/**
 * 聊天详情页 —— 校园易物
 * --------------------------------------------------------------------
 * 职责：
 *   1. 加载某个会话的历史消息（与某用户的聊天记录）
 *   2. 实时接收新消息：3s 轮询（轻量、对后端无侵入）
 *   3. 发送文字消息
 *   4. 监听键盘高度，调整输入区位置
 *   5. 自动滚动到底部
 *   6. （v2 升级）计算每条消息的 stagger_delay，使列表错落入场
 *
 * 入口参数（任一即可）：
 *   - ?conversation_id=xxx    进入已有会话
 *   - ?product_id=xxx&peer_id=xxx   从商品详情"私聊议价"过来（无 conversation_id）
 *
 * API 对接：
 *   GET  /api/conversations/{id}/                    会话详情
 *   GET  /api/messages/?conversation_id=xxx&since=ts  拉取消息（增量）
 *   POST /api/messages/send/                          发送（body: {conversation_id, content}）
 *   POST /api/conversations/                          仅在 product_id+peer_id 入口时创建
 *
 * 设计要点：
 *   - 进入页面即拉取历史 -> 启动轮询 -> 离开/隐藏时停止
 *   - 发送消息乐观插入（带 client_id 标识，便于后端去重或回填）
 *   - 键盘弹起时滚动到底部
 *   - 消息气泡最大宽 70%，避免长文本撑爆
 *   - 网络异常时使用本地 mock 保证可演示
 *   - v2: 发送消息时为最新若干条消息分配错落延迟（0/40/80/...ms）
 *     配合 WXML 的 .anim-stagger-in 与 inline --stagger-delay 实现错落入场
 */
const api = require('../../utils/api.js')

/**
 * 错落入场步长（ms），与 .anim-stagger-in 配合
 * 动效来源：Part 22.11 列表错落入场（基于 OriginOS 6 弹性动效）
 * @type {number}
 */
const STAGGER_STEP_MS = 40

/**
 * 错落延迟上限（ms），超过此值的消息不再累加
 * 避免长列表入场过慢。
 * @type {number}
 */
const STAGGER_MAX_MS = 320

Page({
  data: {
    // 会话元信息
    conversationId: null,
    peer: { id: 0, username: '对方', avatar: '', initials: 'U', credit_score: 80 },
    product: null,
    // 消息列表
    messages: [],
    lastMsgId: '',         // 滚动定位用
    // 输入
    inputValue: '',
    // UI 态
    loading: true,
    sending: false,
    keyboardHeight: 0,     // 键盘高度（rpx 化后）
    // 自身 id
    myId: null,
  },

  // 轮询句柄
  pollTimer: null,
  // 消息临时 id 计数器（乐观更新用）
  tempIdCounter: 0,
  // 最近一次发送/接收的时间戳（用于 stagger 延迟的相对锚点）
  lastBurstAt: 0,

  /**
   * 页面加载：解析入口参数，初始化会话
   * @param {Object} options 启动参数
   */
  onLoad(options) {
    const app = getApp()
    this.setData({ myId: (app.globalData.userInfo && app.globalData.userInfo.id) || 1 })
    const convId = options && options.conversation_id
    const productId = options && options.product_id
    const peerId = options && options.peer_id

    if (convId) {
      this.setData({ conversationId: String(convId) })
      this.loadConversation(convId)
    } else if (productId) {
      this.bootstrapFromProduct(productId, peerId)
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 800)
    }
  },

  /**
   * 页面显示：启动 3s 轮询拉取新消息
   */
  onShow() {
    this.startPolling()
  },

  /**
   * 页面隐藏：停止轮询，节省资源
   */
  onHide() {
    this.stopPolling()
  },

  /**
   * 页面卸载：清理轮询句柄
   */
  onUnload() {
    this.stopPolling()
  },

  /**
   * 监听键盘高度变化，同步调整输入区 padding 并滚到底部
   * @param {Object} e 微信小程序键盘高度事件
   */
  onKeyboardHeightChange(e) {
    const h = (e && e.detail && e.detail.height) || 0
    // rpx 化（按 750 设计稿 / 2 = 1px = 1rpx，这里 1px = 1rpx 即可）
    this.setData({ keyboardHeight: h })
    // 滚到底部
    setTimeout(() => this.scrollToBottom(), 50)
  },

  /* ===================== 启动 ===================== */
  /**
   * 从 product_id+peer_id 入口：先创建/获取会话再加载
   * @param {string} productId 商品 id
   * @param {string|number} peerId 对方用户 id
   */
  async bootstrapFromProduct(productId, peerId) {
    this.setData({ loading: true })
    try {
      const res = await api.getOrCreateConversation(peerId, productId)
      const conv = (res && res.data) || {}
      const id = conv.id || conv.conversation_id
      if (!id) throw new Error('未返回会话 id')
      this.setData({ conversationId: String(id) })
      this.loadConversation(id)
    } catch (err) {
      console.warn('[chat-room] 创建会话失败，使用 mock:', err && err.message)
      // mock 兜底
      this.setData({
        conversationId: 'mock-' + Date.now(),
        peer: {
          id: Number(peerId) || 1001,
          username: '张同学',
          avatar: '',
          initials: 'Z',
          credit_score: 92,
        },
        product: { id: Number(productId) || 1, title: '商品咨询' },
        messages: this.buildMockMessages(),
        lastMsgId: 'msg-mock-init',
        loading: false,
      })
    }
  },

  /**
   * 加载会话详情（含 peer / product）+ 历史消息
   * @param {string|number} id 会话 id
   */
  async loadConversation(id) {
    this.setData({ loading: true })
    try {
      const res = await api.conversations()
      const list = (res && res.data && res.data.results) || (res && res.data) || []
      const arr = Array.isArray(list) ? list : []
      const conv = arr.find((c) => String(c.id) === String(id)) || arr[0] || {}
      // 解析 peer
      const peer = conv.peer || (conv.user_a && conv.user_b
        ? ((conv.user_a.id === this.data.myId) ? conv.user_b : conv.user_a)
        : { id: 0, username: '校园用户', avatar: '' })
      this.setData({
        peer: {
          id: peer.id,
          username: peer.username,
          avatar: peer.avatar || '',
          initials: (peer.username || 'U').slice(0, 1).toUpperCase(),
          credit_score: peer.credit_score || 80,
        },
        product: conv.product || null,
      })
      // 加载历史消息
      await this.loadMessages(id, true)
    } catch (err) {
      console.warn('[chat-room] 加载会话失败，使用 mock:', err && err.message)
      this.setData({
        peer: { id: 1001, username: '张同学', avatar: '', initials: 'Z', credit_score: 92 },
        product: { id: 1, title: '高数教材第七版' },
        messages: this.buildMockMessages(),
        lastMsgId: 'msg-mock-init',
      })
    } finally {
      this.setData({ loading: false })
      // 等待 DOM 更新再滚到底
      setTimeout(() => this.scrollToBottom(), 100)
    }
  },

  /**
   * 拉取消息（增量）
   * @param {string|number} id conversation_id
   * @param {boolean} full 是否全量拉取
   */
  async loadMessages(id, full) {
    try {
      const since = full ? '' : (this.lastSyncAt || '')
      const res = await api.messages(id, since ? { since } : {})
      const list = (res && res.data && res.data.results) || (res && res.data) || []
      const arr = Array.isArray(list) ? list : []
      const mapped = arr.map((m) => this.mapMessage(m))
      if (full) {
        // 全量加载时，历史消息不需要 stagger（避免老消息也错落）
        const stamped = mapped.map((m) => Object.assign({}, m, { stagger_delay: 0 }))
        this.setData({ messages: stamped, lastMsgId: stamped.length ? ('msg-' + stamped[stamped.length - 1].id) : '' })
      } else if (mapped.length) {
        // 增量：仅对新到达的批量计算错落延迟
        const burstTs = Date.now()
        this.lastBurstAt = burstTs
        const stampedNew = this.applyStaggerDelays(mapped, burstTs)
        const merged = this.data.messages.concat(stampedNew)
        this.setData({
          messages: merged,
          lastMsgId: 'msg-' + stampedNew[stampedNew.length - 1].id,
        })
        this.scrollToBottom()
      }
      this.lastSyncAt = new Date().toISOString()
    } catch (err) {
      console.warn('[chat-room] 拉消息失败:', err && err.message)
      if (full) {
        this.setData({
          messages: this.buildMockMessages(),
          lastMsgId: 'msg-mock-init',
        })
      }
    }
  },

  /**
   * 为一批消息计算错落延迟
   * 动效来源：Part 22.11 列表错落入场（OriginOS 6 弹性）
   * 规则：从第 0 条起每条累加 STAGGER_STEP_MS，上限 STAGGER_MAX_MS
   * @param {Array<Object>} msgs 消息列表
   * @param {number} burstTs 本次批次锚点时间戳
   * @returns {Array<Object>} 带 stagger_delay 字段的副本
   */
  applyStaggerDelays(msgs, burstTs) {
    return msgs.map((m, idx) => {
      const delay = Math.min(idx * STAGGER_STEP_MS, STAGGER_MAX_MS)
      return Object.assign({}, m, {
        stagger_delay: delay,
        // 记录批次锚点，便于后续扩展（如：「同批次内允许重排」）
        _burst_ts: burstTs,
      })
    })
  },

  /**
   * 映射后端消息为 UI 友好结构
   * @param {Object} m 后端原始消息
   * @returns {Object} UI 友好消息结构
   */
  mapMessage(m) {
    const sender = m.sender || m.sender_info || { id: m.sender_id, username: '用户', avatar: '' }
    const senderId = m.sender_id || (sender && sender.id) || 0
    return {
      id: m.id,
      client_id: m.client_id || '',
      sender_id: senderId,
      sender: {
        id: sender.id,
        username: sender.username,
        avatar: sender.avatar || '',
        initials: (sender.username || 'U').slice(0, 1).toUpperCase(),
      },
      content: m.content || m.text || '',
      created_at: m.created_at || m.timestamp || new Date().toISOString(),
      time_text: this.formatTime(m.created_at || m.timestamp),
      is_mine: senderId === this.data.myId,
      // AI 标识：username 含「AI」/「助手」/sender.is_ai 视为 AI 消息
      is_ai: !!(m.is_ai || (sender && sender.is_ai) || /^(AI|助手|智能助手)/i.test(sender.username || '')),
      pending: !!m.pending,
      failed: !!m.failed,
      // 默认无 stagger（具体批次会在上层注入）
      stagger_delay: 0,
    }
  },

  /**
   * 构造 mock 消息列表（包含 1 条 AI 消息用于演示 AI 光晕）
   * @returns {Array<Object>} mock 消息列表
   */
  buildMockMessages() {
    const myId = this.data.myId || 1
    const peerId = 1001
    return [
      {
        id: 'm1', sender_id: peerId, content: '你好，请问这本书还有吗？',
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        sender: { id: peerId, username: '张同学', avatar: '', initials: 'Z' },
        is_mine: false, is_ai: false, time_text: this.formatTime(new Date(Date.now() - 10 * 60 * 1000)),
      },
      {
        id: 'm2', sender_id: myId, content: '在的！九成新，保存完好',
        created_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
        sender: { id: myId, username: '我', avatar: '', initials: 'M' },
        is_mine: true, is_ai: false, time_text: this.formatTime(new Date(Date.now() - 9 * 60 * 1000)),
      },
      {
        // AI 智能助手消息（演示 OriginOS 6 AI 光晕脉冲 + 渐变气泡）
        id: 'm-ai-1', sender_id: 0, content: '我是易物小助手，可以帮你智能议价哦~',
        created_at: new Date(Date.now() - 8.5 * 60 * 1000).toISOString(),
        sender: { id: 0, username: 'AI 助手', avatar: '', initials: 'A', is_ai: true },
        is_mine: false, is_ai: true, time_text: this.formatTime(new Date(Date.now() - 8.5 * 60 * 1000)),
      },
      {
        id: 'm3', sender_id: peerId, content: '可以小刀到 30 吗？',
        created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        sender: { id: peerId, username: '张同学', avatar: '', initials: 'Z' },
        is_mine: false, is_ai: false, time_text: this.formatTime(new Date(Date.now() - 8 * 60 * 1000)),
      },
      {
        id: 'm4', sender_id: myId, content: '最低 33，诚心要的话可以',
        created_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
        sender: { id: myId, username: '我', avatar: '', initials: 'M' },
        is_mine: true, is_ai: false, time_text: this.formatTime(new Date(Date.now() - 7 * 60 * 1000)),
      },
    ]
  },

  /* ===================== 轮询 ===================== */
  /**
   * 启动 3s 轮询
   */
  startPolling() {
    this.stopPolling()
    if (!this.data.conversationId) return
    this.pollTimer = setInterval(() => {
      if (this.data.conversationId) {
        this.loadMessages(this.data.conversationId, false)
      }
    }, 3000)
  },

  /**
   * 停止轮询
   */
  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  },

  /* ===================== 输入 ===================== */
  /**
   * 输入框变化
   * @param {Object} e input 事件
   */
  onInput(e) {
    this.setData({ inputValue: e.detail.value })
  },

  /**
   * 发送消息
   * 流程：构造临时消息 -> 注入 stagger_delay -> 乐观插入 -> POST /api/messages/send/ -> 失败标红
   * 动效来源：本次发送的新消息会触发 .anim-stagger-in 错落入场
   */
  async onSend() {
    const content = (this.data.inputValue || '').trim()
    if (!content || this.data.sending) return
    if (!this.data.conversationId) {
      wx.showToast({ title: '会话未就绪', icon: 'none' })
      return
    }

    this.tempIdCounter += 1
    const tempId = 'tmp-' + Date.now() + '-' + this.tempIdCounter
    const myId = this.data.myId
    const nowIso = new Date().toISOString()
    // 发送触发新一轮 stagger 批次（仅给本条消息分配 0ms，后续若有接口回包再补 40/80...）
    const burstTs = Date.now()
    this.lastBurstAt = burstTs
    const tempMsg = {
      id: tempId,
      client_id: tempId,
      sender_id: myId,
      sender: { id: myId, username: '我', avatar: '', initials: 'M' },
      content,
      created_at: nowIso,
      time_text: this.formatTime(nowIso),
      is_mine: true,
      is_ai: false,
      pending: true,
      // 本条消息为批次首条，立即入场
      stagger_delay: 0,
      _burst_ts: burstTs,
    }

    // 乐观插入 + 清空输入
    this.setData({
      messages: this.data.messages.concat([tempMsg]),
      inputValue: '',
      sending: true,
      lastMsgId: 'msg-' + tempId,
    })
    this.scrollToBottom()

    try {
      const res = await api.sendMessage(this.data.conversationId, {
        content,
        client_id: tempId,
      })
      const saved = (res && res.data) || {}
      // 用真实 id 替换临时消息
      const list = this.data.messages.map((m) => {
        if (m.id !== tempId) return m
        return Object.assign({}, m, {
          id: saved.id || tempId,
          pending: false,
        })
      })
      this.setData({
        messages: list,
        lastMsgId: 'msg-' + (saved.id || tempId),
        sending: false,
      })
      this.scrollToBottom()
    } catch (err) {
      // 失败标红（保留可重试）
      const list = this.data.messages.map((m) => {
        if (m.id !== tempId) return m
        return Object.assign({}, m, { pending: false, failed: true })
      })
      this.setData({ messages: list, sending: false })
      wx.showToast({ title: '发送失败，请重试', icon: 'none' })
    }
  },

  /**
   * 重试发送（点击失败气泡）
   * @param {Object} e tap 事件，e.currentTarget.dataset.id 为消息 id
   */
  onRetry(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    // 把失败消息重新放回输入框
    const list = this.data.messages
    const idx = list.findIndex((m) => m.id === id)
    if (idx === -1) return
    const target = list[idx]
    const next = list.filter((m) => m.id !== id)
    this.setData({
      messages: next,
      inputValue: target.content,
      lastMsgId: next.length ? ('msg-' + next[next.length - 1].id) : '',
    })
  },

  /* ===================== 工具 ===================== */
  /**
   * 时间格式化为 HH:mm
   * @param {string|number|Date} t 时间输入
   * @returns {string} 格式化后的时间字符串
   */
  formatTime(t) {
    if (!t) return ''
    const d = (t instanceof Date) ? t : new Date(t)
    if (isNaN(d.getTime())) return ''
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  },

  /**
   * 滚动消息列表到底部
   */
  scrollToBottom() {
    const list = this.data.messages
    if (!list.length) return
    const last = list[list.length - 1]
    this.setData({ lastMsgId: 'msg-' + last.id })
  },
})
