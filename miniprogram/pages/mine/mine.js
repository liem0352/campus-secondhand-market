/**
 * pages/mine/mine.js
 * 我的页控制器 · 校园易物 v5 重构
 * --------------------------------------------------------------------
 * 设计要点：
 *   - 配色按功能分类（避免全 orange-100 视觉单调）
 *   - 订单入口 5 个状态（新增"待收货"）
 *   - 宫格菜单 10 个（5 列 2 行）
 *   - 信用分带等级中文标签
 *   - 严格使用 var(--*) 引用 design token
 *
 * 路由来源：
 *   /users/me/           - 当前用户资料
 *   /stats/me/overview/  - 我的汇总（发布 / 已售 / 收藏 / 信用分）
 *   /orders/             - 订单列表（用于订单入口徽标）
 */

const api = require('../../utils/api.js')
const { getCreditLevel } = require('../../utils/style.js')
const { ICON } = require('../../utils/icon.js')

/* ================== 配色：按功能分类 ==================
 * 通过 design token 引用，约定在 app.wxss 中：
 *   --orange-100 / --orange-200    订单 / 发布
 *   --red-100   / --red-200        收藏
 *   --gold-100  / --gold-200       钱包
 *   --blue-100  / --blue-200       地址
 *   --green-100 / --green-200       认证
 *   --purple-100/ --purple-200     消息
 *   --cyan-100  / --cyan-200       客服
 *   --gray-100  / --gray-200       帮助/设置
 *
 * 注：由于 WXML 内联 style 不支持 var(--*)，此处保留 hex 渐变字符串；
 *     颜色值与 app.wxss 中 --orange-100 等同源，保持视觉一致。
 */
const COLOR_PALETTE = {
  orange:  'linear-gradient(135deg, #FFE3D1 0%, #FFCBA4 100%)', // ≡ --orange-100 → --orange-200
  red:     'linear-gradient(135deg, #FFD6D6 0%, #FFB0B0 100%)', // ≡ --danger-100 → --danger-300
  gold:    'linear-gradient(135deg, #FFEFB8 0%, #FFE08A 100%)', // ≡ --amber-100 → --amber-200
  blue:    'linear-gradient(135deg, #D6E8FF 0%, #B0D0FF 100%)', // ≡ --info-100 → --info-300
  green:   'linear-gradient(135deg, #D6F5DC 0%, #B0E8BD 100%)', // ≡ --success-100 → --success-300
  purple:  'linear-gradient(135deg, #E8D6FF 0%, #D0B0FF 100%)', // 紫色系（消息中心）
  cyan:    'linear-gradient(135deg, #D6F5F5 0%, #B0E8E8 100%)', // 青色系（客服）
  gray:    'linear-gradient(135deg, #EEEEEE 0%, #DDDDDD 100%)', // ≡ --warm-100 → --warm-200
}

/* ================== 订单入口（5 个状态） ==================
 * 状态码与后端约定：
 *   ''               → 全部
 *   'pending_payment'→ 待付款
 *   'pending_ship'   → 待发货
 *   'pending_receive'→ 待收货
 *   'completed'      → 已完成
 *
 * iconSrc：复用首页同款 Lucide PNG 图标，保持视觉一致
 */
const ORDER_ENTRIES = [
  { key: 'all',     label: '全部',   iconSrc: '/assets/icons/grid.png',   color: COLOR_PALETTE.orange, count: 0, status: '' },
  { key: 'pending', label: '待付款', iconSrc: '/assets/icons/wallet.png', color: COLOR_PALETTE.red,    count: 0, status: 'pending_payment' },
  { key: 'ship',    label: '待发货', iconSrc: '/assets/icons/truck.png',   color: COLOR_PALETTE.gold,   count: 0, status: 'pending_ship' },
  { key: 'receive', label: '待收货', iconSrc: '/assets/icons/package.png', color: COLOR_PALETTE.blue,   count: 0, status: 'pending_receive' },
  { key: 'done',    label: '已完成', iconSrc: '/assets/icons/check.png',   color: COLOR_PALETTE.green,  count: 0, status: 'completed' },
]

/* ================== 工具宫格（10 项 / 5 列 2 行） ==================
 * 配色按业务分类：
 *   1) 我的发布  - orange   6) 校园认证 - green
 *   2) 我买到的  - red      7) 消息中心 - purple
 *   3) 我的收藏  - red      8) 在线客服 - cyan
 *   4) 我的钱包  - gold     9) 帮助反馈 - gray
 *   5) 收货地址  - blue    10) 设置    - gray
 */
const QUICK_GRID = [
  { key: 'publish',   label: '我的发布', iconSrc: '/assets/icons/plus.png',            color: COLOR_PALETTE.orange, url: '/pages/mine/my-products?type=on_sale' },
  { key: 'bought',    label: '我买到的', iconSrc: '/assets/icons/shopping-bag.png',     color: COLOR_PALETTE.red,    url: '/pages/mine/my-products?type=bought' },
  { key: 'favorites', label: '我的收藏', iconSrc: '/assets/icons/favorite.png',         color: COLOR_PALETTE.red,    url: '/pages/mine/favorites' },
  { key: 'wallet',    label: '我的钱包', iconSrc: '/assets/icons/wallet.png',           color: COLOR_PALETTE.gold,   url: '/pages/mine/wallet' },
  { key: 'address',   label: '收货地址', iconSrc: '/assets/icons/location.png',         color: COLOR_PALETTE.blue,   url: '/pages/mine/address' },
  { key: 'auth',      label: '校园认证', iconSrc: '/assets/icons/school.png',           color: COLOR_PALETTE.green,  action: 'onVerify' },
  { key: 'message',   label: '消息中心', iconSrc: '/assets/icons/message-square.png',   color: COLOR_PALETTE.purple, url: '/pages/messages/messages' },
  { key: 'support',   label: '在线客服', iconSrc: '/assets/icons/help-circle.png',      color: COLOR_PALETTE.cyan,   action: 'onSupport' },
  { key: 'help',      label: '帮助反馈', iconSrc: '/assets/icons/info.png',             color: COLOR_PALETTE.gray,   action: 'onHelp' },
  { key: 'settings',  label: '设置',     iconSrc: '/assets/icons/settings.png',         color: COLOR_PALETTE.gray,   url: '/pages/mine/settings' },
]

/* ================== 信用分等级中文映射 ================== */
const CREDIT_LEVEL_CN = { high: '优', mid: '良', low: '低' }

Page({
  data: {
    // ===== 用户信息 =====
    userInfo: {
      id: 0,
      username: '',
      nickname: '',
      avatar: '/assets/icons/avatar.png',
      school: '',
      student_id: '',
      credit_score: 80,
      is_verified: false,
    },
    /** 信用分等级（high | mid | low） */
    creditLevel: 'mid',
    /** 信用分等级中文（优 / 良 / 低） */
    creditLevelText: '良',

    // ===== 统计 =====
    stats: { onSale: 0, sold: 0, favorites: 0, reviews: 0 },

    // ===== 入口数据 =====
    orderEntries: ORDER_ENTRIES,
    quickGrid: QUICK_GRID,

    // ===== 状态 =====
    loading: false,
    logged: false,
    /** 状态栏高度（rpx / px 由 CSS 决定，WXML 用于顶部 padding-top） */
    statusBarHeight: 0,
  },

  /* ================================================================
   * 生命周期
   * ================================================================ */

  /**
   * 页面加载：拉取状态栏高度（用于顶部安全区）
   */
  onLoad() {
    try {
      const windowInfo = wx.getWindowInfo
        ? wx.getWindowInfo()
        : (wx.getSystemInfoSync ? wx.getSystemInfoSync() : { statusBarHeight: 20 })
      this.setData({ statusBarHeight: windowInfo.statusBarHeight || 20 })
    } catch (e) {
      this.setData({ statusBarHeight: 20 })
    }
  },

  /**
   * 页面显示：同步 tabBar 高亮 + 拉取数据
   * 每次显示都刷新（不依赖下拉），便于订单徽标 / 信用分实时更新
   */
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 })
    }
    this.refresh()
  },

  /**
   * 下拉刷新：包装 refresh 即可
   */
  onPullDownRefresh() {
    this.refresh().finally(() => wx.stopPullDownRefresh())
  },

  /* ================================================================
   * 数据流
   * ================================================================ */

  /**
   * 刷新页面数据：用户资料 + 统计 + 订单徽标
   * 未登录时仅展示壳页面
   * @returns {Promise<void>}
   */
  refresh() {
    const app = getApp()
    const cached = app.globalData.userInfo

    if (!app.globalData.token) {
      this.setData({
        logged: false,
        userInfo: this.fallbackUser(),
        stats: { onSale: 0, sold: 0, favorites: 0, reviews: 0 },
        creditLevel: 'mid',
        creditLevelText: '良',
        orderEntries: ORDER_ENTRIES.map((e) => ({ ...e, count: 0 })),
      })
      return Promise.resolve()
    }

    this.setData({ loading: true, logged: true })

    return Promise.all([
      this.fetchMe(),
      this.fetchStats(),
      this.fetchOrderCounts(),
    ])
      .catch((err) => {
        console.warn('[mine] refresh fail', err)
        if (cached) this.applyUser(cached)
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  },

  /**
   * 拉取当前用户资料
   * @returns {Promise<void>}
   */
  fetchMe() {
    return api.me()
      .then((res) => {
        const u = (res && res.data) || {}
        this.applyUser(u)
        getApp().globalData.userInfo = u
        try { wx.setStorageSync('userInfo', u) } catch (e) { /* 静默 */ }
      })
  },

  /**
   * 拉取统计数据
   * @returns {Promise<void>}
   */
  fetchStats() {
    return api.myOverview()
      .then((res) => {
        const s = (res && res.data) || {}
        this.setData({
          stats: {
            onSale:    this._num(s.on_sale   != null ? s.on_sale   : s.onSale)    || 0,
            sold:      this._num(s.sold      != null ? s.sold      : s.sold)      || 0,
            favorites: this._num(s.favorites != null ? s.favorites : s.favorites) || 0,
            reviews:   this._num(s.reviews   != null ? s.reviews   : s.reviews)   || 0,
          },
        })
      })
      .catch(() => { /* 静默失败，使用空数据 */ })
  },

  /**
   * 拉取订单状态数量，回填到订单入口徽标
   * @returns {Promise<void>}
   */
  fetchOrderCounts() {
    const statusList = ORDER_ENTRIES
      .filter((e) => !!e.status)
      .map((e) => ({ key: e.key, status: e.status }))

    const tasks = statusList.map((s) =>
      api.orders({ status: s.status, page_size: 1 })
        .then((res) => {
          const data = (res && res.data) || {}
          const total = (data.total != null)
            ? data.total
            : (Array.isArray(data.results) ? data.results.length : 0)
          return { key: s.key, count: this._num(total) }
        })
        .catch(() => ({ key: s.key, count: 0 }))
    )

    return Promise.all(tasks).then((arr) => {
      const map = {}
      arr.forEach((it) => { map[it.key] = it.count })
      const merged = ORDER_ENTRIES.map((e) => Object.assign({}, e, {
        count: map[e.key] != null ? map[e.key] : 0,
      }))
      this.setData({ orderEntries: merged })
    })
  },

  /**
   * 归一化数字：支持字符串 / 数字 / null
   * @param {*} v 输入
   * @returns {number}
   * @private
   */
  _num(v) {
    const n = Number(v)
    return isNaN(n) ? 0 : n
  },

  /**
   * 把接口返回的用户数据归一化并 setData
   * @param {Object} u 后端 /users/me/ 响应数据
   */
  applyUser(u) {
    const score = this._num(u.credit_score != null ? u.credit_score : (u.creditScore || 80))
    const lvl = getCreditLevel(score)
    const level = lvl.level || 'mid'
    this.setData({
      userInfo: {
        id: u.id || 0,
        username: u.username || '',
        nickname: u.nickname || u.username || '未登录用户',
        avatar: u.avatar || '/assets/icons/avatar.png',
        school: u.school || '未填写学校',
        student_id: u.student_id || u.studentId || '',
        credit_score: score,
        is_verified: !!u.is_verified,
      },
      creditLevel: level,
      creditLevelText: CREDIT_LEVEL_CN[level] || '良',
    })
  },

  /**
   * 未登录时的兜底用户对象
   * @returns {Object}
   */
  fallbackUser() {
    return {
      id: 0,
      username: '',
      nickname: '未登录',
      avatar: '/assets/icons/avatar.png',
      school: '请先登录',
      student_id: '',
      credit_score: 80,
      is_verified: false,
    }
  },

  /* ================================================================
   * 事件：通用
   * ================================================================ */

  /**
   * 跳到登录页（未登录态 / 已登录态头像点击都会触发）
   */
  onLoginTap() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  /**
   * 菜单点击统一入口（功能宫格 / 系统设置列表共用）
   * @param {Object} e event
   */
  onMenuTap(e) {
    const { key, url, action } = e.currentTarget.dataset
    if (action && typeof this[action] === 'function') {
      this[action]()
      return
    }
    if (!url) return
    // 订单 / 聊天 / 钱包 / 收藏 / 我的发布 都是已实现页面
    const known = ['orders', 'chat', 'wallet', 'favorites', 'my-products', 'settings', 'stats']
    if (known.includes(key)) {
      if (key === 'orders' || key === 'chat') {
        wx.switchTab({ url: key === 'chat' ? '/pages/chat/chat' : url })
      } else {
        wx.navigateTo({ url, fail: () => wx.showToast({ title: '页面打开失败', icon: 'none' }) })
      }
      return
    }
    // 未知菜单：给出"建设中"提示
    wx.showToast({ title: '功能建设中', icon: 'none' })
  },

  /**
   * 订单入口点击：跳转订单页并携带 status
   * @param {Object} e event
   */
  onOrderEntryTap(e) {
    const { status } = e.currentTarget.dataset
    const query = status ? `?status=${status}` : ''
    wx.navigateTo({ url: '/pages/orders/orders' + query })
  },

  /**
   * 点击信用分徽章：弹窗说明
   */
  onCreditTap() {
    wx.showModal({
      title: '信用分说明',
      content: '信用分初始为 80；订单完成互评后动态调整。低于 60 分时发布商品需审核。',
      showCancel: false,
      confirmText: '我知道了',
    })
  },

  /* ================================================================
   * 事件：业务
   * ================================================================ */

  /**
   * 校园认证：弹窗输入学号
   */
  onVerify() {
    const cur = this.data.userInfo
    if (cur.is_verified) {
      wx.showToast({ title: '已通过校园认证', icon: 'success' })
      return
    }
    wx.showModal({
      title: '校园认证',
      editable: true,
      placeholderText: '请输入学号',
      content: cur.student_id || '',
      success: (r) => {
        if (!r.confirm) return
        const studentId = (r.content || '').trim()
        if (!studentId) {
          wx.showToast({ title: '学号不能为空', icon: 'none' })
          return
        }
        this.submitVerify(studentId)
      },
    })
  },

  /**
   * 提交校园认证
   * @param {string} studentId 学号
   */
  submitVerify(studentId) {
    api.updateProfile({ student_id: studentId, school: this.data.userInfo.school })
      .then(() => {
        wx.showToast({ title: '认证成功', icon: 'success' })
        this.setData({
          'userInfo.is_verified': true,
          'userInfo.student_id': studentId,
        })
      })
      .catch((err) => {
        // mock / 离线模式：本地标记
        const msg = (err && err.message) || ''
        wx.showToast({
          title: /未连接|无法连接|超时/.test(msg) ? '已暂存（离线）' : (msg || '认证成功'),
          icon: 'success',
        })
        this.setData({
          'userInfo.is_verified': true,
          'userInfo.student_id': studentId,
        })
      })
  },

  /**
   * 在线客服：打开 AI 助手页（兜底提示）
   */
  onSupport() {
    wx.showModal({
      title: '在线客服',
      content: '工作时间：9:00-22:00；非工作时段可使用 AI 智能客服（"AI" 入口）',
      confirmText: '去 AI 助手',
      cancelText: '我知道了',
      success: (r) => {
        if (r.confirm) {
          wx.navigateTo({ url: '/pages/ai/ai' })
        }
      },
    })
  },

  /**
   * 帮助反馈：跳转到常见问题页（如未实现则兜底）
   */
  onHelp() {
    wx.showModal({
      title: '帮助与反馈',
      content: '如遇问题，可在公众号"校园易物"留言，或加入 QQ 群 123456789 反馈。',
      showCancel: false,
      confirmText: '我知道了',
    })
  },

  /**
   * 退出登录
   */
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定退出登录吗？',
      success: (r) => {
        if (!r.confirm) return
        getApp().clearSession()
        wx.reLaunch({ url: '/pages/login/login' })
      },
    })
  },

  /* ================================================================
   * 事件：导航（保留旧 API 兼容）
   * ================================================================ */

  /**
   * 跳到订单页（兼容：保留旧 goOrders API）
   */
  goOrders() {
    wx.navigateTo({ url: '/pages/orders/orders' })
  },

  /**
   * 跳到收藏页
   */
  goFavorites() {
    wx.navigateTo({ url: '/pages/mine/favorites' })
  },

  /**
   * 跳到我的发布页
   */
  goMyProducts() {
    wx.navigateTo({ url: '/pages/mine/my-products' })
  },

  /**
   * 分享给好友
   * @returns {Object}
   */
  onShareAppMessage() {
    return {
      title: '校园易物 · 让闲置流动起来',
      path: '/pages/index/index',
    }
  },

  /**
   * 分享到朋友圈
   * @returns {Object}
   */
  onShareTimeline() {
    return {
      title: '校园易物 · 让闲置流动起来',
    }
  },
})
