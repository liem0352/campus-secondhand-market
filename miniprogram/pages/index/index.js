/**
 * pages/index/index.js
 * --------------------------------------------------------------------
 * 首页 —— 校园二手商品瀑布流浏览（v5 融合设计重写）
 *
 * 主要功能：
 *   1. 顶部安全区适配 + 自定义导航栏（沉浸式）
 *   2. 渐变 Hero（液态玻璃） + 玻璃感搜索框 + 错落快捷入口
 *   3. 公告滚动条 + 轮播图 + 分类横滑入口
 *   4. 限时特惠（倒计时） + 近期成交 + 热门商品横滑
 *   5. 双列瀑布流商品卡片（product-card 组件 v2）
 *   6. 下拉刷新 + 上拉加载更多
 *   7. 加载占位（骨架屏）+ 空状态 + 错误状态
 *
 * 设计语言：Apple Liquid Glass + MD3 Expressive + OriginOS 6 光感
 * 数据来源：
 *   - 商品流：GET /api/products/?page=1&page_size=20&status=on_sale
 *   - 分类入口：GET /api/categories/?level=1
 *   - 聚合数据：GET /api/home/feed/
 *   - 失败时降级到本地 mock，保证页面可演示
 *
 * 可访问性：
 *   - 所有可点击元素 ≥ 88rpx 触控热区
 *   - 支持 prefers-reduced-motion（CSS 端处理）
 *   - 关键操作有 aria-label（写在 wxml）
 */

const sys = require('../../utils/sys')
const api = require('../../utils/api')
const { getCreditLevel } = require('../../utils/style')
// 模拟器图片降级工具：当后端图片 URL 指向 8000 端口时，自动替换为本地占位图
const { fallbackProducts, fallbackProductImage } = require('../../utils/resolve-url.js')

/* ================== 分类图标映射 ==================
 * 将后端返回的 icon 键值映射为实际图片路径
 * 兼容 lucide-* / 业务 key / 中文别名，与 category.js 保持一致
 *
 * 后端实际命名（参考 backend/scripts/init_categories.py）：
 *   - 一级：book-open / laptop / home / dumbbell / shirt / music-2 / package
 *   - 二级：book / graduation-cap / languages / file-check
 *           smartphone / laptop / tablet / plug / camera / headphones
 *           bed / utensils / droplet / pencil / cookie
 *           circle-dot / mountain / bike
 *           shirt / shopping-bag / footprints / briefcase / watch
 *           music-2 / piano / wind / drum / settings
 */
const CATEGORY_ICON_MAP = {
  /* ---------- 教材书籍 / 一级 (book-open) ---------- */
  'book-open':          '/assets/icons/book-open.png',
  'lucide-book-open':   '/assets/icons/book-open.png',

  /* ---------- 大学教材 / 考研 / 语言 / 考试（sub） ---------- */
  'book':               '/assets/icons/book.png',
  'lucide-book':        '/assets/icons/book.png',
  'textbook':           '/assets/icons/book.png',
  'graduation-cap':     '/assets/icons/school.png',
  'lucide-graduation-cap': '/assets/icons/school.png',
  'languages':          '/assets/icons/languages.png',
  'lucide-languages':   '/assets/icons/languages.png',
  'file-check':         '/assets/icons/file-check.png',
  'lucide-file-check':  '/assets/icons/file-check.png',

  // 校园教程 / 教材
  '教程':               '/assets/icons/book-open.png',
  'school':             '/assets/icons/school.png',
  'lucide-school':      '/assets/icons/school.png',
  'tutorial':           '/assets/icons/school.png',

  /* ---------- 电子产品 / 一级 (laptop) ---------- */
  'laptop':             '/assets/icons/laptop.png',
  'lucide-laptop':      '/assets/icons/laptop.png',
  'monitor':            '/assets/icons/laptop.png',
  'lucide-monitor':     '/assets/icons/laptop.png',

  // 数码电子
  'phone':              '/assets/icons/phone.png',
  'smartphone':         '/assets/icons/phone.png',
  'lucide-phone':       '/assets/icons/phone.png',
  'lucide-smartphone':  '/assets/icons/phone.png',
  'digital':            '/assets/icons/laptop.png',
  'electronics':        '/assets/icons/laptop.png',
  '数码':               '/assets/icons/laptop.png',

  /* ---------- 平板 / 配件 / 相机 / 耳机（sub） ---------- */
  'tablet':             '/assets/icons/tablet.png',
  'lucide-tablet':      '/assets/icons/tablet.png',
  'plug':               '/assets/icons/plug.png',
  'lucide-plug':        '/assets/icons/plug.png',
  'camera':             '/assets/icons/camera.png',
  'lucide-camera':     '/assets/icons/camera.png',
  'headphones':        '/assets/icons/headphones.png',
  'lucide-headphones':  '/assets/icons/headphones.png',

  /* ---------- 生活用品 / 一级 (home) ---------- */
  'home':               '/assets/icons/sofa.png',
  'house':              '/assets/icons/sofa.png',
  'lucide-home':        '/assets/icons/sofa.png',
  'lucide-house':       '/assets/icons/sofa.png',
  'lucide-armchair':    '/assets/icons/sofa.png',
  'lucide-bed':         '/assets/icons/bed.png',

  // 生活用品 sub
  'bed':                '/assets/icons/bed.png',
  'lucide-bed':         '/assets/icons/bed.png',
  'utensils':           '/assets/icons/utensils.png',
  'lucide-utensils':    '/assets/icons/utensils.png',
  'droplet':            '/assets/icons/droplet.png',
  'lucide-droplet':     '/assets/icons/droplet.png',
  'pencil':             '/assets/icons/pencil.png',
  'lucide-pencil':      '/assets/icons/pencil.png',
  'cookie':             '/assets/icons/cookie.png',
  'lucide-cookie':      '/assets/icons/cookie.png',

  'life':               '/assets/icons/sofa.png',
  'sofa':               '/assets/icons/sofa.png',
  'lucide-sofa':        '/assets/icons/sofa.png',
  '生活':               '/assets/icons/sofa.png',

  /* ---------- 运动器材 / 一级 (dumbbell) ---------- */
  'dumbbell':           '/assets/icons/dumbbell.png',
  'lucide-dumbbell':    '/assets/icons/dumbbell.png',
  'sport':              '/assets/icons/dumbbell.png',
  'sports':             '/assets/icons/dumbbell.png',

  /* ---------- 球类 / 健身 / 户外 / 骑行（sub） ---------- */
  'circle-dot':         '/assets/icons/circle-dot.png',
  'lucide-circle-dot':  '/assets/icons/circle-dot.png',
  'mountain':           '/assets/icons/mountain.png',
  'lucide-mountain':    '/assets/icons/mountain.png',
  'bike':               '/assets/icons/bike.png',
  'transport':          '/assets/icons/bike.png',
  'lucide-bike':        '/assets/icons/bike.png',

  /* ---------- 服饰鞋帽 / 一级 (shirt) ---------- */
  'shirt':              '/assets/icons/apparel.png',
  'clothing':           '/assets/icons/apparel.png',
  'apparel':            '/assets/icons/apparel.png',
  'lucide-shirt':       '/assets/icons/apparel.png',
  '服饰':               '/assets/icons/apparel.png',

  /* ---------- 男装 / 女装 / 鞋靴 / 箱包 / 配饰（sub） ---------- */
  'shopping-bag':       '/assets/icons/shopping-bag.png',
  'lucide-shopping-bag': '/assets/icons/shopping-bag.png',
  'footprints':         '/assets/icons/footprints.png',
  'lucide-footprints':  '/assets/icons/footprints.png',
  'briefcase':          '/assets/icons/briefcase.png',
  'lucide-briefcase':   '/assets/icons/briefcase.png',
  'watch':              '/assets/icons/watch.png',
  'lucide-watch':       '/assets/icons/watch.png',

  /* ---------- 乐器 / 一级 (music-2) ---------- */
  'music-2':            '/assets/icons/music-2.png',
  'lucide-music-2':     '/assets/icons/music-2.png',

  // 乐器 sub
  'music':              '/assets/icons/music.png',
  'lucide-music':       '/assets/icons/music.png',
  'lucide-guitar':      '/assets/icons/music.png',
  'piano':              '/assets/icons/piano.png',
  'lucide-piano':       '/assets/icons/piano.png',
  'wind':               '/assets/icons/wind.png',
  'lucide-wind':        '/assets/icons/wind.png',
  'drum':               '/assets/icons/drum.png',
  'lucide-drum':        '/assets/icons/drum.png',
  'cog':                '/assets/icons/cog.png',
  'lucide-cog':         '/assets/icons/cog.png',
  'settings':           '/assets/icons/cog.png',
  'lucide-settings':    '/assets/icons/cog.png',

  '乐器':               '/assets/icons/music-2.png',

  /* ---------- 其它 / 兜底 (package) ---------- */
  'package':            '/assets/icons/package.png',
  'lucide-package':     '/assets/icons/package.png',
  'other':              '/assets/icons/package.png',
  '其他':               '/assets/icons/package.png',
  'tag':                '/assets/icons/tag.png',
  'lucide-tag':         '/assets/icons/tag.png',

  // 美妆护肤
  'beauty':             '/assets/icons/sparkles.png',
  'cosmetic':           '/assets/icons/sparkles.png',
  'lucide-sparkles':    '/assets/icons/sparkles.png',
  // 食品零食
  'food':               '/assets/icons/utensils.png',
  'snack':              '/assets/icons/utensils.png',
  // 礼物
  'gift':               '/assets/icons/gift.png',
  'lucide-gift':        '/assets/icons/gift.png',
  // 工具
  'tool':               '/assets/icons/wrench.png',
  'tools':              '/assets/icons/wrench.png',
  'lucide-wrench':      '/assets/icons/wrench.png',
  // 灯具/小家电
  'appliance':          '/assets/icons/lightbulb.png',
  'lightbulb':          '/assets/icons/lightbulb.png',
  'lucide-lightbulb':   '/assets/icons/lightbulb.png',
  // 母婴
  'baby':               '/assets/icons/baby.png',
  'lucide-baby':        '/assets/icons/baby.png',
  // 宠物
  'pet':                '/assets/icons/pet.png',
  'lucide-pet':         '/assets/icons/pet.png',

  /* ---------- 兜底 ---------- */
  'more':               '/assets/icons/grid.png',
  'lucide-more':        '/assets/icons/grid.png',
  'grid':               '/assets/icons/grid.png',
  'lucide-grid':        '/assets/icons/grid.png',
  'default':            '/assets/icons/package.png',
}

/**
 * 将分类图标键值解析为实际图片路径
 * @param {string} iconKey - 后端返回的图标键名
 * @returns {string} 图片路径
 */
function resolveCategoryIcon(iconKey) {
  if (!iconKey) return CATEGORY_ICON_MAP.default
  if (iconKey.startsWith('/assets/')) return iconKey
  return CATEGORY_ICON_MAP[iconKey] || CATEGORY_ICON_MAP.default
}

/* ================== 常量 ================== */
// 每页请求条数（与后端 page_size 字段对齐）
const PAGE_SIZE = 20
// 商品状态：仅展示在售
const PRODUCT_STATUS = 'on_sale'

/* ================== 本地 fallback mock ==================
 * 当后端 /api/products/ 尚未就绪时，使用本数据让瀑布流可见；
 * 接入真实接口后此对象不再生效。
 */
const MOCK_CATEGORIES = [
  { id: 1, name: '教材书籍', icon: 'book-open' },
  { id: 2, name: '电子产品', icon: 'laptop' },
  { id: 3, name: '服饰鞋帽', icon: 'shirt' },
  { id: 4, name: '生活用品', icon: 'home' },
  { id: 5, name: '运动器材', icon: 'dumbbell' },
  { id: 6, name: '乐器',     icon: 'music-2' },
  { id: 7, name: '其他',     icon: 'package' },
]

// 10 个真实本地图片（picsum 已下载到 miniprogram/assets/products/），
// 给 mock fallback 兜底，防止后端数据异常时图片完全空缺。
const MOCK_COVERS = [
  '/assets/products/p4_4.jpg',     // 教材类
  '/assets/products/p7_11.jpg',    // 数码类
  '/assets/products/p15_24.jpg',   // 宿舍家具
  '/assets/products/p10_16.jpg',   // 鼠标键盘
  '/assets/products/p19_31.jpg',   // 服装
  '/assets/products/p6_10.jpg',    // 教材真题
  '/assets/products/p13_21.jpg',   // 手环穿戴
  '/assets/products/p20_33.jpg',   // 灯具
  '/assets/products/p9_13.jpg',    // 计算机书籍
  '/assets/products/p22_37.jpg',   // 宿舍电器
]

const MOCK_PRODUCTS = [
  { id: 101, title: '高等数学（同济第七版）上下册，九成新，几乎无笔记', price: '35.00', cover: MOCK_COVERS[0], school: '武汉大学', condition: 'like_new', favorite_count: 12, is_favorited: false, seller: { id: 1, nickname: '张同学', credit_score: 96 } },
  { id: 102, title: 'iPad Air 4 64G 星空灰，附原装保护壳+钢化膜', price: '2580.00', cover: MOCK_COVERS[1], school: '华中科大', condition: 'good', favorite_count: 47, is_favorited: true, seller: { id: 2, nickname: '李同学', credit_score: 88 } },
  { id: 103, title: '北欧风实木书桌，搬家出', price: '180.00', cover: MOCK_COVERS[2], school: '武汉理工', condition: 'good', favorite_count: 8, is_favorited: false, seller: { id: 3, nickname: '王同学', credit_score: 72 } },
  { id: 104, title: '全新未拆：罗技 MX Master 3 无线鼠标', price: '499.00', cover: MOCK_COVERS[3], school: '华中师大', condition: 'new', favorite_count: 22, is_favorited: false, seller: { id: 4, nickname: '赵同学', credit_score: 95 } },
  { id: 105, title: '冬季加厚羽绒服 男 L码 黑色 穿过一冬', price: '120.00', cover: MOCK_COVERS[4], school: '武大', condition: 'fair', favorite_count: 5, is_favorited: false, seller: { id: 5, nickname: '孙同学', credit_score: 65 } },
  { id: 106, title: '考研英语真题黄皮书 2025版', price: '28.00', cover: MOCK_COVERS[5], school: '华科', condition: 'good', favorite_count: 3, is_favorited: false, seller: { id: 6, nickname: '周同学', credit_score: 90 } },
  { id: 107, title: '小米手环 8 NFC版 黑色 国行在保', price: '169.00', cover: MOCK_COVERS[6], school: '武理工', condition: 'like_new', favorite_count: 9, is_favorited: false, seller: { id: 7, nickname: '吴同学', credit_score: 83 } },
  { id: 108, title: '宿舍小台灯 护眼 USB充电', price: '39.00', cover: MOCK_COVERS[7], school: '华师', condition: 'good', favorite_count: 6, is_favorited: false, seller: { id: 8, nickname: '郑同学', credit_score: 78 } },
  { id: 109, title: '《计算机网络：自顶向下方法》第七版', price: '45.00', cover: MOCK_COVERS[8], school: '武大', condition: 'like_new', favorite_count: 11, is_favorited: false, seller: { id: 9, nickname: '陈同学', credit_score: 92 } },
  { id: 110, title: '宿舍懒人小冰箱 6L', price: '88.00', cover: MOCK_COVERS[9], school: '华科', condition: 'good', favorite_count: 4, is_favorited: false, seller: { id: 10, nickname: '林同学', credit_score: 70 } },
]

Page({
  /**
   * 页面初始数据
   * - statusBarHeight: 状态栏高度（用于顶部安全区）
   * - categories: 一级分类横滑数据
   * - products: 商品瀑布流数据
   * - page / hasMore: 分页状态
   * - loading / refreshing / error: UI 状态机
   * - initialized: 首次加载是否完成（避免 onShow 重复触发 load）
   * - unreadCount: 顶部消息红点（占位）
   */
  data: {
    statusBarHeight: 20,
    searchPlaceholder: '搜商品 / 搜学校 / 搜卖家…',
    searchHotWord: '高数教材',
    categories: [],
    products: [],
    page: 1,
    hasMore: true,
    loading: false,
    refreshing: false,
    error: false,
    errorMsg: '',
    initialized: false,
    isEmpty: false,
    // Hero Banner 数据（校园易物品牌信息）
    heroStats: { products: '1.2k', users: '500+' },
    // 聚合首页数据
    banners: [],
    notices: [],
    hotProducts: [],
    freshProducts: [],
    quickActions: [
      { key: 'publish',  icon: '/assets/icons/upload.png',    label: '发布闲置',  color: '#FF6B35' },
      { key: 'ai',       icon: '/assets/icons/ai.png',       label: 'AI 一键',   color: '#7C3AED' },
      { key: 'fav',      icon: '/assets/icons/favorite.png', label: '我的收藏',  color: '#F43F5E' },
      { key: 'orders',   icon: '/assets/icons/wallet.png',   label: '我的订单',  color: '#10B981' },
    ],
    bannerIndex: 0,
    // 限时特惠
    flashDeals: [],
    countdown: { h: '00', m: '00', s: '00' },
    // 近期成交
    recentDeals: [],
    // 消息未读数（顶部红点）
    unreadCount: 0,
    // 自定义导航栏右侧 padding：动态让出原生胶囊按钮的位置
    // 默认 110px（≈ 胶囊宽度 87 + 右边距 10 + 间距 13），避免首屏渲染时按钮与胶囊重叠
    navBarPaddingRight: 110,
    // 自定义导航栏顶部 margin：与原生胶囊顶部对齐（不同屏宽下都需要动态计算）
    navBarMarginTop: 4,
  },

  /**
   * 生命周期：页面加载
   * 1. 读取状态栏高度（用于顶部安全区）；
   * 2. 设置自定义 tab-bar 高亮（首页 = 0）；
   * 3. 拉取分类 + 第一页商品。
   */
  onLoad() {
    this.initStatusBar()
    this.syncTabBar()
    this.loadCategories()
    this.loadHomeFeed()
    this.loadProducts({ refresh: true })
    this.startBannerAutoplay()
    this.startCountdown()
    this.loadFlashDeals()
    this.loadRecentDeals()
  },

  /**
   * 生命周期：页面显示
   * - 仅在首次进入时（!initialized）才主动 load；
   * - 后续从其他 tab 切回首页时**不**重复拉数据（避免浪费流量），
   *   如有需要可通过下拉刷新手动触发。
   * - 登录态检查：未登录跳登录页（统一入口约定）。
   */
  onShow() {
    // 同步自定义 tab-bar 高亮
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    // 登录拦截
    const app = getApp()
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }
    if (!this.data.initialized) {
      // onLoad 已发起请求，此处不重复
      this.setData({ initialized: true })
    }
  },

  /**
   * 初始化顶部安全区高度 + 微信原生胶囊按钮避让距离
   * - statusBarHeight：状态栏高度（用于顶部安全区占位）
   * - navBarPaddingRight：自定义导航栏的右内边距
   *   通过 wx.getMenuButtonBoundingClientRect() 获取胶囊位置，
   *   让自定义右按钮（消息入口）落在胶囊左侧（同一行），避免被挤到胶囊下方
   * - navBarMarginTop：自定义导航栏的顶部外边距
   *   让 navbar 顶部和胶囊顶部在同一像素线上，彻底对齐原生控件
   * @returns {void}
   */
  initStatusBar() {
    try {
      const sysInfo = sys.getSystemInfoSync()
      const statusBarHeight = sysInfo.statusBarHeight || 20
      // 获取微信原生胶囊按钮的位置和尺寸（单位：px）
      const menuButton = wx.getMenuButtonBoundingClientRect()
      const windowWidth = sysInfo.windowWidth || 375
      // 1) 让 navbar 内容的右边 = 胶囊左边 - 10px（留出 10px 间距）
      const paddingRight = windowWidth - (menuButton.left || 0) + 10
      // 2) 让 navbar 顶部 = 胶囊顶部（取相对状态栏底部的偏移，去除状态栏高度的影响）
      const marginTop = (menuButton.top || 0) - statusBarHeight
      this.setData({
        statusBarHeight,
        navBarPaddingRight: paddingRight,
        navBarMarginTop: marginTop,
      })
    } catch (e) {
      // 异常时使用默认值，保证页面布局不崩
      this.setData({
        statusBarHeight: 20,
        navBarPaddingRight: 110,
        navBarMarginTop: 4,
      })
    }
  },

  /**
   * 同步自定义 tab-bar 当前高亮项（首页 = 0）
   * @returns {void}
   */
  syncTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  /**
   * 拉取首页聚合数据（轮播 + 公告 + 分类 + 热门 + 最新）
   * 失败时使用本地兜底，保证首屏不空白。
   * 图片降级：当后端图片 URL 指向 8000 端口时，替换为本地占位图。
   * @returns {Promise<void>}
   */
  async loadHomeFeed() {
    try {
      const res = await api.homeFeed()
      const data = (res && res.data) || {}
      const banners = data.banners || []
      const notices = data.notices || []
      // 对热门商品和最新商品的图片进行降级处理
      const hotProducts = fallbackProducts(data.hot_products || [])
      const freshProducts = fallbackProducts(data.fresh_products || [])
      const siteStats = data.site_stats || {}
      this.setData({
        banners,
        notices,
        hotProducts,
        freshProducts,
        heroStats: {
          products: String(siteStats.product_count || 0),
          users: String(siteStats.user_count || 0),
        },
      })
    } catch (err) {
      // 失败时不报错；保留默认空数据
      console.warn('[home] loadHomeFeed failed', err)
    }
  },

  /**
   * 启动轮播自动播放（每 4 秒）
   * @returns {void}
   */
  startBannerAutoplay() {
    if (this._bannerTimer) return
    this._bannerTimer = setInterval(() => {
      const banners = this.data.banners || []
      if (!banners.length) return
      const next = (this.data.bannerIndex + 1) % banners.length
      this.setData({ bannerIndex: next })
    }, 4000)
  },

  /**
   * 用户点击轮播指示点：切换到指定 banner
   * @param {Object} e 事件对象，e.currentTarget.dataset.idx
   * @returns {void}
   */
  onBannerTap(e) {
    const idx = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.idx) || 0
    this.setData({ bannerIndex: Number(idx) || 0 })
  },

  /**
   * 轮播图变化事件：同步指示点
   * @param {Object} e 事件对象，e.detail.current
   * @returns {void}
   */
  onBannerChange(e) {
    const idx = (e && e.detail && e.detail.current) || 0
    this.setData({ bannerIndex: idx })
  },

  /**
   * 点击 banner：根据 action_type 跳转
   * @param {Object} e 事件对象，e.currentTarget.dataset.item
   * @returns {void}
   */
  onTapBannerItem(e) {
    const item = ((e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.item) || {})
    if (!item || !item.action_type) return
    if (item.action_type === 'page' && item.action_payload) {
      if (item.action_payload.startsWith('/pages/')) {
        wx.navigateTo({ url: item.action_payload, fail: () => wx.switchTab({ url: item.action_payload }) })
      }
    } else if (item.action_type === 'category') {
      wx.switchTab({ url: '/pages/category/category?parent_id=' + (item.action_payload || '') })
    }
  },

  /**
   * 点击导航栏左侧：扫一扫
   * 调起微信原生扫码；识别到内部跳转路径则自动跳转；
   * 识别到外部 URL 复制到剪贴板；其他内容跳到搜索页
   * @returns {void}
   */
  onTapNavLeft() {
    if (!wx.scanCode) {
      wx.showToast({ title: '当前微信版本不支持扫码', icon: 'none' })
      return
    }
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode', 'barCode'],
      success: (res) => {
        const result = (res && res.result) || ''
        if (!result) {
          wx.showToast({ title: '未识别到内容', icon: 'none' })
          return
        }
        if (result.indexOf('/pages/detail/detail') !== -1) {
          wx.navigateTo({ url: result })
        } else if (/^https?:\/\//.test(result)) {
          wx.setClipboardData({
            data: result,
            success: () => wx.showToast({ title: '链接已复制', icon: 'success' }),
          })
        } else {
          wx.navigateTo({ url: '/pages/search/search?keyword=' + encodeURIComponent(result) })
        }
      },
      fail: (err) => {
        if (err && err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '扫码失败', icon: 'none' })
        }
      },
    })
  },

  /**
   * 点击导航栏右侧：消息中心
   * @returns {void}
   */
  onTapNavRight() {
    wx.switchTab({ url: '/pages/chat/chat' })
  },

  /**
   * 点击快捷入口
   * @param {Object} e 事件对象，e.currentTarget.dataset.key
   * @returns {void}
   */
  onTapQuickAction(e) {
    const key = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.key) || ''
    if (key === 'publish') {
      wx.switchTab({ url: '/pages/publish/publish' })
    } else if (key === 'ai') {
      wx.navigateTo({ url: '/pages/ai/ai' })
    } else if (key === 'fav') {
      wx.navigateTo({ url: '/pages/mine/mine?tab=favorites' })
    } else if (key === 'orders') {
      wx.navigateTo({ url: '/pages/orders/orders' })
    }
  },

  /**
   * 点击语音搜索按钮：跳转到搜索页（由搜索页触发语音输入面板）
   * @returns {void}
   */
  onTapVoice() {
    wx.navigateTo({ url: '/pages/search/search?autofocus=1&voice=1' })
  },

  /**
   * 点击热门 / 最新商品
   * @param {Object} e 事件对象，e.currentTarget.dataset.id
   * @returns {void}
   */
  onTapHotProduct(e) {
    const id = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id) || ''
    if (!id) return
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  },

  /**
   * 拉取一级分类（用于顶部横滑入口）
   * - 成功：写入 categories
   * - 失败：降级到本地 MOCK_CATEGORIES，保证页面有内容可展示
   * @returns {Promise<void>}
   */
  async loadCategories() {
    try {
      const res = await api.categories()
      const list = (res && res.data && res.data.results) || (res && res.data) || []
      const formatted = (Array.isArray(list) ? list : [])
        .filter((c) => !c.parent) // 仅取一级分类
        .map((c) => ({
          id:   c.id,
          name: c.name,
          icon: resolveCategoryIcon(c.icon),
        }))
      this.setData({ categories: formatted.length ? formatted : MOCK_CATEGORIES })
    } catch (err) {
      // 接口未就绪时降级
      this.setData({ categories: MOCK_CATEGORIES })
    }
  },

  /**
   * 拉取商品列表
   * @param {Object} opts
   * @param {boolean} opts.refresh  true=下拉刷新（page 重置 1）；false=上拉加载更多（page +1）
   * @returns {Promise<void>}
   */
  async loadProducts({ refresh = false } = {}) {
    if (this.data.loading) return
    if (!refresh && !this.data.hasMore) return

    this.setData({ loading: true, error: false })
    const nextPage = refresh ? 1 : this.data.page + 1

    try {
      const res = await api.products({
        page: nextPage,
        page_size: PAGE_SIZE,
        status: PRODUCT_STATUS,
      })
      // 兼容多种分页响应：{results, count, next} / {items, total, has_more} / 直接数组
      const body = (res && res.data) || {}
      let list = body.results || body.items || body.data || (Array.isArray(body) ? body : [])
      const hasNext = !!(body.next || body.has_more) && list.length >= PAGE_SIZE

      // 对商品列表的图片进行降级处理（模拟器无法加载 8000 端口图片时替换为本地占位图）
      list = fallbackProducts(list)

      // 兜底：当接口未就绪或返回空，且是首屏刷新，使用 mock 一次
      let finalList = list
      if (refresh && (!list || !list.length)) {
        finalList = MOCK_PRODUCTS
      }

      // 合并列表（去重以防后端 page 边界返回重复）
      const merged = refresh ? finalList : this.data.products.concat(finalList)

      this.setData({
        products: merged,
        page: nextPage,
        hasMore: hasNext || (!refresh && finalList.length === PAGE_SIZE),
        loading: false,
        refreshing: false,
        isEmpty: refresh && (!merged || !merged.length),
      })
    } catch (err) {
      // 接口失败时，首屏用 mock 兜底
      if (refresh) {
        this.setData({
          products: MOCK_PRODUCTS,
          loading: false,
          refreshing: false,
          error: false,
          isEmpty: false,
        })
      } else {
        this.setData({ loading: false, error: true, errorMsg: (err && err.message) || '加载失败' })
        wx.showToast({ title: '加载更多失败', icon: 'none' })
      }
    }
  },

  /**
   * 用户下拉刷新
   * @returns {void}
   */
  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.loadProducts({ refresh: true })
      .finally(() => wx.stopPullDownRefresh())
  },

  /**
   * 用户上拉触底
   * @returns {void}
   */
  onReachBottom() {
    this.loadProducts({ refresh: false })
  },

  /**
   * 点击搜索框：跳搜索页
   * @returns {void}
   */
  onTapSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  },

  /**
   * 点击分类入口
   * @param {Object} e 事件对象，e.currentTarget.dataset.item
   * @returns {void}
   */
  onTapCategory(e) {
    const item = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.item) || {}
    // 跳转到分类 tab，并通过 query 携带一级分类 id，由分类页接收
    wx.switchTab({
      url: '/pages/category/category?parent_id=' + (item.id || ''),
    })
  },

  /**
   * 点击商品卡片
   * @param {Object} e 事件对象，e.detail = {id}
   * @returns {void}
   */
  onTapProduct(e) {
    const id = (e && e.detail && e.detail.id) || ''
    if (!id) return
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  },

  /**
   * 收藏按钮事件：乐观更新 + 落库（接口预留）
   * @param {Object} e 事件对象，e.detail = {id, product, active}
   * @returns {Promise<void>}
   */
  async onFavoriteProduct(e) {
    const detail = (e && e.detail) || {}
    const { id, product, active } = detail
    if (!id) return
    // 1) 本地立即更新收藏数（乐观）
    const next = this.data.products.map((p) => {
      if (p.id !== id) return p
      return Object.assign({}, p, {
        is_favorited: active,
        favorite_count: Math.max(0, (p.favorite_count || 0) + (active ? 1 : -1)),
      })
    })
    this.setData({ products: next })
    // 2) 落库（失败时回滚 + toast），使用统一的 api.toggleFavorite
    try {
      await api.toggleFavorite(id)
    } catch (err) {
      // 回滚
      const rollback = this.data.products.map((p) => {
        if (p.id !== id) return p
        return Object.assign({}, p, {
          is_favorited: !active,
          favorite_count: Math.max(0, (p.favorite_count || 0) + (active ? -1 : 1)),
        })
      })
      this.setData({ products: rollback })
      wx.showToast({ title: '操作失败，请稍后再试', icon: 'none' })
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
    const cover = product.cover || product.image
    if (!cover) {
      wx.showToast({ title: '该商品暂无图片', icon: 'none' })
      return
    }
    wx.previewImage({
      urls: [cover],
      current: cover,
      fail: (err) => {
        if (err && err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '图片预览失败', icon: 'none' })
        }
      },
    })
  },

  /**
   * 空状态 / 错误状态：点击重试
   * @returns {void}
   */
  onRetry() {
    this.setData({ error: false, errorMsg: '' })
    this.loadProducts({ refresh: true })
  },

  /**
   * 空状态：点击去发布
   * @returns {void}
   */
  onTapPublish() {
    wx.switchTab({ url: '/pages/publish/publish' })
  },

  /**
   * "限时特惠 - 抢更多"按钮：跳到分类页（按限时聚合）
   * @returns {void}
   */
  onTapFlashMore() {
    wx.switchTab({ url: '/pages/category/category' })
  },

  /**
   * "近期成交 - 看更多"按钮：跳到分类页
   * @returns {void}
   */
  onTapDealsMore() {
    wx.switchTab({ url: '/pages/category/category' })
  },

  /**
   * "本周热门 - 看更多"按钮：跳到分类页
   * @returns {void}
   */
  onTapHotMore() {
    wx.switchTab({ url: '/pages/category/category' })
  },

  /**
   * 生命周期：页面卸载，清理轮播定时器
   * @returns {void}
   */
  onUnload() {
    if (this._bannerTimer) {
      clearInterval(this._bannerTimer)
      this._bannerTimer = null
    }
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer)
      this._countdownTimer = null
    }
  },

  /**
   * 启动限时特惠倒计时（每秒）
   * 倒计时目标：当日 23:59:59
   * @returns {void}
   */
  startCountdown() {
    if (this._countdownTimer) return
    const pad = (n) => String(n).padStart(2, '0')
    const tick = () => {
      const now = new Date()
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      let diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))
      const h = Math.floor(diff / 3600); diff %= 3600
      const m = Math.floor(diff / 60)
      const s = diff % 60
      this.setData({
        countdown: { h: pad(h), m: pad(m), s: pad(s) },
      })
    }
    tick()
    this._countdownTimer = setInterval(tick, 1000)
  },

  /**
   * 加载限时特惠商品（mock 兜底，等后端接口就绪替换）
   * @returns {void}
   */
  loadFlashDeals() {
    const flashDeals = [
      {
        id: 201,
        title: '考研政治冲刺笔记 全新',
        cover: MOCK_COVERS[5],
        flash_price: '18.80',
        original_price: '38.00',
        discount: 50,
        sold_count: 23,
        sold_percent: 70,
      },
      {
        id: 202,
        title: '罗技 G304 无线鼠标',
        cover: MOCK_COVERS[3],
        flash_price: '149.00',
        original_price: '229.00',
        discount: 35,
        sold_count: 12,
        sold_percent: 40,
      },
      {
        id: 203,
        title: '蓝牙耳机 主动降噪',
        cover: MOCK_COVERS[1],
        flash_price: '99.00',
        original_price: '199.00',
        discount: 50,
        sold_count: 56,
        sold_percent: 88,
      },
      {
        id: 204,
        title: '宿舍折叠收纳箱',
        cover: MOCK_COVERS[2],
        flash_price: '29.90',
        original_price: '59.00',
        discount: 49,
        sold_count: 8,
        sold_percent: 30,
      },
    ]
    this.setData({ flashDeals })
  },

  /**
   * 加载近期成交（mock 兜底）
   * @returns {void}
   */
  loadRecentDeals() {
    const recentDeals = [
      { id: 1, buyer_name: '张同学', buyer_initial: '张', product_title: '高数教材 同济第七版', price: '30.00', time_text: '2 分钟前' },
      { id: 2, buyer_name: '李同学', buyer_initial: '李', product_title: 'iPad Air 4 64G 星空灰', price: '2580.00', time_text: '5 分钟前' },
      { id: 3, buyer_name: '王同学', buyer_initial: '王', product_title: '北欧实木书桌', price: '180.00', time_text: '12 分钟前' },
      { id: 4, buyer_name: '陈同学', buyer_initial: '陈', product_title: '《计算机网络》第七版', price: '45.00', time_text: '20 分钟前' },
      { id: 5, buyer_name: '林同学', buyer_initial: '林', product_title: '小米手环 8 NFC', price: '169.00', time_text: '半小时前' },
    ]
    this.setData({ recentDeals })
  },

  /**
   * 点击限时特惠商品
   * @param {Object} e 事件对象，e.currentTarget.dataset.id
   * @returns {void}
   */
  onTapFlashDeal(e) {
    const id = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id) || ''
    if (!id) return
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  },

  /**
   * 分享给好友
   * @returns {Object} 分享参数
   */
  onShareAppMessage() {
    return {
      title: '校园易物 · 闲置流转，让宝贝找到新主人',
      path: '/pages/index/index',
    }
  },

  /**
   * 分享到朋友圈（基础库 2.11+）
   * @returns {Object} 分享参数
   */
  onShareTimeline() {
    return { title: '校园易物 · 闲置流转' }
  },

  /**
   * 商品图片加载失败降级：将后端图片 URL 替换为本地占位图
   * 当图片指向 8000 端口或 /media/ 相对路径时，自动替换为 /assets/products/ 下的占位图
   * @param {Object} e - 图片加载错误事件
   * @param {string} e.currentTarget.dataset.type - 图片类型：product/flash/hot/fresh
   * @param {number} e.currentTarget.dataset.index - 图片在列表中的索引
   * @returns {void}
   */
  onImageErrorFallback(e) {
    const { type, index } = (e.currentTarget.dataset || {})
    if (!type || index === undefined) return

    // 根据类型获取对应的商品列表
    const listKey = {
      flash: 'flashDeals',
      hot: 'hotProducts',
      fresh: 'freshProducts',
      product: 'products',
    }[type]

    if (!listKey) return
    const list = this.data[listKey] || []
    const item = list[index]
    if (!item) return

    // 对商品图片进行降级处理
    const fallbackItem = fallbackProductImage(item)

    // 检查是否确实做了降级
    if (fallbackItem !== item) {
      this.setData({
        [listKey + '[' + index + ']']: fallbackItem,
      })
    }
  },
})
