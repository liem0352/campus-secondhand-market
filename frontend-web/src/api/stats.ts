/**
 * 卖家数据看板 API
 * 对应后端：/api/stats/seller/
 */
import request from '@/utils/request'

/** 概览数据 */
export interface SellerOverview {
  /** 在售商品数 */
  on_sale_count: number
  /** 已售出数 */
  sold_count: number
  /** 待处理订单数 */
  pending_order_count: number
  /** 信用分 */
  credit_score: number
  /** 用户名（管理员视角） */
  username?: string
}

/** 销售趋势（按天） */
export interface SalesTrendPoint {
  date: string
  amount: number
  count: number
}

/**
 * 分类收入分布
 * 后端实际返回 {name, count, percent}，为兼容旧版统计接口也允许 value 字段。
 */
export interface CategoryDistribution {
  name: string
  /** 商品数量（后端字段） */
  count: number
  /** 占比百分比 */
  percent?: number
  /** 兼容旧字段 */
  value?: number
}

/**
 * 价格区间分布
 * 后端返回 {label, count}；旧版字段名为 range，此处也兼容。
 */
export interface PriceRangeBucket {
  /** 区间中文标签（后端字段） */
  label: string
  count: number
  /** 兼容旧字段 */
  range?: string
}

/**
 * 获取校园易物 H5 端工作台概览
 */
export function fetchSellerOverview(): Promise<SellerOverview> {
  return request.get('/stats/seller/overview/')
}

/**
 * 获取销售趋势
 * @param params.days 时间窗口（7/30/90）
 */
export function fetchSalesTrend(params: { days?: number } = {}): Promise<{ trend: SalesTrendPoint[] }> {
  return request.get('/stats/seller/trend/', { params })
}

/**
 * 获取分类收入分布
 */
export function fetchCategoryDistribution(): Promise<{ distribution: CategoryDistribution[] }> {
  return request.get('/stats/seller/category-distribution/')
}

/**
 * 获取价格区间分布
 */
export function fetchPriceRange(): Promise<{ buckets: PriceRangeBucket[] }> {
  return request.get('/stats/seller/price-range/')
}
