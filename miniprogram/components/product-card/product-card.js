/**
 * components/product-card/product-card.js
 * --------------------------------------------------------------------
 * 商品卡片组件 —— 校园易物（融合 fusion-ui-design v2 / Part 22 重构版）
 *
 * 职责：
 *   1. 展示单件商品的核心信息（主图 / 标题 / 价格 / 学校 / 信用分 / 浏览收藏数）；
 *   2. 接收父页面传入的商品对象，并按 layout 切换瀑布流 / 列表两种排版；
 *   3. 通过 triggerEvent 把点击、收藏、点击学校等事件抛给父页面（无业务逻辑）；
 *   4. v2 新增：陀螺仪事件监听（OriginOS 6 陀螺仪光影），动态调整主图透视倾斜。
 *
 * 数据约定（来自后端 /api/products/ 列表接口的单个 product 元素）：
 *   {
 *     id, title, price, original_price, cover, images[],
 *     condition: 'new'|'like_new'|'good'|'fair',   // 成色
 *     school,                                      // 学校名
 *     seller: { id, nickname, avatar, credit_score }
 *     is_favorited, favorite_count, view_count,
 *     created_at
 *   }
 *
 * 设计 token：颜色 / 字号 / 间距 / 动效 全部走 var(--*)，见 app.wxss
 * 关键动效（v2 升级）：
 *   - 卡片入场：MagicOS 10 一镜到底（pcard-fade-up，0%→40%→100% 过冲）
 *   - 收藏按钮：spring-coloros 心跳脉冲（400ms 干脆利落）
 *   - 按下：spring-coloros scale(0.94) + 阴影收敛
 *   - 折射光斑：iOS 26 anim-liquid-shine（CSS ::after，app.wxss）
 *   - 陀螺仪光影：OriginOS 6 .gyro-light（背景扫光） + 本组件 JS 动态 rotateX/Y
 */
const sys = require('../../utils/sys.js')
const { productCover, FALLBACK, simulateFallback } = require('../../utils/resolve-url.js')

/**
 * 陀螺仪最大倾斜角度（度）
 * 防止用户大幅度倾斜时主图倾斜过度，保持视觉稳定
 * @type {number}
 */
const GYRO_MAX_TILT = 8

/**
 * 陀螺仪输入平滑系数（0-1，越小越平滑）
 * 0.15 体感：略微滞后但非常顺滑
 * @type {number}
 */
const GYRO_SMOOTHING = 0.15

Component({
  /**
   * 组件对外属性
   */
  properties: {
    /**
     * 商品数据对象（由父页面通过 product="{{item}}" 传入）
     */
    product: {
      type: Object,
      value: {},
    },
    /**
     * 布局模式：waterfall（瀑布流双列，默认）/ list（横向列表）
     * - waterfall：主图为正方形，适合首页 / 分类页双列瀑布流
     * - list     ：主图为 4:3 横图，适合搜索结果 / 收藏夹的单列列表
     */
    layout: {
      type: String,
      value: 'waterfall',
    },
    /**
     * 是否启用陀螺仪光影（默认 false，避免不必要的性能开销）
     * 父页面可在合适场景（如首页瀑布流）打开
     */
    enableGyro: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件内部状态
   */
  data: {
    /**
     * 成色文案映射（业务字段值 -> 中文显示）
     */
    conditionLabel: '',
    /**
     * 成色对应色阶 class（new/like_new/good/fair）
     */
    conditionClass: '',
    /**
     * 信用分等级 class（high / mid / low）
     */
    creditClass: '',
    /**
     * 收藏按钮激活态（带心跳动画）
     */
    favoriteActive: false,
    /**
     * 封面图绝对 URL（已拼上 https + apiBase 的 host）
     */
    coverUrl: '',
    /**
     * 心跳脉冲 class（点击瞬间激活，CSS 动画结束后清空）
     * 避免连续点击时动画叠加
     */
    pulseClass: '',
    /**
     * 是否有 eye 图标（开发期按需检测）
     */
    hasViewIcon: true,
    /**
     * 陀螺仪 X 轴倾斜角（度，对应 rotateY；左倾为负）
     * 初始 0，由 wx.onDeviceMotionChange 实时更新
     */
    gyroTiltX: 0,
    /**
     * 陀螺仪 Y 轴倾斜角（度，对应 rotateX；前倾为负）
     * 初始 0，由 wx.onDeviceMotionChange 实时更新
     */
    gyroTiltY: 0,
  },

  /**
   * 生命周期 / 观察者
   */
  lifetimes: {
    /**
     * 组件挂载完成：
     *   1. 初始化派生字段
     *   2. 若启用陀螺仪，启动设备方向监听（wx.onDeviceMotionChange）
     */
    attached() {
      this.refreshDerived()
      this._initGyro()
    },

    /**
     * 组件销毁：
     *   1. 停止设备方向监听（避免内存泄漏 / 事件残留）
     *   2. 清理心跳脉冲定时器
     */
    detached() {
      this._destroyGyro()
      this._pulseTimer && clearTimeout(this._pulseTimer)
      this._clearPulseTimer && clearTimeout(this._clearPulseTimer)
    },
  },

  /**
   * 监听外部 product 变化
   */
  observers: {
    'product'(next) {
      if (next && next.id) this.refreshDerived()
    },
    /**
     * 监听 enableGyro 变化：动态启停设备方向监听
     */
    'enableGyro'(next) {
      if (next) {
        this._initGyro()
      } else {
        this._destroyGyro()
        // 重置为水平
        this.setData({ gyroTiltX: 0, gyroTiltY: 0 })
      }
    },
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 根据 product 计算派生字段：成色文案 / 信用分等级 / 初始收藏态
     * 提成函数：避免在 observers 中写重复逻辑
     */
    refreshDerived() {
      const p = this.data.product || {}
      const conditionMap = {
        new:      { label: '全新',     cls: 'cond-new' },
        like_new: { label: '几乎全新', cls: 'cond-like-new' },
        good:     { label: '九成新',   cls: 'cond-good' },
        fair:     { label: '八成新',   cls: 'cond-fair' },
      }
      const c = conditionMap[p.condition] || { label: '', cls: '' }
      const credit = (p.seller && p.seller.credit_score) || 0
      const creditCls = credit >= 90 ? 'credit-high' : (credit >= 60 ? 'credit-mid' : 'credit-low')

      // 封面图：调用统一的 URL 解析工具
      const coverUrl = productCover(p)

      this.setData({
        conditionLabel: c.label,
        conditionClass: c.cls,
        creditClass:    creditCls,
        favoriteActive: !!p.is_favorited,
        coverUrl:       coverUrl,
      })
    },

    /**
     * 初始化陀螺仪监听（v2 新增，OriginOS 6 陀螺仪光影）
     * 1. 检测设备能力（部分旧设备/模拟器无 DeviceMotion）；
     * 2. 启动 wx.startDeviceMotionListening；
     * 3. 绑定 wx.onDeviceMotionChange 回调，使用低通滤波平滑输出。
     *
     * 注意：所有 API 调用用 try/catch 包裹，失败时静默降级（保持卡片正常显示）。
     * @private
     */
    _initGyro() {
      if (!this.data.enableGyro) return
      if (this._gyroStarted) return // 防重复启动
      this._smoothedX = 0
      this._smoothedY = 0
      this._gyroStarted = true

      // 1) 设备能力检测：模拟器/无陀螺仪的设备直接返回
      try {
        // 走 utils/sys 封装：内部已用新的设备信息 API 替代已弃用的旧 API
        const sysInfo = sys.getSystemInfoSync()
        // iOS 模拟器与 PC 端通常 deviceOrientation 为 undefined
        if (!sysInfo || sysInfo.platform === 'devtools' || sysInfo.platform === 'windows' || sysInfo.platform === 'mac') {
          this._gyroSupported = false
          return
        }
        this._gyroSupported = true
      } catch (e) {
        this._gyroSupported = false
        return
      }

      // 2) 启动设备方向监听（微信侧会自动请求权限）
      try {
        if (typeof wx.startDeviceMotionListening === 'function') {
          wx.startDeviceMotionListening({ interval: 'game' })
        }
      } catch (e) {
        // 静默失败：保持陀螺仪关闭
        this._gyroSupported = false
        return
      }

      // 3) 绑定方向变化回调
      try {
        if (typeof wx.onDeviceMotionChange === 'function') {
          this._gyroHandler = (res) => this._onDeviceMotion(res)
          wx.onDeviceMotionChange(this._gyroHandler)
        } else {
          this._gyroSupported = false
        }
      } catch (e) {
        this._gyroSupported = false
      }
    },

    /**
     * 销毁陀螺仪监听（组件销毁时调用）
     * 1. 停止设备方向监听；
     * 2. 解绑回调；
     * 3. 重置状态标记，避免重复启动。
     * @private
     */
    _destroyGyro() {
      if (!this._gyroStarted) return
      this._gyroStarted = false
      try {
        if (typeof wx.stopDeviceMotionListening === 'function') {
          wx.stopDeviceMotionListening()
        }
      } catch (e) { /* 忽略 */ }
      try {
        if (typeof wx.offDeviceMotionChange === 'function' && this._gyroHandler) {
          wx.offDeviceMotionChange(this._gyroHandler)
        }
      } catch (e) { /* 忽略 */ }
      this._gyroHandler = null
    },

    /**
     * 设备方向变化回调（v2 新增）
     * 使用一阶低通滤波平滑陀螺仪抖动，避免主图剧烈抖动。
     * 将 beta/gamma 限定在 ±GYRO_MAX_TILT 度范围内。
     *
     * wx.onDeviceMotionChange 字段说明：
     *   - alpha: 绕 z 轴（指南针方向）0-360
     *   - beta:  绕 x 轴（前后倾斜） -180~180，平放约 0，竖起约 ±90
     *   - gamma: 绕 y 轴（左右倾斜） -90~90，平放约 0
     *
     * @param {Object} res 设备方向数据 { alpha, beta, gamma }
     * @private
     */
    _onDeviceMotion(res) {
      if (!this._gyroSupported) return
      const beta = Number(res && res.beta) || 0
      const gamma = Number(res && res.gamma) || 0

      // 1) 截断到合理范围
      const targetX = Math.max(-GYRO_MAX_TILT, Math.min(GYRO_MAX_TILT, gamma))
      // beta 在手持设备轻微前倾时约 5-15 度，所以减去静态偏置
      const targetY = Math.max(-GYRO_MAX_TILT, Math.min(GYRO_MAX_TILT, beta - 10))

      // 2) 一阶低通滤波：smoothed = smoothed * (1-a) + target * a
      this._smoothedX = this._smoothedX * (1 - GYRO_SMOOTHING) + targetX * GYRO_SMOOTHING
      this._smoothedY = this._smoothedY * (1 - GYRO_SMOOTHING) + targetY * GYRO_SMOOTHING

      // 3) 节流 setData：四舍五入到 0.1 度，避免频繁渲染
      const newX = Math.round(this._smoothedX * 10) / 10
      const newY = Math.round(this._smoothedY * 10) / 10
      if (newX !== this.data.gyroTiltX || newY !== this.data.gyroTiltY) {
        this.setData({ gyroTiltX: newX, gyroTiltY: newY })
      }
    },

    /**
     * 点击卡片：把商品 id 抛给父页面，由父页面决定跳转
     */
    onTap() {
      this.triggerEvent('tap', { id: this.data.product.id })
    },

    /**
     * 点击收藏按钮
     * 1. 阻止冒泡避免触发 onTap；
     * 2. 切换本地态（乐观更新），同时抛事件给父页面落库；
     * 3. 触发 spring-coloros 心跳动画（pulseClass + 400ms 后清除）。
     */
    onFavorite(e) {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
      const next = !this.data.favoriteActive

      // 触发心跳动画：先清空 class，再下一帧设置，让 CSS 动画重启
      this.setData({ favoriteActive: next, pulseClass: '' })
      // 强制下一帧添加 class，触发 CSS 动画
      this._pulseTimer && clearTimeout(this._pulseTimer)
      this._pulseTimer = setTimeout(() => {
        this.setData({ pulseClass: 'pcard__fav--pulse' })
        // 动画结束后清空（避免重复点击叠加）
        this._clearPulseTimer = setTimeout(() => {
          this.setData({ pulseClass: '' })
        }, 450)
      }, 16)

      this.triggerEvent('favorite', {
        id: this.data.product.id,
        product: this.data.product,
        active: next,
      })
    },

    /**
     * 点击学校徽标：跳到该学校的商品列表（事件给父页面处理）
     */
    onSchoolTap(e) {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
      this.triggerEvent('schooltap', {
        school: this.data.product.school,
        product: this.data.product,
      })
    },

    /**
     * 图片加载完成：开发期调试日志
     */
    onImageLoad(e) {
      if (typeof console !== 'undefined' && console.log) {
        console.log('[product-card] image loaded:', this.data.product && this.data.product.cover)
      }
    },

    /**
     * 图片加载失败兜底：
     *   1. 尝试用 simulateFallback 替换为本地 /assets/products/ 占位图
     *   2. 若已使用本地占位图，不使用 SVG
     *   3. 仅当无法降级到本地图时，才使用内联 SVG data-uri
     */
    onImageError() {
      const p = this.data.product || {}
      const rawCover = p.cover || ''

      // 尝试降级到本地占位图
      const localFallback = simulateFallback(rawCover)
      if (localFallback !== FALLBACK) {
        const product = { ...p, cover: localFallback }
        this.setData({ coverUrl: localFallback, product })
        return
      }

      // 无法降级到本地图片，使用内联 SVG data-uri
      const placeholder =
        'data:image/svg+xml;utf8,' +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">' +
          '<rect width="320" height="320" fill="#f4f6f8"/>' +
          '<g fill="none" stroke="#cbd5dc" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="40" y="60" width="240" height="200" rx="12"/>' +
          '<circle cx="120" cy="140" r="20"/>' +
          '<path d="M60 240 L120 180 L180 230 L240 170 L280 240"/>' +
          '</g>' +
          '<text x="160" y="290" text-anchor="middle" font-size="20" fill="#a4adb5" font-family="sans-serif">图片不可用</text>' +
          '</svg>'
        )
      const product = { ...p, cover: placeholder }
      this.setData({ product, coverUrl: placeholder })
    },

    /**
     * 长按卡片：预览大图（在父页面实现大图浏览，本组件只抛事件）
     */
    onLongPress() {
      const p = this.data.product || {}
      const imgs = (p.images && p.images.length)
        ? p.images
        : (p.cover ? [p.cover] : [])
      this.triggerEvent('longpress', { id: p.id, images: imgs })
    },
  },
})
