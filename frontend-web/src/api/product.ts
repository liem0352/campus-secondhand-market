/**
 * 商品模块 API
 * 对应后端路由:/api/products/、/api/categories/
 */
import request from '@/utils/request'
import { PRODUCT_ENDPOINTS } from '@/constants'
import type { User } from './user'

/** 商品成色 */
export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair'

/** 商品状态机 */
export type ProductStatus =
  | 'draft'      // 草稿
  | 'pending'    // 待审核
  | 'on_sale'    // 在售
  | 'sold'       // 已售
  | 'off_shelf'  // 已下架

/** 商品图片 */
export interface ProductImage {
  id: number
  image_url: string
  sort_order?: number
}

/** 商品分类（树） */
export interface Category {
  id: number
  name: string
  icon?: string
  parent?: number | null
  sort_order?: number
  /** 子分类（仅树形接口返回时存在） */
  children?: Category[]
}

/** 商品实体 */
export interface Product {
  id: number
  title: string
  description: string
  price: number
  /** 原价（划线价） */
  original_price?: number
  /** 成色 */
  condition: ProductCondition
  /** 状态 */
  status: ProductStatus
  /** 所在学校 */
  school: string
  /** 分类 */
  category?: { id: number; name: string }
  /**
   * 封面图 URL（列表接口由后端 ProductBriefSerializer 计算自首张图片）
   * - 列表/搜索：一定有（可能为空串）
   * - 详情：一定有（与 images[0].image_url 一致）
   */
  cover?: string
  /**
   * 商品图片列表（仅详情接口 ProductDetailSerializer 返回）
   * 列表/搜索时通常为空数组，需要封面请用 cover
   */
  images?: ProductImage[]
  /** 浏览数 */
  view_count: number
  /** 收藏数 */
  favorite_count: number
  /** 发布时间 */
  created_at: string
  /** 卖家摘要 */
  seller: Pick<User, 'id' | 'username' | 'nickname' | 'avatar' | 'credit_score' | 'school'>
}

/**
 * 统一获取商品封面图 URL
 * - 优先用后端算好的 `cover`
 * - 详情场景下回退到 images[0].image_url
 * - 都没有则返回空串，让 UI 走占位
 */
export function getProductCover(p: Partial<Product> | null | undefined): string {
  if (!p) return ''
  if (p.cover) return p.cover
  const first = p.images?.[0]?.image_url
  return first || ''
}

/** 商品列表通用响应（DRF 风格） */
export interface Paginated<T> {
  count: number
  next?: string | null
  previous?: string | null
  results: T[]
}

/** 商品创建/编辑入参 */
export interface ProductPayload {
  title: string
  description: string
  price: number
  original_price?: number
  condition: ProductCondition
  status?: ProductStatus
  category_id: number
  image_ids?: number[]
  school?: string
}

/** 我的商品查询参数 */
export interface MyProductsQuery {
  status?: ProductStatus | ''
  category_id?: number
  search?: string
  page?: number
  page_size?: number
}

/**
 * 获取"我的商品"列表
 * @param params 状态/分类/搜索/分页
 */
export function fetchMyProducts(params: MyProductsQuery = {}): Promise<Paginated<Product>> {
  return request.get(PRODUCT_ENDPOINTS.MY_PRODUCTS, { params })
}

/**
 * 获取商品详情
 * @param id 商品 ID
 */
export function fetchProduct(id: number): Promise<Product> {
  return request.get(PRODUCT_ENDPOINTS.DETAIL(id))
}

/**
 * 创建商品
 * @param data 商品数据
 */
export function createProduct(data: ProductPayload): Promise<Product> {
  return request.post(PRODUCT_ENDPOINTS.CREATE, data)
}

/**
 * 更新商品
 * @param id 商品 ID
 * @param data 部分字段
 */
export function updateProduct(id: number, data: Partial<ProductPayload>): Promise<Product> {
  return request.patch(PRODUCT_ENDPOINTS.UPDATE(id), data)
}

/**
 * 删除商品
 * @param id 商品 ID
 */
export function deleteProduct(id: number): Promise<void> {
  return request.delete(PRODUCT_ENDPOINTS.DELETE(id))
}

/**
 * 商品上架（从 off_shelf -> on_sale）
 */
export function onShelf(id: number): Promise<Product> {
  return request.post(PRODUCT_ENDPOINTS.ON_SHELF(id))
}

/**
 * 商品下架（on_sale -> off_shelf）
 */
export function offShelf(id: number): Promise<Product> {
  return request.post(PRODUCT_ENDPOINTS.OFF_SHELF(id))
}

/**
 * 批量下架商品
 */
export function bulkOffShelf(ids: number[]): Promise<void> {
  return request.post(PRODUCT_ENDPOINTS.BULK_OFF_SHELF, { ids })
}

/**
 * 通用商品图片上传
 * @param file 图片文件
 */
export function uploadProductImage(file: File): Promise<{ id: number; url: string }> {
  const form = new FormData()
  form.append('file', file)
  return request.post(PRODUCT_ENDPOINTS.UPLOAD, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  })
}

/* ========================================
   分类模块
   ======================================== */

/**
 * 获取分类列表
 * @param params 可选 parent 仅返回二级分类
 */
export function fetchCategories(params: { parent?: number | null } = {}): Promise<Paginated<Category> | Category[]> {
  return request.get(PRODUCT_ENDPOINTS.CATEGORIES, { params })
}

/**
 * 获取分类树（一级 + 二级）
 */
export function fetchCategoryTree(): Promise<Category[]> {
  return request.get(PRODUCT_ENDPOINTS.CATEGORY_TREE)
}
