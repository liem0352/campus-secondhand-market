/**
 * 图标资源统一管理 —— 校园易物
 * --------------------------------------------------------------------
 * 集中管理所有 SVG 图标路径，供 WXML / JS 引用。
 * 优势：
 *   1. 路径集中，修改一处即可全量生效；
 *   2. 避免 WXML 中硬编码字符串散落；
 *   3. 与 utils/style.js 一起提供"设计 token + 资源 token"完整闭环。
 *
 * 重要：所有图标均为 SVG（**严禁 emoji**，用户规则 5）。
 * 风格：Lucide outline 24x24 / stroke-width=2 / 圆角端点。
 */

// 资源根目录（绝对路径，相对于小程序根目录；以 / 开头避免被解析为相对当前页面）
const ROOT = '/assets/'

/* ================== TabBar 图标 ================== */
const TABBAR = [
  {
    key: 'home',
    text: '首页',
    pagePath: '/pages/index/index',
    icon: ROOT + 'tabbar/home.png',
    iconActive: ROOT + 'tabbar/home-active.png',
  },
  {
    key: 'category',
    text: '分类',
    pagePath: '/pages/category/category',
    icon: ROOT + 'tabbar/category.png',
    iconActive: ROOT + 'tabbar/category-active.png',
  },
  {
    key: 'publish',
    text: '发布',
    pagePath: '/pages/publish/publish',
    icon: ROOT + 'tabbar/publish.png',
    iconActive: ROOT + 'tabbar/publish-active.png',
  },
  {
    key: 'chat',
    text: '消息',
    pagePath: '/pages/chat/chat',
    icon: ROOT + 'tabbar/chat.png',
    iconActive: ROOT + 'tabbar/chat-active.png',
  },
  {
    key: 'mine',
    text: '我的',
    pagePath: '/pages/mine/mine',
    icon: ROOT + 'tabbar/mine.png',
    iconActive: ROOT + 'tabbar/mine-active.png',
  },
]

/**
 * 根据 key 获取 tabbar 某一项
 * @param {string} key home/category/publish/chat/mine
 * @returns {Object|null}
 */
function getTabbar(key) {
  return TABBAR.find((t) => t.key === key) || null
}

/* ================== 通用功能图标 ================== */
const ICON = {
  /* --- 基础操作 --- */
  // 搜索
  search:       ROOT + 'icons/search.png',
  // 加号
  plus:         ROOT + 'icons/plus.png',
  // 减号
  minus:        ROOT + 'icons/minus.png',
  // 关闭
  close:        ROOT + 'icons/close.png',
  // 勾选
  check:        ROOT + 'icons/check.png',
  // 刷新
  refresh:      ROOT + 'icons/refresh.png',
  // 筛选
  filter:       ROOT + 'icons/filter.png',
  // 更多
  more:         ROOT + 'icons/more.png',
  // 列表
  list:         ROOT + 'icons/list.png',

  /* --- 箭头 --- */
  arrowRight:   ROOT + 'icons/arrow-right.png',
  arrowLeft:    ROOT + 'icons/arrow-left.png',
  arrowDown:    ROOT + 'icons/arrow-down.png',

  /* --- 收藏/喜欢 --- */
  favorite:     ROOT + 'icons/favorite.png',
  favoriteOn:   ROOT + 'icons/favorite-on.png',
  bookmark:     ROOT + 'icons/bookmark.png',

  /* --- 编辑 --- */
  edit:         ROOT + 'icons/edit.png',
  delete:       ROOT + 'icons/delete.png',
  upload:       ROOT + 'icons/upload.png',
  download:     ROOT + 'icons/download.png',
  share:        ROOT + 'icons/share.png',

  /* --- 媒体 --- */
  camera:       ROOT + 'icons/camera.png',
  cameraPlus:   ROOT + 'icons/camera-plus.png',
  image:        ROOT + 'icons/image.png',
  mic:          ROOT + 'icons/mic.png',
  send:         ROOT + 'icons/send.png',

  /* --- 信用/身份 --- */
  credit:       ROOT + 'icons/credit.png',
  award:        ROOT + 'icons/award.png',
  badgeCheck:   ROOT + 'icons/badge-check.png',
  user:         ROOT + 'icons/user.png',
  users:        ROOT + 'icons/users.png',
  userX:        ROOT + 'icons/user-x.png',
  shield:       ROOT + 'icons/shield.png',
  school:       ROOT + 'icons/school.png',
  zap:          ROOT + 'icons/zap.png',

  /* --- 业务图标 --- */
  ai:           ROOT + 'icons/ai.png',
  bell:         ROOT + 'icons/bell.png',
  scan:         ROOT + 'icons/scan.png',
  qrcode:       ROOT + 'icons/qr-code.png',
  eye:          ROOT + 'icons/eye.png',
  eyeOff:       ROOT + 'icons/eye-off.png',
  lock:         ROOT + 'icons/lock.png',
  wallet:       ROOT + 'icons/wallet.png',
  creditCard:   ROOT + 'icons/credit-card.png',
  megaphone:    ROOT + 'icons/megaphone.png',
  flame:        ROOT + 'icons/flame.png',
  chart:        ROOT + 'icons/chart.png',
  trendingUp:   ROOT + 'icons/trending-up.png',
  helpCircle:   ROOT + 'icons/help-circle.png',
  messageSquare:ROOT + 'icons/message-square.png',
  messageCircle:ROOT + 'icons/message-circle.png',
  headphones:   ROOT + 'icons/headphones.png',
  info:         ROOT + 'icons/info.png',
  settings:     ROOT + 'icons/settings.png',
  logOut:       ROOT + 'icons/log-out.png',
  moon:         ROOT + 'icons/moon.png',
  globe:        ROOT + 'icons/globe.png',
  package:      ROOT + 'icons/package.png',
  shoppingBag:  ROOT + 'icons/shopping-bag.png',
  tag:          ROOT + 'icons/tag.png',
  grid:         ROOT + 'icons/grid.png',
  truck:        ROOT + 'icons/truck.png',
  lightbulb:    ROOT + 'icons/lightbulb.png',

  /* --- 位置/时间 --- */
  location:     ROOT + 'icons/location.png',
  phone:        ROOT + 'icons/phone.png',
  clock:        ROOT + 'icons/clock.png',
}

/* ================== 状态图标 ================== */
const STATUS = {
  empty:    ROOT + 'icons/empty.png',
  loading:  ROOT + 'icons/loading.png',
  success:  ROOT + 'icons/status-success.png',
  warning:  ROOT + 'icons/status-warning.png',
  error:    ROOT + 'icons/status-error.png',
}

/* ================== 商品分类图标映射 ================== */
/**
 * 校园易物一级分类 -> 图标 key
 * 覆盖"教材/服饰/数码/运动/美妆/食品/生活/礼物"等常见二手品类
 */
const CATEGORY_ICON = {
  // 校园教材
  book:        'book',
  textbook:    'book',
  // 服饰鞋包
  apparel:     'apparel',
  clothes:     'apparel',
  // 数码电子
  digital:     'laptop',
  electronics: 'laptop',
  laptop:      'laptop',
  // 运动器材
  sport:       'dumbbell',
  sports:      'dumbbell',
  // 自行车/代步
  bike:        'bike',
  transport:   'bike',
  // 食品零食
  food:        'utensils',
  snack:       'utensils',
  // 生活用品
  life:        'sofa',
  living:      'sofa',
  // 美妆护肤
  beauty:      'sparkles',
  cosmetic:    'sparkles',
  // 母婴
  baby:        'baby',
  // 宠物
  pet:         'pet',
  // 文娱音乐
  music:       'music',
  // 工具
  tool:        'wrench',
  tools:       'wrench',
  // 灯具/小家电
  appliance:   'lightbulb',
  // 默认
  other:       'tag',
  more:        'tag',
  tag:         'tag',
  default:     'tag',
}

/**
 * 根据分类 key 解析出对应的图标 PNG 路径
 * @param {string} key 分类标识
 * @returns {string} PNG 路径（兜底 tag）
 */
function resolveCategoryIcon(key) {
  const iconKey = CATEGORY_ICON[key] || CATEGORY_ICON['default']
  return ICON[iconKey] || ICON.tag
}

module.exports = {
  ROOT,
  TABBAR,
  getTabbar,
  ICON,
  STATUS,
  CATEGORY_ICON,
  resolveCategoryIcon,
}
