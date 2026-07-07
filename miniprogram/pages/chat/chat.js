/**
 * 会话列表页（消息 Tab） —— 校园易物
 * --------------------------------------------------------------------
 * 职责：
 *   1. 加载当前用户的会话列表（按 last_message_at 倒序）
 *   2. 每条展示：对方头像 + 昵称 + 最后消息 + 时间 + 未读数
 *   3. 点击跳转到 chat-room 聊天详情
 *
 * API 对接：
 *   GET  /api/conversations/                会话列表
 *   POST /api/conversations/{id}/read/      标记已读（点击会话时调用）
 *
 * 设计要点：
 *   - 与 5-tab 中的"消息"tab 对应
 *   - 网络失败时使用 mock 列表保证可演示
 *   - 列表项右侧未读小红点 + 数字
 *   - 时间展示为"今天 HH:mm / 昨天 / MM-DD"
 */
const api = require('../../utils/api.js')

Page({
  data: {
    conversations: [],
    loading: true,
    // 自身 id（用于决定消息方向与 mock）
    myId: null,
  },

  onLoad() {
    const app = getApp()
    this.setData({ myId: (app.globalData.userInfo && app.globalData.userInfo.id) || 1 })
  },

  onShow() {
    // 每次显示 tab 都重新拉取
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    if (!getApp().globalData.token) {
      // 未登录也允许查看 mock
      this.bindList(this.buildMockList())
      return
    }
    this.loadList()
  },

  /**
   * 拉取会话列表
   * 流程：GET /api/conversations/ -> 映射字段 -> 渲染；失败降级 mock
   */
  async loadList() {
    this.setData({ loading: true })
    try {
      const res = await api.conversations()
      const list = (res && res.data && res.data.results) || (res && res.data) || []
      const arr = Array.isArray(list) ? list : []
      this.bindList(arr)
    } catch (err) {
      console.warn('[chat] 加载会话失败，使用 mock:', err && err.message)
      this.bindList(this.buildMockList())
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 映射后端数据 + 时间格式化为 UI 友好文本
   * @param {Array} list 会话原始数据
   */
  bindList(list) {
    const myId = this.data.myId || 1
    const convs = list.map((c) => {
      // 对方（peer）= 与我不同的 user
      const peer = this.resolvePeer(c, myId)
      return {
        ...c,
        peer: {
          id: peer.id,
          username: peer.username,
          avatar: peer.avatar || '',
          initials: (peer.username || 'U').slice(0, 1).toUpperCase(),
          credit_score: peer.credit_score || 80,
        },
        product: c.product || null,
        last_message: c.last_message || (c.lastMessage) || '',
        last_message_at_text: this.formatTime(c.last_message_at || c.updated_at),
        unread: Number(c.unread_count || c.unread || 0),
      }
    })
    // 按时间倒序
    convs.sort((a, b) => {
      const ta = this.parseDate(a.last_message_at || a.updated_at || 0).getTime()
      const tb = this.parseDate(b.last_message_at || b.updated_at || 0).getTime()
      return tb - ta
    })
    this.setData({ conversations: convs })
  },

  /**
   * 解析"对方"用户对象
   * @param {Object} c 会话
   * @param {number} myId
   */
  resolvePeer(c, myId) {
    // 后端约定：c.user_a / c.user_b / c.peer 三种可能
    if (c.peer && (c.peer.id !== undefined)) return c.peer
    if (c.user_a && c.user_b) {
      return (c.user_a.id === myId) ? c.user_b : c.user_a
    }
    return {
      id: c.peer_id || 0,
      username: c.peer_username || '校园用户',
      avatar: c.peer_avatar || '',
      credit_score: c.peer_credit_score || 80,
    }
  },

  /**
   * 时间格式化为"今天/昨天/MM-DD"
   * @param {string|number|Date} t
   */
  formatTime(t) {
    if (!t) return ''
    const date = this.parseDate(t)
    if (isNaN(date.getTime())) return ''
    const now = new Date()
    const isSameDay = (a, b) => a.toDateString() === b.toDateString()
    const yest = new Date(now); yest.setDate(now.getDate() - 1)
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    if (isSameDay(date, now)) return `今天 ${hh}:${mm}`
    if (isSameDay(date, yest)) return `昨天 ${hh}:${mm}`
    const M = String(date.getMonth() + 1).padStart(2, '0')
    const D = String(date.getDate()).padStart(2, '0')
    return `${M}-${D}`
  },

  /**
   * 兼容 iOS 的日期解析
   * iOS Safari 仅支持 yyyy/MM/dd、yyyy-MM-dd、yyyy-MM-ddTHH:mm:ss 等格式，
   * 不支持 "yyyy-MM-dd HH:mm:ss"（带空格）。此处统一将空格替换为 "T"，
   * 并将 "-" 分隔的日期部分转为 "/"，确保跨端可用。
   * @param {string|number|Date} t 任意可被标准 Date 解析的值
   * @returns {Date} 解析后的 Date 对象，失败返回 Invalid Date
   */
  parseDate(t) {
    if (t instanceof Date) return t
    if (typeof t === 'number') return new Date(t)
    if (typeof t === 'string') {
      // 形如 "2026-06-06 18:54:01" -> "2026/06/06 18:54:01"
      // 形如 "2026-06-06T18:54:01" 保持原样可被 iOS 解析
      if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(:\d{2})?$/.test(t)) {
        return new Date(t.replace(/-/g, '/'))
      }
      return new Date(t)
    }
    return new Date(NaN)
  },

  /**
   * 构造 mock 会话列表
   */
  buildMockList() {
    const now = Date.now()
    return [
      {
        id: 1,
        last_message: '在吗？这本教材还在吗？',
        last_message_at: new Date(now - 5 * 60 * 1000).toISOString(),
        unread_count: 2,
        peer: { id: 1001, username: '张同学', avatar: '', credit_score: 92 },
        product: { id: 88, title: '高数教材第七版' },
      },
      {
        id: 2,
        last_message: '好的，那明天下午 5 点图书馆门口见',
        last_message_at: new Date(now - 2 * 3600 * 1000).toISOString(),
        unread_count: 0,
        peer: { id: 1002, username: '李同学', avatar: '', credit_score: 85 },
        product: { id: 91, title: '罗技 M170 无线鼠标' },
      },
      {
        id: 3,
        last_message: '可以小刀吗？',
        last_message_at: new Date(now - 26 * 3600 * 1000).toISOString(),
        unread_count: 1,
        peer: { id: 1003, username: '王学姐', avatar: '', credit_score: 78 },
        product: { id: 76, title: '《深入理解计算机系统》' },
      },
      {
        id: 4,
        last_message: '[商品] 已发货',
        last_message_at: new Date(now - 3 * 86400 * 1000).toISOString(),
        unread_count: 0,
        peer: { id: 1004, username: '陈同学', avatar: '', credit_score: 95 },
        product: null,
      },
    ]
  },

  /* ===================== 交互 ===================== */
  /**
   * 点击会话：标记已读 + 跳转聊天详情
   * @param {Object} e event
   */
  onTapConv(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    // 乐观更新未读数
    const list = this.data.conversations.map((c) => {
      if (c.id === id) return Object.assign({}, c, { unread: 0, unread_count: 0 })
      return c
    })
    this.setData({ conversations: list })
    // 后台标记已读（失败不阻塞）
    api.markRead(id).catch(() => {})
    wx.navigateTo({ url: `/pages/chat-room/chat-room?conversation_id=${id}` })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadList().finally(() => wx.stopPullDownRefresh())
  },
})
