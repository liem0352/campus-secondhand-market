/**
 * 业务常量集中管理
 * 包含分页、超时、限制、状态等可配置项,避免硬编码散落
 */

/** 全局通用分页 */
export const PAGE_SIZE_DEFAULT = 20
export const PAGE_SIZE_SMALL = 10
export const PAGE_SIZE_LARGE = 50

/** 商品状态枚举(后端值) */
export const PRODUCT_STATUS = {
  ON_SALE: 'on_sale',
  PENDING: 'pending',
  SOLD: 'sold',
  OFF_SHELF: 'off_shelf',
  DRAFT: 'draft',
} as const
export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS]

/** 商品状态中文映射 */
export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  on_sale: '在售',
  pending: '待审核',
  sold: '已售',
  off_shelf: '已下架',
  draft: '草稿',
}

/** 订单状态枚举 */
export const ORDER_STATUS = {
  REQUESTED: 'requested',
  CONFIRMED: 'confirmed',
  SHIPPING: 'shipping',
  PICKING: 'picking',
  COMPLETED: 'completed',
  REVIEWED: 'reviewed',
  CANCELLED: 'cancelled',
} as const
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

/** 订单状态中文映射 */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  requested: '待确认',
  confirmed: '已确认',
  shipping: '运输中',
  picking: '待取件',
  completed: '已完成',
  reviewed: '已评价',
  cancelled: '已取消',
}

/** 商品成色枚举(1-10) */
export const PRODUCT_CONDITION_OPTIONS = [
  { value: 10, label: '全新' },
  { value: 9, label: '9 成新' },
  { value: 8, label: '8 成新' },
  { value: 7, label: '7 成新' },
  { value: 6, label: '6 成新' },
  { value: 5, label: '5 成新及以下' },
] as const

/** 信用分等级阈值 */
export const CREDIT_LEVEL = {
  HIGH_THRESHOLD: 90,
  MID_THRESHOLD: 70,
} as const

/** 角色枚举(前端展示) */
export const USER_ROLE = {
  ADMIN: 'admin',
  BUYER: 'buyer',
  SELLER: 'seller',
  C_USER: 'c_user',
} as const
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]

/** 角色中文 */
export const USER_ROLE_LABEL: Record<UserRole, string> = {
  admin: '管理员',
  buyer: '买家',
  seller: '卖家',
  c_user: 'C 端用户',
}

/** 商品描述最大长度 */
export const PRODUCT_DESC_MAX_LENGTH = 500
export const PRODUCT_TITLE_MAX_LENGTH = 60
export const PRODUCT_PRICE_MIN = 0.01
export const PRODUCT_PRICE_MAX = 999999

/** 私信单条最大长度 */
export const MESSAGE_MAX_LENGTH = 500

/** 评价最大长度 */
export const REVIEW_MAX_LENGTH = 300

/** 头像上传允许的扩展名 */
export const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif']

/** 通用正负面标签(用于快速反馈) */
export const POSITIVE_WORDS = ['完成', '成功', '已', '好的']
export const NEGATIVE_WORDS = ['失败', '错误', '未', '拒绝', '不允许']
