/**
 * pages/category/category.js
 * --------------------------------------------------------------------
 * 分类页 —— 校园二手商品按类目浏览（v6 重构）
 *
 * 主要功能：
 *   1. 左右两栏布局：左侧一级分类（图标 + 文字），
 *      右侧 L2 横向滚动胶囊条 + 商品瀑布流。
 *   2. 点击左侧切换右侧内容（保留滚动位置，重新触发水平滑动 keyframe）。
 *   3. 接收首页通过 query 传入的 parent_id，自动定位到对应一级分类。
 *   4. 与首页共用 product-card 组件，瀑布流体验一致。
 *   5. 集成 empty-state / error-state 组件，统一空 / 错状态。
 *   6. 支持下拉刷新 / 上拉加载更多（与首页一致）。
 *
 * v6 重构变化：
 *   - 移除 Hero banner（与 L1 选中态信息重复）
 *   - L2 从 3 列宫格改为横向滚动胶囊条
 *   - 选中态颜色分离：L1 强主色填充 / L2 弱主色软背景
 *   - 排序按钮合并到 L2 条右侧
 *
 * 数据来源：
 *   - 一级分类：GET /api/categories/?level=1
 *   - 二级分类：GET /api/categories/?parent={id}
 *   - 商品流：  GET /api/products/?category={sub_id}&page=1&page_size=20&status=on_sale
 *
 * 设计语言：Apple Liquid Glass + MD3 Expressive + OriginOS 6 光感
 * 可访问性：
 *   - 所有可点击元素 ≥ 88rpx 触控热区
 *   - 支持 prefers-reduced-motion（CSS 端处理）
 *   - 关键操作有 aria-label（写在 wxml）
 *   - 切换分类时通过 aria-live 区域通知屏幕阅读器
 */

const api = require('../../utils/api')
// 模拟器图片降级工具
const { fallbackProducts } = require('../../utils/resolve-url.js')

/* ================== 常量 ================== */
const PAGE_SIZE = 20
const PRODUCT_STATUS = 'on_sale'
const SORT_OPTIONS = [
  { key: 'default',   label: '综合' },
  { key: '-favorite_count', label: '人气' },
  { key: '-created_at',     label: '最新' },
  { key: 'price',           label: '价升' },
  { key: '-price',          label: '价降' },
]

/* ================== 图标映射 ==================
 * 将后端 Category.icon 字段映射为本地 PNG
 *
 * 后端实际命名（参考 backend/scripts/init_categories.py）：
 *   - 一级：book-open / laptop / home / dumbbell / shirt / music-2 / package
 *   - 二级：book / graduation-cap / languages / file-check
 *           smartphone / laptop / tablet / plug / camera / headphones
 *           bed / utensils / droplet / pencil / cookie
 *           circle-dot / mountain / bike
 *           shirt / shopping-bag / footprints / briefcase / watch
 *           music-2 / piano / wind / drum / settings
 *
 * 本表同时兼容：
 *   1) 后端实际短名（book-open / music-2 / package 等）
 *   2) lucide- 前缀
 *   3) 业务 key（book / phone / shirt / home / music / more 等）
 *   4) 中文别名（教程 / 数码 / 服饰 / 生活 / 乐器 / 其他）
 */
const CATEGORY_ICON_MAP = {
  /* ---------- 教材书籍 / 一级 (book-open) ---------- */
  'book-open':     '/assets/icons/book-open.png',
  'lucide-book-open': '/assets/icons/book-open.png',
  '教材书籍':       '/assets/icons/book-open.png',

  /* ---------- 大学教材 / 考研 / 语言 / 考试（sub） ---------- */
  'book':          '/assets/icons/book.png',
  'lucide-book':   '/assets/icons/book.png',
  'textbook':      '/assets/icons/book.png',
  'graduation-cap':'/assets/icons/school.png',
  'lucide-graduation-cap': '/assets/icons/school.png',
  'languages':     '/assets/icons/languages.png',
  'lucide-languages': '/assets/icons/languages.png',
  'file-check':    '/assets/icons/file-check.png',
  'lucide-file-check': '/assets/icons/file-check.png',

  /* ---------- 电子产品 / 一级 (laptop) ---------- */
  'laptop':        '/assets/icons/laptop.png',
  'lucide-laptop': '/assets/icons/laptop.png',
  'digital':       '/assets/icons/laptop.png',
  'electronics':   '/assets/icons/laptop.png',
  '数码':          '/assets/icons/laptop.png',

  /* ---------- 手机 / 电脑 / 平板 / 配件 / 相机 / 耳机（sub） ---------- */
  'smartphone':    '/assets/icons/smartphone.png',
  'lucide-smartphone': '/assets/icons/smartphone.png',
  'phone':         '/assets/icons/phone.png',
  'tablet':        '/assets/icons/tablet.png',
  'lucide-tablet': '/assets/icons/tablet.png',
  'plug':          '/assets/icons/plug.png',
  'lucide-plug':   '/assets/icons/plug.png',
  'camera':        '/assets/icons/camera.png',
  'lucide-camera': '/assets/icons/camera.png',
  'headphones':    '/assets/icons/headphones.png',
  'lucide-headphones': '/assets/icons/headphones.png',
  'audio':         '/assets/icons/headphones.png',

  /* ---------- 生活用品 / 一级 (home) ---------- */
  'home':          '/assets/icons/sofa.png',
  'house':         '/assets/icons/sofa.png',
  'lucide-home':   '/assets/icons/sofa.png',
  'life':          '/assets/icons/sofa.png',
  'sofa':          '/assets/icons/sofa.png',
  'lucide-sofa':   '/assets/icons/sofa.png',
  '生活':          '/assets/icons/sofa.png',

  /* ---------- 宿舍 / 厨房 / 洗护 / 文具 / 食品（sub） ---------- */
  'bed':           '/assets/icons/bed.png',
  'lucide-bed':    '/assets/icons/bed.png',
  'utensils':      '/assets/icons/utensils.png',
  'lucide-utensils': '/assets/icons/utensils.png',
  'food':          '/assets/icons/utensils.png',
  'snack':         '/assets/icons/utensils.png',
  'droplet':       '/assets/icons/droplet.png',
  'lucide-droplet':'/assets/icons/droplet.png',
  'pencil':        '/assets/icons/pencil.png',
  'lucide-pencil': '/assets/icons/pencil.png',
  'cookie':        '/assets/icons/cookie.png',
  'lucide-cookie': '/assets/icons/cookie.png',

  /* ---------- 运动器材 / 一级 (dumbbell) ---------- */
  'dumbbell':      '/assets/icons/dumbbell.png',
  'lucide-dumbbell': '/assets/icons/dumbbell.png',
  'sport':         '/assets/icons/dumbbell.png',
  'sports':        '/assets/icons/dumbbell.png',

  /* ---------- 球类 / 健身 / 户外 / 骑行（sub） ---------- */
  'circle-dot':    '/assets/icons/circle-dot.png',
  'lucide-circle-dot': '/assets/icons/circle-dot.png',
  'mountain':      '/assets/icons/mountain.png',
  'lucide-mountain': '/assets/icons/mountain.png',
  'bike':          '/assets/icons/bike.png',
  'lucide-bike':   '/assets/icons/bike.png',
  'transport':     '/assets/icons/bike.png',

  /* ---------- 服饰鞋帽 / 一级 (shirt) ---------- */
  'shirt':         '/assets/icons/apparel.png',
  'lucide-shirt':  '/assets/icons/apparel.png',
  'apparel':       '/assets/icons/apparel.png',
  'clothing':      '/assets/icons/apparel.png',
  '服饰':          '/assets/icons/apparel.png',

  /* ---------- 男装 / 女装 / 鞋靴 / 箱包 / 配饰（sub） ---------- */
  'shopping-bag':  '/assets/icons/shopping-bag.png',
  'lucide-shopping-bag': '/assets/icons/shopping-bag.png',
  'footprints':    '/assets/icons/footprints.png',
  'lucide-footprints': '/assets/icons/footprints.png',
  'briefcase':     '/assets/icons/briefcase.png',
  'lucide-briefcase': '/assets/icons/briefcase.png',
  'watch':         '/assets/icons/watch.png',
  'lucide-watch':  '/assets/icons/watch.png',

  /* ---------- 乐器 / 一级 (music-2) ---------- */
  'music-2':       '/assets/icons/music-2.png',
  'lucide-music-2':'/assets/icons/music-2.png',
  'music':         '/assets/icons/music.png',
  'lucide-music':  '/assets/icons/music.png',
  '乐器':          '/assets/icons/music-2.png',
  'instrument':    '/assets/icons/music-2.png',

  /* ---------- 弦乐 / 键盘 / 管乐 / 打击 / 配件（sub） ---------- */
  'piano':         '/assets/icons/piano.png',
  'lucide-piano':  '/assets/icons/piano.png',
  'wind':          '/assets/icons/wind.png',
  'lucide-wind':   '/assets/icons/wind.png',
  'drum':          '/assets/icons/drum.png',
  'lucide-drum':   '/assets/icons/drum.png',
  'cog':           '/assets/icons/cog.png',
  'lucide-cog':    '/assets/icons/cog.png',
  'settings':      '/assets/icons/cog.png',
  'lucide-settings':'/assets/icons/cog.png',

  /* ---------- 其它 / 兜底 (package) ---------- */
  'package':       '/assets/icons/package.png',
  'lucide-package':'/assets/icons/package.png',
  'other':         '/assets/icons/package.png',
  '其他':          '/assets/icons/package.png',
  'tag':           '/assets/icons/tag.png',
  'lucide-tag':    '/assets/icons/tag.png',

  /* ---------- 教程 / 数码 / 服饰 / 生活 / 乐器 / 其他（首页横滑别名） ---------- */
  '教程':          '/assets/icons/book-open.png',
  'school':        '/assets/icons/school.png',
  'lucide-school': '/assets/icons/school.png',
  'tutorial':      '/assets/icons/school.png',

  /* ---------- 其它业务图标（保持原映射） ---------- */
  'sparkles':      '/assets/icons/sparkles.png',
  'lucide-sparkles':'/assets/icons/sparkles.png',
  'beauty':        '/assets/icons/sparkles.png',
  'cosmetic':      '/assets/icons/sparkles.png',
  'baby':          '/assets/icons/baby.png',
  'lucide-baby':   '/assets/icons/baby.png',
  'pet':           '/assets/icons/pet.png',
  'lucide-pet':    '/assets/icons/pet.png',
  'gift':          '/assets/icons/gift.png',
  'lucide-gift':   '/assets/icons/gift.png',
  'tool':          '/assets/icons/wrench.png',
  'tools':         '/assets/icons/wrench.png',
  'lucide-wrench': '/assets/icons/wrench.png',
  'appliance':     '/assets/icons/lightbulb.png',
  'lightbulb':     '/assets/icons/lightbulb.png',
  'lucide-lightbulb':'/assets/icons/lightbulb.png',

  /* ---------- 兜底 ---------- */
  'more':          '/assets/icons/grid.png',
  'lucide-more':   '/assets/icons/grid.png',
  'grid':          '/assets/icons/grid.png',
  'lucide-grid':   '/assets/icons/grid.png',
  'default':       '/assets/icons/package.png',
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

/* ================== 本地 fallback mock ================== */
// 注：与后端 /api/categories/ 一级分类保持一致（教程/数码/服饰/生活/乐器/其他）
const MOCK_LEVEL1 = [
  { id: 1, name: '教程',     icon: resolveCategoryIcon('school') },
  { id: 2, name: '数码',     icon: resolveCategoryIcon('laptop') },
  { id: 3, name: '服饰',     icon: resolveCategoryIcon('apparel') },
  { id: 4, name: '生活',     icon: resolveCategoryIcon('sofa') },
  { id: 5, name: '乐器',     icon: resolveCategoryIcon('music') },
  { id: 6, name: '其他',     icon: resolveCategoryIcon('more') },
]

// 二级分类按一级 + 名称映射图标
const SUB_ICON_BY_NAME = {
  '全部': resolveCategoryIcon('tag'),
  // 教程 / 教材
  '考研':     resolveCategoryIcon('book'),
  '英语':     resolveCategoryIcon('book'),
  '数学':     resolveCategoryIcon('book'),
  '计算机':   resolveCategoryIcon('book'),
  '文学':     resolveCategoryIcon('book'),
  '教材':     resolveCategoryIcon('book'),
  '课外书':   resolveCategoryIcon('book'),
  // 数码 / 电子
  '手机':     resolveCategoryIcon('phone'),
  '电脑':     resolveCategoryIcon('laptop'),
  '平板':     resolveCategoryIcon('phone'),
  '耳机':     resolveCategoryIcon('headphones'),
  '相机':     resolveCategoryIcon('phone'),
  '配件':     resolveCategoryIcon('phone'),
  // 服饰 / 鞋包
  '男装':     resolveCategoryIcon('apparel'),
  '女装':     resolveCategoryIcon('apparel'),
  '鞋靴':     resolveCategoryIcon('apparel'),
  '包袋':     resolveCategoryIcon('apparel'),
  '配饰':     resolveCategoryIcon('apparel'),
  // 生活 / 家居
  '宿舍':     resolveCategoryIcon('sofa'),
  '美妆':     resolveCategoryIcon('sparkles'),
  '运动':     resolveCategoryIcon('dumbbell'),
  '美食':     resolveCategoryIcon('utensils'),
  '电器':     resolveCategoryIcon('lightbulb'),
  // 乐器 / 音乐
  '吉他':     resolveCategoryIcon('music'),
  '钢琴':     resolveCategoryIcon('music'),
  '提琴':     resolveCategoryIcon('music'),
  '管乐':     resolveCategoryIcon('music'),
  '音响':     resolveCategoryIcon('headphones'),
  '其他乐器': resolveCategoryIcon('music'),
  // 其他
  '虚拟物品': resolveCategoryIcon('more'),
  '代步':     resolveCategoryIcon('bike'),
  '票券':     resolveCategoryIcon('more'),
  '其他':     resolveCategoryIcon('more'),
}

const MOCK_LEVEL2_MAP = {
  1: [
    { id: 101, name: '考研' }, { id: 102, name: '英语' }, { id: 103, name: '数学' },
    { id: 104, name: '计算机' }, { id: 105, name: '文学' }, { id: 106, name: '教材' },
  ],
  2: [
    { id: 201, name: '手机' }, { id: 202, name: '电脑' }, { id: 203, name: '平板' },
    { id: 204, name: '耳机' }, { id: 205, name: '相机' }, { id: 206, name: '配件' },
  ],
  3: [
    { id: 301, name: '男装' }, { id: 302, name: '女装' }, { id: 303, name: '鞋靴' },
    { id: 304, name: '包袋' }, { id: 305, name: '配饰' },
  ],
  4: [
    { id: 401, name: '宿舍' }, { id: 402, name: '美妆' }, { id: 403, name: '运动' },
    { id: 404, name: '美食' }, { id: 405, name: '电器' },
  ],
  5: [
    { id: 501, name: '吉他' }, { id: 502, name: '钢琴' }, { id: 503, name: '提琴' },
    { id: 504, name: '管乐' }, { id: 505, name: '音响' }, { id: 506, name: '其他乐器' },
  ],
  6: [
    { id: 601, name: '虚拟物品' }, { id: 602, name: '代步' }, { id: 603, name: '票券' }, { id: 604, name: '其他' },
  ],
}

// v6 重构：L1_SUBTITLE 已移除（Hero banner 删除后不再需要副标题）

const MOCK_COVERS = [
  '/assets/products/p4_4.jpg',     // 教材
  '/assets/products/p6_10.jpg',    // 真题
  '/assets/products/p9_13.jpg',    // 计算机书籍
  '/assets/products/p11_17.jpg',   // 线性代数
  '/assets/products/p8_12.jpg',    // 算法导论
  '/assets/products/p10_16.jpg',   // 现代文学
]

const MOCK_PRODUCTS = [
  { id: 1001, title: '高等数学（同济第七版）上下册', price: '35.00', cover: MOCK_COVERS[0], school: '武汉大学', condition: 'like_new', favorite_count: 12, is_favorited: false, seller: { id: 1, nickname: '张同学', credit_score: 96 } },
  { id: 1002, title: '考研英语真题黄皮书 2025', price: '28.00', cover: MOCK_COVERS[1], school: '华中科大', condition: 'good', favorite_count: 3, is_favorited: false, seller: { id: 6, nickname: '周同学', credit_score: 90 } },
  { id: 1003, title: '《计算机网络：自顶向下方法》第七版', price: '45.00', cover: MOCK_COVERS[2], school: '武大', condition: 'like_new', favorite_count: 11, is_favorited: false, seller: { id: 9, nickname: '陈同学', credit_score: 92 } },
  { id: 1004, title: '线性代数（同济版）几乎全新', price: '18.00', cover: MOCK_COVERS[3], school: '武理工', condition: 'like_new', favorite_count: 6, is_favorited: false, seller: { id: 11, nickname: '黄同学', credit_score: 88 } },
  { id: 1005, title: '《算法导论》第三版', price: '65.00', cover: MOCK_COVERS[4], school: '华科', condition: 'good', favorite_count: 15, is_favorited: true, seller: { id: 12, nickname: '徐同学', credit_score: 85 } },
  { id: 1006, title: '现代文学三十年', price: '15.00', cover: MOCK_COVERS[5], school: '华师', condition: 'fair', favorite_count: 2, is_favorited: false, seller: { id: 13, nickname: '高同学', credit_score: 76 } },
]

/**
 * 为二级分类列表注入 icon 字段（前端映射）
 * @param {Array<{id:number,name:string}>} list - 二级分类列表
 * @returns {Array} 带 icon 字段的二级分类
 */
function decorateL2WithIcon(list) {
  return (list || []).map((c) => Object.assign({}, c, { icon: SUB_ICON_BY_NAME[c.name] || resolveCategoryIcon('tag') }))
}

Page({
  /**
   * 页面初始数据
   * - level1: 一级分类列表
   * - selectedL1: 当前选中的一级分类
   * - level2: 当前一级分类下的二级分类
   * - selectedL2: 当前选中的二级分类（null = "全部"）
   * - products: 商品瀑布流数据
   * - page / hasMore: 分页状态
   * - loading / refreshing / error: UI 状态机
   * - isEmpty: 当前分类下无商品
   * - sortIndex / currentSort / currentSortLabel: 排序状态与显示文案
   * - ariaAnnounce: 屏幕阅读器播报文本
   */
  data: {
    level1: [],
    selectedL1: null,
    level2: [],
    selectedL2: null,
    products: [],
    page: 1,
    hasMore: true,
    loading: false,
    refreshing: false,
    isEmpty: false,
    error: false,
    errorMsg: '',
    // 排序状态
    sortIndex: 0,
    currentSort: 'default',
    currentSortLabel: '综合',  // v6：排序按钮显示文案（与 L2 胶囊条同行）
    // aria-live 区域文本（切换分类时同步播报）
    ariaAnnounce: '',
    // 全部 tab 占位
    ALL: { id: null, name: '全部', icon: resolveCategoryIcon('tag') },
  },

  /**
   * 生命周期：页面加载
   * 1. 同步自定义 tab-bar 高亮（分类 = 1）；
   * 2. 接收 query 里的 parent_id（从首页跳转过来），自动定位到对应一级分类；
   * 3. 拉取一级分类列表并初始化右侧内容。
   * @param {Object} options - 页面启动参数
   * @param {string} [options.parent_id] - 一级分类 id（来自首页横滑入口）
   * @returns {void}
   */
  onLoad(options) {
    this.syncTabBar()
    const parentId = (options && options.parent_id) ? Number(options.parent_id) : null
    this.loadLevel1(parentId)
  },

  /**
   * 生命周期：页面显示
   * - 切回分类 tab 时保持 tab-bar 高亮
   * @returns {void}
   */
  onShow() {
    this.syncTabBar()
  },

  /**
   * 同步自定义 tab-bar 当前高亮项（分类 = 1）
   * @returns {void}
   */
  syncTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  /**
   * 拉取一级分类列表
   * - 成功：写入 level1，定位到 initial（query.parent_id 或第一个）；
   * - 失败：降级到本地 MOCK_LEVEL1，保证页面有内容。
   * @param {number|null} parentId - 从首页跳转过来时携带的一级分类 id
   * @returns {Promise<void>}
   */
  async loadLevel1(parentId) {
    try {
      const res = await api.categories()
      const list = (res && res.data && res.data.results) || (res && res.data) || []
      const arr = (Array.isArray(list) ? list : [])
        .filter((c) => !c.parent) // 仅一级
        .map((c) => ({
          id:   c.id,
          name: c.name,
          icon: resolveCategoryIcon(c.icon),
        }))
      const final = arr.length ? arr : MOCK_LEVEL1
      const initial = (parentId && final.find((c) => c.id === parentId)) || final[0]
      this.setData({
        level1: final,
        selectedL1: initial,
        ariaAnnounce: `已切换到${initial ? initial.name : ''}分类`,
      })
      if (initial) this.loadLevel2(initial.id)
    } catch (err) {
      console.warn('[category] loadLevel1 failed', err)
      this.setData({
        level1: MOCK_LEVEL1,
        selectedL1: MOCK_LEVEL1[0],
        ariaAnnounce: '已切换到教程分类',
      })
      this.loadLevel2(MOCK_LEVEL1[0].id)
    }
  },

  /**
   * 拉取指定一级分类下的二级分类
   * - 写入 level2，重置分页状态，自动请求商品列表
   * - 失败时降级到 MOCK_LEVEL2_MAP
   * @param {number} parentId - 一级分类 id
   * @returns {Promise<void>}
   */
  async loadLevel2(parentId) {
    try {
      const res = await api.categories()
      const list = (res && res.data && res.data.results) || (res && res.data) || []
      const sub = (Array.isArray(list) ? list : [])
        .filter((c) => {
          const pid = c.parent && c.parent.id
          return String(pid) === String(parentId) || String(c.parent) === String(parentId)
        })
        .map((c) => ({ id: c.id, name: c.name, icon: resolveCategoryIcon(c.icon) }))
      const final = sub.length ? sub : (MOCK_LEVEL2_MAP[parentId] || [])
      const decorated = decorateL2WithIcon(final)
      this.setData({
        level2: decorated,
        selectedL2: this.data.ALL,
        products: [],
        page: 1,
        hasMore: true,
        isEmpty: false,
        error: false,
      })
      this.loadProducts({ refresh: true })
    } catch (err) {
      console.warn('[category] loadLevel2 failed', err)
      const arr = decorateL2WithIcon(MOCK_LEVEL2_MAP[parentId] || [])
      this.setData({
        level2: arr,
        selectedL2: this.data.ALL,
        products: [],
        page: 1,
        hasMore: true,
        isEmpty: false,
        error: false,
      })
      this.loadProducts({ refresh: true })
    }
  },

  /**
   * 拉取商品列表
   * - refresh=true：下拉刷新 / 切换分类（page 重置 1）；
   * - refresh=false：上拉加载更多（page +1）。
   * - 失败时首屏用 MOCK_PRODUCTS 兜底，后续翻页弹 toast。
   * @param {Object} [opts]
   * @param {boolean} [opts.refresh=false] - 是否为下拉刷新 / 首次加载
   * @returns {Promise<void>}
   */
  async loadProducts({ refresh = false } = {}) {
    if (this.data.loading) return
    if (!refresh && !this.data.hasMore) return

    const subId = this.data.selectedL2 && this.data.selectedL2.id
    const l1Id = this.data.selectedL1 && this.data.selectedL1.id
    this.setData({ loading: true, error: false })
    const nextPage = refresh ? 1 : this.data.page + 1

    try {
      const categoryFilter = subId || l1Id || ''
      const res = await api.products({
        page: nextPage,
        page_size: PAGE_SIZE,
        status: PRODUCT_STATUS,
        category: categoryFilter || undefined,
        ordering: this.data.currentSort !== 'default' ? this.data.currentSort : undefined,
      })
      const body = (res && res.data) || {}
      let list = body.results || body.items || body.data || (Array.isArray(body) ? body : [])
      const hasNext = !!(body.next || body.has_more) && list.length >= PAGE_SIZE

      // 对商品列表的图片进行降级处理（模拟器无法加载 8000 端口图片时替换为本地占位图）
      list = fallbackProducts(list)

      let finalList = list
      if (refresh && (!list || !list.length)) {
        finalList = MOCK_PRODUCTS
      }
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
      console.warn('[category] loadProducts failed', err)
      if (refresh) {
        // 首屏失败 → mock 兜底
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
   * 点击左侧一级分类：切换右侧内容并触发水平滑动动画
   * - 同步屏幕阅读器播报
   * @param {Object} e 事件对象，e.currentTarget.dataset.item
   * @returns {void}
   */
  onTapLevel1(e) {
    const item = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.item) || {}
    if (!item || !item.id) return
    if (this.data.selectedL1 && this.data.selectedL1.id === item.id) return
    this.setData({
      selectedL1: item,
      ariaAnnounce: `已切换到${item.name}分类`,
    })
    this.loadLevel2(item.id)
  },

  /**
   * 点击二级分类（含"全部"）：切换商品列表
   * @param {Object} e 事件对象，e.currentTarget.dataset.item
   * @returns {void}
   */
  onTapLevel2(e) {
    const item = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.item) || {}
    if (this.data.selectedL2 && this.data.selectedL2.id === item.id) return
    this.setData({
      selectedL2: item,
      products: [],
      page: 1,
      hasMore: true,
      isEmpty: false,
      ariaAnnounce: `已筛选${item.name}商品`,
    })
    this.loadProducts({ refresh: true })
  },

  /**
   * 点击商品卡片：跳详情页
   * @param {Object} e 事件对象，e.detail = {id}
   * @returns {void}
   */
  onTapProduct(e) {
    const id = (e && e.detail && e.detail.id) || ''
    if (!id) return
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  },

  /**
   * 收藏按钮事件：乐观更新 + 落库（接口走 api.toggleFavorite）
   * @param {Object} e 事件对象，e.detail = {id, product, active}
   * @returns {Promise<void>}
   */
  async onFavoriteProduct(e) {
    const detail = (e && e.detail) || {}
    const { id, active } = detail
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
    // 2) 落库（失败时回滚 + toast）
    try {
      await api.toggleFavorite(id)
    } catch (err) {
      console.warn('[category] toggleFavorite failed', err)
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
   * @param {Object} e 事件对象 e.detail.id 商品ID
   * @returns {void}
   */
  onLongPressProduct(e) {
    const id = (e && e.detail && e.detail.id) || ''
    if (!id) return
    // 从当前商品列表中找出对应商品的所有图片
    const all = []
    const list = this.data.products || []
    const p = list.find((x) => String(x.id) === String(id))
    if (p) {
      if (p.image_url) all.push(p.image_url)
      if (Array.isArray(p.images)) {
        p.images.forEach((img) => {
          const u = (img && (img.image_url || img.url || img))
          if (u) all.push(u)
        })
      }
    }
    if (!all.length) {
      wx.showToast({ title: '该商品暂无图片', icon: 'none' })
      return
    }
    wx.previewImage({
      urls: all,
      current: all[0],
      fail: () => wx.showToast({ title: '图片预览失败', icon: 'none' }),
    })
  },

  /**
   * 错误状态：点击重新加载
   * @returns {void}
   */
  onRetry() {
    this.setData({ error: false, errorMsg: '' })
    this.loadProducts({ refresh: true })
  },

  /**
   * 点击顶部搜索栏：跳搜索页
   * @returns {void}
   */
  onTapSearch() {
    wx.navigateTo({ url: '/pages/search/search?autofocus=1' })
  },

  /**
   * 点击语音搜索按钮：跳搜索页（搜索页内触发语音）
   * @returns {void}
   */
  onTapVoice() {
    wx.navigateTo({ url: '/pages/search/search?autofocus=1&voice=1' })
  },

  /**
   * 点击排序：循环切换 SORT_OPTIONS，并刷新商品列表
   * @returns {void}
   */
  onTapSort() {
    const nextIndex = (this.data.sortIndex + 1) % SORT_OPTIONS.length
    const sort = SORT_OPTIONS[nextIndex]
    this.setData({
      sortIndex: nextIndex,
      currentSort: sort.key,
      currentSortLabel: sort.label,  // v6：同步排序按钮显示文案
      products: [],
      page: 1,
      hasMore: true,
      isEmpty: false,
      ariaAnnounce: `已按${sort.label}排序`,
    })
    this.loadProducts({ refresh: true })
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
   * 分享给好友
   * @returns {Object} 分享参数
   */
  onShareAppMessage() {
    const l1 = this.data.selectedL1
    const l2 = this.data.selectedL2
    const l2Name = l2 && l2.id !== null ? l2.name : ''
    const title = l1
      ? `校园易物 · ${l1.name}${l2Name ? ' / ' + l2Name : ''}分类`
      : '校园易物 · 分类浏览'
    return { title, path: '/pages/category/category' }
  },

  /**
   * 分享到朋友圈（基础库 2.11+）
   * @returns {Object} 分享参数
   */
  onShareTimeline() {
    const l1 = this.data.selectedL1
    return {
      title: l1 ? `校园易物 · ${l1.name}专区` : '校园易物 · 分类浏览',
    }
  },
})
