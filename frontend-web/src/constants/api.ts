/**
 * API 端点集中管理
 * 统一管理所有 HTTP 路径,业务代码不再出现散落字符串
 * 注意：所有端点都相对于 API_BASE,不带前导斜杠
 */

/** 后端鉴权相关端点 */
export const AUTH_ENDPOINTS = {
  LOGIN: 'auth/login/',
  LOGOUT: 'auth/logout/',
  REFRESH: 'auth/refresh/',
  REGISTER: 'auth/register/',
  ME: 'auth/me/',
} as const

/** 用户相关端点 */
export const USER_ENDPOINTS = {
  PROFILE: 'users/me/',
  UPDATE_PROFILE: 'users/me/',
  CHANGE_PASSWORD: 'users/me/password/',
  UPLOAD_AVATAR: 'users/me/avatar/',
  USERS: 'users/',
  USER_DETAIL: (id: number | string) => `users/${id}/`,
} as const

/** 商品相关端点 */
export const PRODUCT_ENDPOINTS = {
  LIST: 'products/',
  DETAIL: (id: number | string) => `products/${id}/`,
  CREATE: 'products/',
  UPDATE: (id: number | string) => `products/${id}/`,
  DELETE: (id: number | string) => `products/${id}/`,
  MY_PRODUCTS: 'products/mine/',
  ON_SHELF: (id: number | string) => `products/${id}/on-shelf/`,
  OFF_SHELF: (id: number | string) => `products/${id}/off-shelf/`,
  BULK_OFF_SHELF: 'products/bulk-off-shelf/',
  FAVORITES: 'favorites/',
  CATEGORIES: 'categories/',
  CATEGORY_TREE: 'categories/tree/',
  UPLOAD: 'upload/',
} as const

/** 订单相关端点 */
export const ORDER_ENDPOINTS = {
  LIST: 'orders/',
  DETAIL: (id: number | string) => `orders/${id}/`,
  CREATE: 'orders/',
  CANCEL: (id: number | string) => `orders/${id}/cancel/`,
  CONFIRM: (id: number | string) => `orders/${id}/confirm/`,
  COMPLETE: (id: number | string) => `orders/${id}/complete/`,
  SHIP: (id: number | string) => `orders/${id}/ship/`,
  BUYER_ORDERS: 'orders/?role=buyer',
  SELLER_ORDERS: 'orders/?role=seller',
} as const

/** 统计相关端点 */
export const STATS_ENDPOINTS = {
  SELLER_OVERVIEW: 'stats/seller/',
  SELLER_TREND: 'stats/seller/trend/',
  SELLER_CATEGORY: 'stats/seller/category/',
  SELLER_FUNNEL: 'stats/seller/funnel/',
  SELLER_RECENT: 'stats/seller/recent/',
  DASHBOARD: 'stats/dashboard/',
} as const

/** 消息相关端点 */
export const MESSAGE_ENDPOINTS = {
  CONVERSATIONS: 'messages/conversations/',
  MESSAGES: (id: number | string) => `messages/conversations/${id}/`,
  SEND: (id: number | string) => `messages/conversations/${id}/send/`,
  UNREAD: 'messages/unread/',
} as const

/** 评价/举报端点 */
export const REVIEW_ENDPOINTS = {
  PRODUCT_REVIEWS: (productId: number | string) => `products/${productId}/reviews/`,
  CREATE_REVIEW: 'reviews/',
  REPORT: 'reports/',
  REPORT_ACTIONS: 'reports/actions/',
} as const

/** AI 智能服务端点 */
export const AI_ENDPOINTS = {
  HEALTH: 'ai/health/',
  MODERATE: 'ai/moderate/',
  PRICE_SUGGEST: 'ai/price-suggest/',
  POLISH: 'ai/polish/',
  NEGOTIATE: 'ai/negotiate/',
  EXTRACT_KEYWORDS: 'ai/extract-keywords/',
  CUSTOMER_SERVICE: 'ai/customer-service/',
  PUBLISH_ASSIST: 'ai/publish-assist/',
} as const

/** 端点拼接辅助:把相对路径拼到 baseURL */
export function joinUrl(base: string, path: string): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  const p = path.startsWith('/') ? path.slice(1) : path
  return `${b}/${p}`
}
