/**
 * 订单模块 API
 * 对应后端路由：/api/orders/
 * 状态机：requested -> confirmed -> shipping -> completed / cancelled
 */
import request from '@/utils/request'
import type { User } from './user'

/** 订单状态 */
export type OrderStatus =
  | 'requested'   // 买家提交"想要"，待卖家确认
  | 'confirmed'   // 卖家已确认
  | 'shipping'    // 交易中（自取中/已发货）
  | 'completed'   // 已完成
  | 'cancelled'   // 已取消

/** 配送方式 */
export type ShippingMethod = 'pickup' | 'express'

/** 订单商品摘要 */
export interface OrderProduct {
  id: number
  title: string
  image_url: string
  price: number
}

/** 订单实体 */
export interface Order {
  id: number
  /** 订单编号 */
  order_no?: string
  product: OrderProduct
  buyer: Pick<User, 'id' | 'username' | 'nickname' | 'avatar' | 'credit_score' | 'school'>
  seller: Pick<User, 'id' | 'username' | 'nickname' | 'avatar' | 'credit_score' | 'school'>
  status: OrderStatus
  shipping_method: ShippingMethod
  price: number
  /** 自取地点或快递地址 */
  pickup_location: string
  /** 约定时间 */
  pickup_time: string
  /** 买家留言 */
  buyer_message?: string
  /** 卖家备注 */
  seller_note?: string
  created_at: string
  confirmed_at?: string
  completed_at?: string
  cancelled_at?: string
}

/** 订单查询参数 */
export interface OrdersQuery {
  status?: OrderStatus | ''
  role?: 'buyer' | 'seller'
  page?: number
  page_size?: number
}

/** 通用分页响应 */
export interface Paginated<T> {
  count: number
  next?: string | null
  previous?: string | null
  results: T[]
}

/**
 * 获取订单列表
 * @param params 状态过滤 + 身份（买家/卖家）
 */
export function fetchOrders(params: OrdersQuery = {}): Promise<Paginated<Order>> {
  return request.get('/orders/', { params })
}

/**
 * 获取订单详情
 * @param id 订单 ID
 */
export function fetchOrder(id: number): Promise<Order> {
  return request.get(`/orders/${id}/`)
}

/**
 * 卖家确认订单
 * @param id 订单 ID
 * @param payload 配送方式 + 自取地点 + 时间
 */
export function confirmOrder(
  id: number,
  payload?: { shipping_method?: ShippingMethod; pickup_location?: string; pickup_time?: string }
): Promise<Order> {
  return request.post(`/orders/${id}/confirm/`, payload || {})
}

/**
 * 卖家/买家标记完成
 */
export function completeOrder(id: number): Promise<Order> {
  return request.post(`/orders/${id}/complete/`)
}

/**
 * 取消订单
 */
export function cancelOrder(id: number, reason?: string): Promise<Order> {
  return request.post(`/orders/${id}/cancel/`, { reason })
}
