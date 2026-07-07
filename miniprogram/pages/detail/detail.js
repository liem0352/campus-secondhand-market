/**
 * 商品详情页 v3 —— 校园易物（融合设计系统重构版）
 * --------------------------------------------------------------------
 * 职责：
 *   1. 加载并展示商品详情（轮播 + 价格 + 标题 + 描述 + 卖家）
 *   2. 收藏 / 取消收藏切换
 *   3. 底部 CTA：私聊议价（创建会话 -> 跳聊天页）/ 立即购买（创建订单）
 *   4. 浏览数 +1（轻量上报）
 *   5. 顶部自定义导航栏 + 滚动联动玻璃化
 *
 * API 对接：
 *   GET  /api/products/{id}/            商品详情
 *   POST /api/products/{id}/view/       浏览数 +1（失败不阻塞）
 *   POST /api/products/{id}/favorite/   收藏切换
 *   POST /api/conversations/            创建/获取会话
 *   POST /api/orders/                   创建订单
 *
 * 设计要点（融合设计系统 v4）：
 *   - 顶部自定义导航栏（透明 -> 滚动 > 200rpx 时变玻璃感）
 *   - 主图 aspect-ratio 1:1 + 自绘玻璃指示器（带横滑进度）
 *   - 价格大字号（56rpx）+ 暖橙渐变文字 + 玻璃感原价 chip
 *   - 卡片：液态玻璃（半透 + 顶部高光 + 多层阴影）
 *   - Spring 弹性动效：cubic-bezier(0.34, 1.56, 0.64, 1)
 *   - 页面入场动画：从右滑入
 *   - 触达目标 ≥ 88rpx；支持 prefers-reduced-motion
 *   - 全部 token 来自 app.wxss CSS 变量
 *   - 所有图标使用 SVG（utils/icon.js）
 *   - 网络异常时使用本地 mock 数据保证可演示
 */
const api = require('../../utils/api.js')
const sys = require('../../utils/sys.js')
const { CONDITION_OPTIONS, formatPrice } = require('../../utils/style.js')
const ICON = require('../../utils/icon.js').ICON

// 顶部导航变玻璃感的滚动阈值（rpx）
const NAV_GLASS_THRESHOLD = 200

Page({
  data: {
    // 商品原始数据
    product: null,
    // UI 派生数据
    images: [],          // 轮播图数组
    tags: [],            // 标签数组
    conditionText: '',   // 成色中文
    schoolText: '',      // 学校文案
    sellerInitials: 'U', // 卖家头像占位文字
    createdAtText: '',   // 发布时间（友好）
    // 评价
    reviews: [],
    reviewCount: 0,
    reviewAvg: 5.0,
    showAllReviews: false,
    // 相似推荐
    similarProducts: [],
    // 价格趋势（mock）
    priceTrend: { max: 0, min: 0, avg: 0, points: [] },
    // 同校在售（mock）
    sameSchool: [],
    // 交互态
    isFavorite: false,
    isFollowed: false,         // 是否关注卖家（本地存储跟踪）
    loading: true,
    // 顶部导航
    navScrolled: false,            // 滚动后是否变玻璃感
    navTitle: '商品详情',          // 中间标题
    swiperIndex: 0,                // 当前轮播 index
    entryClass: 'detail-page--enter', // 页面入场动画 class
    safeTopPx: '0rpx',             // 顶部安全区占位
    // 折扣文案
    discountText: '',
    // 图标资源
    iconFavorite: ICON.favorite,
    iconFavoriteOn: ICON.favoriteOn,
    iconShare: ICON.share,
    iconArrowLeft: ICON.arrowLeft,
    iconMore: ICON.arrowRight,
    // 当前用户 id（用于"我想要"时校验是否卖家本人）
    myId: null,
  },

  /**
   * 页面加载：接收路由参数 + 拉取详情 + 同步 tabBar 安全区
   * @param {Object} options 路由参数
   */
  onLoad(options) {
    // 接收路由参数 ?id=xxx
    const id = (options && options.id) ? String(options.id) : ''
    if (!id) {
      wx.showToast({ title: '商品不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 800)
      return
    }
    this.productId = id
    const app = getApp()
    this.setData({
      myId: (app.globalData.userInfo && app.globalData.userInfo.id) || null,
    })
    // 顶部安全区（兼容刘海屏）
    this.computeSafeTop()
    this.loadDetail(id)
  },

  /**
   * onShow 时同步 tabBar 高亮 + 当前用户 id
   */
  onShow() {
    const app = getApp()
    if (app && app.globalData && app.globalData.userInfo) {
      this.setData({ myId: app.globalData.userInfo.id || null })
    }
  },

  /**
   * 计算顶部安全区高度（rpx），用于自定义导航栏内边距
   */
  computeSafeTop() {
    try {
      // 走 utils/sys 封装：内部已用新的窗口信息 API 替代已弃用的旧 API
      const sysInfo = sys.getSystemInfoSync()
      const px = (sysInfo && sysInfo.safeArea && sysInfo.safeArea.top) || (sysInfo && sysInfo.statusBarHeight) || 20
      // rpx = px * 750 / screenWidth
      const rpx = Math.round(px * 750 / (sysInfo.screenWidth || 375))
      this.setData({ safeTopPx: rpx + 'rpx' })
    } catch (e) {
      this.setData({ safeTopPx: '44rpx' })
    }
  },

  /**
   * 页面卸载：清理滚动监听（保留防抖以兼容）
   */
  onUnload() {
    if (this._scrollRaf) {
      this._scrollRaf = null
    }
  },

  /**
   * 页面滚动：联动顶部导航栏"透明 -> 玻璃感"
   * @param {Object} e
   */
  onPageScroll(e) {
    const top = (e && e.scrollTop) || 0
    const next = top > NAV_GLASS_THRESHOLD
    if (next !== this.data.navScrolled) {
      this.setData({ navScrolled: next })
    }
  },

  /**
   * 轮播图切换：更新 indicator 计数
   * @param {Object} e swiper change 事件
   */
  onSwiperChange(e) {
    const detail = (e && e.detail) || {}
    this.setData({ swiperIndex: Number(detail.current) || 0 })
  },

  /**
   * 加载商品详情
   * @param {string} id 商品 id
   * 流程：请求后端 -> 映射字段 -> 渲染；失败时降级到 mock
   */
  async loadDetail(id) {
    this.setData({ loading: true })
    try {
      const res = await api.productDetail(id)
      const product = (res && res.data) || {}
      this.bindProduct(product)
      // 浏览数 +1（失败不阻塞主流程）
      this.bumpView(id)
      // 异步拉取评价 + 相似商品（不阻塞主流程）
      this.loadReviews(id)
      this.loadSimilar(id)
    } catch (err) {
      console.warn('[detail] 加载详情失败，使用 mock:', err && err.message)
      this.bindProduct(this.buildMockProduct(id))
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 上报浏览数（静默失败）
   * @param {string} id 商品 id
   */
  bumpView(id) {
    api.bumpProductView(id).catch(() => { /* 静默 */ })
  },

  /**
   * 加载商品评价
   * @param {string} id 商品 id
   */
  async loadReviews(id) {
    try {
      const res = await api.productReviews(id, { page: 1, page_size: 5 })
      const list = (res && res.data && res.data.results) || (res && res.data) || []
      const arr = Array.isArray(list) ? list : []
      const total = (res && res.data && res.data.total) || arr.length
      // 评分统计
      const stats = arr.reduce(
        (acc, r) => {
          acc.count += 1
          acc.sum += Number(r.rating || 5)
          return acc
        },
        { count: 0, sum: 0 }
      )
      const avg = stats.count ? Number((stats.sum / stats.count).toFixed(1)) : 5.0
      this.setData({
        reviews: arr.slice(0, 3),
        reviewCount: total,
        reviewAvg: avg,
        showAllReviews: arr.length > 3,
      })
    } catch (e) {
      // 静默失败，使用内置示例评价
      this.setData({
        reviews: this.buildMockReviews(),
        reviewCount: 12,
        reviewAvg: 4.8,
        showAllReviews: true,
      })
    }
  },

  /**
   * 加载相似商品
   * @param {string} id 商品 id
   */
  async loadSimilar(id) {
    try {
      const res = await api.similarProducts(id)
      const list = (res && res.data) || []
      const arr = Array.isArray(list) ? list : []
      const { productCover } = require('../../utils/resolve-url.js')
      // 把每个相似商品的封面图 URL 拼成绝对 URL（避免模拟器把相对路径当本地文件）
      const normalized = arr.slice(0, 6).map((p) => ({ ...p, cover: productCover(p) }))
      this.setData({ similarProducts: normalized })
    } catch (e) {
      // 静默失败，使用内置示例相似商品
      this.setData({ similarProducts: this.buildMockSimilar(id) })
    }
    // 价格趋势 + 同校在售（mock 兜底，等接口就绪替换）
    this.buildPriceTrend()
    this.buildSameSchool()
  },

  /**
   * 构造价格趋势（基于当前商品价格生成 7 个柱状点）
   * - 柱高 = (价格 - min) / (max - min) * 100
   * - 末位高亮为"当前"
   * - 为柱状图设置 --bar-stagger CSS 变量，实现依次"长出"的动效
   */
  buildPriceTrend() {
    const cur = Number((this.data.product && this.data.product.price) || 100)
    // mock 历史 7 个点
    const hist = [
      cur * 1.18,
      cur * 1.12,
      cur * 1.05,
      cur * 1.20,
      cur * 1.08,
      cur * 1.02,
      cur,
    ]
    const max = Math.max(...hist)
    const min = Math.min(...hist)
    const avg = Math.round(hist.reduce((s, v) => s + v, 0) / hist.length)
    const range = max - min || 1
    const points = hist.map((v, idx) => ({
      height: Math.round(((v - min) / range) * 80) + 20, // 20% - 100%
      label: ['7天', '6天', '5天', '4天', '3天', '昨天', '今天'][idx] || '',
      isCurrent: idx === hist.length - 1,
      // 通过内联 style 注入 CSS 变量，实现柱状图依次入场
      barStyle: '--bar-stagger: ' + (idx * 80) + 'ms; height: ' +
        (Math.round(((v - min) / range) * 80) + 20) + '%; background: ' +
        (idx === hist.length - 1 ? 'var(--color-primary)' : 'var(--color-bg-hover)') + ';',
    }))
    this.setData({
      priceTrend: {
        max: max.toFixed(2),
        min: min.toFixed(2),
        avg: avg.toFixed(2),
        points,
      },
    })
  },

  /**
   * 构造同校在售（mock）
   */
  buildSameSchool() {
    const sameSchool = [
      { id: 901, title: '考研英语真题黄皮书 2025版', price: '28.00', cover: '/assets/products/p6_10.jpg', seller: { school: this.data.schoolText || '示例大学' } },
      { id: 902, title: '罗技 G304 无线鼠标', price: '149.00', cover: '/assets/products/p10_16.jpg', seller: { school: this.data.schoolText || '示例大学' } },
      { id: 903, title: '蓝牙耳机 主动降噪', price: '99.00', cover: '/assets/products/p11_17.jpg', seller: { school: this.data.schoolText || '示例大学' } },
    ]
    this.setData({ sameSchool })
  },

  /**
   * 构造 mock 评价（带友好时间、tags、首字母）
   * @returns {Array<Object>}
   */
  buildMockReviews() {
    return [
      {
        id: 'r1',
        reviewer: { id: 2001, username: '王同学', avatar: '', initials: 'W', school: '示例大学' },
        rating: 5,
        content: '卖家发货快，包装仔细，物品和描述完全一致，已经回购第二次了！',
        created_at: '2026-05-20',
        created_at_text: '05-20',
        tags: ['描述相符', '回复快'],
      },
      {
        id: 'r2',
        reviewer: { id: 2002, username: '李学姐', avatar: '', initials: 'L', school: '示例大学' },
        rating: 5,
        content: '价格合理，沟通顺畅，整体体验非常好，强烈推荐～',
        created_at: '2026-05-15',
        created_at_text: '05-15',
        tags: ['服务好'],
      },
      {
        id: 'r3',
        reviewer: { id: 2003, username: '陈同学', avatar: '', initials: 'C', school: '示例大学' },
        rating: 4,
        content: '商品有 9 成新，保存得很整洁，物流也快。',
        created_at: '2026-05-10',
        created_at_text: '05-10',
        tags: ['性价比高'],
      },
    ]
  },

  /**
   * 构造 mock 相似商品
   * @param {string} seedId 商品 id
   * @returns {Array<Object>}
   */
  buildMockSimilar(seedId) {
    const base = Number(seedId) || 1
    return [1, 2, 3, 4, 5, 6].map((i) => ({
      id: base + i,
      title: '同类推荐 · 款式' + i,
      price: (20 + i * 5).toFixed(2),
      cover: 'https://picsum.photos/seed/sim' + (base + i) + '/400/400',
      view_count: 50 + i * 10,
      favorite_count: 3 + i,
    }))
  },

  /**
   * 跳转到相似商品详情
   * @param {Object} e event
   */
  onTapSimilar(e) {
    const id = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id) || ''
    if (!id) return
    // replace 跳转避免栈过深
    wx.redirectTo({ url: '/pages/detail/detail?id=' + id })
  },

  /**
   * 查看全部评价（跳到商品评价全屏列表）
   * 复用 chat-room 的全屏页思路，此处仅提示后续接入
   */
  onViewAllReviews() {
    const total = this.data.reviewCount || this.data.reviews.length
    wx.showToast({ title: '共 ' + total + ' 条评价', icon: 'none' })
  },

  /**
   * 映射后端字段到页面 data
   * @param {Object} raw 后端返回的 product
   */
  bindProduct(raw) {
    const { abs } = require('../../utils/resolve-url.js')
    // 把每个图 URL 拼成绝对 URL，避免模拟器把相对路径当本地文件
    const imgsRaw = (raw.images && raw.images.length)
      ? raw.images
      : (raw.cover ? [{ image_url: raw.cover }] : [])
    const images = imgsRaw.map((i) => ({ ...i, image_url: abs(i.image_url || i.url || '') }))

    // 标签：兼容字符串数组和对象数组
    let tags = []
    if (Array.isArray(raw.tags)) {
      tags = raw.tags.map((t) => (typeof t === 'string' ? t : (t.name || '')))
    }
    if (raw.category && raw.category.name && tags.indexOf(raw.category.name) === -1) {
      tags.unshift(raw.category.name)
    }

    // 成色文案
    const cond = CONDITION_OPTIONS.find((c) => c.value === raw.condition)
    const conditionText = cond ? cond.label : (raw.condition_text || '九成新')

    // 卖家默认值（防止后端字段缺失）
    const seller = raw.seller || {}
    const sellerSafe = Object.assign(
      { id: 0, username: '校园卖家', avatar: '', school: '未填写', credit_score: 80 },
      seller
    )

    // 卖家头像首字母
    const sellerInitials = (sellerSafe.username || 'U').slice(0, 1).toUpperCase()

    // 折扣文案：原价为现价的 1.x 倍时显示
    let discountText = ''
    if (raw.original_price && raw.price) {
      const cur = Number(raw.price)
      const orig = Number(raw.original_price)
      if (orig > 0 && cur > 0 && orig > cur) {
        const off = Math.round((1 - cur / orig) * 10)
        if (off > 0) discountText = off + ' 折'
      }
    }

    this.setData({
      product: Object.assign({}, raw, { seller: sellerSafe }),
      images,
      tags,
      conditionText,
      schoolText: sellerSafe.school || '校园用户',
      sellerInitials,
      isFavorite: !!raw.is_favorite,
      isFollowed: !!(sellerSafe.id && (wx.getStorageSync('followedSellers') || {})[sellerSafe.id]),
      discountText,
    })

    // 动态标题（顶部导航）
    const navTitle = (raw.title || '商品详情').slice(0, 12)
    this.setData({ navTitle })
    wx.setNavigationBarTitle({ title: navTitle })
  },

  /**
   * 构造 mock 商品（无后端时仍可演示）
   * @param {string} id 商品 id
   * @returns {Object}
   */
  buildMockProduct(id) {
    return {
      id: Number(id) || 1,
      title: '【九成新】高数教材第七版 + 习题解答',
      description: '考研复习用过，保存完好，无笔记划线。配套习题解答一并出。\n\n自取优先（学校东区图书馆门口），可小刀诚议。',
      price: '35.00',
      original_price: '68.00',
      condition: 'like_new',
      school: '示例大学',
      view_count: 128,
      favorite_count: 12,
      status: 'on_sale',
      tags: ['教材', '考研', '自取优先'],
      images: [
        { image_url: 'https://picsum.photos/seed/p' + id + 'a/750/750' },
        { image_url: 'https://picsum.photos/seed/p' + id + 'b/750/750' },
        { image_url: 'https://picsum.photos/seed/p' + id + 'c/750/750' },
      ],
      seller: {
        id: 1001,
        username: '张同学',
        avatar: '',
        school: '示例大学',
        credit_score: 92,
      },
      is_favorite: false,
    }
  },

  /* ===================== 交互：导航栏返回 ===================== */
  /**
   * 点击顶部导航"返回"按钮
   */
  onNavBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 })
    } else {
      // 无上级页面时回首页
      wx.switchTab({ url: '/pages/index/index' })
    }
  },

  /* ===================== 交互：轮播图预览 ===================== */
  /**
   * 点击/长按轮播图预览
   * @param {Object} e event
   */
  onPreviewImage(e) {
    const { index } = e.currentTarget.dataset
    const urls = (this.data.images || []).map((i) => i.image_url).filter(Boolean)
    if (!urls.length) return
    wx.previewImage({ current: urls[index], urls })
  },

  /* ===================== 交互：收藏切换 ===================== */
  /**
   * 切换收藏状态
   */
  async onFavorite() {
    if (!this.productId) return
    const prev = this.data.isFavorite
    // 乐观更新
    this.setData({ isFavorite: !prev })
    try {
      const res = await api.toggleFavorite(this.productId)
      const data = (res && res.data) || {}
      // 用后端真实状态回写
      if (typeof data.favorited === 'boolean') {
        this.setData({ isFavorite: !!data.favorited })
      }
      wx.showToast({
        title: data.favorited ? '已收藏' : '已取消收藏',
        icon: 'none',
      })
    } catch (err) {
      // 失败回滚
      this.setData({ isFavorite: prev })
      wx.showToast({ title: '操作失败，请稍后再试', icon: 'none' })
    }
  },

  /* ===================== 交互：分享 ===================== */
  /**
   * 分享 / 复制链接（兜底）
   */
  onShare() {
    wx.showActionSheet({
      itemList: ['分享给好友', '复制商品链接'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 触发 onShareAppMessage
        } else if (res.tapIndex === 1) {
          wx.setClipboardData({ data: `campus-market://product/${this.productId}` })
        }
      },
    })
  },

  /**
   * 右上角分享
   */
  onShareAppMessage() {
    const p = this.data.product || {}
    const title = `${p.title || '校园二手好物'}${p.price ? ' · ¥' + Number(p.price).toFixed(2) : ''}`
    return {
      title: title.slice(0, 60),
      path: `/pages/detail/detail?id=${this.productId}`,
      imageUrl: (this.data.images[0] && this.data.images[0].image_url) || '',
    }
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    const p = this.data.product || {}
    const title = `${p.title || '校园二手好物'}${p.price ? ' ¥' + Number(p.price).toFixed(2) : ''}`
    return {
      title: title.slice(0, 60),
      query: `id=${this.productId}`,
      imageUrl: (this.data.images[0] && this.data.images[0].image_url) || '',
    }
  },

  /* ===================== 交互：关注卖家 ===================== */
  /**
   * 关注 / 取消关注卖家
   * 后端无 follow 接口时，使用本地存储 wx.setStorageSync('followedSellers', {id: ts}) 跟踪
   * 关注成功：图标切换 + 提示
   * @returns {void}
   */
  onFollowSeller() {
    const product = this.data.product || {}
    const seller = product.seller || {}
    const sellerId = seller.id
    if (!sellerId) {
      wx.showToast({ title: '卖家信息缺失', icon: 'none' })
      return
    }
    // 不能关注自己
    if (this.data.myId && String(this.data.myId) === String(sellerId)) {
      wx.showToast({ title: '不能关注自己', icon: 'none' })
      return
    }
    const storage = wx.getStorageSync('followedSellers') || {}
    const isFollowed = !!storage[sellerId]
    if (isFollowed) {
      delete storage[sellerId]
      wx.setStorageSync('followedSellers', storage)
      this.setData({ isFollowed: false })
      wx.showToast({ title: '已取消关注', icon: 'none' })
    } else {
      storage[sellerId] = Date.now()
      wx.setStorageSync('followedSellers', storage)
      this.setData({ isFollowed: true })
      wx.showToast({ title: '关注成功', icon: 'success' })
    }
  },

  /* ===================== 交互：私聊议价 ===================== */
  /**
   * 私聊议价：创建/获取会话 -> 跳转 chat-room
   * 流程：先 POST /api/conversations/ 拿 conversation_id，再 navigateTo
   */
  async onChat() {
    if (!this.productId) return
    const product = this.data.product || {}
    const peerId = (product.seller && product.seller.id) || 0
    if (this.data.myId && peerId && this.data.myId === peerId) {
      wx.showToast({ title: '不能与自己私聊', icon: 'none' })
      return
    }
    wx.showLoading({ title: '正在进入聊天...', mask: true })
    try {
      const res = await api.getOrCreateConversation(peerId || undefined, this.productId)
      const conv = (res && res.data) || {}
      const conversationId = conv.id || conv.conversation_id
      wx.hideLoading()
      if (!conversationId) throw new Error('未返回会话 id')
      wx.navigateTo({
        url: `/pages/chat-room/chat-room?conversation_id=${conversationId}`,
      })
    } catch (err) {
      wx.hideLoading()
      console.warn('[detail] 创建会话失败，使用 mock 跳转:', err && err.message)
      // 兜底：仍允许跳转到聊天页（chat-room 端会再次创建）
      wx.navigateTo({
        url: `/pages/chat-room/chat-room?product_id=${this.productId}&peer_id=${peerId}`,
      })
    }
  },

  /* ===================== 交互：立即购买 ===================== */
  /**
   * 立即购买：创建订单（带二次确认）
   * 流程：wx.showModal 确认 -> POST /api/orders/ -> 跳转订单页或提示
   */
  async onWant() {
    if (!this.productId) return
    const product = this.data.product || {}
    if (this.data.myId && product.seller && this.data.myId === product.seller.id) {
      wx.showToast({ title: '不能购买自己的商品', icon: 'none' })
      return
    }
    // 二次确认（防误触）
    const confirmed = await new Promise((resolve) => {
      wx.showModal({
        title: '确认想要这件商品？',
        content: `价格：${formatPrice(product.price)}\n创建订单后将通知卖家"${product.seller && product.seller.username}"。`,
        confirmText: '确认下单',
        cancelText: '再想想',
        success: (r) => resolve(r.confirm),
        fail: () => resolve(false),
      })
    })
    if (!confirmed) return

    wx.showLoading({ title: '正在下单...', mask: true })
    try {
      const res = await api.createOrder({ product_id: this.productId })
      wx.hideLoading()
      wx.showToast({ title: '已通知卖家', icon: 'success' })
      const order = (res && res.data) || {}
      setTimeout(() => {
        wx.navigateTo({ url: '/pages/orders/orders' })
      }, 600)
    } catch (err) {
      wx.hideLoading()
      const msg = (err && err.message) || '下单失败'
      wx.showToast({ title: msg, icon: 'none' })
    }
  },

  /* ===================== 交互：举报 ===================== */
  /**
   * 举报商品入口（占位）
   */
  onReport() {
    wx.showActionSheet({
      itemList: ['虚假信息', '违禁品', '已售出', '其他问题'],
      success: () => {
        wx.showToast({ title: '举报已提交', icon: 'success' })
      },
    })
  },
})
