/**
 * utils/resolve-url.js
 * --------------------------------------------------------------------
 * 统一处理图片 URL 的"绝对化"工具
 *
 * 为什么需要：
 *  - 微信模拟器在「不校验合法域名」模式下，对 <image src="/media/..."> 这种
 *    **相对路径**会**误当成 miniprogram 本地文件**去 assets/ 目录找，
 *    找不到就报 "Failed to load local image resource ... 500"。
 *  - 真机/预览期 dev tool 会自动拼上 host，所以同一段代码真机 OK 模拟器 NG。
 *  - 后端 ProductBriefSerializer.get_cover() 虽然会用 request.build_absolute_uri
 *    拼成绝对 URL，但**若字段相对路径**（如 /media/...）就要前端再兜底。
 *  - 集中处理一处，三端（H5/小程序/后台）行为一致。
 *
 * 模拟器图片降级：
 *  - 模拟器无法加载 8000 端口（Django 直接端口）的图片，但真机可以。
 *  - 本模块提供 simulateFallback() 方法，当检测到图片 URL 指向 8000 端口时，
 *    自动映射到本地 /assets/products/ 目录下的占位图。
 *
 * 用法：
 *   const resolve = require('../../utils/resolve-url.js')
 *   const coverUrl = resolve.abs(p.cover || p.images?.[0]?.image_url)
 *   <image src="{{coverUrl || '/assets/icons/empty.png'}}" />
 */

const FALLBACK = '/assets/icons/empty.png'

/**
 * 本地占位产品图片池（当模拟器无法加载后端 8000 端口图片时降级使用）
 * 这些图片已下载到 miniprogram/assets/products/ 目录，模拟器可直接访问。
 */
const MOCK_PRODUCT_IMAGES = [
  '/assets/products/p1_1.jpg',
  '/assets/products/p2_2.jpg',
  '/assets/products/p3_3.jpg',
  '/assets/products/p4_4.jpg',
  '/assets/products/p5_7.jpg',
  '/assets/products/p6_10.jpg',
  '/assets/products/p7_11.jpg',
  '/assets/products/p8_12.jpg',
  '/assets/products/p9_13.jpg',
  '/assets/products/p10_16.jpg',
  '/assets/products/p11_17.jpg',
  '/assets/products/p12_20.jpg',
  '/assets/products/p13_21.jpg',
  '/assets/products/p14_23.jpg',
  '/assets/products/p15_24.jpg',
  '/assets/products/p16_26.jpg',
  '/assets/products/p17_27.jpg',
  '/assets/products/p18_29.jpg',
  '/assets/products/p19_31.jpg',
  '/assets/products/p20_33.jpg',
  '/assets/products/p21_34.jpg',
  '/assets/products/p22_37.jpg',
  '/assets/products/p23_38.jpg',
  '/assets/products/p24_41.jpg',
  '/assets/products/p25_42.jpg',
  '/assets/products/p26_43.jpg',
  '/assets/products/p27_44.jpg',
  '/assets/products/p28_45.jpg',
  '/assets/products/p29_46.jpg',
  '/assets/products/p21_35.jpg',
]

/**
 * 伪随机数生成器（基于字符串种子，保证同一 URL 始终映射到同一张占位图）
 * @param {string} seed - 种子字符串
 * @returns {number} 0-1 之间的伪随机数
 */
function seededRandom(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转为 32 位整数
  }
  return Math.abs(hash % 10000) / 10000
}

/**
 * 检测图片 URL 是否需要降级到本地占位图
 * 当 URL 指向 8000 端口（Django 直接端口）且当前环境是模拟器时，返回本地占位图路径
 * @param {string} url - 后端返回的图片 URL
 * @returns {string} 需要降级则返回本地占位图路径，否则返回原 URL
 */
function simulateFallback(url) {
  if (!url) return FALLBACK
  if (typeof url !== 'string') url = String(url)
  if (!url.trim()) return FALLBACK

  // 检测是否指向 8000 端口（Django 开发服务器）
  // 模拟器无法直接加载 http://...:8000/media/... 类型的 URL
  // 匹配 :8000 后跟 / 或 URL 结束的情况，如：
  //   http://192.168.31.103:8000/media/p.jpg  -> 匹配
  //   http://192.168.31.103:8000              -> 匹配
  const isDjangoPort = /:8000(\/|$)/i.test(url)

  // 检测是否是相对路径（如 /media/xxx.jpg），在模拟器中也会被误判为本地文件
  const isRelativePath = /^\/media\//i.test(url)

  if (!isDjangoPort && !isRelativePath) {
    // 绝对 URL 且非 8000 端口，直接返回
    return url
  }

  // 需要降级：使用 URL 作为种子，确定性地选择一张本地占位图
  const idx = Math.floor(seededRandom(url) * MOCK_PRODUCT_IMAGES.length)
  return MOCK_PRODUCT_IMAGES[idx]
}

function getApiOrigin() {
  try {
    const app = getApp && getApp()
    const base = (app && app.globalData && app.globalData.apiBase) || ''
    return base.replace(/\/api\/?$/, '')  // 去 /api 尾巴，留下 origin
  } catch (e) {
    return ''
  }
}

/**
 * 把 raw 强制重写到 apiBase 的 origin 上
 *  - raw = "http://192.168.31.103:8000/media/p.jpg"
 *  - apiBase origin = "https://192.168.31.103:8443"
 *  - return: "https://192.168.31.103:8443/media/p.jpg"
 *
 * 重要：因为 HTTPS 代理在 8443，8000 上**没有 HTTPS**，所以不能只换协议。
 * 必须把整个 origin 都替换成代理的 origin，否则 https://...:8000 会连不上。
 */
function rewriteToApiOrigin(raw) {
  const origin = getApiOrigin()
  if (!origin) return raw
  // 提取 raw 的 path+query 部分（保留）
  const m = raw.match(/^https?:\/\/[^/?#]+(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i)
  if (!m) return raw
  const path = m[1] || '/'
  const query = m[2] || ''
  const hash = m[3] || ''
  return origin + path + query + hash
}

/**
 * 把任意形态的图 URL 拼成绝对 URL
 * @param {string} raw 后端给的图 URL（可能为 https://, http://, /media/..., 纯文件名）
 * @returns {string} 绝对 URL；空值返回空串
 */
function abs(raw) {
  if (!raw) return ''
  if (typeof raw !== 'string') raw = String(raw)
  if (!raw.trim()) return ''

  // 本地资源路径（/assets/...）不需要改写，直接返回
  // 这些是 simulateFallback 降级后的本地占位图
  if (raw.startsWith('/assets/')) {
    return raw
  }

  const origin = getApiOrigin()

  // 1. 已经是绝对 URL
  if (/^https?:\/\//i.test(raw)) {
    // 若 origin 是 https://192.168.31.103:8443（代理），后端给的可能是
    // http://192.168.31.103:8000（直接 Django），整段 origin 都要重写，
    // 不能只换协议（8000 上没 HTTPS）
    if (origin && origin.startsWith('https://')) {
      return rewriteToApiOrigin(raw)
    }
    // 其它场景：只换协议
    if (raw.startsWith('http://') && origin && origin.startsWith('https://')) {
      return 'https://' + raw.slice(7)
    }
    return raw
  }

  // 2. 相对路径：拼上 origin
  if (!origin) return raw  // 兜底
  if (raw.startsWith('/')) return origin + raw
  return origin + '/' + raw
}

/**
 * 一站式：给 product 对象，取其封面图绝对 URL
 * - 优先 product.cover
 * - 兜底 product.images[0].image_url / .url
 * - 最终失败返回 FALLBACK 本地占位
 */
function productCover(p) {
  if (!p) return FALLBACK
  const raw = p.cover
    || (Array.isArray(p.images) && p.images[0]
          && (p.images[0].image_url || p.images[0].url))
    || ''
  return abs(raw) || FALLBACK
}

/**
 * 给任意商品对象，降级其封面图 URL 到本地占位图
 * 当图片 URL 指向 8000 端口或为 /media/ 相对路径时，替换为本地占位图
 * @param {Object} product - 商品对象
 * @returns {Object} 处理后的商品对象（不修改原对象）
 */
function fallbackProductImage(product) {
  if (!product) return product
  const result = { ...product }

  // 降级 cover 字段
  if (result.cover) {
    const fallback = simulateFallback(result.cover)
    if (fallback !== result.cover) {
      result.cover = fallback
    }
  }

  // 降级 images 数组中的 image_url
  if (Array.isArray(result.images)) {
    result.images = result.images.map((img) => {
      if (!img) return img
      const fallbackImg = { ...img }
      if (fallbackImg.image_url) {
        const fallback = simulateFallback(fallbackImg.image_url)
        if (fallback !== fallbackImg.image_url) {
          fallbackImg.image_url = fallback
        }
      }
      if (fallbackImg.url) {
        const fallback = simulateFallback(fallbackImg.url)
        if (fallback !== fallbackImg.url) {
          fallbackImg.url = fallback
        }
      }
      return fallbackImg
    })
  }

  return result
}

/**
 * 批量降级商品列表中的图片 URL
 * @param {Array} products - 商品列表
 * @returns {Array} 处理后的商品列表
 */
function fallbackProducts(products) {
  if (!Array.isArray(products)) return products
  return products.map(fallbackProductImage)
}

module.exports = { abs, productCover, FALLBACK, simulateFallback, fallbackProductImage, fallbackProducts, MOCK_PRODUCT_IMAGES }
