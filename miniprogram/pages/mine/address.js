/**
 * 收货地址管理 —— 校园易物
 * 简化实现：
 *   1. 地址列表（本地存储）
 *   2. 新增 / 编辑 / 删除
 *   3. 设置默认地址
 *   4. 选择模式：传入 ?select=1 时，点击地址会回传并 wx.navigateBack
 */
const MAX_ADDRESS = 10

Page({
  data: {
    list: [],
    selectMode: false,         // 是否选择模式（从订单页跳转）
    selectedId: null,
    editing: false,            // 是否显示编辑弹窗
    form: {
      id: '',
      name: '',
      phone: '',
      school: '',
      dorm: '',
      detail: '',
      isDefault: false,
    },
  },

  onLoad(options) {
    this.setData({ selectMode: !!(options && options.select) })
    this.load()
  },

  onShow() {
    this.load()
  },

  /**
   * 从本地加载地址列表
   * @returns {void}
   */
  load() {
    const list = (wx.getStorageSync('addresses') || []).slice()
    // 默认地址排第一
    list.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
    this.setData({ list })
  },

  /**
   * 选择地址（select 模式）
   * @param {Object} e 事件对象
   * @returns {void}
   */
  onSelectAddress(e) {
    if (!this.data.selectMode) return
    const id = e.currentTarget.dataset.id
    const item = this.data.list.find((x) => x.id === id)
    if (!item) return
    const pages = getCurrentPages()
    const prev = pages[pages.length - 2]
    if (prev && prev.setData) {
      prev.setData({ selectedAddress: item })
    }
    wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/index/index' }) })
  },

  /**
   * 切换默认地址
   * @param {Object} e 事件对象
   * @returns {void}
   */
  onToggleDefault(e) {
    const id = e.currentTarget.dataset.id
    const list = this.data.list.map((it) => Object.assign({}, it, { isDefault: it.id === id }))
    wx.setStorageSync('addresses', list)
    this.load()
    wx.showToast({ title: '已设为默认', icon: 'success' })
  },

  /**
   * 打开新增弹窗
   * @returns {void}
   */
  onAdd() {
    if (this.data.list.length >= MAX_ADDRESS) {
      wx.showToast({ title: '最多 ' + MAX_ADDRESS + ' 个地址', icon: 'none' })
      return
    }
    this.setData({
      editing: true,
      form: { id: '', name: '', phone: '', school: '', dorm: '', detail: '', isDefault: this.data.list.length === 0 },
    })
  },

  /**
   * 打开编辑弹窗
   * @param {Object} e 事件对象
   * @returns {void}
   */
  onEdit(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.list.find((x) => x.id === id)
    if (!item) return
    this.setData({ editing: true, form: Object.assign({}, item) })
  },

  /**
   * 关闭编辑弹窗
   * @returns {void}
   */
  onCancelEdit() {
    this.setData({ editing: false })
  },

  /**
   * 保存地址
   * @returns {void}
   */
  onSave() {
    const f = this.data.form
    if (!f.name || !f.phone || !f.school || !f.detail) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(f.phone)) {
      wx.showToast({ title: '手机号不正确', icon: 'none' })
      return
    }
    const list = (wx.getStorageSync('addresses') || []).slice()
    if (f.id) {
      // 编辑
      const idx = list.findIndex((x) => x.id === f.id)
      if (idx >= 0) {
        list[idx] = Object.assign({}, f)
      }
    } else {
      // 新增
      list.push(Object.assign({}, f, { id: 'a_' + Date.now() }))
    }
    // 设置默认时要清掉其他默认
    if (f.isDefault) {
      list.forEach((it) => { if (it.id !== f.id) it.isDefault = false })
    }
    wx.setStorageSync('addresses', list)
    this.setData({ editing: false })
    this.load()
    wx.showToast({ title: '已保存', icon: 'success' })
  },

  /**
   * 删除地址
   * @param {Object} e 事件对象
   * @returns {void}
   */
  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除地址',
      content: '确认删除该地址？',
      success: (r) => {
        if (!r.confirm) return
        const list = (wx.getStorageSync('addresses') || []).filter((x) => x.id !== id)
        wx.setStorageSync('addresses', list)
        this.load()
        wx.showToast({ title: '已删除', icon: 'success' })
      },
    })
  },

  /**
   * 表单输入
   * @param {Object} e input 事件
   * @returns {void}
   */
  onFormInput(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ ['form.' + key]: e.detail.value })
  },

  /**
   * 切换默认
   * @param {Object} e switch 事件
   * @returns {void}
   */
  onFormToggleDefault(e) {
    this.setData({ 'form.isDefault': e.detail.value })
  },
})
