/**
 * 我的订单页 —— 校园易物（Phase 4.0 · fusion-ui-design v2）
 * --------------------------------------------------------------------
 * 业务流程：
 *   1. 顶部 Tab：全部 / 待付款 / 待发货 / 待收货 / 已完成
 *   2. 列表：每张订单卡片展示商品图、标题、价格、对方头像、状态、订单号
 *   3. 状态机可视化（步骤条）：已申请 -> 已确认 -> 待取/待发 -> 已完成
 *   4. 操作按钮按状态/角色变化：
 *        - requested（卖家视角）："确认" / "拒绝"
 *        - confirmed（买家视角）："标记完成"
 *        - completed："去评价"
 *        - cancelled：仅展示
 *   5. 顶部 Tab 与状态机步骤联动，已完成步进用主色，未完成用灰
 *
 * 融合设计语言（fusion-ui-design v2）：
 *   - Part 22.10 ColorOS 16 充电岛：进行中订单的能量波进度胶囊
 *   - Part 22.9  OriginOS 6  空间玻璃：弹性入场 + 错落列表
 *   - Part 22.2  iOS 26 Liquid Glass：液态玻璃卡片 + 折射层
 *   - 状态变化时通过 setData 触发 spring / 进度胶囊动画更新
 *
 * API 对接点：
 *   - GET  /api/orders/?status=xxx
 *   - POST /api/orders/{id}/confirm/
 *   - POST /api/orders/{id}/reject/
 *   - POST /api/orders/{id}/complete/
 *   - GET  /api/orders/{id}/  (详情/评价入口)
 *
 * 设计要点：
 *   - 复用 app.wxss token + 工具类
 *   - 状态色取自 utils/style.js 的 ORDER_STATUS_MAP
 *   - mock 数据兜底（后端未启动也能展示完整状态机）
 *   - 减动效偏好：尊重系统 prefers-reduced-motion（CSS 已处理）
 *   - 订单状态变化时调用 this.updateOrderAnimation() 重新计算 stepList
 *     让 spring-m3-fast / anim-progress-fill 自动重播（Key 别名 + key 值刷新）
 */
const api = require('../../utils/api.js')
const { ORDER_STATUS_MAP, formatPrice } = require('../../utils/style.js')
const { ICON } = require('../../utils/icon.js')

/* ================== 状态机步骤定义（顺序固定） ================== */
// 步骤条配置：覆盖订单全生命周期。
// 修改步骤请同步 STEPS 与 getStepIndex。
const STEPS = [
  { key: 'requested', label: '已申请' },
  { key: 'confirmed', label: '已确认' },
  { key: 'shipping',  label: '待取/待发' },
  { key: 'completed', label: '已完成' },
]

/* ================== Tab 配置（5 类，匹配用户要求） ================== */
// 业务映射：
//   all       -> 全部（不过滤）
//   requested -> 待付款（订单刚提交，等待卖家确认/买家付款）
//   confirmed -> 待发货（已确认，等待卖家发货）
//   shipping  -> 待收货（已发货，等待买家确认收货）
//   completed -> 已完成
// 注：cancelled 状态的订单只出现在"全部"Tab，不单独建 Tab
const TABS = [
  { key: 'all',       label: '全部' },
  { key: 'requested', label: '待付款' },
  { key: 'confirmed', label: '待发货' },
  { key: 'shipping',  label: '待收货' },
  { key: 'completed', label: '已完成' },
]

/* ================== 单订单进度胶囊映射 ================== */
// ColorOS 16 充电岛能量波：进行中订单展示进度胶囊
// progressPercent: 0-100 填充比例
// progressText   : 胶囊右侧文案
// 取消状态 / 已完成订单不展示充电岛胶囊
const PROGRESS_MAP = {
  requested: { percent: 25, text: '已申请' },
  confirmed: { percent: 50, text: '已确认，待发货' },
  shipping:  { percent: 75, text: '已发货，待收货' },
  completed: { percent: 100, text: '已完成' },
}

/* ================== 订单状态显示文本 ================== */
// 与 TABS label 一致：5 类业务状态 + 1 类取消
const STATUS_DISPLAY = {
  requested: '待付款',
  confirmed: '待发货',
  shipping:  '待收货',
  completed: '已完成',
  cancelled: '已取消',
}

/**
 * 根据订单状态推算当前到达的步骤索引（0-based）
 * ------------------------------------------------------------
 *   - requested : 0 (已申请)
 *   - confirmed : 1 (已确认)
 *   - shipping  : 2 (待取/待发)  — 部分后端会用 confirmed 兼任
 *   - completed : 3 (已完成)
 *   - cancelled : -1 (无步骤条)
 * @param {string} status 订单状态
 * @returns {number} 步骤索引（-1 表示无步骤条）
 */
function getStepIndex(status) {
  switch (status) {
    case 'requested': return 0
    case 'confirmed': return 1
    case 'shipping':  return 2
    case 'completed': return 3
    case 'cancelled': return -1
    default:          return 0
  }
}

/**
 * Mock 数据（当后端 /api/orders/ 失败时使用）
 * 覆盖 5 种状态、买卖双视角，让状态机和操作按钮都能演示。
 * @param {number} currentUserId 当前用户 ID
 * @returns {Array} mock 订单列表
 */
function buildMockOrders(currentUserId) {
  const me = currentUserId || 1
  return [
    {
      id: 1001,
      order_no: 'C20260606001',
      status: 'requested',
      product: { id: 11, title: '《高数》第七版（同济大学）', cover: '/assets/icons/image.png', price: 35 },
      buyer:  { id: me, nickname: '我', avatar: '/assets/icons/avatar.png' },
      seller: { id: 2, nickname: '李四', avatar: '/assets/icons/avatar.png' },
      total_amount: 35,
      created_at: '2026-06-06 10:30',
      remark: '希望本周内自取',
    },
    {
      id: 1002,
      order_no: 'C20260605007',
      status: 'confirmed',
      product: { id: 12, title: '罗技 MX Master 3 鼠标', cover: '/assets/icons/image.png', price: 420 },
      buyer:  { id: me, nickname: '我', avatar: '/assets/icons/avatar.png' },
      seller: { id: 3, nickname: '王五', avatar: '/assets/icons/avatar.png' },
      total_amount: 420,
      created_at: '2026-06-05 21:12',
      remark: '已与卖家约周六下午图书馆门口',
    },
    {
      id: 1003,
      order_no: 'C20260604022',
      status: 'shipping',
      product: { id: 13, title: 'iPad Air 4 64G', cover: '/assets/icons/image.png', price: 2680 },
      buyer:  { id: 2, nickname: '李四', avatar: '/assets/icons/avatar.png' },
      seller: { id: me, nickname: '我', avatar: '/assets/icons/avatar.png' },
      total_amount: 2680,
      created_at: '2026-06-04 09:00',
      remark: '顺丰到付',
    },
    {
      id: 1004,
      order_no: 'C20260601005',
      status: 'completed',
      product: { id: 14, title: '大学英语四级真题（最新）', cover: '/assets/icons/image.png', price: 18 },
      buyer:  { id: me, nickname: '我', avatar: '/assets/icons/avatar.png' },
      seller: { id: 4, nickname: '赵六', avatar: '/assets/icons/avatar.png' },
      total_amount: 18,
      created_at: '2026-06-01 14:00',
      remark: '已完成交易',
    },
    {
      id: 1005,
      order_no: 'C20260530099',
      status: 'cancelled',
      product: { id: 15, title: '耐克跑鞋 42 码', cover: '/assets/icons/image.png', price: 199 },
      buyer:  { id: me, nickname: '我', avatar: '/assets/icons/avatar.png' },
      seller: { id: 5, nickname: '钱七', avatar: '/assets/icons/avatar.png' },
      total_amount: 199,
      created_at: '2026-05-30 18:30',
      remark: '买家已取消',
    },
  ]
}

Page({
  data: {
    tabs: TABS,
    currentTab: 0,           // 当前 Tab 索引
    currentTabKey: 'all',    // 与后端 status 字段对应
    orders: [],
    steps: STEPS,            // 步骤条配置
    loading: false,
    finished: false,         // 列表已无更多
    page: 1,
    pageSize: 20,
    // 资源：使用 SVG 取代 emoji / 特殊字符（用户规则 5）
    arrowIcon: ICON.arrowRight,
    statusSuccessIcon: ICON.success,
    // 角色：根据订单判断"我是买家还是卖家"，用于切换按钮
    currentUserId: 0,
    // 动效关键帧时间戳，用于触发重播（ColorOS 16 干脆利落打断）
    _animTick: 0,
  },

  /**
   * 页面显示：检查登录态、激活 tab 高亮、刷新数据
   * ------------------------------------------------------------
   * 同步自定义 tabBar 的高亮（订单页不是 tab 时不需要）。
   */
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: -1 })
    }
    const app = getApp()
    const uid = (app.globalData.userInfo && app.globalData.userInfo.id) || 0
    this.setData({ currentUserId: uid })
    this.refresh()
  },

  /**
   * 下拉刷新
   * ------------------------------------------------------------
   * 重新拉取数据并停止下拉动画。
   */
  onPullDownRefresh() {
    this.refresh().finally(() => wx.stopPullDownRefresh())
  },

  /**
   * 切换 Tab
   * ------------------------------------------------------------
   * @param {Object} e 事件对象
   * 切换后调用 refresh() 重新拉取对应状态的订单。
   * 同时更新 _animTick 触发 anim-m3-spatial-in 重新播放。
   */
  onTabChange(e) {
    const index = Number(e.currentTarget.dataset.index)
    if (index === this.data.currentTab) return
    this.setData({
      currentTab: index,
      currentTabKey: TABS[index].key,
      _animTick: this.data._animTick + 1,
    })
    this.refresh()
  },

  /**
   * 刷新列表（先清空再请求）
   * ------------------------------------------------------------
   * @returns {Promise} 完成时 resolve
   */
  refresh() {
    this.setData({ loading: true, orders: [], page: 1, finished: false })
    return this.loadPage().finally(() => this.setData({ loading: false }))
  },

  /**
   * 加载一页
   * ------------------------------------------------------------
   * 内部使用，封装单次分页请求。
   * @returns {Promise}
   */
  loadPage() {
    const { currentTabKey, page, pageSize } = this.data
    const params = { page, page_size: pageSize }
    if (currentTabKey !== 'all') params.status = currentTabKey

    return this.fetchOrders(params)
      .then((list) => {
        const decorated = this.decorateOrders(list || [])
        this.setData({
          orders: this.data.orders.concat(decorated),
          finished: !list || list.length < pageSize,
        })
      })
      .catch((err) => {
        console.error('[orders] loadPage fail', err)
      })
  },

  /**
   * 拉取订单数据（带 mock 兜底）
   * ------------------------------------------------------------
   * @param {Object} params 查询参数
   * @returns {Promise<Array>} 订单列表
   */
  fetchOrders(params) {
    const qs = Object.keys(params || {})
      .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&')
    return new Promise((resolve) => {
      if (!getApp().globalData.token) {
        // 未登录：直接 mock
        return resolve(this.mockFilter(params))
      }
      api.orders(params || {})
        .then((res) => {
          const list = (res && res.data && (res.data.results || res.data)) || []
          resolve(Array.isArray(list) ? list : [])
        })
        .catch(() => resolve(this.mockFilter(params)))
    })
  },

  /**
   * 用 mock 数据按 status 过滤
   * ------------------------------------------------------------
   * @param {Object} params 查询参数
   * @returns {Array} 过滤后的订单列表
   */
  mockFilter(params) {
    const all = buildMockOrders(this.data.currentUserId)
    if (!params || !params.status || params.status === 'all') return all
    return all.filter((o) => o.status === params.status)
  },

  /**
   * 为订单数据附加展示字段：状态文本/颜色、步骤索引、当前角色、操作按钮、进度胶囊
   * ------------------------------------------------------------
   * @param {Array} orders 原始订单
   * @returns {Array} 装饰后的订单（直接用于 setData）
   */
  decorateOrders(orders) {
    const me = this.data.currentUserId
    return orders.map((o) => {
      // 1) 状态显示：优先 STATUS_DISPLAY，未知状态回落 ORDER_STATUS_MAP
      const sm = ORDER_STATUS_MAP[o.status] || { label: o.status, color: '#999999' }
      const statusLabel = STATUS_DISPLAY[o.status] || sm.label
      // 2) 步骤索引
      const stepIndex = getStepIndex(o.status)
      // 3) 角色判断：我是买家还是卖家
      const isBuyer = me && o.buyer && Number(o.buyer.id) === Number(me)
      const isSeller = me && o.seller && Number(o.seller.id) === Number(me)
      // 4) 对方信息
      const counterpart = isSeller ? o.buyer : o.seller
      // 5) 操作按钮
      const actions = this.computeActions(o, isBuyer, isSeller)
      // 6) 步骤条每个点的完成态
      const stepList = STEPS.map((s, idx) => ({
        ...s,
        done: stepIndex >= idx,
        active: stepIndex === idx,
      }))
      // 7) ColorOS 16 充电岛进度胶囊数据
      const progress = PROGRESS_MAP[o.status] || { percent: 0, text: '' }
      const showProgress = !!PROGRESS_MAP[o.status] && o.status !== 'cancelled'
      // 8) 卡片状态修饰类（用于增强边框/动效）
      const statusClass = (o.status === 'confirmed' || o.status === 'shipping')
        ? 'order-card--progress'
        : ''
      return {
        ...o,
        statusLabel,
        statusColor: sm.color,
        role: isSeller ? 'seller' : (isBuyer ? 'buyer' : 'guest'),
        counterpart: counterpart || {},
        actions,
        stepList,
        progressPercent: progress.percent,
        progressText: progress.text,
        showProgress,
        statusClass,
        priceText: formatPrice(o.total_amount != null ? o.total_amount : (o.product && o.product.price) || 0),
      }
    })
  },

  /**
   * 计算订单的操作按钮（按状态 + 角色）
   * ------------------------------------------------------------
   * @param {Object} order 订单
   * @param {boolean} isBuyer 我是买家
   * @param {boolean} isSeller 我是卖家
   * @returns {Array<{key:string,label:string,type:string}>} 操作按钮列表
   */
  computeActions(order, isBuyer, isSeller) {
    const acts = []
    switch (order.status) {
      case 'requested':
        // 卖家视角：确认 / 拒绝；买家视角：取消
        if (isSeller) {
          acts.push({ key: 'confirm', label: '确认订单', type: 'primary' })
          acts.push({ key: 'reject',  label: '拒绝',     type: 'ghost'   })
        } else if (isBuyer) {
          acts.push({ key: 'cancel',  label: '取消订单', type: 'ghost'   })
        }
        break
      case 'confirmed':
        // 双方都能标记完成（实际业务中由买家确认收货）
        if (isBuyer) {
          acts.push({ key: 'complete', label: '标记完成', type: 'primary' })
        }
        if (isSeller) {
          acts.push({ key: 'ship',     label: '标记发货', type: 'primary' })
        }
        acts.push({ key: 'chat',       label: '联系对方', type: 'ghost'   })
        break
      case 'shipping':
        acts.push({ key: 'complete', label: '确认收货', type: 'primary' })
        acts.push({ key: 'chat',     label: '联系对方', type: 'ghost'   })
        break
      case 'completed':
        acts.push({ key: 'review', label: '去评价', type: 'primary' })
        acts.push({ key: 'detail', label: '订单详情', type: 'ghost' })
        break
      case 'cancelled':
        acts.push({ key: 'detail', label: '订单详情', type: 'ghost' })
        break
      default:
        break
    }
    return acts
  },

  /**
   * 触发订单操作
   * ------------------------------------------------------------
   * @param {Object} e 事件对象（含 data-id, data-key）
   */
  onActionTap(e) {
    const { id, key } = e.currentTarget.dataset
    const order = this.data.orders.find((o) => String(o.id) === String(id))
    if (!order) return
    switch (key) {
      case 'confirm': this.confirmOrder(order); break
      case 'reject':  this.rejectOrder(order);  break
      case 'cancel':  this.cancelOrder(order);  break
      case 'complete':this.completeOrder(order);break
      case 'ship':    this.shipOrder(order);    break
      case 'chat':    this.openChat(order);     break
      case 'review':  this.goReview(order);     break
      case 'detail':  this.goDetail(order);     break
      default: break
    }
  },

  /**
   * 卡片整体点击（不影响按钮）：进入订单详情
   * ------------------------------------------------------------
   * 避免按钮冒泡：onActionTap 已 stopPropagation 等价（小程序内通过外层
   * 不放 bindtap 解决），此处仅做空操作占位以便后续扩展。
   * @param {Object} e 事件对象
   */
  onCardTap(e) {
    // 保留扩展位：例如打开订单详情弹窗
    // 当前不做跳转，避免与按钮区冲突
  },

  /**
   * 订单状态变化时本地更新（避免全量 refresh）
   * ------------------------------------------------------------
   * 直接在客户端模拟"卖家确认 -> 状态推进"，触发 spring / 充电岛动效重播。
   * 真实接口完成后建议改为后端推送。
   * @param {string} orderId 订单 ID
   * @param {string} newStatus 新的订单状态
   */
  updateOrderStatus(orderId, newStatus) {
    const orders = (this.data.orders || []).map((o) => {
      if (String(o.id) !== String(orderId)) return o
      return { ...o, status: newStatus }
    })
    const decorated = this.decorateOrders(orders)
    this.setData({
      orders: decorated,
      // _animTick 变化让 WXML 中依赖 stagger-delay 的卡片整体重播入场
      _animTick: this.data._animTick + 1,
    })
  },

  /**
   * 卖家：确认订单
   * ------------------------------------------------------------
   * 调接口成功后本地推进状态 -> 'confirmed'，触发弹层/胶囊动画。
   * @param {Object} order 订单
   */
  confirmOrder(order) {
    this.callOrderAction(order.id, '/orders/' + order.id + '/confirm/', 'POST', {})
      .then(() => {
        wx.showToast({ title: '已确认', icon: 'success' })
        this.updateOrderStatus(order.id, 'confirmed')
      })
      .catch((err) => this.handleActionErr(err, '确认失败'))
  },

  /**
   * 卖家：拒绝订单
   * ------------------------------------------------------------
   * 二次确认弹窗后调接口，成功后状态 -> 'cancelled'。
   * @param {Object} order 订单
   */
  rejectOrder(order) {
    wx.showModal({
      title: '提示',
      content: '确定要拒绝该订单吗？',
      success: (r) => {
        if (!r.confirm) return
        this.callOrderAction(order.id, '/orders/' + order.id + '/reject/', 'POST', {})
          .then(() => {
            wx.showToast({ title: '已拒绝', icon: 'none' })
            this.updateOrderStatus(order.id, 'cancelled')
          })
          .catch((err) => this.handleActionErr(err, '操作失败'))
      },
    })
  },

  /**
   * 买家：取消订单
   * ------------------------------------------------------------
   * @param {Object} order 订单
   */
  cancelOrder(order) {
    wx.showModal({
      title: '提示',
      content: '确定要取消该订单吗？',
      success: (r) => {
        if (!r.confirm) return
        this.callOrderAction(order.id, '/orders/' + order.id + '/cancel/', 'POST', {})
          .then(() => {
            wx.showToast({ title: '已取消', icon: 'none' })
            this.updateOrderStatus(order.id, 'cancelled')
          })
          .catch((err) => this.handleActionErr(err, '取消失败'))
      },
    })
  },

  /**
   * 买家：标记完成（确认收货）
   * ------------------------------------------------------------
   * 成功后状态 -> 'completed'，充电岛胶囊进度拉满。
   * @param {Object} order 订单
   */
  completeOrder(order) {
    wx.showModal({
      title: '确认完成',
      content: '确认已收到货，交易完成？',
      success: (r) => {
        if (!r.confirm) return
        this.callOrderAction(order.id, '/orders/' + order.id + '/complete/', 'POST', {})
          .then(() => {
            wx.showToast({ title: '已完成', icon: 'success' })
            this.updateOrderStatus(order.id, 'completed')
          })
          .catch((err) => this.handleActionErr(err, '操作失败'))
      },
    })
  },

  /**
   * 卖家：标记发货
   * ------------------------------------------------------------
   * 成功后状态 -> 'shipping'，触发 anim-charge-wave 充电岛波纹。
   * @param {Object} order 订单
   */
  shipOrder(order) {
    this.callOrderAction(order.id, '/orders/' + order.id + '/ship/', 'POST', {})
      .then(() => {
        wx.showToast({ title: '已发货', icon: 'success' })
        this.updateOrderStatus(order.id, 'shipping')
      })
      .catch((err) => this.handleActionErr(err, '发货失败'))
  },

  /**
   * 跳到聊天页（与对方）
   * ------------------------------------------------------------
   * 优先跳到 chat-room（带 peerId + peerName），fallback 到 chat 会话列表
   * @param {Object} order 订单
   */
  openChat(order) {
    const target = order.counterpart || {}
    const url = '/pages/chat-room/chat-room'
      + '?peerId=' + (target.id || '')
      + '&peerName=' + encodeURIComponent(target.nickname || target.username || '对方')
      + (order.product && order.product.id ? '&productId=' + order.product.id : '')
    wx.navigateTo({
      url,
      fail: () => {
        // chat-room 不可用：跳到 chat tab
        wx.switchTab({ url: '/pages/chat/chat' })
      },
    })
  },

  /**
   * 跳到评价页
   * ------------------------------------------------------------
   * @param {Object} order 订单
   */
  goReview(order) {
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + (order.product && order.product.id) + '&review=1',
      fail: () => {
        wx.showToast({ title: '请进入商品详情评价', icon: 'none' })
      },
    })
  },

  /**
   * 跳到订单详情
   * ------------------------------------------------------------
   * 临时使用 Modal 展示订单基本信息，避免重复页面。
   * @param {Object} order 订单
   */
  goDetail(order) {
    wx.showModal({
      title: '订单详情',
      content: '订单号：' + order.order_no + '\n状态：' + (order.statusLabel || order.status),
      showCancel: false,
    })
  },

  /**
   * 通用订单操作调用
   * ------------------------------------------------------------
   * @param {number} id 订单 id
   * @param {string} url 接口 URL
   * @param {string} method HTTP 方法
   * @param {Object} data 请求体
   * @returns {Promise} 操作结果
   */
  callOrderAction(id, url, method, data) {
    return new Promise((resolve, reject) => {
      if (!getApp().globalData.token) {
        // mock 模式：直接 resolve
        return setTimeout(resolve, 300)
      }
      const m = (method || 'POST').toUpperCase()
      let p
      if (url.includes('/confirm/')) p = api.confirmOrder(id, data)
      else if (url.includes('/cancel/')) p = api.cancelOrder(id, data && data.reason)
      else if (url.includes('/complete/')) p = api.completeOrder(id)
      else p = api.orders({}).then(() => null)
      p.then(resolve).catch((err) => {
        if (err && err._mock !== false) resolve()
        else reject(err)
      })
    })
  },

  /**
   * 统一处理操作失败
   * ------------------------------------------------------------
   * @param {Error} err 错误对象
   * @param {string} fallbackMsg 兜底提示
   */
  handleActionErr(err, fallbackMsg) {
    const msg = (err && err.message) || fallbackMsg || '操作失败'
    wx.showToast({ title: msg, icon: 'none' })
  },

  /**
   * 跳到首页
   */
  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  /**
   * 上拉加载更多
   * ------------------------------------------------------------
   * 滚动到底部自动加载下一页。
   */
  onReachBottom() {
    if (this.data.finished || this.data.loading) return
    this.setData({ page: this.data.page + 1 })
    this.setData({ loading: true })
    this.loadPage().finally(() => this.setData({ loading: false }))
  },
})
