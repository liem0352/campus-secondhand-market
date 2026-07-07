/**
 * login.js
 * ===================================================================
 * 校园易物 · 登录 / 注册页（v3 融合设计系统重构）
 *   - Apple Liquid Glass + MD3 Expressive + OriginOS 6 + Spring
 *
 * 数据流兼容：保留原 data 字段（username/password/nickname/isRegister/
 *            submitting/backendOk/backendHint/statusBarHeight）
 *            外部不再被引用，但内部继续读取 / 写入。
 * 新增字段：
 *   - focusField         当前 focus 的输入框 key（username/password）
 *   - agreed             是否勾选用户协议
 *   - showPassword       密码是否明文显示
 *   - nickAnimateKey     用于触发昵称输入框重新动画（key 变化 → 重新挂载）
 */
const api = require('../../utils/api')
// 集中管理本页所用 SVG 图标（用户规则 5：严禁 emoji / 特殊字符作 UI 图标）
const { ICON } = require('../../utils/icon.js')
// 统一封装：状态栏 / 胶囊按钮位置
const sys = require('../../utils/sys')
// 协议文案（用户协议 / 隐私政策 / 同意弹窗概要）
const AGREEMENT = require('../../utils/agreement.js')

/**
 * 登录 / 注册页
 * 校园易物 v3 重构：
 *   - 移除旧"家庭资产管理"文案
 *   - 改为"校园易物"品牌
 *   - 登录 / 注册模式互斥（胶囊指示器 + Spring 弹性）
 *   - 提交流程增加 submitting 锁定状态
 *   - 强制勾选用户协议后才能提交
 *   - 支持密码可见切换
 *   - 第三方登录入口（微信 / QQ / 手机号占位）
 */
Page({
  data: {
    // ===== 表单数据 =====
    username: 'zhangsan',
    password: '123456',
    nickname: '',
    // ===== 模式与状态 =====
    isRegister: false,        // 当前是否注册模式
    submitting: false,         // 提交中（按钮 loading 状态）
    // ===== 后端健康 =====
    backendOk: true,
    backendHint: '',
    // ===== 视觉态 =====
    /** 当前 focus 的输入框 key（username/password/null） */
    focusField: '',
    /** 是否同意用户协议 */
    agreed: false,
    /** 密码是否明文 */
    showPassword: false,
    /** 入场动画的标记 key：用于 wx:if 节点重新挂载时触发动画 */
    nickAnimateKey: 0,
    /** 协议同意弹窗是否显示（灰色登录按钮点按时唤起） */
    agreementModalVisible: false,
    /** 完整协议详情弹窗是否显示 */
    agreementDetailVisible: false,
    /** 当前展示的完整协议对象（userAgreement 或 privacyPolicy） */
    currentAgreement: AGREEMENT.userAgreement,
    // ===== 系统与图标 =====
    // SVG 图标资源（取代 emoji / 特殊字符作 UI 图标，用户规则 5）
    iconArrowLeft: ICON.arrowLeft,
    // 状态栏高度：用于品牌区 padding-top 避开 iPhone 刘海/灵动岛/状态栏
    statusBarHeight: 20,
  },

  /**
   * 页面加载：清理 session、检测后端、读状态栏
   * @returns {void}
   */
  onLoad() {
    getApp().clearSession()
    if (!this._checkingBackend) this.checkBackend()
    // 初始化状态栏高度（custom 导航栏下 env() 失效，必须 JS 取）
    this.initStatusBar()
    // 初始化协议默认未勾选
    this.setData({ agreed: false })
  },

  /**
   * 读取状态栏高度，给品牌区 padding-top 让出顶部空间
   * 关键点：custom 模式下 env(safe-area-inset-top) 失效
   * @returns {void}
   */
  initStatusBar() {
    try {
      const info = sys.getSystemInfoSync()
      this.setData({ statusBarHeight: info.statusBarHeight || 20 })
    } catch (e) {
      this.setData({ statusBarHeight: 20 })
    }
  },

  /**
   * 检测后端健康状态
   * 成功：不弹提示
   * 失败：显示后端未连接警告条
   * @returns {Promise<void>}
   */
  async checkBackend() {
    if (this._checkingBackend) return
    this._checkingBackend = true
    this.setData({ backendOk: true, backendHint: '正在检测后端连接...' })
    try {
      await api.health()
      this.setData({ backendOk: true, backendHint: '' })
    } catch (e) {
      const hint =
        (e && e.message) ||
        '后端未连接。请先启动后端服务（Django 默认 8000 端口）'
      this.setData({ backendOk: false, backendHint: hint })
    } finally {
      this._checkingBackend = false
    }
  },

  /**
   * 双向绑定：账号
   * @param {Object} e input 事件
   * @returns {void}
   */
  onUsername(e) { this.setData({ username: e.detail.value }) },

  /**
   * 双向绑定：密码
   * @param {Object} e input 事件
   * @returns {void}
   */
  onPassword(e) { this.setData({ password: e.detail.value }) },

  /**
   * 双向绑定：昵称
   * @param {Object} e input 事件
   * @returns {void}
   */
  onNickname(e) { this.setData({ nickname: e.detail.value }) },

  /**
   * 输入框 focus 事件 —— 高亮字段
   * @returns {void}
   */
  onFocusUsername() { this.setData({ focusField: 'username' }) },

  /**
   * 密码输入框 focus 事件 —— 高亮字段
   * @returns {void}
   */
  onFocusPassword() { this.setData({ focusField: 'password' }) },

  /**
   * 输入框 blur 事件 —— 取消高亮
   * @returns {void}
   */
  onBlurUsername() {
    if (this.data.focusField === 'username') this.setData({ focusField: '' })
  },

  /**
   * 密码输入框 blur 事件 —— 取消高亮
   * @returns {void}
   */
  onBlurPassword() {
    if (this.data.focusField === 'password') this.setData({ focusField: '' })
  },

  /**
   * 切换密码明文 / 密文
   * @returns {void}
   */
  togglePasswordVisible() {
    this.setData({ showPassword: !this.data.showPassword })
  },

  /**
   * 切换协议勾选
   * @returns {void}
   */
  toggleAgreement() {
    this.setData({ agreed: !this.data.agreed })
  },

  /**
   * 占位 noop：用于配合 catchtap 阻止冒泡到 mask（弹窗点击事件）
   * @returns {void}
   */
  noop() {},

  /**
   * 打开完整协议详情弹窗
   * - 同意弹窗内"查看完整协议 →"链接触发
   * - 勾选行内"《用户协议》/《隐私政策》"链接触发
   * - type = 'user' | 'privacy'
   * @param {Object} e 事件对象，e.currentTarget.dataset.type = 'user'|'privacy'
   * @returns {void}
   */
  onOpenAgreementDetail(e) {
    const type = e.currentTarget.dataset.type
    const target = type === 'privacy' ? AGREEMENT.privacyPolicy : AGREEMENT.userAgreement
    this.setData({
      currentAgreement: target,
      agreementDetailVisible: true,
    })
  },

  /**
   * 关闭完整协议详情弹窗
   * 支持：点遮罩、点关闭按钮、点底部"我已知晓"按钮
   * @returns {void}
   */
  onCloseAgreementDetail() {
    this.setData({ agreementDetailVisible: false })
  },

  /**
   * 协议弹窗：点遮罩关闭
   * @returns {void}
   */
  onAgreementModalMaskTap() {
    this.setData({ agreementModalVisible: false })
  },

  /**
   * 协议弹窗：取消（关闭弹窗，不勾选协议）
   * @returns {void}
   */
  onAgreementModalCancel() {
    this.setData({ agreementModalVisible: false })
  },

  /**
   * 协议弹窗：同意并继续
   * 流程：自动勾选 checkbox → 关闭弹窗 → 调用 submit() 继续登录
   * @returns {void}
   */
  onAgreementModalConfirm() {
    this.setData(
      { agreementModalVisible: false, agreed: true },
      () => this.submit()
    )
  },

  /**
   * 登录 / 注册 Tab 切换
   * @param {Object} e 事件对象，e.currentTarget.dataset.mode = 'login' | 'register'
   * @returns {void}
   */
  onTabTap(e) {
    const mode = e.currentTarget.dataset.mode
    const isRegister = mode === 'register'
    if (isRegister === this.data.isRegister) return
    // 切换时通过 class 控制胶囊指示器（Spring 弹性由 WXSS 负责）
    this.setData({
      isRegister,
      // 通过更新 key 让昵称字段重新挂载、重新触发动画
      nickAnimateKey: this.data.nickAnimateKey + 1,
    })
  },

  /**
   * 兼容旧版 toggle（保留以防外部引用）
   * @returns {void}
   */
  toggleMode() {
    this.setData({
      isRegister: !this.data.isRegister,
      nickAnimateKey: this.data.nickAnimateKey + 1,
    })
  },

  /**
   * 返回上一级：
   * - 栈 > 1 走 navigateBack 返回
   * - 栈 == 1 走 reLaunch 到首页（兜底）
   * - reLaunch 都不行才退出小程序
   * @returns {void}
   */
  onBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 })
    } else {
      // 兜底：栈里只有 login 自己，重启到首页
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },

  /**
   * 后端不可用时直接回到首页（即使未登录）
   * @returns {void}
   */
  goHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  },

  /**
   * 监听物理返回键 / 导航栏左箭头
   * @returns {boolean} true 阻止默认行为
   */
  onBackPress() {
    this.onBack()
    return true // 阻止默认行为（关闭小程序）
  },

  /**
   * 第三方登录入口
   * - 微信：调用 wx.login 拿 code，后端用 code 换 openid 完成登录
   * - QQ：调用 wx.login（同 code 流程，标识 provider=qq）
   * - 手机号：弹窗输入手机号 + 验证码（模拟）
   * @param {Object} e 事件对象，e.currentTarget.dataset.type = 'wechat'|'qq'|'phone'
   * @returns {void}
   */
  onThirdParty(e) {
    const type = e.currentTarget.dataset.type
    if (type === 'wechat') return this.loginByWechat()
    if (type === 'qq') return this.loginByQQ()
    if (type === 'phone') return this.loginByPhone()
  },

  /**
   * 微信登录：调起 wx.login 拿临时 code，
   * 调用后端 /auth/wechat/（如果存在）换 openid + token；
   * 后端无接口时进入"快速体验"模式（生成演示账户）
   * @returns {Promise<void>}
   */
  async loginByWechat() {
    if (!wx.login) {
      wx.showToast({ title: '当前环境不支持微信登录', icon: 'none' })
      return
    }
    wx.showLoading({ title: '登录中' })
    try {
      const codeRes = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject })
      })
      const code = (codeRes && codeRes.code) || ''
      if (!code) throw new Error('未获取到 code')

      // 尝试调后端微信登录（实际接口名以 /auth/wechat/ 推测）
      let result
      try {
        result = await api.request
          ? await api.request({ url: '/auth/wechat/', method: 'POST', data: { code } })
          : null
      } catch (e) {
        result = null
      }
      if (result && (result.code === 0 || result.code === 200) && result.data) {
        const d = result.data
        getApp().setSession(d.access || d.token, d.user || d)
        wx.hideLoading()
        wx.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 600)
        return
      }
      // 后端未就绪：进入"快速体验"模式
      throw new Error('后端未就绪')
    } catch (err) {
      wx.hideLoading()
      this.quickExperienceLogin('微信用户')
    }
  },

  /**
   * QQ 登录：流程同微信，标识 provider=qq
   * @returns {Promise<void>}
   */
  async loginByQQ() {
    if (!wx.login) {
      wx.showToast({ title: '当前环境不支持 QQ 登录', icon: 'none' })
      return
    }
    wx.showLoading({ title: '登录中' })
    try {
      const codeRes = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject })
      })
      const code = (codeRes && codeRes.code) || ''
      if (!code) throw new Error('未获取到 code')
      let result
      try {
        result = await api.request
          ? await api.request({ url: '/auth/qq/', method: 'POST', data: { code } })
          : null
      } catch (e) {
        result = null
      }
      if (result && (result.code === 0 || result.code === 200) && result.data) {
        const d = result.data
        getApp().setSession(d.access || d.token, d.user || d)
        wx.hideLoading()
        wx.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 600)
        return
      }
      throw new Error('后端未就绪')
    } catch (err) {
      wx.hideLoading()
      this.quickExperienceLogin('QQ用户')
    }
  },

  /**
   * 手机号登录：弹窗输入手机号 + 验证码
   * @returns {void}
   */
  loginByPhone() {
    wx.showModal({
      title: '手机号登录',
      editable: true,
      placeholderText: '请输入11位手机号',
      success: (r1) => {
        if (!r1.confirm) return
        const phone = (r1.content || '').trim()
        if (!/^1[3-9]\d{9}$/.test(phone)) {
          wx.showToast({ title: '手机号格式不正确', icon: 'none' })
          return
        }
        // 发送"验证码"（演示：固定 123456）
        wx.showToast({ title: '验证码已发送: 123456', icon: 'none', duration: 1500 })
        setTimeout(() => {
          wx.showModal({
            title: '输入验证码',
            editable: true,
            placeholderText: '演示验证码：123456',
            success: (r2) => {
              if (!r2.confirm) return
              const code = (r2.content || '').trim()
              if (code !== '123456') {
                wx.showToast({ title: '验证码错误', icon: 'none' })
                return
              }
              this.quickExperienceLogin('用户' + phone.slice(-4))
            },
          })
        }, 800)
      },
    })
  },

  /**
   * 快速体验登录：未对接第三方后端时，本地生成会话
   * @param {string} nickname 昵称
   * @returns {void}
   */
  quickExperienceLogin(nickname) {
    const ts = Date.now()
    const fakeUser = {
      id: 'demo_' + ts,
      username: 'demo_' + ts,
      nickname: nickname || '体验用户',
      avatar: '/assets/icons/avatar.png',
      school: '校园易物',
      is_verified: false,
    }
    const fakeToken = 'demo_token_' + ts
    getApp().setSession(fakeToken, fakeUser)
    wx.showToast({ title: '已进入体验模式', icon: 'success' })
    setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 600)
  },

  /**
   * 登录按钮点击入口
   * 流程：
   *   1) submitting 中直接拦截
   *   2) 协议未勾选 → 弹出风格统一的协议同意弹窗（不直接 toast）
   *   3) 协议已勾选 → 走 submit() 真正提交
   * @returns {void}
   */
  onSubmitTap() {
    if (this.data.submitting) return
    if (!this.data.agreed) {
      // 唤起风格统一的协议同意弹窗；用户点击"同意并继续"会回调 submit
      this.setData({ agreementModalVisible: true })
      return
    }
    this.submit()
  },

  /**
   * 提交登录或注册
   * 登录成功：保存 token + user，跳到首页
   * 失败：toast 提示，必要时重检后端
   * @returns {Promise<void>}
   */
  async submit() {
    if (this.data.submitting) return
    const { username, password, isRegister, nickname, agreed } = this.data
    if (!agreed) {
      // 兜底：理论上 onSubmitTap 已拦截；这里再校验一次防并发
      this.setData({ agreementModalVisible: true })
      return
    }
    if (!username || !password) {
      wx.showToast({ title: '请填写账号密码', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    wx.showLoading({ title: isRegister ? '注册中' : '登录中' })
    try {
      const res = isRegister
        ? await api.register({ username, password, nickname: nickname || username })
        : await api.login({ username, password })
      const d = res.data
      getApp().setSession(d.access, d.user)
      wx.hideLoading()
      this.setData({ submitting: false })
      wx.switchTab({ url: '/pages/index/index' })
    } catch (e) {
      wx.hideLoading()
      this.setData({ submitting: false })
      const msg =
        (e && e.message) ||
        (e && e.errMsg) ||
        (typeof e === 'string' ? e : '') ||
        (isRegister ? '注册失败' : '登录失败')
      wx.showToast({ title: msg, icon: 'none', duration: 3000 })
      if (/后端|连接|域名|runserver/i.test(msg)) this.checkBackend()
    }
  },
})
