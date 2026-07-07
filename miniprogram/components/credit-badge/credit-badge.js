/**
 * 信用分徽章组件 —— 校园易物 v5
 * ============================================================
 * 业务：根据传入的信用分（0-100）渲染"信用极好 / 良好 / 一般"徽章。
 * 设计：液态玻璃胶囊（iOS 26 Liquid Glass 折射）+ 顶部高光 + 渐变
 *      + MD3 Expressive Spring 入场 + 数字滚动
 *      + OriginOS 6 增强光（按下时）+ ColorOS 16 充电岛光晕脉冲（high）
 * 升级（v4）：
 *   1. 等级配色升级：high=绿渐变 / mid=蓝渐变 / low=橙渐变
 *   2. 新增 showIcon（盾牌/星星/圆点），纯 CSS 绘制，禁用 emoji
 *   3. 新增 shape：pill / circle / rounded
 *   4. size 档位细化：sm(80x40) / md(120x56) / lg(96x96 圆)
 *   5. 数字字体：SF Pro Display
 *   6. 支持 prefers-reduced-motion（CSS 端处理）
 *
 * 升级（v5 - fusion-ui-design v2）：
 *   1. anim-m3-spatial-in（MD3 Expressive 弹性入场，由 WXML 工具类提供）
 *   2. spring-ios-morph（iOS 26 玻璃形变）+ spring-m3-default（容器 transition）
 *   3. iOS 26 Liquid Glass 折射层 cb__refract（多层 inset + 顶/底高光）
 *   4. OriginOS 6 增强光 cb__enhanced（按下时中心点高亮）
 *   5. 高信用分光晕脉冲 cb__pulse + anim-charge-wave（ColorOS 16 充电岛）
 *   6. 不同等级（high/mid/low）应用不同折射层 class
 *   7. 新增可选 pulse 开关属性（默认 true）
 *
 * Props：
 *   - score      {number}   信用分（0-100）
 *   - level      {string}   'high' | 'mid' | 'low'，未传时由 score 推断
 *   - size       {string}   'sm' | 'md' | 'lg'，默认 'md'
 *   - showLabel  {boolean}  是否显示"信用xx"标签，默认 true
 *   - showIcon   {boolean}  是否显示左侧等级图标，默认 true
 *   - shape      {string}   'pill'(默认) | 'circle' | 'rounded'
 *   - pulse      {boolean}  是否启用高信用分光晕脉冲，默认 true
 *
 * 用法：
 *   <credit-badge score="{{seller.credit_score}}"></credit-badge>
 *   <credit-badge score="95" size="lg" shape="circle"></credit-badge>
 *   <credit-badge score="60" level="mid" size="sm" show-icon="{{false}}"></credit-badge>
 *   <credit-badge score="98" pulse="{{false}}"></credit-badge>
 */
const { getCreditLevel } = require('../../utils/style.js')

Component({
  properties: {
    score:     { type: Number,  value: 80 },
    level:     { type: String,  value: '' },           // '' 表示按 score 推断
    size:      { type: String,  value: 'md' },          // sm | md | lg
    showLabel: { type: Boolean, value: true },
    showIcon:  { type: Boolean, value: true },
    shape:     { type: String,  value: 'pill' },        // pill | circle | rounded
    pulse:     { type: Boolean, value: true },          // v5：是否启用高信用分光晕脉冲
  },

  data: {
    displayScore: 0,         // 用于数字滚动展示
    finalLevel: 'mid',       // 实际展示的等级（避免与 properties.level 重名）
    levelText: '良好',
    levelClass: 'cb--mid',
    sizeClass: 'cb--size-md',
    shapeClass: 'cb--shape-pill',
    pulseClass: 'cb--pulse-off', // v5：脉冲开关 class（仅 high 等级且 pulse=true 时为 on）
    showPulse: false,        // v5：是否渲染 cb__pulse 元素（高信用分光晕脉冲层）
    badgeStyle: '',
    scoreStyle: '',
    labelStyle: '',
  },

  observers: {
    /**
     * 监听分数/尺寸/显式等级/形状/脉冲开关，更新徽章
     * @param {number} score 信用分
     * @param {string} size  尺寸档位
     * @param {string} level 显式等级
     * @param {string} shape 形状
     * @param {boolean} pulse 脉冲开关
     * @returns {void}
     */
    'score, size, level, shape, pulse': function (score, size, level, shape, pulse) {
      this.updateBadge(score, size, level, shape, pulse)
    },
  },

  lifetimes: {
    /**
     * 组件挂载：触发数字滚动动效，并按当前 pulse 设置初始化
     * @returns {void}
     */
    attached() {
      this.updateBadge(
        this.data.score,
        this.data.size,
        this.data.level,
        this.data.shape,
        this.data.pulse
      )
    },
  },

  methods: {
    /**
     * 根据分数、尺寸、显式等级、形状、脉冲开关更新徽章展示数据
     * @param {number} score 信用分
     * @param {string} size  尺寸档位
     * @param {string} level 显式等级（可空）
     * @param {string} shape 形状
     * @param {boolean} pulse 脉冲开关（仅 high 等级生效）
     * @returns {void}
     */
    updateBadge(score, size, level, shape, pulse) {
      // 1) 等级推断：显式 level 优先，否则由 score 推断
      const inferred = getCreditLevel(Number(score) || 0)
      const finalLevel = level || inferred.level
      const finalLabelMap = { high: '极好', mid: '良好', low: '一般' }
      const finalLabel = finalLabelMap[finalLevel] || '良好'
      const levelClass = 'cb--' + finalLevel

      // 2) 尺寸 class + 内部数字 / 文案字号
      const sizeMap = { sm: 'cb--size-sm', md: 'cb--size-md', lg: 'cb--size-lg' }
      const sizeClass = sizeMap[size] || sizeMap.md

      // 数字字号：sm 22 / md 28 / lg 40
      const scoreFontMap = { sm: 22, md: 28, lg: 40 }
      const labelFontMap = { sm: 18, md: 20, lg: 22 }
      const scoreStyle = `font-size:${scoreFontMap[size] || 28}rpx;`
      const labelStyle = `font-size:${labelFontMap[size] || 20}rpx;`

      // 3) 形状 class
      const shapeMap = { pill: 'cb--shape-pill', circle: 'cb--shape-circle', rounded: 'cb--shape-rounded' }
      const shapeClass = shapeMap[shape] || shapeMap.pill

      // 4) v5 脉冲控制：仅 high 等级且 pulse === true 时启用
      //    - showPulse 控制 WXML 中 cb__pulse 节点是否渲染（避免 mid/low 浪费节点）
      //    - pulseClass 提供显式 class 标识（保留扩展位）
      const pulseEnabled = !!pulse && finalLevel === 'high'
      const showPulse = pulseEnabled
      const pulseClass = pulseEnabled ? 'cb--pulse-on' : 'cb--pulse-off'

      // 5) lg + circle 时容器不需要内边距，但 width/height 已在 wxss 固定
      const badgeStyle = ''

      this.setData({
        finalLevel,
        levelText: finalLabel,
        levelClass,
        sizeClass,
        shapeClass,
        pulseClass,
        showPulse,
        badgeStyle,
        scoreStyle,
        labelStyle,
      })

      // 6) 触发数字滚动动效
      this.animateNumber(score, 800)
    },

    /**
     * 数字滚动动效：从 0 滚动到目标 score
     * @param {number} target 目标分数
     * @param {number} duration 动效时长（ms）
     * @returns {void}
     */
    animateNumber(target, duration) {
      // 兼容旧基础库：直接以最终值兜底
      if (typeof requestAnimationFrame !== 'function') {
        this.setData({ displayScore: Number(target) || 0 })
        return
      }
      const finalScore = Math.max(0, Math.min(100, Math.round(Number(target) || 0)))
      const start = 0
      const startTime = Date.now()

      const step = () => {
        const now = Date.now()
        const elapsed = now - startTime
        if (elapsed >= duration) {
          this.setData({ displayScore: finalScore })
          return
        }
        // easeOutQuad：前期快、后期慢，符合"自然加速"感
        const t = elapsed / duration
        const eased = 1 - (1 - t) * (1 - t)
        const cur = Math.round(start + (finalScore - start) * eased)
        this.setData({ displayScore: cur })
        requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    },
  },
})
