/**
 * 微信小程序入口文件 —— 校园易物（Campus Second-hand Market）
 * --------------------------------------------------------------------
 * 负责：
 *   1. 应用启动时的全局数据初始化；
 *   2. 持久化登录态的读写；
 *   3. 系统信息、设备信息、能力探测；
 *   4. 启动时的"新版本更新"提示。
 *
 * 业务变更说明：
 *   - 旧业务为"家庭记账"，现改造为"校园二手交易平台"；
 *   - userInfo 字段扩展为校园场景字段：school / student_id / credit_score / avatar；
 *   - apiBase 保持与后端 Django 服务的约定（127.0.0.1:8000/api），真机调试改为局域网 IP。
 */
const sys = require('./utils/sys')

const TOKEN_KEY = 'token'             // 登录 token 的本地存储 key
const USER_KEY  = 'userInfo'          // 用户资料的本地存储 key
const LAST_LAUNCH_KEY = 'lastLaunchAt' // 上次启动时间戳，用于按需弹更新

App({
  /**
   * 全局共享数据
   * - apiBase  : 后端 API 根地址
   * - token    : JWT 登录态
   * - userInfo : 当前登录用户信息（包含 school/student_id/credit_score/avatar）
   * - systemInfo: 走 utils/sys 封装的系统信息缓存，避免重复获取新 API
   * - menuRect  : 右上角胶囊按钮的位置信息（用于页面避让）
   */
  globalData: {
    // 真机调试用电脑局域网 IP；模拟器可改回 127.0.0.1
    apiBase: 'http://127.0.0.1:8000/api',
    token: '',
    userInfo: null,
    systemInfo: null,
    menuRect: null,
  },

  /**
   * 应用启动生命周期：恢复登录态、探测设备能力、检查版本更新
   */
  onLaunch() {
    this.restoreSession()
    this.initSystemInfo()
    this.checkUpdateSafe()
  },

  /**
   * 应用前台展示时触发：可用于"红点 / 未读消息数"刷新
   */
  onShow() {
    // 预留入口：未来可在此处拉取未读消息数 / 订单提醒
  },

  /**
   * 从本地缓存恢复登录态到 globalData
   * @returns {void}
   */
  restoreSession() {
    try {
      const token = wx.getStorageSync(TOKEN_KEY) || ''
      const userInfo = wx.getStorageSync(USER_KEY) || null
      this.globalData.token = token
      this.globalData.userInfo = userInfo
    } catch (e) {
      // 存储异常时降级为空登录态
      this.globalData.token = ''
      this.globalData.userInfo = null
    }
  },

  /**
   * 缓存并写入登录态
   * @param {string} token    后端返回的 JWT
   * @param {object} userInfo 用户资料对象（包含 school/student_id/credit_score/avatar）
   * @returns {void}
   */
  setSession(token, userInfo) {
    this.globalData.token = token || ''
    this.globalData.userInfo = userInfo || null
    try {
      wx.setStorageSync(TOKEN_KEY, this.globalData.token)
      wx.setStorageSync(USER_KEY, this.globalData.userInfo)
    } catch (e) {
      // 写入失败时只更新内存，不影响当前会话
    }
  },

  /**
   * 清除登录态（退出登录 / token 过期）
   * @returns {void}
   */
  clearSession() {
    this.globalData.token = ''
    this.globalData.userInfo = null
    try {
      wx.removeStorageSync(TOKEN_KEY)
      wx.removeStorageSync(USER_KEY)
    } catch (e) {
      // 忽略本地清理异常
    }
  },

  /**
   * 判断是否已登录（用于页面访问前的拦截判断）
   * @returns {boolean} 已登录返回 true
   */
  isLoggedIn() {
    return !!(this.globalData.token && this.globalData.userInfo)
  },

  /**
   * 初始化系统信息：缓存系统信息 + 胶囊位置
   * @returns {void}
   */
  initSystemInfo() {
    try {
      this.globalData.systemInfo = sys.getSystemInfoSync()
    } catch (e) {
      this.globalData.systemInfo = null
    }
    try {
      // 微信 7.0+ 才有的胶囊信息：用于自定义导航栏
      const rect = wx.getMenuButtonBoundingClientRect && wx.getMenuButtonBoundingClientRect()
      this.globalData.menuRect = rect || null
    } catch (e) {
      this.globalData.menuRect = null
    }
  },

  /**
   * 安全地检查小程序新版本（带防骚扰节流：每天最多弹一次）
   * @returns {void}
   */
  checkUpdateSafe() {
    if (!wx.getUpdateManager) return

    let lastLaunch = 0
    try { lastLaunch = wx.getStorageSync(LAST_LAUNCH_KEY) || 0 } catch (e) { lastLaunch = 0 }
    const now = Date.now()
    const ONE_DAY = 24 * 60 * 60 * 1000
    if (now - lastLaunch < ONE_DAY) return

    const updateManager = wx.getUpdateManager()
    updateManager.onCheckForUpdate((res) => {
      // hasUpdate 表示后端是否有新版本，前端无法直接控制
      // 真正提示在 onUpdateReady 里
    })
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已准备好，是否立即重启？',
        confirmText: '重启',
        cancelText: '稍后',
        success: (r) => {
          if (r.confirm) {
            updateManager.applyUpdate()
          }
        },
      })
    })
    updateManager.onUpdateFailed(() => {
      // 静默失败：用户拒绝或网络问题，不打扰
    })

    try { wx.setStorageSync(LAST_LAUNCH_KEY, now) } catch (e) {}
  },

  /**
   * 全局错误兜底：捕获脚本错误并 toast 提示
   * @param {string} err 错误信息
   */
  onError(err) {
    // 教学项目不做远程上报，仅在控制台可见
    // eslint-disable-next-line no-console
    console.error('[App onError]', err)
  },
})
