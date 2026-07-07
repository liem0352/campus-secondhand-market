/**
 * utils/format.js
 * --------------------------------------------------------------------
 * 通用格式化工具
 * - 价格、相对时间、距离、信用分、文案长度限制
 * --------------------------------------------------------------------
 */

/**
 * 格式化金额（保留 2 位小数 + ¥）
 * @param {number|string} n
 * @param {boolean} withSymbol - 是否带 ¥
 */
function money(n, withSymbol = true) {
  const v = Number(n || 0).toFixed(2)
  return withSymbol ? `¥${v}` : v
}

/**
 * 简化价格（>=10000 显示 X.X 万）
 * @param {number} n
 */
function shortMoney(n) {
  const v = Number(n || 0)
  if (v >= 10000) return (v / 10000).toFixed(1) + 'w'
  if (v >= 1000) return (v / 1000).toFixed(1) + 'k'
  return String(v)
}

/**
 * 相对时间
 * @param {string|number|Date} date
 * @returns {string}
 */
function relativeTime(date) {
  if (!date) return ''
  const t = date instanceof Date ? date : new Date(date)
  if (isNaN(t.getTime())) return ''
  const diff = Date.now() - t.getTime()
  if (diff < 0) {
    // 未来时间
    const abs = Math.abs(diff)
    const m = Math.floor(abs / 60000)
    if (m < 60) return `${m} 分钟后`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} 小时后`
    return formatDate(t)
  }
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return '刚刚'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} 天前`
  if (day < 30) return `${Math.floor(day / 7)} 周前`
  return formatDate(t)
}

/**
 * 格式化日期 YYYY-MM-DD
 */
function formatDate(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * 格式化日期时间 YYYY-MM-DD HH:mm
 */
function formatDateTime(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * 截断文本，超出部分用 ... 代替
 * @param {string} str
 * @param {number} max
 */
function truncate(str, max = 20) {
  if (!str) return ''
  if (String(str).length <= max) return str
  return String(str).slice(0, max) + '...'
}

/**
 * 信用分等级
 * @param {number} score
 * @returns {string} high / mid / low
 */
function creditLevel(score) {
  const s = Number(score || 0)
  if (s >= 90) return 'high'
  if (s >= 60) return 'mid'
  return 'low'
}

/**
 * 信用分等级文案
 */
function creditLabel(score) {
  const lv = creditLevel(score)
  return { high: '信用极好', mid: '信用良好', low: '信用一般' }[lv] || '信用未知'
}

/**
 * 成色 -> 中文
 */
function conditionText(c) {
  const map = { new: '全新', like_new: '几乎全新', good: '九成新', fair: '一般' }
  return map[c] || c || '--'
}

/**
 * 订单状态 -> 中文
 */
function orderStatusText(s) {
  const map = {
    pending: '待付款',
    paid: '待发货',
    shipping: '待收货',
    completed: '已完成',
    cancelled: '已取消',
    refunding: '退款中',
    refunded: '已退款',
  }
  return map[s] || s || '--'
}

/**
 * 距离米数 -> 友好文本
 */
function distanceText(m) {
  const v = Number(m || 0)
  if (v < 1000) return `${v} m`
  return `${(v / 1000).toFixed(1)} km`
}

/**
 * 手机号脱敏
 */
function maskPhone(phone) {
  if (!phone) return ''
  const s = String(phone)
  if (s.length !== 11) return s
  return s.slice(0, 3) + '****' + s.slice(7)
}

/**
 * 数字千分位
 */
function thousands(n) {
  const v = Number(n || 0)
  return v.toLocaleString('zh-CN')
}

module.exports = {
  money,
  shortMoney,
  relativeTime,
  formatDate,
  formatDateTime,
  truncate,
  creditLevel,
  creditLabel,
  conditionText,
  orderStatusText,
  distanceText,
  maskPhone,
  thousands,
}
