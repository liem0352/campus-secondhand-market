/**
 * pages/mine/settings.js
 * 设置页 —— 校园易物
 * --------------------------------------------------------------------
 * 设计：
 *   1) 用户信息：编辑后写入 wx.setStorage（持久化）+ 同步到 globalData
 *   2) 通知设置：4 个开关，写入本地存储
 *   3) 隐私设置：3 个开关 + 1 个选择器（谁可以看我的发布）
 *   4) 通用：清除缓存（计算 wx.getStorageInfo 体积）、评分、协议、关于
 *
 * 边界处理：
 *   - 未登录时所有编辑功能弹窗引导去登录
 *   - 清除缓存只清业务数据（白名单 msg_/user_/favorites_），不清 token
 */
const { ICON } = require('../../utils/icon.js')

// 缓存清理白名单：只清业务缓存，保留 token 和会话信息
const CACHE_WHITELIST_KEEP = [
  'token',
  'userInfo',
  'msg_notifications_v1',
  'msg_read_ids_v1',
]

// 隐私设置中"谁可以看我的发布"的可选值
const WHO_CAN_SEE_OPTIONS = [
  { value: 'public',  label: '所有人' },
  { value: 'school',  label: '仅本校' },
  { value: 'fav',     label: '仅我关注的人' },
]

const APP_VERSION = '1.0.0'

Page({
  data: {
    arrowIcon: ICON.arrowRight,
    version: APP_VERSION,
    logged: false,
    userInfo: {
      id: 0,
      nickname: '',
      avatar: '/assets/icons/avatar.png',
      school: '',
      student_id: '',
      phone: '',
      phoneMasked: '',
      is_verified: false,
    },
    // 通知开关
    notify: {
      order:  true,
      social: true,
      system: true,
      promo:  false,
    },
    // 隐私设置
    privacy: {
      schoolOnly:     true,
      favCountPublic: true,
      whoCanSee:      'school',
      whoCanSeeLabel: '仅本校',
    },
    blacklistCount: 0,
    cacheSize: '0 KB',
  },

  onLoad() {
    this.loadAll()
  },

  onShow() {
    // 重新加载（可能从编辑页返回）
    this.loadAll()
  },

  /**
   * 加载全部设置项（用户信息 + 通知 + 隐私 + 缓存）
   */
  loadAll() {
    const app = getApp()
    const token = app.globalData.token
    const user = app.globalData.userInfo || this.loadFromStorage('userInfo') || {}

    // 通知 / 隐私
    const notify = Object.assign(
      { order: true, social: true, system: true, promo: false },
      this.loadFromStorage('settings_notify') || {}
    )
    const privacy = Object.assign(
      { schoolOnly: true, favCountPublic: true, whoCanSee: 'school' },
      this.loadFromStorage('settings_privacy') || {}
    )
    privacy.whoCanSeeLabel =
      (WHO_CAN_SEE_OPTIONS.find((o) => o.value === privacy.whoCanSee) || {}).label || '仅本校'

    // 黑名单数量（mock）
    let blacklistCount = 0
    try { blacklistCount = (wx.getStorageSync('blacklist') || []).length } catch (e) {}

    // 缓存体积
    this.computeCacheSize().then((size) => {
      this.setData({ cacheSize: size })
    })

    this.setData({
      logged: !!token,
      userInfo: {
        id: user.id || 0,
        nickname: user.nickname || user.username || '',
        avatar: user.avatar || '/assets/icons/avatar.png',
        school: user.school || '',
        student_id: user.student_id || user.studentId || '',
        phone: user.phone || '',
        is_verified: !!user.is_verified,
      },
      notify,
      privacy,
      blacklistCount,
    })
  },

  /**
   * 从 storage 读 JSON
   */
  loadFromStorage(key) {
    try { return wx.getStorageSync(key) } catch (e) { return null }
  },

  /**
   * 写 storage（同步）
   */
  saveToStorage(key, val) {
    try { wx.setStorageSync(key, val) } catch (e) {}
  },

  /**
   * 计算缓存体积（不区分业务/系统）
   */
  computeCacheSize() {
    return new Promise((resolve) => {
      try {
        wx.getStorageInfo({
          success: (res) => {
            const kb = res.currentSize || 0
            if (kb < 1024) resolve(kb + ' KB')
            else resolve((kb / 1024).toFixed(1) + ' MB')
          },
          fail: () => resolve('未知'),
        })
      } catch (e) { resolve('未知') }
    })
  },

  /**
   * 通用：未登录拦截
   */
  requireLogin() {
    if (this.data.logged) return true
    wx.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => wx.navigateTo({ url: '/pages/login/login' }), 600)
    return false
  },

  /**
   * 编辑资料入口
   */
  onEditProfile() {
    if (!this.requireLogin()) return
    // 简化：用 modal 提示当前不支持大表单编辑
    wx.showActionSheet({
      itemList: ['修改头像', '修改昵称', '修改学校'],
      success: (res) => {
        if (res.tapIndex === 0) this.onEditAvatar()
        if (res.tapIndex === 1) this.onEditNickname()
        if (res.tapIndex === 2) this.onEditSchool()
      },
    })
  },

  /**
   * 修改头像：选择相册 / 拍照，本地替换（无后端）
   */
  onEditAvatar() {
    if (!this.requireLogin()) return
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file || !file.tempFilePath) return
        const newInfo = Object.assign({}, this.data.userInfo, { avatar: file.tempFilePath })
        this.setData({ 'userInfo.avatar': file.tempFilePath })
        this.persistUser(newInfo)
        wx.showToast({ title: '头像已更新', icon: 'success' })
      },
    })
  },

  /**
   * 修改昵称
   */
  onEditNickname() {
    if (!this.requireLogin()) return
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称（1-16 字）',
      content: this.data.userInfo.nickname || '',
      success: (res) => {
        if (!res.confirm) return
        const val = (res.content || '').trim()
        if (!val || val.length > 16) {
          wx.showToast({ title: '昵称需 1-16 字', icon: 'none' })
          return
        }
        const newInfo = Object.assign({}, this.data.userInfo, { nickname: val })
        this.setData({ 'userInfo.nickname': val })
        this.persistUser(newInfo)
        wx.showToast({ title: '昵称已更新', icon: 'success' })
      },
    })
  },

  /**
   * 修改学校
   */
  onEditSchool() {
    if (!this.requireLogin()) return
    wx.showModal({
      title: '修改学校',
      editable: true,
      placeholderText: '请输入学校全称',
      content: this.data.userInfo.school || '',
      success: (res) => {
        if (!res.confirm) return
        const val = (res.content || '').trim()
        if (!val) {
          wx.showToast({ title: '学校不能为空', icon: 'none' })
          return
        }
        const newInfo = Object.assign({}, this.data.userInfo, { school: val })
        this.setData({ 'userInfo.school': val })
        this.persistUser(newInfo)
        wx.showToast({ title: '学校已更新', icon: 'success' })
      },
    })
  },

  /**
   * 持久化用户信息到 storage + globalData
   */
  persistUser(newInfo) {
    getApp().globalData.userInfo = newInfo
    this.saveToStorage('userInfo', newInfo)
  },

  /**
   * 手机绑定（mock）
   */
  onBindPhone() {
    if (!this.requireLogin()) return
    if (this.data.userInfo.phone) {
      wx.showModal({
        title: '解绑手机？',
        content: '解绑后将无法使用手机号登录',
        success: (res) => {
          if (!res.confirm) return
          const newInfo = Object.assign({}, this.data.userInfo, { phone: '' })
          this.setData({ 'userInfo.phone': '' })
          this.persistUser(newInfo)
          wx.showToast({ title: '已解绑', icon: 'success' })
        },
      })
      return
    }
    wx.showModal({
      title: '绑定手机',
      editable: true,
      placeholderText: '请输入 11 位手机号',
      content: '',
      success: (res) => {
        if (!res.confirm) return
        const val = (res.content || '').trim()
        if (!/^1[3-9]\d{9}$/.test(val)) {
          wx.showToast({ title: '手机号格式不正确', icon: 'none' })
          return
        }
        // mock：直接存
        const newInfo = Object.assign({}, this.data.userInfo, { phone: val })
        this.setData({ 'userInfo.phone': val })
        this.persistUser(newInfo)
        wx.showToast({ title: '绑定成功', icon: 'success' })
      },
    })
  },

  /**
   * 校园认证
   */
  onVerify() {
    if (!this.requireLogin()) return
    if (this.data.userInfo.is_verified) {
      wx.showToast({ title: '已通过校园认证', icon: 'success' })
      return
    }
    wx.showModal({
      title: '校园认证',
      editable: true,
      placeholderText: '请输入学号',
      content: this.data.userInfo.student_id || '',
      success: (res) => {
        if (!res.confirm) return
        const val = (res.content || '').trim()
        if (!val) {
          wx.showToast({ title: '学号不能为空', icon: 'none' })
          return
        }
        const newInfo = Object.assign({}, this.data.userInfo, {
          student_id: val,
          is_verified: true,
        })
        this.setData({
          'userInfo.student_id': val,
          'userInfo.is_verified': true,
        })
        this.persistUser(newInfo)
        wx.showToast({ title: '认证成功', icon: 'success' })
      },
    })
  },

  /**
   * 修改密码
   * 弹出原生模态：输入旧密码 / 新密码 / 确认新密码
   * 通过 PATCH /api/users/me/ 提交 password 字段（若后端支持）
   * 否则将新密码存到本地 storage（用于非真实环境的演示）
   * @returns {void}
   */
  onChangePassword() {
    if (!this.requireLogin()) return
    // 三步式输入：旧密码 → 新密码 → 确认
    wx.showModal({
      title: '修改密码',
      editable: true,
      placeholderText: '请输入当前密码',
      success: (r1) => {
        if (!r1.confirm) return
        const oldPwd = (r1.content || '').trim()
        if (!oldPwd) {
          wx.showToast({ title: '请输入当前密码', icon: 'none' })
          return
        }
        wx.showModal({
          title: '设置新密码',
          editable: true,
          placeholderText: '6-20位字母数字组合',
          success: (r2) => {
            if (!r2.confirm) return
            const newPwd = (r2.content || '').trim()
            if (!/^[A-Za-z0-9]{6,20}$/.test(newPwd)) {
              wx.showToast({ title: '密码格式不正确', icon: 'none' })
              return
            }
            wx.showModal({
              title: '确认新密码',
              editable: true,
              placeholderText: '再次输入新密码',
              success: (r3) => {
                if (!r3.confirm) return
                const confirmPwd = (r3.content || '').trim()
                if (newPwd !== confirmPwd) {
                  wx.showToast({ title: '两次输入不一致', icon: 'none' })
                  return
                }
                this.submitPasswordChange(oldPwd, newPwd)
              },
            })
          },
        })
      },
    })
  },

  /**
   * 提交密码修改
   * 1) 优先调用后端 PATCH /api/users/me/
   * 2) 后端不支持时保存到本地
   * @param {string} oldPwd 旧密码
   * @param {string} newPwd 新密码
   * @returns {Promise<void>}
   */
  async submitPasswordChange(oldPwd, newPwd) {
    wx.showLoading({ title: '提交中' })
    try {
      await api.updateProfile({ password: newPwd, old_password: oldPwd })
      wx.hideLoading()
      wx.showToast({ title: '密码已更新', icon: 'success' })
    } catch (err) {
      wx.hideLoading()
      // 后端未支持 / 接口异常时：保存到本地供演示
      const saved = wx.getStorageSync('local_passwords') || {}
      const me = (this.data.userInfo && this.data.userInfo.id) || 'me'
      saved[me] = newPwd
      wx.setStorageSync('local_passwords', saved)
      wx.showModal({
        title: '已记录',
        content: '当前环境未启用后端密码接口，新密码已保存到本地。\n下次登录请使用新密码。',
        showCancel: false,
        confirmText: '好的',
      })
    }
  },

  /**
   * 通知开关
   */
  onToggleNotify(e) {
    if (!this.requireLogin()) return
    const key = e.currentTarget.dataset.key
    const checked = e.detail.value
    const next = Object.assign({}, this.data.notify, { [key]: checked })
    this.setData({ notify: next })
    this.saveToStorage('settings_notify', next)
    wx.showToast({ title: checked ? '已开启' : '已关闭', icon: 'none', duration: 800 })
  },

  /**
   * 隐私开关
   */
  onTogglePrivacy(e) {
    if (!this.requireLogin()) return
    const key = e.currentTarget.dataset.key
    const checked = e.detail.value
    const next = Object.assign({}, this.data.privacy, { [key]: checked })
    this.setData({ privacy: next })
    this.saveToStorage('settings_privacy', next)
    wx.showToast({ title: checked ? '已开启' : '已关闭', icon: 'none', duration: 800 })
  },

  /**
   * 谁可以看我的发布
   */
  onPickWhoCanSee() {
    if (!this.requireLogin()) return
    wx.showActionSheet({
      itemList: WHO_CAN_SEE_OPTIONS.map((o) => o.label),
      success: (res) => {
        const opt = WHO_CAN_SEE_OPTIONS[res.tapIndex]
        if (!opt) return
        const next = Object.assign({}, this.data.privacy, {
          whoCanSee: opt.value,
          whoCanSeeLabel: opt.label,
        })
        this.setData({ privacy: next })
        this.saveToStorage('settings_privacy', next)
      },
    })
  },

  /**
   * 黑名单管理
   * 从本地存储中读取黑名单用户列表，支持移除 / 新增
   * @returns {void}
   */
  onBlacklist() {
    if (!this.requireLogin()) return
    const list = (wx.getStorageSync('blacklist') || []).slice()
    if (list.length === 0) {
      wx.showModal({
        title: '黑名单',
        content: '当前黑名单为空。\n\n提示：长按任意用户头像或在私聊详情页可加入黑名单。',
        confirmText: '添加测试',
        cancelText: '关闭',
        success: (r) => {
          if (r.confirm) this.promptAddBlacklist()
        },
      })
      return
    }
    // 展示黑名单列表，每项可移除
    const itemList = list.map((u) => (u.nickname || u.name || ('用户' + u.id)))
    itemList.push('+ 添加黑名单')
    wx.showActionSheet({
      itemList,
      success: (res) => {
        if (res.tapIndex === list.length) {
          this.promptAddBlacklist()
        } else {
          const removed = list[res.tapIndex]
          wx.showModal({
            title: '移除黑名单',
            content: '确认将「' + (removed.nickname || removed.name || '用户' + removed.id) + '」移出黑名单？',
            success: (r) => {
              if (!r.confirm) return
              const next = list.filter((_, i) => i !== res.tapIndex)
              wx.setStorageSync('blacklist', next)
              this.setData({ blacklistCount: next.length })
              wx.showToast({ title: '已移出黑名单', icon: 'success' })
            },
          })
        }
      },
    })
  },

  /**
   * 弹出添加黑名单对话框
   * @returns {void}
   */
  promptAddBlacklist() {
    wx.showModal({
      title: '添加黑名单',
      editable: true,
      placeholderText: '输入用户昵称或ID',
      success: (r) => {
        if (!r.confirm) return
        const text = (r.content || '').trim()
        if (!text) {
          wx.showToast({ title: '内容不能为空', icon: 'none' })
          return
        }
        const list = wx.getStorageSync('blacklist') || []
        list.push({
          id: 'u_' + Date.now(),
          nickname: text,
          addedAt: Date.now(),
        })
        wx.setStorageSync('blacklist', list)
        this.setData({ blacklistCount: list.length })
        wx.showToast({ title: '已加入黑名单', icon: 'success' })
      },
    })
  },

  /**
   * 清除缓存（白名单保留 token / 会话）
   */
  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '将清除图片缓存、临时数据等，不会清除登录状态',
      success: (res) => {
        if (!res.confirm) return
        try {
          const info = wx.getStorageInfoSync()
          info.keys.forEach((k) => {
            if (CACHE_WHITELIST_KEEP.indexOf(k) === -1) {
              try { wx.removeStorageSync(k) } catch (e) {}
            }
          })
        } catch (e) {}
        wx.showToast({ title: '清理完成', icon: 'success' })
        this.loadAll()
      },
    })
  },

  /**
   * 评分
   */
  onRate() {
    // 微信小程序没有直接打开评分的 API，给个引导
    wx.showModal({
      title: '喜欢校园易物？',
      content: '请到「发现 - 小程序 - 校园易物」页面下拉到底部，给我们 5 星好评吧！',
      showCancel: false,
      confirmText: '好的',
    })
  },

  /**
   * 用户协议 / 隐私政策 / 关于
   */
  onUserAgreement() {
    this.showAgreement('用户协议', '欢迎使用校园易物！\n\n请遵守平台规则，文明交易、诚信交易。\n\n1. 禁止发布违禁品、虚假信息\n2. 禁止绕过平台进行线下诈骗\n3. 禁止恶意刷单、刷收藏\n4. 交易纠纷请通过平台申诉\n\n校园易物保留对违规行为的处理权。')
  },

  onPrivacyPolicy() {
    this.showAgreement('隐私政策', '校园易物重视你的隐私：\n\n1. 我们仅收集提供校园二手交易服务所必需的信息\n2. 不会向第三方出售你的个人信息\n3. 你可在「设置」中随时调整隐私选项\n4. 数据加密传输，安全存储\n\n如有问题请联系：support@campus-market.local')
  },

  onAbout() {
    wx.showModal({
      title: '关于校园易物',
      content: '校园易物 v' + APP_VERSION + '\n\n让闲置流动起来\n\n一个专为高校学生设计的二手交易平台。\n\nAI 智能发布 · 信用分体系 · 校园认证 · 安全交易',
      showCancel: false,
      confirmText: '好的',
    })
  },

  showAgreement(title, content) {
    wx.showModal({
      title: title,
      content: content,
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
      success: (res) => {
        if (!res.confirm) return
        if (typeof getApp().clearSession === 'function') {
          getApp().clearSession()
        } else {
          // 兜底：清掉 token + userInfo
          try { wx.removeStorageSync('token') } catch (e) {}
          getApp().globalData.token = ''
          getApp().globalData.userInfo = null
        }
        wx.reLaunch({ url: '/pages/login/login' })
      },
    })
  },

  /**
   * wxml 中使用：{{maskPhone(userInfo.phone)}}，对手机号打码
   * 13800001234 -> 138****1234
   */
  maskPhone(phone) {
    if (!phone || phone.length < 7) return phone || ''
    return phone.slice(0, 3) + '****' + phone.slice(-4)
  },
})
