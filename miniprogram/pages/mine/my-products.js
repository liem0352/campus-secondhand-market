/**
 * 我的发布 / 我买到的 —— 校园易物
 * - type=on_sale  : 我发布的（默认 tab 切换 status）
 * - type=bought   : 我买到的（基于订单）
 */
const api = require('../../utils/api.js')

const PAGE_SIZE = 20

// 我发布的 — tab 与后端商品状态对应
const TABS_MY_PRODUCTS = [
  { key: 'on_sale',    label: '在售' },
  { key: 'pending',    label: '审核中' },
  { key: 'sold',       label: '已售' },
  { key: 'off_shelf',  label: '已下架' },
]

// 我买到的 — 订单状态
const TABS_BOUGHT = [
  { key: 'requested',  label: '已申请' },
  { key: 'confirmed',  label: '已确认' },
  { key: 'shipping',   label: '待取/待发' },
  { key: 'completed',  label: '已完成' },
]

Page({
  data: {
    pageType: 'on_sale',  // on_sale | bought
    tabs: TABS_MY_PRODUCTS,
    activeTab: 'on_sale',
    list: [],
    page: 1,
    hasMore: true,
    loading: false,
    loadingMore: false,
    error: false,
    errorMsg: '',
  },

  onLoad(options) {
    const t = (options && options.type) || 'on_sale'
    if (t === 'bought') {
      this.setData({
        pageType: 'bought',
        tabs: TABS_BOUGHT,
        activeTab: TABS_BOUGHT[0].key,
      })
      wx.setNavigationBarTitle({ title: '我买到的' })
    } else {
      wx.setNavigationBarTitle({ title: '我的发布' })
    }
    this.loadList({ refresh: true })
  },

  onPullDownRefresh() {
    this.loadList({ refresh: true }).finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadList({ refresh: false })
    }
  },

  onTabChange(e) {
    const key = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.key) || ''
    if (!key || key === this.data.activeTab) return
    this.setData({ activeTab: key })
    this.loadList({ refresh: true })
  },

  /**
   * 加载列表
   */
  async loadList({ refresh = false } = {}) {
    if (this.data.loading) return
    if (!getApp().globalData.token) {
      this.setData({ list: [], hasMore: false, error: false })
      return
    }
    const nextPage = refresh ? 1 : this.data.page + 1
    this.setData({ loading: refresh, loadingMore: !refresh, error: false })
    try {
      let items = []
      let total = 0
      let hasMore = false
      if (this.data.pageType === 'bought') {
        const res = await api.orders({ role: 'buyer', status: this.data.activeTab, page: nextPage, page_size: PAGE_SIZE })
        const body = (res && res.data) || {}
        const list = body.results || body.items || body.data || (Array.isArray(body) ? body : [])
        items = list.map((o) => ({
          id: o.id,
          title: (o.product && o.product.title) || '订单 #' + o.id,
          price: String(o.price || '0.00'),
          cover: (o.product && o.product.images && o.product.images[0] && o.product.images[0].image_url) || '/assets/icons/image.png',
          status: o.status,
          school: o.product && o.product.school,
        }))
        total = body.count || body.total || list.length
        hasMore = !!(body.next || body.has_more)
      } else {
        const res = await api.products({ seller_id: 'me', status: this.data.activeTab, page: nextPage, page_size: PAGE_SIZE })
        const body = (res && res.data) || {}
        const list = body.results || body.items || body.data || (Array.isArray(body) ? body : [])
        items = list.map((p) => ({
          id: p.id,
          title: p.title,
          price: String(p.price || '0.00'),
          cover: (p.images && p.images[0] && p.images[0].image_url) || p.cover || '/assets/icons/image.png',
          status: p.status,
          school: p.school,
          view_count: p.view_count,
          favorite_count: p.favorite_count,
        }))
        total = body.count || body.total || list.length
        hasMore = !!(body.next || body.has_more)
      }
      const merged = refresh ? items : this.data.list.concat(items)
      this.setData({
        list: merged,
        total,
        page: nextPage,
        hasMore,
        loading: false,
        loadingMore: false,
      })
    } catch (e) {
      this.setData({
        loading: false,
        loadingMore: false,
        error: refresh,
        errorMsg: (e && e.message) || '加载失败',
      })
    }
  },

  onRetry() {
    this.setData({ error: false })
    this.loadList({ refresh: true })
  },

  onGoPublish() {
    wx.switchTab({ url: '/pages/publish/publish' })
  },

  onTapItem(e) {
    const id = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id) || ''
    if (!id) return
    if (this.data.pageType === 'bought') {
      wx.navigateTo({ url: '/pages/orders/orders?order_id=' + id })
    } else {
      wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
    }
  },

  /**
   * 操作：下架/上架/删除
   */
  async onActTap(e) {
    const { id, act } = (e && e.currentTarget && e.currentTarget.dataset) || {}
    if (!id || !act) return
    if (act === 'del') {
      const res = await wx.showModal({ title: '确认删除', content: '删除后不可恢复', confirmText: '删除' })
      if (!res.confirm) return
      try {
        await api.deleteProduct(id)
        wx.showToast({ title: '已删除' })
        this.setData({ list: this.data.list.filter((it) => it.id !== id) })
      } catch (err) {
        wx.showToast({ title: '删除失败', icon: 'none' })
      }
    } else if (act === 'off' || act === 'on') {
      try {
        await api.toggleProduct(id, act === 'off' ? 'off_shelf' : 'on_sale')
        wx.showToast({ title: act === 'off' ? '已下架' : '已上架' })
        this.setData({
          list: this.data.list.map((it) => (it.id === id ? Object.assign({}, it, { status: act === 'off' ? 'off_shelf' : 'on_sale' }) : it)),
        })
      } catch (err) {
        wx.showToast({ title: '操作失败', icon: 'none' })
      }
    }
  },

  noop() {},

  /**
   * 状态文案
   */
  statusText(s) {
    return ({
      on_sale: '在售', pending: '审核中', sold: '已售', off_shelf: '已下架',
      pending_sold: '已订未付', draft: '草稿',
      requested: '已申请', confirmed: '已确认', shipping: '待取/待发',
      completed: '已完成', cancelled: '已取消',
    })[s] || s || '--'
  },

  statusClass(s) {
    if (s === 'on_sale' || s === 'completed') return 'status-badge--success'
    if (s === 'pending' || s === 'pending_sold' || s === 'shipping') return 'status-badge--warning'
    if (s === 'sold' || s === 'confirmed') return 'status-badge--info'
    if (s === 'off_shelf' || s === 'cancelled') return 'status-badge--cancelled'
    return ''
  },
})
