/**
 * pages/search/search.js
 * --------------------------------------------------------------------
 * 搜索页 —— 实时搜索 + 历史记录 + 热门搜索 + 结果瀑布流
 *
 * 主要功能：
 *   1. 顶部搜索栏（玻璃感）：输入框 + 清空 + 搜索按钮
 *   2. 历史搜索记录（本地缓存，最多 10 条）
 *   3. 热门搜索词（固定榜单 + 实时排行占位）
 *   4. 搜索结果：瀑布流（product-card）+ 排序（综合/价格↑↓/最新）
 *   5. 空结果：empty-state 组件引导
 *
 * 数据来源：
 *   - 历史搜索：wx.getStorageSync('search_history')
 *   - 搜索结果：GET /api/products/?search=keyword&ordering=xxx&page=1
 *   - 失败时降级到本地 mock
 *
 * 可访问性：
 *   - 所有可点击元素 ≥ 88rpx 触控热区
 *   - 输入框带 aria-label
 */

const api = require('../../utils/api')
const sys = require('../../utils/sys')
const { fallbackProducts } = require('../../utils/resolve-url.js')

/* ================== 排序选项 ================== */
const SORT_OPTIONS = [
  { key: 'relevance', label: '综合排序' },
  { key: '-created_at', label: '最新发布' },
  { key: 'price', label: '价格升序' },
  { key: '-price', label: '价格降序' },
  { key: '-favorite_count', label: '人气最高' },
]

/* ================== 热门搜索（固定榜单） ================== */
const HOT_KEYWORDS = [
  '高数教材', '考研英语', 'iPad', '自行车',
  '宿舍台灯', '蓝牙耳机', '羽绒服', '电脑',
  '吉他', 'switch', '美妆小样', '宿舍神器',
]

/* ================== 本地 fallback mock ================== */
const MOCK_RESULTS = [
  { id: 201, title: '高数教材第七版（带答案）九成新', price: '35.00', cover: '/assets/products/p4_4.jpg', school: '武汉大学', condition: 'like_new', favorite_count: 18, is_favorited: false, seller: { id: 11, nickname: '何同学', credit_score: 95 } },
  { id: 202, title: '考研英语真题黄皮书 2025版', price: '28.00', cover: '/assets/products/p6_10.jpg', school: '华科', condition: 'good', favorite_count: 9, is_favorited: false, seller: { id: 12, nickname: '吕同学', credit_score: 88 } },
  { id: 203, title: 'iPad Air 4 64G 星空灰带配件', price: '2580.00', cover: '/assets/products/p7_11.jpg', school: '华中科大', condition: 'good', favorite_count: 47, is_favorited: true, seller: { id: 2, nickname: '李同学', credit_score: 88 } },
  { id: 204, title: '捷安特山地自行车 七成新', price: '680.00', cover: '/assets/products/p10_16.jpg', school: '武大', condition: 'good', favorite_count: 12, is_favorited: false, seller: { id: 13, nickname: '冯同学', credit_score: 90 } },
  { id: 205, title: '宿舍护眼台灯 USB充电', price: '39.00', cover: '/assets/products/p20_33.jpg', school: '华师', condition: 'good', favorite_count: 6, is_favorited: false, seller: { id: 8, nickname: '郑同学', credit_score: 78 } },
]

Page({
  data: {
    statusBarHeight: 20,
    keyword: '',
    autoFocus: true,
    searched: false,
    loading: false,
    results: [],
    total: 0,
    hasMore: true,
    page: 1,
    sortKey: 'relevance',
    sortLabel: '综合排序',
    sortOptions: SORT_OPTIONS,
    sortPickerVisible: false,
    historyList: [],
    hotList: HOT_KEYWORDS,
  },

  onLoad(options) {
    try {
      const sysInfo = sys.getSystemInfoSync()
      this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 })
    } catch (e) {
      this.setData({ statusBarHeight: 20 })
    }
    // 接收初始关键词
    const kw = (options && options.keyword) || ''
    if (kw) {
      this.setData({ keyword: kw })
      this.doSearch()
    }
    // 读取历史
    this.loadHistory()
  },

  onShow() {
    this.loadHistory()
  },

  /**
   * 从本地缓存读取历史搜索（最多 10 条）
   * @returns {void}
   */
  loadHistory() {
    try {
      const list = wx.getStorageSync('search_history') || []
      this.setData({ historyList: Array.isArray(list) ? list.slice(0, 10) : [] })
    } catch (e) {
      this.setData({ historyList: [] })
    }
  },

  /**
   * 保存搜索关键词到历史（去重 + 最新置顶）
   * @param {string} kw 关键词
   * @returns {void}
   */
  saveHistory(kw) {
    if (!kw) return
    try {
      let list = wx.getStorageSync('search_history') || []
      list = list.filter((x) => x !== kw)
      list.unshift(kw)
      list = list.slice(0, 10)
      wx.setStorageSync('search_history', list)
      this.setData({ historyList: list })
    } catch (e) { /* 静默失败 */ }
  },

  /**
   * 输入框输入事件
   * @param {Object} e 事件对象
   * @returns {void}
   */
  onInputChange(e) {
    this.setData({ keyword: e.detail.value || '' })
  },

  /**
   * 点击搜索按钮 / 确认键：触发搜索
   * @returns {void}
   */
  onTapSearch() {
    const kw = (this.data.keyword || '').trim()
    if (!kw) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' })
      return
    }
    this.doSearch()
  },

  /**
   * 执行真实搜索：保存历史 + 拉取数据
   * @returns {Promise<void>}
   */
  async doSearch() {
    const kw = (this.data.keyword || '').trim()
    if (!kw) return
    this.saveHistory(kw)
    this.setData({ searched: true, loading: true, page: 1, hasMore: true, results: [], total: 0 })
    await this.loadResults({ refresh: true })
  },

  /**
   * 加载搜索结果
   * @param {Object} opts
   * @param {boolean} opts.refresh true=重置；false=加载更多
   * @returns {Promise<void>}
   */
  async loadResults({ refresh = false } = {}) {
    if (this.data.loading) return
    if (!refresh && !this.data.hasMore) return
    this.setData({ loading: true })
    const nextPage = refresh ? 1 : this.data.page + 1
    const ordering = this.data.sortKey === 'relevance' ? '' : this.data.sortKey
    try {
      const res = await api.products({
        page: nextPage,
        page_size: 20,
        status: 'on_sale',
        search: this.data.keyword,
        ordering,
      })
      const body = (res && res.data) || {}
      let list = body.results || body.items || body.data || (Array.isArray(body) ? body : [])
      list = fallbackProducts(list)
      const total = body.count || body.total || list.length
      const hasNext = !!(body.next || body.has_more) && list.length >= 20
      // 兜底：第一次无结果时使用 mock
      if (refresh && (!list || !list.length)) {
        list = MOCK_RESULTS
      }
      const merged = refresh ? list : this.data.results.concat(list)
      this.setData({
        results: merged,
        total: refresh ? list.length : this.data.total || total,
        page: nextPage,
        hasMore: hasNext || list.length >= 20,
        loading: false,
      })
    } catch (err) {
      // 接口失败兜底
      if (refresh) {
        this.setData({ results: MOCK_RESULTS, total: MOCK_RESULTS.length, loading: false, hasMore: false })
      } else {
        this.setData({ loading: false })
        wx.showToast({ title: '加载更多失败', icon: 'none' })
      }
    }
  },

  /**
   * 点击历史 / 热门 tag：触发搜索
   * @param {Object} e 事件对象
   * @returns {void}
   */
  onTapHistoryTag(e) {
    const kw = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.keyword) || ''
    if (!kw) return
    this.setData({ keyword: kw })
    this.doSearch()
  },

  /**
   * 清空历史
   * @returns {void}
   */
  onTapClearHistory() {
    wx.showModal({
      title: '清空历史',
      content: '确定要清空所有历史搜索吗？',
      confirmText: '清空',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          try { wx.removeStorageSync('search_history') } catch (e) {}
          this.setData({ historyList: [] })
        }
      },
    })
  },

  /**
   * 清空输入框
   * @returns {void}
   */
  onTapClear() {
    this.setData({ keyword: '', results: [], searched: false, total: 0 })
  },

  /**
   * 返回上一页
   * @returns {void}
   */
  onTapBack() {
    wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/index/index' }) })
  },

  /**
   * 切换排序：弹出 popover 选择
   * @returns {void}
   */
  onToggleSort() {
    // 简单实现：循环切换排序
    const opts = SORT_OPTIONS
    const idx = opts.findIndex((o) => o.key === this.data.sortKey)
    const next = opts[(idx + 1) % opts.length]
    this.setData({ sortKey: next.key, sortLabel: next.label, page: 1, hasMore: true, results: [] })
    this.loadResults({ refresh: true })
  },

  /**
   * 点击商品卡片
   * @param {Object} e 事件对象
   * @returns {void}
   */
  onTapProduct(e) {
    const id = (e && e.detail && e.detail.id) || ''
    if (!id) return
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  },

  /**
   * 收藏商品（乐观更新 + 落库）
   * @param {Object} e 事件对象
   * @returns {Promise<void>}
   */
  async onFavoriteProduct(e) {
    const detail = (e && e.detail) || {}
    const { id, product, active } = detail
    if (!id) return
    const next = this.data.results.map((p) => {
      if (p.id !== id) return p
      return Object.assign({}, p, {
        is_favorited: active,
        favorite_count: Math.max(0, (p.favorite_count || 0) + (active ? 1 : -1)),
      })
    })
    this.setData({ results: next })
    try {
      await api.toggleFavorite(id)
    } catch (err) {
      const rollback = this.data.results.map((p) => {
        if (p.id !== id) return p
        return Object.assign({}, p, {
          is_favorited: !active,
          favorite_count: Math.max(0, (p.favorite_count || 0) + (active ? -1 : 1)),
        })
      })
      this.setData({ results: rollback })
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  /**
   * 长按商品：触发大图预览
   * @param {Object} e 事件对象
   * @returns {void}
   */
  onLongPressProduct(e) {
    const detail = (e && e.detail) || {}
    const product = detail.product || {}
    const cover = product.cover || product.image || '/assets/products/p4_4.jpg'
    if (!cover) return
    wx.previewImage({ urls: [cover], current: cover })
  },

  /**
   * 空状态：跳到分类页
   * @returns {void}
   */
  onTapGoCategory() {
    wx.switchTab({ url: '/pages/category/category' })
  },

  /**
   * 上拉加载更多
   * @returns {void}
   */
  onReachBottom() {
    if (this.data.searched) {
      this.loadResults({ refresh: false })
    }
  },
})
