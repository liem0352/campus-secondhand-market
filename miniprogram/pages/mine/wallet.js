/**
 * 我的钱包页 —— 校园易物 v5
 * --------------------------------------------------------------------
 * 职责：
 *   1. 展示用户余额、冻结金额、累计交易、信用分等数据（mock + 本地存储）
 *   2. 充值 / 提现 / 交易明细 / 绑定银行卡 入口
 *   3. 收支明细列表（mock 数据），支持「全部 / 收入 / 支出」筛选 Tab
 *   4. 余额变动操作：模拟充值 + 模拟提现（带密码校验 + Spring 动效反馈）
 *
 * 设计规范：
 *   - 严格使用 design token（var(--*)）
 *   - 触达目标 ≥ 88rpx
 *   - Spring 弹性动效（press-spring-fast / anim-stagger-in / anim-number-pop）
 *   - 支持 prefers-reduced-motion
 */
const sys = require('../../utils/sys.js')

/**
 * 钱包 mock 初始数据
 * @typedef {Object} WalletBalance
 * @property {number} balance      可用余额（元）
 * @property {number} frozen       冻结金额
 * @property {number} total_in     累计收入
 * @property {number} total_out    累计支出
 * @property {number} credit_score 信用分
 */
const MOCK_BALANCE = {
  balance: 268.50,
  frozen: 0.00,
  total_in: 1280.00,
  total_out: 1011.50,
  credit_score: 96,
}

/**
 * 交易记录 mock 数据
 * @typedef {Object} Transaction
 * @property {string} id      唯一 ID
 * @property {'in'|'out'} type 收入 / 支出
 * @property {number} amount  金额
 * @property {string} title   标题
 * @property {string} time    时间描述
 * @property {'success'|'pending'|'failed'} status 状态
 */
const MOCK_TRANSACTIONS = [
  { id: 't1', type: 'in',  amount: 380.00, title: '卖出《高等数学》教材', time: '今天 14:23', status: 'success' },
  { id: 't2', type: 'out', amount:  45.00, title: '购买 USB-C 扩展坞',    time: '昨天 09:12', status: 'success' },
  { id: 't3', type: 'in',  amount: 220.00, title: '卖出 无线鼠标',         time: '2 天前',    status: 'success' },
  { id: 't4', type: 'out', amount:  68.50, title: '购买 充电宝',           time: '3 天前',    status: 'success' },
  { id: 't5', type: 'in',  amount: 680.00, title: '卖出 iPad Air 4',       time: '1 周前',    status: 'success' },
  { id: 't6', type: 'out', amount:  12.00, title: '提现到微信零钱',         time: '1 周前',    status: 'success' },
  { id: 't7', type: 'in',  amount: 100.00, title: '活动奖励',               time: '2 周前',    status: 'success' },
]

/**
 * Tab 索引位置映射（用于胶囊指示器位移）
 * 三个 Tab 平分容器宽度，每个占 1/3
 */
const TAB_INDICATOR_MAP = {
  all: '0%',
  in:  '100%',
  out: '200%',
}

Page({
  data: {
    // ===== 状态栏高度（沉浸式 Hero） =====
    statusBarHeight: 20,

    // ===== 钱包数据 =====
    balance: { ...MOCK_BALANCE },
    transactions: MOCK_TRANSACTIONS,
    filteredTransactions: MOCK_TRANSACTIONS,

    // ===== 筛选 Tab =====
    txTab: 'all',           // 'all' | 'in' | 'out'
    tabIndicatorX: '0%',    // 胶囊指示器位移

    // ===== 密码弹窗 =====
    showPasswordDialog: false,
    pwdAction: '',          // 'recharge' | 'withdraw'
    pwdAmount: '',
    pwdInput: '',
    pwdError: '',
  },

  /**
   * 页面加载：初始化状态栏高度 + 加载本地余额
   */
  onLoad() {
    this.initStatusBarHeight()
    this.loadBalance()
    this.updateFiltered()
    this._loaded = true
  },

  /**
   * 页面显示：从其他页返回时刷新余额（仅当已加载过才刷新，避免覆盖内存状态）
   */
  onShow() {
    if (!this._loaded) return
    this.loadBalance()
  },

  /**
   * 初始化状态栏高度（用于沉浸式 Hero 顶部占位）
   */
  initStatusBarHeight() {
    try {
      const info = sys.getSystemInfoSync()
      this.setData({ statusBarHeight: info.statusBarHeight || 20 })
    } catch (e) {
      this.setData({ statusBarHeight: 20 })
    }
  },

  /**
   * 从本地存储加载余额数据
   * @returns {void}
   */
  loadBalance() {
    const saved = wx.getStorageSync('wallet_balance')
    if (saved) {
      this.setData({ balance: { ...MOCK_BALANCE, ...saved } })
    }
  },

  /**
   * 保存余额到本地存储
   * @returns {void}
   */
  saveBalance() {
    wx.setStorageSync('wallet_balance', this.data.balance)
  },

  /* ================================================================
   * 筛选 Tab
   * ================================================================ */

  /**
   * 切换筛选 Tab
   * @param {Object} e 事件对象
   * @returns {void}
   */
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    if (!tab || tab === this.data.txTab) return
    this.setData({
      txTab: tab,
      tabIndicatorX: TAB_INDICATOR_MAP[tab] || '0%',
    })
    this.updateFiltered()
  },

  /**
   * 根据当前 Tab 更新筛选后的交易列表
   * @returns {void}
   */
  updateFiltered() {
    const { txTab, transactions } = this.data
    let list = transactions
    if (txTab === 'in') {
      list = transactions.filter((t) => t.type === 'in')
    } else if (txTab === 'out') {
      list = transactions.filter((t) => t.type === 'out')
    }
    this.setData({ filteredTransactions: list })
  },

  /* ================================================================
   * 业务操作
   * ================================================================ */

  /**
   * 充值：打开密码弹窗（默认金额 100）
   * @returns {void}
   */
  onRecharge() {
    this.setData({
      showPasswordDialog: true,
      pwdAction: 'recharge',
      pwdAmount: '100',
      pwdInput: '',
      pwdError: '',
    })
  },

  /**
   * 提现：打开密码弹窗（默认金额 50）
   * @returns {void}
   */
  onWithdraw() {
    this.setData({
      showPasswordDialog: true,
      pwdAction: 'withdraw',
      pwdAmount: '50',
      pwdInput: '',
      pwdError: '',
    })
  },

  /**
   * 交易明细：当前已是全部记录，给提示
   * @returns {void}
   */
  onTransactions() {
    wx.showToast({ title: '已是全部记录', icon: 'none' })
  },

  /**
   * 绑定银行卡：弹窗输入卡号（演示）
   * @returns {void}
   */
  onBindCard() {
    wx.showModal({
      title: '绑定银行卡',
      content: '请输入银行卡号（演示）：',
      editable: true,
      placeholderText: '如 6225 8801 2345 6789',
      success: (r) => {
        if (!r.confirm) return
        const card = (r.content || '').replace(/\s/g, '')
        if (!/^\d{16,19}$/.test(card)) {
          wx.showToast({ title: '卡号格式不正确', icon: 'none' })
          return
        }
        const list = wx.getStorageSync('bank_cards') || []
        list.push({
          id: 'card_' + Date.now(),
          no: card.slice(-4),
          full: card,
          addedAt: Date.now(),
        })
        wx.setStorageSync('bank_cards', list)
        wx.showToast({ title: '已绑定', icon: 'success' })
      },
    })
  },

  /* ================================================================
   * 密码弹窗
   * ================================================================ */

  /**
   * 修改金额输入
   * @param {Object} e input 事件
   * @returns {void}
   */
  onPwdAmountChange(e) {
    this.setData({ pwdAmount: e.detail.value, pwdError: '' })
  },

  /**
   * 修改密码输入
   * @param {Object} e input 事件
   * @returns {void}
   */
  onPwdInputChange(e) {
    this.setData({ pwdInput: e.detail.value, pwdError: '' })
  },

  /**
   * 关闭密码弹窗
   * @returns {void}
   */
  onCloseDialog() {
    this.setData({ showPasswordDialog: false, pwdInput: '', pwdError: '' })
  },

  /**
   * 确认密码弹窗：校验金额 + 密码 + 余额
   * @returns {void}
   */
  onConfirmDialog() {
    const { pwdAction, pwdAmount, pwdInput, balance } = this.data
    const amount = parseFloat(pwdAmount)
    if (!amount || amount <= 0) {
      this.setData({ pwdError: '请输入有效金额' })
      return
    }
    if (!pwdInput || pwdInput.length < 6) {
      this.setData({ pwdError: '请输入6位支付密码' })
      return
    }
    if (pwdAction === 'withdraw' && amount > balance.balance) {
      this.setData({ pwdError: '余额不足' })
      return
    }
    this.applyTransaction(pwdAction, amount)
  },

  /**
   * 应用交易：更新余额 + 插入交易记录 + 持久化
   * @param {'recharge'|'withdraw'} action 操作类型
   * @param {number} amount 金额
   * @param {string} pwd 密码（演示不校验具体值）
   * @returns {void}
   */
  applyTransaction(action, amount, pwd) {
    const balance = Object.assign({}, this.data.balance)
    let title = ''
    if (action === 'recharge') {
      balance.balance += amount
      balance.total_in += amount
      title = '充值 +' + amount.toFixed(2) + ' 元'
    } else {
      balance.balance -= amount
      balance.total_out += amount
      title = '提现 -' + amount.toFixed(2) + ' 元'
    }
    const tx = {
      id: 't_' + Date.now(),
      type: action === 'recharge' ? 'in' : 'out',
      amount,
      title,
      time: '刚刚',
      status: 'success',
    }
    const transactions = [tx].concat(this.data.transactions)
    this.setData({
      balance,
      transactions,
      showPasswordDialog: false,
      pwdInput: '',
      pwdError: '',
    })
    this.updateFiltered()
    this.saveBalance()
    wx.showToast({
      title: action === 'recharge' ? '充值成功' : '提现申请已提交',
      icon: 'success',
    })
  },

  /* ================================================================
   * 分享
   * ================================================================ */

  /**
   * 分享给好友
   * @returns {Object}
   */
  onShareAppMessage() {
    return {
      title: '校园易物 · 我的钱包',
      path: '/pages/mine/wallet',
    }
  },
})
