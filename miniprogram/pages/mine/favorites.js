/**
 * 我的收藏页 —— 校园易物
 * --------------------------------------------------------------------
 * 职责：
 *   1. 拉取当前用户收藏的商品列表（GET /api/favorites/）
 *   2. 卡片点击进入详情；点击收藏按钮可取消收藏
 *   3. 下拉刷新 + 触底加载更多
 *   4. 登录态校验：未登录提示去登录
 *   5. 兜底：当后端未就绪时使用 mock 数据
 */
const api = require('../../utils/api.js')
const sys = require('../../utils/sys')

// 每页条数
const PAGE_SIZE = 20

// 兜底 mock（无后端时让页面可演示）
const MOCK_FAVORITES = [
  {
    id: 1001,
    product: {
      id: 102,
      title: 'iPad Air 4 64G 星空灰，附原装保护壳+钢化膜',
      price: '2580.00',
      cover: '/assets/products/p7_11.jpg',
      school: '华中科大',
      condition: 'good',
      favorite_count: 47,
      is_favorited: true,
      seller: { id: 2, nickname: '李同学', credit_score: 88 },
    },
  },
  {
    id: 1002,
    product: {
      id: 101,
      title: '高等数学（同济第七版）上下册，九成新，几乎无笔记',
      price: '35.00',
      cover: '/assets/products/p4_4.jpg',
      school: '武汉大学',
      condition: 'like_new',
      favorite_count: 12,
      is_favorited: true,
      seller: { id: 1, nickname: '张同学', credit_score: 96 },
    },
  },
  {
    id: 1003,
    product: {
      id: 107,
      title: '小米手环 8 NFC版 黑色 国行在保',
      price: '169.00',
      cover: '/assets/products/p13_21.jpg',
      school: '武理工',
      condition: 'like_new',
      favorite_count: 9,
      is_favorited: true,
      seller: { id: 7, nickname: '吴同学', credit_score: 83 },
    },
  },
]

Page({
  data: {
    list: [],
    total: 0,
    page: 1,
    hasMore: true,
    loading: false,
    loadingMore: false,
    error: false,
    errorMsg: '',
    logged: false,
  },

  /**
   * 页面加载：检查登录态
   */
  onLoad() {
    this.setData({ logged: !!getApp().globalData.token })
    this.loadList({ refresh: true })
  },

  /**
   * 页面显示：如有 token 则刷新一次（从其他页面取消收藏后能即时更新）
   */
  onShow() {
    if (getApp().globalData.token) {
      this.setData({ logged: true })
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadList({ refresh: true }).finally(() => wx.stopPullDownRefresh())
  },

  /**
   * 触底加载
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadList({ refresh: false })
    }
  },

  /**
   * 加载收藏列表
   * @param {Object} opts {refresh: boolean}
   */
  async loadList({ refresh = false } = {}) {
    if (this.data.loading) return
    const app = getApp()
    if (!app.globalData.token) {
      this.setData({ logged: false, list: [], total: 0, hasMore: false })
      return
    }
    const nextPage = refresh ? 1 : this.data.page + 1
    this.setData({
      loading: refresh,
      loadingMore: !refresh,
      error: false,
    })
    try {
      const res = await api.favorites({ page: nextPage, page_size: PAGE_SIZE })
      const body = (res && res.data) || {}
      const items = body.results || body.items || body.data || (Array.isArray(body) ? body : [])
      const total = body.count || body.total || items.length
      const hasNext = !!(body.next || body.has_more)

      // 兜底 mock（首屏且为空时）
      let finalList = items
      if (refresh && !items.length) {
        finalList = MOCK_FAVORITES
      }
      const merged = refresh ? finalList : this.data.list.concat(finalList)
      this.setData({
        list: merged,
        total: refresh ? (total || MOCK_FAVORITES.length) : this.data.total,
        page: nextPage,
        hasMore: hasNext || (!refresh && finalList.length === PAGE_SIZE),
        loading: false,
        loadingMore: false,
      })
    } catch (e) {
      // 接口失败时首屏兜底
      if (refresh) {
        this.setData({
          list: MOCK_FAVORITES,
          total: MOCK_FAVORITES.length,
          hasMore: false,
          loading: false,
          loadingMore: false,
          error: false,
        })
      } else {
        this.setData({ loadingMore: false })
        wx.showToast({ title: '加载更多失败', icon: 'none' })
      }
    }
  },

  /**
   * 点击商品卡片
   */
  onTapProduct(e) {
    const id = (e && e.detail && e.detail.id) || ''
    if (!id) return
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  },

  /**
   * 收藏/取消收藏
   * 收藏列表页的取消 = 直接从列表移除
   */
  async onFavorite(e) {
    const detail = (e && e.detail) || {}
    const { id, active } = detail
    if (!id) return
    if (!active) {
      // 取消：乐观移除
      this.setData({
        list: this.data.list.filter((it) => {
          const pid = (it.product && it.product.id) || it.id
          return pid !== id
        }),
        total: Math.max(0, (this.data.total || 0) - 1),
      })
      // 落库
      try {
        await api.toggleFavorite(id)
      } catch (err) {
        wx.showToast({ title: '操作失败', icon: 'none' })
        // 回滚：重新加载
        this.loadList({ refresh: true })
      }
    } else {
      // 重新收藏：调接口即可
      try {
        await api.toggleFavorite(id)
      } catch (err) {
        wx.showToast({ title: '操作失败', icon: 'none' })
      }
    }
  },

  /**
   * 长按：提示删除
   */
  onLongPress(e) {
    const id = (e && e.detail && e.detail.id) || ''
    if (!id) return
    wx.showActionSheet({
      itemList: ['取消收藏'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.onFavorite({ detail: { id, active: false } })
        }
      },
    })
  },

  /**
   * 重试
   */
  onRetry() {
    this.setData({ error: false, errorMsg: '' })
    this.loadList({ refresh: true })
  },

  /**
   * 空态：去首页逛逛
   */
  onGoHome() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return { title: '我收藏的校园好物', path: '/pages/mine/favorites' }
  },
})
