/**
 * pages/messages/messages.js
 * 消息中心 —— 校园易物
 * --------------------------------------------------------------------
 * 定位：与 tab "消息"（会话列表 chat/chat）互补，聚焦业务通知
 *   - 订单消息：订单状态变更（待付款/已发货/已签收 等）
 *   - 系统通知：平台公告、规则更新、活动通知
 *   - 互动消息：收藏/评论/想要（区别于聊天会话）
 *   - 优惠消息：优惠券到账、限时折扣
 *
 * 数据策略：
 *   - 第一次进入：从 mock 模板 + wx.setStorage 持久化（保证用户重新进入状态保留）
 *   - 已读状态：写入 wx.setStorage('msg_read_ids', [...])
 *
 * v2 升级（2026-06）：融合 fusion-ui-design v2
 *   1) Now Bar 通知条：state.nowBar（One UI 9 渐变擦除进入）
 *   2) 错落列表入场：每条消息注入 staggerDelay（OriginOS 6）
 *   3) 未读红点：数据驱动（unread 字段）
 *   4) 长按操作菜单：onLongPressItem + onActionItem（ColorOS 16）
 *   5) 点击关闭 Now Bar：onCloseNowBar
 *
 * 设计：
 *   - 4 大类入口为图标矩阵
 *   - 下方 Tab 栏提供"全部 / 订单 / 系统 / 互动 / 优惠"五档筛选
 *   - 点击通知：标记已读 + 跳转（navigateTo / switchTab / showToast）
 *   - 长按通知：弹操作菜单（标记已读 / 删除）
 */
const { ICON } = require('../../utils/icon.js')

// Now Bar 关闭状态存储 key（用户主动关闭后不再显示）
const STORAGE_KEY_NOWBAR_DISMISSED = 'msg_nowbar_dismissed_v1'
// 删除的通知 id 集合（从本地列表移除）
const STORAGE_KEY_DELETED = 'msg_deleted_ids_v1'

// 4 大类入口配置（颜色用语义色，与品牌色协调）
const CATEGORIES = [
  {
    key: 'order',
    label: '订单消息',
    icon: ICON.wallet,
    bg: 'linear-gradient(135deg, #FF8A65 0%, #FF6B35 100%)',
  },
  {
    key: 'system',
    label: '系统通知',
    icon: ICON.ai,
    bg: 'linear-gradient(135deg, #4FC3F7 0%, #1989FA 100%)',
  },
  {
    key: 'social',
    label: '互动消息',
    icon: ICON.favorite,
    bg: 'linear-gradient(135deg, #FF8A80 0%, #FF4D4F 100%)',
  },
  {
    key: 'promo',
    label: '优惠消息',
    icon: ICON.share,
    bg: 'linear-gradient(135deg, #FFD54F 0%, #FFA500 100%)',
  },
]

// Tab 筛选列表
const TABS = [
  { key: 'all',    label: '全部' },
  { key: 'order',  label: '订单' },
  { key: 'system', label: '系统' },
  { key: 'social', label: '互动' },
  { key: 'promo',  label: '优惠' },
]

// iconBg 颜色（与 CATEGORIES 的 bg 呼应，便于在列表中复用）
const TYPE_ICON_BG = {
  order:  'linear-gradient(135deg, #FF8A65 0%, #FF6B35 100%)',
  system: 'linear-gradient(135deg, #4FC3F7 0%, #1989FA 100%)',
  social: 'linear-gradient(135deg, #FF8A80 0%, #FF4D4F 100%)',
  promo:  'linear-gradient(135deg, #FFD54F 0%, #FFA500 100%)',
}

const TYPE_ICON = {
  order:  ICON.wallet,
  system: ICON.ai,
  social: ICON.favorite,
  promo:  ICON.share,
}

// 错落入场延迟配置（OriginOS 6 风格）
// 每条消息比上一条多延迟 STAGGER_STEP_MS，最多累计到 STAGGER_MAX_MS
const STAGGER_STEP_MS = 60
const STAGGER_MAX_MS = 480

// 通知模板（mock 数据），首次进入写入 storage
const SEED_NOTIFICATIONS = [
  {
    id: 'n_001',
    type: 'order',
    title: '订单已发货',
    content: '你购买的"iPad Air 5 2022 款 64G"已由卖家发货，预计 3 天内送达',
    summary: { title: 'iPad Air 5 2022 款 64G 星光色', price: 3680, cover: '' },
    action: 'order_detail',
    actionPayload: { orderId: 'ORD20250609001' },
    createdAt: Date.now() - 1000 * 60 * 5, // 5 分钟前
  },
  {
    id: 'n_002',
    type: 'social',
    title: '小明 收藏了你的商品',
    content: '你发布的"概率论教材（同济版）"被小明收藏了，快去看看 TA 的需求',
    summary: { title: '概率论教材（同济版 第 5 版）', price: 25, cover: '' },
    action: 'product_detail',
    actionPayload: { productId: 'P_20250601_001' },
    createdAt: Date.now() - 1000 * 60 * 32,
  },
  {
    id: 'n_003',
    type: 'system',
    title: '【平台公告】关于禁止刷单行为的声明',
    content: '为维护公平的校园交易环境，平台将持续打击虚假交易，一经发现将冻结账号',
    action: 'webview',
    actionPayload: { url: '' },
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 'n_004',
    type: 'promo',
    title: '毕业季清仓优惠券已到账',
    content: '满 50 减 5 / 满 100 减 12 / 满 200 减 30，仅限毕业季专区使用',
    action: 'show_coupons',
    actionPayload: {},
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
  },
  {
    id: 'n_005',
    type: 'order',
    title: '订单已签收',
    content: '订单 ORD20250608007 已成功签收，欢迎对商品做出评价',
    summary: { title: '蓝牙耳机（漫步者 Lolli Pro 2）', price: 199, cover: '' },
    action: 'order_detail',
    actionPayload: { orderId: 'ORD20250608007' },
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
  },
  {
    id: 'n_006',
    type: 'social',
    title: '小红 给你留言了',
    content: '你好，请问这个还在吗？方便的话能否小刀一下？',
    action: 'open_chat',
    actionPayload: { userId: 'U_002', nickname: '小红' },
    createdAt: Date.now() - 1000 * 60 * 60 * 30,
  },
  {
    id: 'n_007',
    type: 'system',
    title: '【功能上新】AI 一键发布已上线',
    content: '上传商品图片，AI 自动生成标题/描述/价格区间，让发布更高效',
    action: 'open_ai_publish',
    actionPayload: {},
    createdAt: Date.now() - 1000 * 60 * 60 * 50,
  },
  {
    id: 'n_008',
    type: 'promo',
    title: '【618 校园专场】数码好物低至 5 折',
    content: 'iPad、Kindle、蓝牙耳机等数码品类限时优惠，6 月 18 日截止',
    action: 'webview',
    actionPayload: { url: '' },
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
  },
  {
    id: 'n_009',
    type: 'order',
    title: '订单已付款',
    content: '你已成功支付订单 ORD20250607012，卖家将在 24 小时内发货',
    action: 'order_detail',
    actionPayload: { orderId: 'ORD20250607012' },
    createdAt: Date.now() - 1000 * 60 * 60 * 96,
  },
  {
    id: 'n_010',
    type: 'social',
    title: '你的商品已被 8 人收藏',
    content: '"大学英语六级真题" 近期热度不错，建议完善描述以提升转化',
    action: 'product_detail',
    actionPayload: { productId: 'P_20250520_009' },
    createdAt: Date.now() - 1000 * 60 * 60 * 100,
  },
]

const STORAGE_KEY_NOTIFS = 'msg_notifications_v1'
const STORAGE_KEY_READ = 'msg_read_ids_v1'

Page({
  data: {
    // Now Bar 通知条状态（One UI 9 风格）
    // visible=false 时不渲染
    // visible=true 时显示 anim-oneui-reveal 渐变擦除进入
    nowBar: {
      visible: false,
      icon: ICON.ai,
      title: '',
      subtitle: '',
      actionText: '查看',
    },
    // 4 大类入口
    categories: [],
    // Tab 列表
    tabList: TABS,
    // 当前选中的 Tab
    activeTab: 'all',
    // 完整通知列表（倒序）
    list: [],
    // 根据 activeTab 过滤后的列表（computed via method）
    filteredList: [],
    loading: true,
  },

  onLoad() {
    this.loadNotifications()
  },

  onShow() {
    // 从 storage 重新加载，处理标记已读 / 删除等本地变更
    this.loadNotifications({ silent: true })
  },

  /**
   * 加载通知列表
   * 第一次进入：写入 seed；之后：从 storage 读
   * 同时根据未读数量 / 类型动态计算 Now Bar 文案
   * @param {Object} options
   * @param {boolean} options.silent - true 则不切换 loading 状态
   */
  loadNotifications({ silent = false } = {}) {
    if (!silent) this.setData({ loading: true })

    let stored = []
    try {
      stored = wx.getStorageSync(STORAGE_KEY_NOTIFS) || []
    } catch (e) { stored = [] }

    if (!stored.length) {
      // 首次进入，seed
      stored = SEED_NOTIFICATIONS.slice()
      try { wx.setStorageSync(STORAGE_KEY_NOTIFS, stored) } catch (e) {}
    }

    // 读取已删除 id 集合（从本地列表中过滤）
    let deletedIds = {}
    try {
      const arr = wx.getStorageSync(STORAGE_KEY_DELETED) || []
      deletedIds = arr.reduce((acc, id) => { acc[id] = true; return acc }, {})
    } catch (e) { deletedIds = {} }

    // 读取已读 id 集合
    let readIds = {}
    try {
      const arr = wx.getStorageSync(STORAGE_KEY_READ) || []
      readIds = arr.reduce((acc, id) => { acc[id] = true; return acc }, {})
    } catch (e) { readIds = {} }

    // 倒序 + 应用已读 + 应用删除 + 注入派生字段 + 计算 staggerDelay
    const list = stored
      .filter((n) => !deletedIds[n.id])
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((n, idx) => {
        const unread = !readIds[n.id]
        return Object.assign({}, n, {
          unread,
          iconBg: TYPE_ICON_BG[n.type] || TYPE_ICON_BG.system,
          icon: TYPE_ICON[n.type] || ICON.ai,
          timeText: this.formatTime(n.createdAt),
          // 错落入场延迟：每条消息比上一条多 60ms，最大 480ms
          staggerDelay: this.computeStaggerDelay(idx),
          // 长按操作区显示状态（默认隐藏）
          showActions: false,
        })
      })

    // 计算每个 Tab 的未读数
    const tabList = TABS.map((t) => {
      const filtered = t.key === 'all' ? list : list.filter((n) => n.type === t.key)
      return Object.assign({}, t, { unread: filtered.filter((n) => n.unread).length })
    })

    // 计算 4 大类入口的未读数
    const categories = CATEGORIES.map((c) => {
      const count = list.filter((n) => n.type === c.key && n.unread).length
      return Object.assign({}, c, { unread: count })
    })

    // 应用当前 tab 过滤
    const filteredList = this.applyFilter(list, this.data.activeTab)

    // 计算 Now Bar 状态
    const nowBar = this.computeNowBar(list, categories)

    this.setData({
      list,
      tabList,
      categories,
      filteredList,
      loading: false,
      nowBar,
    })
  },

  /**
   * 计算错落入场延迟（OriginOS 6 风格）
   * @param {number} index - 消息在列表中的索引
   * @returns {number} 延迟毫秒数（最大 STAGGER_MAX_MS）
   */
  computeStaggerDelay(index) {
    const delay = index * STAGGER_STEP_MS
    return Math.min(delay, STAGGER_MAX_MS)
  },

  /**
   * 计算 Now Bar 状态（One UI 9 风格）
   * 逻辑：
   *   - 用户已主动关闭过 → 不再显示
   *   - 没有任何通知 → 不显示
   *   - 有未读订单 → 显示订单提示
   *   - 有未读系统通知 → 显示系统提示
   *   - 有未读优惠 → 显示优惠提示
   *   - 有未读互动 → 显示互动提示
   *   - 无未读 → 显示"已读完成"提示
   * @param {Array} list - 完整通知列表
   * @param {Array} categories - 4 大类入口（含未读数）
   * @returns {Object} nowBar 状态
   */
  computeNowBar(list, categories) {
    // 检查用户是否已主动关闭
    let dismissed = false
    try {
      dismissed = !!wx.getStorageSync(STORAGE_KEY_NOWBAR_DISMISSED)
    } catch (e) { dismissed = false }

    // 没有任何通知时不显示
    if (!list.length) {
      return { visible: false, icon: ICON.ai, title: '', subtitle: '', actionText: '查看' }
    }

    // 优先匹配优先级最高的未读类型：订单 > 优惠 > 互动 > 系统
    const findCat = (key) => categories.find((c) => c.key === key)
    const orderCat = findCat('order')
    const promoCat = findCat('promo')
    const socialCat = findCat('social')
    const systemCat = findCat('system')

    if (orderCat && orderCat.unread > 0) {
      return {
        visible: !dismissed,
        icon: orderCat.icon,
        title: '你有 ' + orderCat.unread + ' 条订单消息',
        subtitle: '发货 / 签收 / 付款状态更新，点击查看',
        actionText: '查看',
      }
    }
    if (promoCat && promoCat.unread > 0) {
      return {
        visible: !dismissed,
        icon: promoCat.icon,
        title: '你有 ' + promoCat.unread + ' 条优惠到账',
        subtitle: '毕业季 / 618 专场优惠券已发放',
        actionText: '查看',
      }
    }
    if (socialCat && socialCat.unread > 0) {
      return {
        visible: !dismissed,
        icon: socialCat.icon,
        title: '你有 ' + socialCat.unread + ' 条互动消息',
        subtitle: '有人收藏 / 评论了你的商品',
        actionText: '查看',
      }
    }
    if (systemCat && systemCat.unread > 0) {
      return {
        visible: !dismissed,
        icon: systemCat.icon,
        title: '你有 ' + systemCat.unread + ' 条系统通知',
        subtitle: '平台公告 / 功能上新',
        actionText: '查看',
      }
    }
    // 无未读时不显示
    return { visible: false, icon: ICON.ai, title: '', subtitle: '', actionText: '查看' }
  },

  /**
   * 过滤逻辑（纯函数抽取，便于测试和复用）
   * @param {Array} list
   * @param {string} tabKey
   * @returns {Array} 过滤后的列表
   */
  applyFilter(list, tabKey) {
    if (tabKey === 'all') return list
    return list.filter((n) => n.type === tabKey)
  },

  /**
   * 时间格式化为"刚刚 / X 分钟前 / X 小时前 / X 天前 / MM-DD"
   * 避免引入 dayjs，保持纯函数
   * @param {number} ts - 时间戳（毫秒）
   * @returns {string} 友好时间字符串
   */
  formatTime(ts) {
    const diff = Date.now() - ts
    if (diff < 0) return '刚刚'
    const min = Math.floor(diff / 60000)
    if (min < 1) return '刚刚'
    if (min < 60) return min + ' 分钟前'
    const hr = Math.floor(min / 60)
    if (hr < 24) return hr + ' 小时前'
    const day = Math.floor(hr / 24)
    if (day < 7) return day + ' 天前'
    const d = new Date(ts)
    return (d.getMonth() + 1) + '-' + (d.getDate() < 10 ? '0' + d.getDate() : d.getDate())
  },

  /**
   * 点击 Now Bar：跳到当前未读数最多的 Tab
   * 行为等价于点击顶部 4 大类入口
   */
  onTapNowBar() {
    // 找到当前未读数最多的分类
    const cats = this.data.categories
    let topKey = 'all'
    let topCount = -1
    cats.forEach((c) => {
      if (c.unread > topCount) {
        topCount = c.unread
        topKey = c.key
      }
    })
    if (topCount <= 0) {
      // 没有未读时，切到"全部" Tab
      topKey = 'all'
    }
    this.setData({ activeTab: topKey, filteredList: this.applyFilter(this.data.list, topKey) })
  },

  /**
   * 关闭 Now Bar：写入本地存储，本会话内不再显示
   * 同时通过 anim-oneui-reveal 反向动画渐隐（依赖 CSS clip-path 反转）
   */
  onCloseNowBar() {
    try { wx.setStorageSync(STORAGE_KEY_NOWBAR_DISMISSED, true) } catch (e) {}
    this.setData({
      'nowBar.visible': false,
    })
  },

  /**
   * 点击顶部 4 大类入口：跳到对应 Tab
   * @param {Object} e - 事件对象
   */
  onTapCategory(e) {
    const { key } = e.currentTarget.dataset
    this.setData({ activeTab: key, filteredList: this.applyFilter(this.data.list, key) })
  },

  /**
   * 切换 Tab
   * @param {Object} e - 事件对象
   */
  onSwitchTab(e) {
    const { key } = e.currentTarget.dataset
    if (key === this.data.activeTab) return
    this.setData({ activeTab: key, filteredList: this.applyFilter(this.data.list, key) })
  },

  /**
   * 长按 Tab：预留扩展（如长按清理某分类）
   * 当前仅给一个轻提示，避免空操作
   * @param {Object} e - 事件对象
   */
  onLongPressTab(e) {
    const { key, index } = e.currentTarget.dataset
    // 预留：未来可实现"长按清理该分类"
    wx.showToast({ title: '长按 ' + (this.data.tabList[index] && this.data.tabList[index].label), icon: 'none', duration: 1000 })
  },

  /**
   * 点击通知条目：标记已读 + 触发 action
   * 同时隐藏该条目的长按操作区
   * @param {Object} e - 事件对象
   */
  onTapItem(e) {
    const { id, type, action, index } = e.currentTarget.dataset
    this.markRead(id, { silent: true })
    this.handleAction(action, e.currentTarget.dataset)
  },

  /**
   * 长按通知条目：弹操作菜单（标记已读 / 删除）
   * 通过更新 showActions 字段控制操作区显隐
   * @param {Object} e - 事件对象
   */
  onLongPressItem(e) {
    const { id, index } = e.currentTarget.dataset
    const key = 'filteredList[' + index + '].showActions'
    // 切换显示：长按再长按则关闭；其他项自动关闭
    const list = this.data.filteredList.map((item, i) => {
      return Object.assign({}, item, { showActions: i === index ? !item.showActions : false })
    })
    this.setData({ filteredList: list })
  },

  /**
   * 长按操作区按钮回调：标记已读 / 删除
   * @param {Object} e - 事件对象（dataset 中含 id 和 action）
   */
  onActionItem(e) {
    const { id, action } = e.currentTarget.dataset
    if (action === 'read') {
      this.markRead(id, { silent: false })
    } else if (action === 'delete') {
      this.deleteItem(id)
    }
  },

  /**
   * 从存储中删除一条通知（不可恢复）
   * @param {string} id - 通知 id
   */
  deleteItem(id) {
    let deleted = []
    try { deleted = wx.getStorageSync(STORAGE_KEY_DELETED) || [] } catch (e) { deleted = [] }
    if (deleted.indexOf(id) === -1) deleted.push(id)
    try { wx.setStorageSync(STORAGE_KEY_DELETED, deleted) } catch (e) {}
    this.loadNotifications({ silent: true })
    wx.showToast({ title: '已删除', icon: 'success', duration: 1000 })
  },

  /**
   * 标记单条已读
   * @param {string} id - 通知 id
   * @param {Object} options
   * @param {boolean} options.silent - true 不弹 toast
   */
  markRead(id, { silent = false } = {}) {
    let readIds = []
    try { readIds = wx.getStorageSync(STORAGE_KEY_READ) || [] } catch (e) { readIds = [] }
    if (readIds.indexOf(id) === -1) readIds.push(id)
    try { wx.setStorageSync(STORAGE_KEY_READ, readIds) } catch (e) {}
    // 重新计算 unread 字段
    this.loadNotifications({ silent: true })
    if (!silent) wx.showToast({ title: '已读', icon: 'none', duration: 1000 })
  },

  /**
   * 全部已读（下拉刷新触发）
   * 当前通过 onPullDownRefresh 触发
   */
  onPullDownRefresh() {
    let readIds = []
    try { readIds = wx.getStorageSync(STORAGE_KEY_READ) || [] } catch (e) { readIds = [] }
    this.data.list.forEach((n) => {
      if (readIds.indexOf(n.id) === -1) readIds.push(n.id)
    })
    try { wx.setStorageSync(STORAGE_KEY_READ, readIds) } catch (e) {}
    this.loadNotifications({ silent: true })
    wx.showToast({ title: '已全部标记为已读', icon: 'success', duration: 1500 })
    // 异步 stopPullDownRefresh
    setTimeout(() => {
      try { wx.stopPullDownRefresh() } catch (e) {}
    }, 300)
  },

  /**
   * 处理 action 跳转
   * @param {string} action - 动作类型
   * @param {Object} dataset - 携带 actionPayload
   */
  handleAction(action, dataset) {
    const payload = this.parseActionPayload(dataset)
    switch (action) {
      case 'order_detail':
        // 订单页是非 tab 页，用 navigateTo；订单页支持 ?id=
        wx.navigateTo({
          url: '/pages/orders/orders' + (payload.orderId ? '?id=' + payload.orderId : ''),
        })
        break
      case 'product_detail':
        wx.navigateTo({
          url: '/pages/detail/detail' + (payload.productId ? '?id=' + payload.productId : ''),
        })
        break
      case 'open_chat':
        // 跳到会话列表（tab 页），让用户找到对应联系人
        wx.switchTab({ url: '/pages/chat/chat' })
        break
      case 'open_ai_publish':
        wx.switchTab({ url: '/pages/publish/publish' })
        break
      case 'webview':
        // 后端未提供活动链接时，给个轻提示
        wx.showToast({ title: '活动详情暂未提供', icon: 'none' })
        break
      case 'show_coupons':
        wx.showToast({ title: '优惠券已到账，请到订单页使用', icon: 'success' })
        break
      default:
        wx.showToast({ title: '查看详情', icon: 'none' })
    }
  },

  /**
   * 从 dataset 中解析 actionPayload（小程序 dataset 只能传字符串）
   * 由于 wxml 没把 actionPayload 显式写出，这里用 dataset 里能找到的字段
   * @param {Object} dataset - 事件 dataset
   * @returns {Object} actionPayload
   */
  parseActionPayload(dataset) {
    return {}
  },

  /**
   * 空操作占位（防止操作区点击冒泡到卡片）
   */
  noop() {},
})
