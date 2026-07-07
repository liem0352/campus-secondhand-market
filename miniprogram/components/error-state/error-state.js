/**
 * components/error-state
 * ============================================================
 * 错误状态组件 —— 校园易物 v5（fusion-ui-design v2）
 * ------------------------------------------------------------
 * 设计语言：MagicOS 10 一镜到底 + iOS 26 Liquid Glass + OriginOS 6 弥散光
 *           + ColorOS 16 干脆利落 + MD3 Expressive
 *
 * Props（向后兼容 + 新增）：
 *   - title         {string}  错误标题
 *   - description   {string}  错误描述
 *   - errorMessage  {string}  错误详情（与 description 二选一，优先）
 *   - errorType     {string}  错误类型: warning(默认) | network | server | empty
 *   - errorCode     {string|number}  错误码（可选）
 *   - showRetry     {boolean} 是否显示重试按钮
 *   - showHome      {boolean} 是否显示"返回首页"副按钮
 *   - retryText     {string}  重试文案
 *   - homeText      {string}  返回首页文案
 *   - compact       {boolean} 紧凑模式
 *   - size          {number}  插画尺寸（rpx），默认 200
 *
 * Event：
 *   - retry  点击重试
 *   - home   点击返回首页
 *
 * 用法：
 *   <error-state
 *     error-type="network"
 *     title="网络不给力"
 *     error-message="请检查你的网络后重试"
 *     error-code="NET_ERR"
 *     show-retry
 *     show-home
 *     bind:retry="onRetry"
 *     bind:home="goHome"
 *   />
 */
Component({
  options: {
    multipleSlots: true,
    styleIsolation: 'apply-shared',
  },

  properties: {
    // 主标题
    title: { type: String, value: '加载失败' },
    // 描述（次要信息）
    description: { type: String, value: '' },
    // 错误详情（与 description 二选一，优先显示）
    errorMessage: { type: String, value: '' },
    // 错误类型：warning | network | server | empty
    errorType: { type: String, value: 'warning' },
    // 错误码
    errorCode: { type: String, value: '' },
    // 是否显示重试按钮
    showRetry: { type: Boolean, value: true },
    // 是否显示"返回首页"副按钮
    showHome: { type: Boolean, value: false },
    // 重试文案
    retryText: { type: String, value: '重新加载' },
    // 返回首页文案
    homeText: { type: String, value: '返回首页' },
    // 紧凑模式
    compact: { type: Boolean, value: false },
    // 插画尺寸（rpx）
    size: { type: Number, value: 200 },
  },

  data: {
    // 根据 errorType 生成的 BEM 修饰符 class
    typeClass: 'err-wrap--warning',
  },

  observers: {
    /**
     * 监听 errorType 变化，更新类型 class
     * 配色差异化（每种 errorType 都有独立 token）
     * @param {string} t 新的 errorType
     * @returns {void}
     */
    'errorType'(t) {
      const map = {
        network: 'err-wrap--network',
        server: 'err-wrap--server',
        empty: 'err-wrap--empty',
        warning: 'err-wrap--warning',
      }
      this.setData({ typeClass: map[t] || map.warning })
    },
  },

  lifetimes: {
    /**
     * 组件挂载：初始化 typeClass
     * 在挂载时同步一次颜色 class，避免首次渲染使用默认值
     * @returns {void}
     */
    attached() {
      const map = {
        network: 'err-wrap--network',
        server: 'err-wrap--server',
        empty: 'err-wrap--empty',
        warning: 'err-wrap--warning',
      }
      this.setData({ typeClass: map[this.data.errorType] || map.warning })
    },
  },

  methods: {
    /**
     * 点击重试按钮，触发 retry 事件
     * detail 携带 errorType 与 errorCode，便于上层埋点 / 区分行为
     * @returns {void}
     */
    onRetry() {
      this.triggerEvent('retry', {
        errorType: this.data.errorType,
        errorCode: this.data.errorCode,
      })
    },

    /**
     * 点击"返回首页"按钮，触发 home 事件
     * detail 携带 errorType，便于上层做来源区分
     * @returns {void}
     */
    onHome() {
      this.triggerEvent('home', { errorType: this.data.errorType })
    },
  },
})
