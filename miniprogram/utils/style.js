/**
 * Design Token 的 JS 镜像 —— 校园易物
 * --------------------------------------------------------------------
 * v4 升级（2026-06）：与 app.wxss 完全同步
 *   - Apple HIG + Liquid Glass 液态玻璃
 *   - Material Design 3 Expressive 形状系统
 *   - OriginOS 6 光感设计
 *   - STRAY_洋葱 动效方法论
 *
 * 用途：当 WXSS 不能满足（inline style / 动态 class / 第三方组件属性）时，
 * 通过 require 此文件来使用设计 token，保证与 app.wxss 的变量完全一致。
 *
 * 约束：
 *   1. 此文件**严禁**与 app.wxss 中的 CSS 变量数值不一致；
 *   2. 修改任何 token 必须**同时**更新 app.wxss 与本文件；
 *   3. 颜色以 #RRGGBB 形式给出（不要带 rgba()，需要透明度时另起字段）。
 */

/* ================== 颜色 ================== */
const color = {
  // 品牌主色
  primary: '#FF6B35',
  primaryHover: '#E55A2B',
  primaryPressed: '#CC4D22',
  primarySoft: '#FFE5DA',
  primarySofter: '#FFF2EB',
  primaryGlow: 'rgba(255, 107, 53, 0.18)',

  // 文本
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textDisabled: '#CCCCCC',
  textInverse: '#FFFFFF',
  textLink: '#FF6B35',
  textOnPrimary: '#FFFFFF',

  // 背景
  bgPage: '#FAFAFB',
  bgPageWarm: 'linear-gradient(180deg, #FFFBF6 0%, #FFF4EE 100%)',
  bgCard: '#FFFFFF',
  bgMask: 'rgba(0, 0, 0, 0.4)',
  bgMaskStrong: 'rgba(0, 0, 0, 0.6)',
  bgHover: '#F5F5F7',
  bgDivider: '#EBEDF0',
  bgSection: '#F7F8FA',

  // 语义（与品牌色协调的橘色调）
  success: '#07C160',
  successSoft: 'rgba(7, 193, 96, 0.12)',
  warning: '#FFA500',
  warningSoft: 'rgba(255, 165, 0, 0.12)',
  error: '#FF4D4F',
  errorSoft: 'rgba(255, 77, 79, 0.12)',
  // info 改为品牌主色 —— 校园易物不再使用冷蓝色
  info: '#FF6B35',
  infoSoft: 'rgba(255, 107, 53, 0.12)',

  // 信用分等级
  creditHigh: '#07C160',
  creditMid: '#FFA500',
  creditLow: '#FF4D4F',

  // 商品成色
  conditionNew: '#07C160',
  // 9 成新改为橘色（与品牌一致）
  conditionLikeNew: '#FF6B35',
  conditionGood: '#FFA500',
  conditionFair: '#999999',
}

/* ================== 字号 ================== */
const fontSize = {
  xs: '22rpx',     /* 11px */
  sm: '26rpx',     /* 13px */
  base: '28rpx',   /* 14px */
  md: '30rpx',     /* 15px */
  lg: '32rpx',     /* 16px */
  xl: '36rpx',     /* 18px */
  xxl: '40rpx',    /* 20px */
  xxxl: '48rpx',   /* 24px */
  xxxxl: '56rpx',  /* 28px */
  xxxxxl: '64rpx', /* 32px */
}

/* ================== 字重 ================== */
const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
}

/* ================== 行高 ================== */
const lineHeight = {
  tight: 1.2,
  snug: 1.35,
  base: 1.5,
  loose: 1.7,
}

/* ================== 间距 ================== */
const space = {
  0: '0rpx',
  1: '8rpx',
  2: '16rpx',
  3: '24rpx',
  4: '32rpx',
  5: '40rpx',
  6: '48rpx',
  7: '56rpx',
  8: '64rpx',
  10: '80rpx',
  12: '96rpx',
  16: '128rpx',
  20: '160rpx',
}

/* ================== 圆角 ================== */
const radius = {
  xs: '6rpx',
  sm: '12rpx',
  base: '20rpx',
  md: '28rpx',
  lg: '36rpx',
  xl: '48rpx',
  xxl: '64rpx',
  xxxl: '80rpx',
  pill: '9999rpx',
  circle: '50%',
}

/* ================== 阴影 ================== */
const shadow = {
  none: 'none',
  xs: '0 1rpx 2rpx rgba(0, 0, 0, 0.04)',
  sm: '0 2rpx 8rpx rgba(0, 0, 0, 0.04), 0 1rpx 2rpx rgba(0, 0, 0, 0.06)',
  base: '0 4rpx 12rpx rgba(0, 0, 0, 0.06), 0 2rpx 4rpx rgba(0, 0, 0, 0.04)',
  md: '0 8rpx 24rpx rgba(0, 0, 0, 0.08), 0 2rpx 6rpx rgba(0, 0, 0, 0.04)',
  lg: '0 16rpx 32rpx rgba(0, 0, 0, 0.10), 0 4rpx 12rpx rgba(0, 0, 0, 0.06)',
  xl: '0 24rpx 48rpx rgba(0, 0, 0, 0.12), 0 8rpx 24rpx rgba(0, 0, 0, 0.06)',

  // 光感阴影
  primarySm: '0 4rpx 12rpx rgba(255, 107, 53, 0.18)',
  primaryMd: '0 8rpx 24rpx rgba(255, 107, 53, 0.24), 0 2rpx 6rpx rgba(255, 107, 53, 0.12)',
  primaryLg: '0 16rpx 32rpx rgba(255, 107, 53, 0.32), 0 4rpx 12rpx rgba(255, 107, 53, 0.16)',
}

/* ================== 动效（Spring 弹性 + Apple 标准 + MD3 物理） ================== */
const duration = {
  instant: 100,
  fast: 200,
  base: 300,
  slow: 450,
  extraSlow: 600,
}

const easing = {
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  in: 'cubic-bezier(0.7, 0, 0.84, 0)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  springBounce: 'cubic-bezier(0.5, 1.8, 0.5, 1)',
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
}

/* ================== 暖色系调色板 ================== */
const palette = {
  orange: {
    50: '#FFF4EE', 100: '#FFE4D4', 200: '#FFCBAA',
    300: '#FFAA7A', 400: '#FF8A5C', 500: '#F25C2A',
    600: '#D44417', 700: '#A8330F', 800: '#82270B', 900: '#5A1A07',
  },
  amber: {
    50: '#FFF8E8', 100: '#FFEDC4', 200: '#FFDD92',
    300: '#FFC75E', 400: '#FFAB38', 500: '#E88A1B',
    600: '#C57015', 700: '#8E4F0F', 800: '#5C3308',
  },
  coral: {
    50: '#FFEEE9', 100: '#FFD5C8', 200: '#FFB59A',
    300: '#FF8E68', 400: '#FF6B45', 500: '#E84B25',
    600: '#C03A18', 700: '#8E2B11', 800: '#5C1B0A',
  },
  cream: {
    50: '#FFFBF6', 100: '#FCF4EB', 200: '#F7E8D6', 300: '#EFD8B7',
  },
  warm: {
    50: '#FAF8F5', 100: '#F1ECE3', 200: '#E1D8C7', 300: '#C8BBA1',
    400: '#8E8270', 500: '#5C5040', 600: '#3D3528', 700: '#2A2418',
  },
  success: {
    50: '#E8F6ED', 100: '#C5E8D2', 300: '#6FCF8B',
    500: '#2F9E54', 600: '#1F7A40',
  },
  warning: {
    50: '#FFF6E5', 100: '#FFE4B5', 300: '#FFB84D',
    500: '#E89414', 600: '#B87408',
  },
  danger: {
    50: '#FFE8E8', 100: '#FFC4C4', 300: '#FF7676',
    500: '#DC3545', 600: '#B01C2C',
  },
  info: {
    50: '#E5F2FF', 100: '#B8DBFF', 300: '#6FB1FF',
    500: '#2F80ED', 600: '#1B62C7',
  },
}

/* ================== 渐变 ================== */
const gradient = {
  warm: 'linear-gradient(135deg, #FF8A5C 0%, #F25C2A 50%, #E84B25 100%)',
  warmSoft: 'linear-gradient(135deg, #FFB89A 0%, #FF8A5C 50%, #FF6B35 100%)',
  amber: 'linear-gradient(135deg, #FFB84D 0%, #E88A1B 100%)',
  coral: 'linear-gradient(135deg, #FF6B45 0%, #E84B25 100%)',
  cream: 'linear-gradient(180deg, #FFFBF6 0%, #FCF4EB 100%)',
  soft: 'linear-gradient(180deg, #FFF4EE 0%, #FFE4D4 100%)',
  page: 'linear-gradient(180deg, #FFFBF6 0%, #FFF4EE 100%)',
  glass: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.6) 100%)',
  shine: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.6) 50%, transparent 70%)',
}

/* ================== Z-Index ================== */
const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 500,
  modalBackdrop: 900,
  modal: 1000,
  popover: 1100,
  toast: 2000,
}

/* ================== 商品成色映射（业务常用） ================== */
const CONDITION_OPTIONS = [
  { value: 'new',       label: '全新',     color: color.conditionNew },
  { value: 'like_new',  label: '几乎全新', color: color.conditionLikeNew },
  { value: 'good',      label: '九成新',   color: color.conditionGood },
  { value: 'fair',      label: '八成新',   color: color.conditionFair },
]

/* ================== 信用分等级工具 ================== */
/**
 * 根据信用分获取对应的等级 / 颜色
 * @param {number} score 信用分（0-100）
 * @returns {{level: 'high'|'mid'|'low', color: string, label: string}}
 */
function getCreditLevel(score) {
  if (score >= 90) return { level: 'high', color: color.creditHigh, label: '极好' }
  if (score >= 60) return { level: 'mid',  color: color.creditMid,  label: '良好' }
  return { level: 'low', color: color.creditLow, label: '一般' }
}

/* ================== 订单状态机映射（业务常用） ================== */
const ORDER_STATUS_MAP = {
  requested: { label: '待确认', color: color.warning },
  confirmed: { label: '进行中', color: color.info },
  completed: { label: '已完成', color: color.success },
  cancelled: { label: '已取消', color: color.textTertiary },
}

/* ================== 工具函数 ================== */
/**
 * 格式化金额（¥ 符号 + 千分位 + 两位小数）
 * @param {number|string} n 金额
 * @returns {string} 形如 "¥1,234.50"
 */
function formatPrice(n) {
  const v = Number(n) || 0
  return '¥' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化金额（不带 ¥ 符号）
 * @param {number|string} n 金额
 * @returns {string} 形如 "1,234.50"
 */
function formatPriceRaw(n) {
  const v = Number(n) || 0
  return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 数字千分位（无小数）
 * @param {number|string} n 数字
 * @returns {string} 形如 "1,234"
 */
function formatNumber(n) {
  const v = Number(n) || 0
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 相对时间（如"3 分钟前"）
 * @param {string|Date} time 时间
 * @returns {string} 相对时间字符串
 */
function timeAgo(time) {
  if (!time) return ''
  const t = (typeof time === 'string') ? new Date(time.replace(/-/g, '/')) : time
  const diff = (Date.now() - t.getTime()) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400 / 7)} 周前`
  if (diff < 86400 * 365) return `${Math.floor(diff / 86400 / 30)} 个月前`
  return `${Math.floor(diff / 86400 / 365)} 年前`
}

/* ================== 导出 ================== */
module.exports = {
  color,
  fontSize,
  fontWeight,
  lineHeight,
  space,
  radius,
  shadow,
  duration,
  easing,
  palette,
  gradient,
  zIndex,
  CONDITION_OPTIONS,
  ORDER_STATUS_MAP,
  getCreditLevel,
  formatPrice,
  formatPriceRaw,
  formatNumber,
  timeAgo,
}
