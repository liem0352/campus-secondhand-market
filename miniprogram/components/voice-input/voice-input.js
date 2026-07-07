/**
 * @file 语音输入组件 — 微信同声传译插件 + 后端 /voice/parse/
 *
 * 融合 fusion-ui-design v2 多家厂商动效：
 *   - MagicOS 10 灵动胶囊频谱岛（Part 22.13）
 *   - OriginOS 6 AI 光晕脉冲（Part 22.9）
 *   - ColorOS 16 充电岛能量（Part 22.10）
 *
 * 状态机：idle / recording / recognizing / thinking / done
 *   - idle        空闲
 *   - recording   录音中（频谱岛点亮，按钮胶囊化）
 *   - recognizing 识别中（onRecognize / onStop 之间的短态）
 *   - thinking    AI 解析中（后端 /voice/parse/ 调用）
 *   - done        完成（preview 已就绪）
 *   - error       错误（兼容旧状态机保留）
 *
 * 启用语音需在 app.json 声明插件并在公众平台授权，见 miniprogram/README.md
 */
const { parseVoiceText } = require('../../utils/voice')

/**
 * 创建同声传译录音管理器
 * @returns {object|null} 录音管理器，插件未配置或未授权时返回 null，模拟器可正常启动
 */
function createRecordManager() {
  try {
    const plugin = requirePlugin('WechatSI')
    return plugin.getRecordRecognitionManager()
  } catch (e) {
    return null
  }
}

/**
 * 5 根频谱条初始高度（百分比 0-100），中位偏低
 * @type {number[]}
 */
const DEFAULT_SPECTRUM_BARS = [10, 16, 22, 18, 12]

Component({
  properties: {
    /** 录音模式：hold 长按说话 | tap 点击切换 */
    mode: {
      type: String,
      value: 'hold',
    },
    /** 是否禁用 */
    disabled: {
      type: Boolean,
      value: false,
    },
    /** 参考日期 YYYY-MM-DD，默认今天 */
    referenceDate: {
      type: String,
      value: '',
    },
  },

  data: {
    /** 兼容旧状态：idle | recording | processing | preview | error（外部 WXML 可读） */
    status: 'idle',
    /**
     * 新状态机：idle | recording | recognizing | thinking | done | error
     * idle        - 空闲
     * recording   - 录音中
     * recognizing - 识别中
     * thinking    - AI 思考中
     * done        - 完成
     * error       - 错误
     */
    state: 'idle',
    /** 实时识别文本（partial） */
    partialText: '',
    /** 最终识别文本 */
    finalText: '',
    /** 已录音秒数 */
    recordSeconds: 0,
    /** 错误信息 */
    errorMessage: '',
    /** 解析后的预览数据 */
    preview: null,
    /** 录音计时器 ID */
    timerId: null,
    /** 插件是否就绪 */
    pluginReady: false,
    /**
     * 当前平均音量 0-100，用于驱动频谱岛整体高度与外发光
     * @type {number}
     */
    soundLevel: 0,
    /**
     * 5 根频谱条的目标高度（百分比 0-100），数组下标 0~4 对应 5 根 bar
     * 由 _startSpectrum() 周期性更新，inline style 绑定到 .spectrum-bar
     * @type {number[]}
     */
    spectrumBars: DEFAULT_SPECTRUM_BARS.slice(),
  },

  lifetimes: {
    /** 组件挂载：初始化录音管理器 */
    attached() {
      this._manager = createRecordManager()
      this.setData({ pluginReady: !!this._manager })
      if (this._manager) this._bindManager()
    },
    /** 组件销毁：清理计时器与频谱采样 */
    detached() {
      this._clearTimer()
      this._stopSpectrum()
      try {
        if (this._manager) this._manager.stop()
      } catch (e) {
        /* ignore */
      }
    },
  },

  methods: {
    /**
     * 绑定同声传译录音管理器回调
     * @private
     */
    _bindManager() {
      const manager = this._manager

      // 实时识别回调
      manager.onRecognize = (res) => {
        this.setData({
          state: 'recognizing',
          partialText: res.result || '',
        })
      }

      // 录音结束回调：进入识别 → 解析流程
      manager.onStop = (res) => {
        this._clearTimer()
        this._stopSpectrum()
        const text = (res.result || '').trim()
        this.setData({
          state: 'recognizing',
          finalText: text,
          recordSeconds: 0,
        })
        if (!text) {
          this._setError('没听清，请再说一次')
          return
        }
        this._parseText(text)
      }

      // 录音错误回调
      manager.onError = (res) => {
        this._clearTimer()
        this._stopSpectrum()
        const msg = res.msg || res.errMsg || '录音识别失败'
        this._setError(msg)
        this.triggerEvent('error', { message: msg })
      }
    },

    /**
     * 切换到错误态（兼容旧 status 字段）
     * @param {string} message 错误信息
     * @private
     */
    _setError(message) {
      this.setData({
        status: 'error',
        state: 'error',
        errorMessage: message,
      })
    },

    /**
     * 清理录音计时器
     * @private
     */
    _clearTimer() {
      if (this.data.timerId) {
        clearInterval(this.data.timerId)
        this.setData({ timerId: null })
      }
    },

    /**
     * 启动频谱音量采样
     * 周期性生成 5 根 bar 的目标高度（0-100%），驱动 MagicOS 10 灵动胶囊频谱岛
     * 真实场景可对接 onVoiceVolume 事件，本组件用伪随机模拟以保证模拟器可演示
     * @private
     */
    _startSpectrum() {
      this._stopSpectrum()
      const tick = () => {
        if (this.data.state !== 'recording') return
        // 基础音量 30-70 之间随机跳动，模拟真实语音强度
        const base = 30 + Math.random() * 40
        const bars = [0, 1, 2, 3, 4].map(() => {
          // 每根 bar 略微独立偏移，制造波浪感
          const jitter = (Math.random() - 0.5) * 30
          return Math.max(8, Math.min(100, Math.round(base + jitter)))
        })
        const level = Math.round(bars.reduce((a, b) => a + b, 0) / 5)
        this.setData({ spectrumBars: bars, soundLevel: level })
        // 80ms 一次 ≈ 12.5fps，足以覆盖视觉弹性波动（CSS 动画负责中间帧）
        this._spectrumTimer = setTimeout(tick, 80)
      }
      this._spectrumTimer = setTimeout(tick, 80)
    },

    /**
     * 停止频谱采样并回落为最小高度
     * @private
     */
    _stopSpectrum() {
      if (this._spectrumTimer) {
        clearTimeout(this._spectrumTimer)
        this._spectrumTimer = null
      }
      this.setData({
        soundLevel: 0,
        spectrumBars: [8, 8, 8, 8, 8],
      })
    },

    /**
     * 检查麦克风权限，未授权时引导用户开启
     * @returns {Promise<void>} 拥有权限时 resolve，否则 reject
     * @private
     */
    async _ensureRecordAuth() {
      return new Promise((resolve, reject) => {
        wx.getSetting({
          success: (res) => {
            if (res.authSetting['scope.record']) {
              resolve()
              return
            }
            wx.authorize({
              scope: 'scope.record',
              success: resolve,
              fail: () => {
                wx.showModal({
                  title: '需要麦克风权限',
                  content: '请在设置中开启录音权限以使用语音记账',
                  confirmText: '去设置',
                  success: (m) => {
                    if (m.confirm) wx.openSetting()
                  },
                })
                reject(new Error('scope.record denied'))
              },
            })
          },
        })
      })
    },

    /**
     * hold 模式：touchstart 触发
     */
    async onTouchStart() {
      if (this.properties.disabled || this.properties.mode !== 'hold') return
      await this.startRecord()
    },

    /**
     * hold 模式：touchend 触发
     */
    onTouchEnd() {
      if (this.properties.mode !== 'hold') return
      this.stopRecord()
    },

    /**
     * tap 模式：点击切换录音状态
     */
    async onTapMic() {
      if (this.properties.disabled || this.properties.mode !== 'tap') return
      if (this.data.status === 'recording') {
        this.stopRecord()
      } else {
        await this.startRecord()
      }
    },

    /**
     * 开始录音：状态 → recording，启动计时器与频谱采样
     */
    async startRecord() {
      if (!this._manager) {
        wx.showToast({
          title: '语音插件未配置，请用手动记账',
          icon: 'none',
          duration: 2500,
        })
        return
      }
      try {
        await this._ensureRecordAuth()
      } catch (e) {
        return
      }

      this.setData({
        status: 'recording',
        state: 'recording',
        partialText: '',
        finalText: '',
        errorMessage: '',
        preview: null,
        recordSeconds: 0,
        soundLevel: 0,
        spectrumBars: DEFAULT_SPECTRUM_BARS.slice(),
      })

      const timerId = setInterval(() => {
        this.setData({ recordSeconds: this.data.recordSeconds + 1 })
      }, 1000)
      this.setData({ timerId })

      this._startSpectrum()
      this._manager.start({
        lang: 'zh_CN',
        duration: 60000,
      })
    },

    /**
     * 结束录音：状态 → recognizing，停止频谱，由 onStop 接管后续流程
     */
    stopRecord() {
      if (this.data.status !== 'recording') return
      this.setData({
        status: 'processing',
        state: 'recognizing',
      })
      this._stopSpectrum()
      try {
        this._manager.stop()
      } catch (e) {
        this._setError('结束录音失败')
      }
    },

    /**
     * 解析识别文本：状态 → thinking，调用后端 /voice/parse/
     * 解析完成后状态 → done（preview 就绪）
     * @param {string} text 识别得到的原始文本
     * @private
     */
    async _parseText(text) {
      this.setData({
        status: 'processing',
        state: 'thinking',
      })
      const ref = this.properties.referenceDate || ''

      try {
        const res = await parseVoiceText(text, ref || undefined)
        const data = res.data

        if (res.code === 40002) {
          // 无金额等部分解析
          this.setData({
            status: 'preview',
            state: 'done',
            preview: data,
            errorMessage: res.message || '未识别到金额，请补充',
          })
          this.triggerEvent('parsed', { ...data, partial: true })
          return
        }

        this.setData({
          status: 'preview',
          state: 'done',
          preview: data,
          errorMessage: '',
        })
        this.triggerEvent('parsed', data)
      } catch (err) {
        const msg = (err && err.message) || '解析失败，请重试或改用手动记账'
        this._setError(msg)
        this.triggerEvent('error', { message: msg })
      }
    },

    /**
     * 外部传入文本（手动输入降级）
     * @param {string} text 待解析的文本
     */
    parseManualText(text) {
      return this._parseText(text)
    },

    /**
     * 重新录制：清空状态回到 idle
     */
    onRetry() {
      this.setData({
        status: 'idle',
        state: 'idle',
        partialText: '',
        finalText: '',
        preview: null,
        errorMessage: '',
        soundLevel: 0,
        spectrumBars: DEFAULT_SPECTRUM_BARS.slice(),
      })
    },

    /**
     * 父页面修改预览后同步
     * @param {object} preview 解析数据
     */
    updatePreview(preview) {
      this.setData({ preview })
    },
  },
})
