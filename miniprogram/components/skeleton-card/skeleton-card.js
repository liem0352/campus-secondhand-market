/**
 * components/skeleton-card
 * ============================================================
 * 卡片骨架屏组件 —— 校园易物 v5
 * ------------------------------------------------------------
 * 设计语言：fusion-ui-design v2
 *   - Part 22.7 Pixel UI / Material 3 Expressive（弹性空间入场）
 *   - Part 22.12 One UI 9 Now Bar（渐变擦除进入）
 *   - 融合 ColorOS 16（spring-coloros-quick 干脆利落曲线）
 *   - 融合 OriginOS 6 空间光感（多色暖橙到琥珀 shimmer）
 *
 * Props（向后兼容 + 新增）：
 *   - count         {number}  渲染卡片数（1-20），默认 4
 *   - layout        {string}  布局：list(默认) | waterfall | block
 *   - shape         {string}  形状：card(默认) | row | block
 *   - gap           {number}  卡片间距 rpx（由 token 决定实际值，保留以兼容旧 prop）
 *   - showCover     {boolean} 是否显示封面占位，layout=waterfall 时强制 true
 *   - showFooter    {boolean} 是否显示底部行（价格 + 元数据）
 *   - shimmer       {boolean} 是否启用 shimmer 动效，默认 true
 *   - stagger       {number}  错落动画延迟基数（ms），默认 60
 *
 * 公共方法：
 *   - setStaggerDelay(delay) 动态更新错落延迟基数
 *   - refresh()              手动刷新内部 rows / class
 *
 * 用法：
 *   <skeleton-card id="sk" count="{{6}}" layout="list" />
 *   <skeleton-card count="{{4}}" layout="waterfall" />
 *   <skeleton-card count="{{3}}" layout="block" shape="block" />
 *
 *   // 动态调整错落延迟
 *   this.selectComponent('#sk').setStaggerDelay(80)
 */
Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    count: { type: Number, value: 4 },
    layout: { type: String, value: 'list' },         // list | waterfall | block
    shape: { type: String, value: 'card' },          // card | row | block
    gap: { type: Number, value: 24 },                // 兼容旧 prop，实际由 token 控制
    showCover: { type: Boolean, value: true },
    showFooter: { type: Boolean, value: true },
    shimmer: { type: Boolean, value: true },
    stagger: { type: Number, value: 60 },
  },

  data: {
    rows: [],            // [{ idx, delay }]
    layoutClass: 'sk-wrap--list',
    shapeClass: 'sk-item--card',
  },

  observers: {
    /**
     * 监听 count/layout/shape/stagger 变化，重新计算行
     * @returns {void}
     */
    'count, layout, shape, stagger'() {
      this._refresh()
    },
  },

  lifetimes: {
    /**
     * 挂载：初始化行 + class
     * @returns {void}
     */
    attached() {
      this._refresh()
    },
  },

  methods: {
    /**
     * 刷新 rows / class
     * @private
     * @returns {void}
     */
    _refresh() {
      const count = Math.max(1, Math.min(20, Number(this.data.count) || 4))
      const stagger = Math.max(0, Number(this.data.stagger) || 60)
      const rows = new Array(count).fill(0).map((_, i) => ({
        idx: i,
        delay: i * stagger,
      }))

      const layoutMap = {
        list: 'sk-wrap--list',
        waterfall: 'sk-wrap--waterfall',
        block: 'sk-wrap--block',
      }
      const shapeMap = {
        card: 'sk-item--card',
        row: 'sk-item--row',
        block: 'sk-item--block',
      }
      const waterfallShape = 'sk-item--waterfall'

      const layoutClass = layoutMap[this.data.layout] || layoutMap.list
      // waterfall 布局固定使用 waterfall 形状
      const shapeClass = this.data.layout === 'waterfall'
        ? waterfallShape
        : (shapeMap[this.data.shape] || shapeMap.card)

      this.setData({ rows, layoutClass, shapeClass })
    },

    /**
     * 动态设置错落动画延迟基数（fusion-ui-design v2：--stagger-delay）
     * @description 用于运行时改变每张卡片的入场错落节奏；会同时更新 prop 与内部 rows。
     * @param {number} delay 错落延迟基数（ms），合法范围 0 - 2000；非法值会被安全收敛。
     * @returns {void}
     */
    setStaggerDelay(delay) {
      const n = Math.max(0, Math.min(2000, Number(delay) || 0))
      // 直接更新 data.stagger，由 observer 触发 _refresh
      this.setData({ stagger: n })
    },

    /**
     * 手动刷新内部状态（外部修改了 prop 但需要立刻重算时调用）
     * @returns {void}
     */
    refresh() {
      this._refresh()
    },
  },
})
