// pages/ai/ai.js — AI 智能理财助手（融合 fusion-ui-design v2）
// --------------------------------------------------------------------
// 升级内容（2026-06）：
//   - 新增 state.thinking：AI 正在思考时显示呼吸光晕（OriginOS 6 AI 动效）
//   - 全函数 JSDoc 中文注释，方便后续维护
//   - 保留原有所有功能（提问/建议/长按/操作面板/导出/清空等）
//   - 严禁 emoji / 特殊符号作 UI 图标（用户规则 5）
//   - 所有网络/系统工具调用都保持原有行为，UI 状态机增量升级

const api = require('../../utils/api')
// 集中管理本页所用 SVG 图标路径（严禁 emoji / 特殊符号作 UI 图标，用户规则 5）
const { ICON } = require('../../utils/icon.js')
// 走 utils/sys 封装：内部已用新 API 替代已弃用的旧系统信息 API
const sys = require('../../utils/sys')

/**
 * 后端历史 -> 前端消息数组
 * @param {Array<Object>} items 后端返回的问答历史
 * @returns {Array<Object>} 前端可消费的消息数组（每条带 id/role/text/time，可选 regen 标记）
 */
function historyToMessages(items) {
  if (!items || !items.length) return []
  const msgs = []
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]
    if (it.question) {
      msgs.push({
        id: it.id + '_q',
        role: 'user',
        text: it.question,
        time: formatTime(it.created_at),
      })
    }
    if (it.answer) {
      msgs.push({
        id: it.id + '_a',
        role: 'ai',
        text: it.answer,
        time: formatTime(it.created_at),
        regen: true, // 来自历史记录的消息支持"重新生成"
      })
    }
  }
  return msgs
}

/**
 * 时间格式化（"HH:mm" 当天；"MM-DD HH:mm" 跨天）
 * @param {string|Date|number} ts 时间戳 / ISO 字符串 / Date 对象
 * @returns {string} 格式化后的中文友好时间字符串
 */
function formatTime(ts) {
  if (!ts) return ''
  const d = new Date((ts.replace ? ts.replace(' ', 'T') : ts))
  if (isNaN(d.getTime())) return ts
  const now = new Date()
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  if (isToday) return `${hh}:${mm}`
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  return `${M}-${D} ${hh}:${mm}`
}

/**
 * 生成消息 id（保证整页唯一，避免长按/重新生成时 id 冲突）
 * @param {string} prefix id 前缀（u/t/a/...）
 * @returns {string} 形如 "u_1737000000_abcd"
 */
function genId(prefix) {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
}

Page({
  /**
   * 页面初始数据
   * - input         ：输入框内容
   * - messages      ：消息列表（user / ai / typing 三种 role 状态）
   * - loading       ：是否正在请求 AI（控制发送按钮 disabled 与光晕）
   * - showWelcome   ：是否显示顶部欢迎卡片
   * - state.thinking：是否处于"AI 思考中"（控制 anim-ai-thinking 呼吸光晕的开启）
   * - statusBarHeight / navBarHeight ：自定义导航栏尺寸
   * - actionSheetVisible / actionMsg ：长按消息弹层
   * - menuVisible   ：顶部菜单弹层
   * - iconAi / iconClose / iconDelete / iconShare ：SVG 图标资源
   */
  data: {
    input: '',
    messages: [],
    loading: false,
    showWelcome: true,

    // AI 状态机：thinking 为 true 时 AI 头像叠加 anim-ai-thinking（OriginOS 6）
    state: {
      thinking: false,
    },

    // 导航栏
    statusBarHeight: 20,
    navBarHeight: 44,

    // 操作面板
    actionSheetVisible: false,
    actionMsg: null,

    // 顶部菜单
    menuVisible: false,

    // SVG 图标资源（取代 emoji / 特殊字符作 UI 图标，用户规则 5）
    iconAi: ICON.ai,        // 建议 / AI 入口
    iconClose: ICON.close,  // 清空 / 关闭
    iconDelete: ICON.delete,// 清空对话
    iconShare: ICON.share,  // 导出对话（用 share 图标代替 export）
  },

  /**
   * 页面加载：读取状态栏/导航栏高度，做自定义导航栏
   */
  onLoad() {
    try {
      const info = sys.getSystemInfoSync()
      const menuRect = wx.getMenuButtonBoundingClientRect
        ? wx.getMenuButtonBoundingClientRect()
        : null
      const statusBarHeight = info.statusBarHeight || 20
      // 胶囊按钮距顶 = menuRect.top，胶囊高度 = menuRect.height
      // 导航栏高度 = (胶囊距顶 - 状态栏高) * 2 + 胶囊高
      const navBarHeight = menuRect
        ? (menuRect.top - statusBarHeight) * 2 + menuRect.height
        : 44
      this.setData({ statusBarHeight, navBarHeight })
    } catch (e) {
      this.setData({ statusBarHeight: 20, navBarHeight: 44 })
    }
  },

  /**
   * 页面显示：选中原生 tab，校验登录态，首次进入加载历史
   */
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    if (!getApp().globalData.token) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    if (this.data.messages.length === 0) {
      this.loadHistory()
    }
  },

  // ============ 导航栏 ============

  /**
   * 返回上一个页面（标准 navigateBack 行为）
   * 兜底：如果栈里只有 ai 自己，reLaunch 到首页
   * （ai 页面不是 tab 页，所以这里用 navigateBack，不走 switchTab）
   */
  onBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 })
    } else {
      // 栈里只有 ai 自己（直接进入场景），reLaunch 兜底到首页
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },

  // ============ 顶部菜单 ============

  /**
   * 打开右上角菜单
   */
  onMenuTap() {
    this.setData({ menuVisible: true })
  },

  /**
   * 关闭右上角菜单
   */
  onMenuClose() {
    this.setData({ menuVisible: false })
  },

  /**
   * 刷新历史：重新拉取一次
   */
  onMenuRefresh() {
    this.setData({ menuVisible: false })
    this.loadHistory(true)
  },

  /**
   * 导出对话：复制到剪贴板
   */
  onMenuExport() {
    this.setData({ menuVisible: false })
    this.exportChat()
  },

  /**
   * 清空对话：先弹确认框
   */
  onMenuClear() {
    this.setData({ menuVisible: false })
    this.confirmClear()
  },

  // ============ 消息加载 ============

  /**
   * 加载历史问答；force=true 时即为空也提示
   * @param {boolean} [force=false] 是否强制刷新并提示
   */
  async loadHistory(force = false) {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const res = await api.aiHistory(1, 20)
      const items = (res.data && res.data.results) || []
      const msgs = historyToMessages(items)
      if (msgs.length > 0) {
        this.setData({ messages: msgs, showWelcome: false })
      } else if (force) {
        wx.showToast({ title: '暂无历史记录', icon: 'none' })
      }
    } catch (e) {
      console.log('[aiHistory]', e.message)
      if (force) wx.showToast({ title: '刷新失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // ============ 输入 ============

  /**
   * 监听输入框变化
   * @param {Object} e 微信 input 事件
   */
  onInput(e) {
    this.setData({ input: e.detail.value })
  },

  /**
   * 清空输入框
   */
  onClear() {
    this.setData({ input: '' })
  },

  /**
   * 快捷问题点击：填入并立即发送
   * @param {Object} e 微信 tap 事件，dataset.q 携带问题文本
   */
  onQuickTap(e) {
    const q = e.currentTarget.dataset.q
    this.setData({ input: q }, () => this.onSend())
  },

  /**
   * 建议按钮（一键消费建议）
   */
  onAdviceTap() {
    if (this.data.loading) {
      wx.showToast({ title: '正在处理中…', icon: 'none' })
      return
    }
    this.fetchAdvice()
  },

  // ============ 发送 ============

  /**
   * 发送用户提问到后端 AI
   * - 维护 messages 列表：用户消息 + 占位 typing 消息
   * - 同步开启 state.thinking（呼吸光晕 + 防止重复点击）
   * - 成功 / 失败均替换占位为最终 AI 消息
   */
  async onSend() {
    if (this.data.loading) return
    const q = this.data.input.trim()
    if (!q) return

    const now = formatTime(new Date())
    const userMsg = { id: genId('u'), role: 'user', text: q, time: now }
    const typingMsg = { id: genId('t'), role: 'ai', text: '', time: '', typing: true }

    this.setData({
      messages: this.data.messages.concat([userMsg, typingMsg]),
      input: '',
      loading: true,
      showWelcome: false,
      'state.thinking': true, // 打开 OriginOS 6 呼吸光晕
    })

    try {
      // 通用问答走 /ai/chat/ ；AI 客服场景才走 /ai/customer-service/
      const res = await api.aiAsk(q, this.data.historyForBackend || [])
      const data = (res && res.data) || {}
      const text = data.answer || data.reply || '（无回复）'
      this.replaceTyping(typingMsg.id, {
        role: 'ai',
        text,
        time: formatTime(new Date()),
        typing: false,
        regen: true, // 新生成的 AI 回复支持"重新生成"
        question: q, // 保存对应问题，用于重新生成
      })
    } catch (e) {
      this.replaceTyping(typingMsg.id, {
        role: 'ai',
        text: '抱歉，AI 服务暂时不可用：' + ((e && e.message) || '未知错误'),
        time: formatTime(new Date()),
        typing: false,
        regen: false,
      })
    } finally {
      this.setData({
        loading: false,
        'state.thinking': false, // 关闭呼吸光晕
      })
    }
  },

  /**
   * 重新生成（基于已保存的 question）
   * @param {string} msgId 目标 AI 消息 id
   */
  async regenerate(msgId) {
    const target = this.data.messages.find((m) => m.id === msgId)
    if (!target || !target.question) {
      wx.showToast({ title: '无法重新生成', icon: 'none' })
      return
    }
    if (this.data.loading) return

    // 把当前 AI 回复内容改为打字占位
    const typingMsg = { ...target, typing: true, text: '', time: '' }
    const newList = this.data.messages.map((m) => (m.id === msgId ? typingMsg : m))
    this.setData({
      messages: newList,
      loading: true,
      'state.thinking': true, // 重新生成期间同样显示呼吸光晕
    })

    try {
      const res = await api.aiAsk(target.question, this.data.historyForBackend || [])
      const data = (res && res.data) || {}
      const text = data.answer || data.reply || '（无回复）'
      this.replaceTyping(msgId, {
        role: 'ai',
        text,
        time: formatTime(new Date()),
        typing: false,
        regen: true,
        question: target.question,
      })
    } catch (e) {
      this.replaceTyping(msgId, {
        role: 'ai',
        text: '重新生成失败：' + ((e && e.message) || '未知错误'),
        time: formatTime(new Date()),
        typing: false,
        regen: true,
        question: target.question,
      })
    } finally {
      this.setData({
        loading: false,
        'state.thinking': false,
      })
    }
  },

  /**
   * 一键消费建议（基于用户账本数据）
   */
  async fetchAdvice() {
    const typingMsg = { id: genId('t'), role: 'ai', text: '', time: '', typing: true }
    this.setData({
      messages: this.data.messages.concat([typingMsg]),
      loading: true,
      showWelcome: false,
      'state.thinking': true, // 建议阶段同样显示呼吸光晕
    })
    try {
      const res = await api.aiAdvice()
      this.replaceTyping(typingMsg.id, {
        role: 'ai',
        text: (res.data && res.data.advice) || '暂无建议，请先在记账页录入一些消费记录',
        time: formatTime(new Date()),
        typing: false,
        regen: true,
        question: '消费建议',
      })
    } catch (e) {
      this.replaceTyping(typingMsg.id, {
        role: 'ai',
        text: '获取建议失败：' + ((e && e.message) || '未知错误'),
        time: formatTime(new Date()),
        typing: false,
        regen: false,
      })
    } finally {
      this.setData({
        loading: false,
        'state.thinking': false,
      })
    }
  },

  /**
   * 替换打字占位为真实消息
   * @param {string} typingId 占位消息 id
   * @param {Object} newMsg 新的 AI 消息内容（会与占位合并）
   */
  replaceTyping(typingId, newMsg) {
    const list = this.data.messages.map((m) =>
      m.id === typingId ? { ...m, ...newMsg, typing: false } : m
    )
    this.setData({ messages: list })
  },

  // ============ 消息操作：长按 -> 弹层 ============

  /**
   * 长按消息：触感反馈 + 弹出操作菜单
   * @param {Object} e 微信 longpress 事件，dataset.id 携带消息 id
   */
  onMsgLongPress(e) {
    const id = e.currentTarget.dataset.id
    const msg = this.data.messages.find((m) => m.id === id)
    if (!msg) return
    // 加触感反馈
    wx.vibrateShort && wx.vibrateShort({ type: 'light' })
    this.setData({ actionSheetVisible: true, actionMsg: msg })
  },

  /**
   * 关闭长按操作弹层
   */
  onActionSheetClose() {
    this.setData({ actionSheetVisible: false, actionMsg: null })
  },

  /**
   * 弹层：复制消息内容到剪贴板
   */
  onActionCopy() {
    const msg = this.data.actionMsg
    this.setData({ actionSheetVisible: false, actionMsg: null })
    if (!msg) return
    wx.setClipboardData({
      data: msg.text,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
      fail: () => wx.showToast({ title: '复制失败', icon: 'none' }),
    })
  },

  /**
   * 弹层：触发"重新生成"
   */
  onActionRegen() {
    const msg = this.data.actionMsg
    this.setData({ actionSheetVisible: false, actionMsg: null })
    if (msg) this.regenerate(msg.id)
  },

  /**
   * 弹层：标记为"没用"反馈
   */
  onActionBad() {
    const msg = this.data.actionMsg
    this.setData({ actionSheetVisible: false, actionMsg: null })
    if (!msg) return
    wx.showToast({ title: '已记录反馈', icon: 'success' })
  },

  /**
   * 弹层：删除单条消息
   */
  onActionDelete() {
    const msg = this.data.actionMsg
    this.setData({ actionSheetVisible: false, actionMsg: null })
    if (!msg) return
    const list = this.data.messages.filter((m) => m.id !== msg.id)
    this.setData({ messages: list })
    wx.showToast({ title: '已删除', icon: 'success' })
  },

  // ============ 消息操作：内联按钮 ============

  /**
   * 内联：复制指定消息
   * @param {Object} e 微信 tap 事件，dataset.id 携带消息 id
   */
  onCopyMsg(e) {
    const id = e.currentTarget.dataset.id
    const msg = this.data.messages.find((m) => m.id === id)
    if (!msg) return
    wx.setClipboardData({
      data: msg.text,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    })
  },

  /**
   * 内联：重新生成
   * @param {Object} e 微信 tap 事件，dataset.id 携带消息 id
   */
  onRegenMsg(e) {
    const id = e.currentTarget.dataset.id
    this.regenerate(id)
  },

  /**
   * 内联：标记"没用"
   */
  onBadMsg(e) {
    wx.showToast({ title: '已记录反馈', icon: 'success' })
  },

  // ============ 菜单功能 ============

  /**
   * 弹确认框后清空对话
   */
  confirmClear() {
    wx.showModal({
      title: '清空对话',
      content: '清空后不可恢复，是否继续？',
      confirmText: '清空',
      // 保留 error 语义色，与品牌错误色（#FF4D4F）一致
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          this.setData({ messages: [], showWelcome: true })
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      },
    })
  },

  /**
   * 把整段对话拼成文本后复制到剪贴板
   */
  exportChat() {
    const msgs = this.data.messages
    if (msgs.length === 0) {
      wx.showToast({ title: '没有对话可导出', icon: 'none' })
      return
    }
    let text = `【AI 理财助手 对话导出 ${formatTime(new Date())}】\n\n`
    msgs.forEach((m) => {
      const who = m.role === 'user' ? '我' : 'AI'
      text += `${who}（${m.time || ''}）：\n${m.text}\n\n`
    })
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showModal({
          title: '已复制到剪贴板',
          content: '可粘贴到微信/备忘录保存',
          showCancel: false,
        })
      },
    })
  },
})
