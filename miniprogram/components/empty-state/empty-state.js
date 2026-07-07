/**
 * components/empty-state
 * 空状态组件（fusion-ui-design v2 融合版）
 *
 * 设计融合：
 *  - iOS 26 Liquid Glass 折射光斑（anim-liquid-shine）
 *  - OriginOS 6 陀螺仪光影（gyro-light）
 *  - Nothing OS 3.5 点阵美学（anim-dot-flicker）
 *  - One UI 9 流畅轻快（spring-oneui）
 *
 * @prop {string}  title            标题
 * @prop {string}  description      描述
 * @prop {string}  icon             内置插画：box / search / chat / order / favorite / message / default
 * @prop {string}  actionText       操作按钮文案
 * @prop {number}  size             插画尺寸（rpx）
 * @prop {boolean} compact          紧凑模式
 * @prop {boolean} enableParallax   是否开启陀螺仪视差（默认 false，避免无谓耗电）
 * @prop {number}  parallaxStrength 视差强度（rpx），默认 8
 * @event action - 点击操作按钮
 */
Component({
  options: {
    multipleSlots: true,
    styleIsolation: 'apply-shared',
  },
  properties: {
    title:           { type: String,  value: '暂无数据' },
    description:     { type: String,  value: '' },
    icon:            { type: String,  value: 'box' },
    actionText:      { type: String,  value: '' },
    size:            { type: Number,  value: 120 },
    compact:         { type: Boolean, value: false },
    enableParallax:  { type: Boolean, value: false },
    parallaxStrength:{ type: Number,  value: 8 },
  },
  data: {
    /** 视差 X 位移（rpx），由设备方向 beta/gamma 转换得到 */
    tiltX: 0,
    /** 视差 Y 位移（rpx），由设备方向 beta/gamma 转换得到 */
    tiltY: 0,
  },
  lifetimes: {
    /**
     * 组件挂载完成
     * 若启用视差，则开启设备方向监听
     */
    attached() {
      if (this.properties.enableParallax) {
        this._startParallax()
      }
    },
    /**
     * 组件卸载
     * 关闭设备方向监听，释放资源
     */
    detached() {
      this._stopParallax()
    },
  },
  observers: {
    /**
     * 监听 enableParallax 变化：动态开启/关闭视差
     * @param {boolean} next 最新的 enableParallax 值
     */
    'enableParallax'(next) {
      if (next) {
        this._startParallax()
      } else {
        this._stopParallax()
      }
    },
  },
  methods: {
    /**
     * 点击操作按钮
     * 触发外部 action 事件
     */
    onAction() {
      this.triggerEvent('action')
    },

    /**
     * 开启陀螺仪视差监听
     * 使用 wx.startDeviceMotionListening 监听设备方向变化，
     * 通过 gamma(左右倾斜) 与 beta(前后倾斜) 计算插图微小位移，
     * 实现 OriginOS 6 陀螺仪光影的"轻微视差"效果。
     * @private
     */
    _startParallax() {
      if (this._motionStarted) return
      this._motionStarted = true
      // 仅在 App 端（非编辑器）开启监听
      if (typeof wx === 'undefined' || !wx.startDeviceMotionListening) return
      try {
        wx.startDeviceMotionListening({
          interval: 'normal',
          success: () => {
            this._motionHandler = (res) => this._onDeviceMotion(res)
            wx.onDeviceMotionChange(this._motionHandler)
          },
          fail: () => {
            // 设备不支持或用户拒绝授权时静默降级
            this._motionStarted = false
          },
        })
      } catch (e) {
        // 异常保护：避免真机抛错打断组件生命周期
        this._motionStarted = false
      }
    },

    /**
     * 关闭陀螺仪视差监听
     * 重置视差位移到 0，释放回调
     * @private
     */
    _stopParallax() {
      if (!this._motionStarted) return
      this._motionStarted = false
      try {
        if (typeof wx !== 'undefined' && wx.offDeviceMotionChange && this._motionHandler) {
          wx.offDeviceMotionChange(this._motionHandler)
        }
        if (typeof wx !== 'undefined' && wx.stopDeviceMotionListening) {
          wx.stopDeviceMotionListening({})
        }
      } catch (e) {
        // 静默处理
      }
      this._motionHandler = null
      this.setData({ tiltX: 0, tiltY: 0 })
    },

    /**
     * 设备方向变化回调
     * - gamma：左右倾斜角度，范围 -90 ~ 90
     * - beta：前后倾斜角度，范围 -180 ~ 180
     * 通过归一化与强度系数换算为 rpx 位移，限制在 ±strength 之间。
     * @param {Object} res 设备方向数据 { alpha, beta, gamma }
     * @private
     */
    _onDeviceMotion(res) {
      if (!res || this.data.tiltX === undefined) return
      // gamma (左右) 映射到 X，beta (前后) 映射到 Y
      // 归一化到 [-1, 1]（以 ±30° 为基准感受范围）
      const nx = Math.max(-1, Math.min(1, (res.gamma || 0) / 30))
      const ny = Math.max(-1, Math.min(1, ((res.beta || 0) - 30) / 30))
      const strength = this.properties.parallaxStrength || 8
      // 反向映射：向右倾斜时插图向左移（视差反向）
      const tiltX = -nx * strength
      const tiltY = -ny * strength
      // 仅当变化超过 0.5rpx 时更新，避免 setData 抖动
      if (Math.abs(tiltX - this.data.tiltX) > 0.5 || Math.abs(tiltY - this.data.tiltY) > 0.5) {
        this.setData({ tiltX, tiltY })
      }
    },
  },
})
