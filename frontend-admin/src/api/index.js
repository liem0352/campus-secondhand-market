/**
 * 平台管理后台 · 统一 API 入口
 * 同步后端路由（参考 spec.md · Task 1.5/1.6）
 * - 用户管理：/admin/users/
 * - 商品审核：/admin/products/audit/
 * - 分类管理：/admin/categories/
 * - 举报处理：/admin/reports/
 * - 仪表盘：   /admin/dashboard/
 * - 审计日志：/admin/audit-logs/
 * - AI 监控： /admin/ai/（自定义）
 */
import request from './request'

/* ========================================
   用户管理
   ======================================== */

/**
 * 获取平台用户列表
 * @param {Object} params 查询参数（keyword/school/is_active/page/page_size）
 */
export function fetchAdminUsers(params = {}) {
  return request({ url: '/admin/users/', method: 'GET', params })
}

/**
 * 封禁用户
 * @param {number|string} id 用户 ID
 * @param {string} [reason] 封禁理由
 */
export function banUser(id, reason = '') {
  // 后端 UserBanView 期望的字段为 ban_reason（与审计日志保持一致）
  return request({ url: `/admin/users/${id}/ban/`, method: 'POST', data: { ban_reason: reason } })
}

/**
 * 解封用户
 * @param {number|string} id 用户 ID
 */
export function unbanUser(id) {
  return request({ url: `/admin/users/${id}/unban/`, method: 'POST' })
}

/**
 * 调整用户信用分
 * @param {number|string} id 用户 ID
 * @param {number} delta 增减量（正数加分，负数减分）
 * @param {string} reason 调整理由
 */
export function adjustUserCredit(id, delta, reason) {
  return request({ url: `/admin/users/${id}/adjust-credit/`, method: 'POST', data: { delta, reason } })
}

/* ========================================
   商品审核
   ======================================== */

/**
 * 获取商品审核列表
 * @param {Object} params 查询参数（status/keyword/page/page_size）
 */
export function fetchAuditProducts(params = {}) {
  return request({ url: '/admin/products/audit/', method: 'GET', params })
}

/**
 * 审核通过商品
 * @param {number|string} id 商品 ID
 * @param {string} [remark] 备注
 */
export function approveProduct(id, remark = '') {
  return request({ url: `/admin/products/${id}/approve/`, method: 'POST', data: { remark } })
}

/**
 * 审核驳回商品
 * @param {number|string} id 商品 ID
 * @param {string} remark 驳回理由（必填）
 */
export function rejectProduct(id, remark) {
  return request({ url: `/admin/products/${id}/reject/`, method: 'POST', data: { remark } })
}

/**
 * 获取商品审核各状态数量
 * 后端兜底：若 /count/ 不存在，前端可临时在 AuditProducts 内并发查询各 status
 * @param {Object} params { status: 'pending' | 'approved' | 'rejected' }
 */
export function fetchAuditProductCount(params = {}) {
  return request({ url: '/admin/products/audit/count/', method: 'GET', params })
}

/* ========================================
   分类管理
   ======================================== */

/**
 * 获取全部分类（树形）
 */
export function fetchAdminCategories() {
  return request({ url: '/admin/categories/', method: 'GET' })
}

/**
 * 新建分类
 * @param {Object} data { name, parent, sort_order, icon }
 */
export function createCategory(data) {
  return request({ url: '/admin/categories/', method: 'POST', data })
}

/**
 * 更新分类
 * @param {number|string} id 分类 ID
 * @param {Object} data 待更新字段
 */
export function updateCategory(id, data) {
  return request({ url: `/admin/categories/${id}/`, method: 'PUT', data })
}

/**
 * 删除分类
 * @param {number|string} id 分类 ID
 */
export function deleteCategory(id) {
  return request({ url: `/admin/categories/${id}/`, method: 'DELETE' })
}

/* ========================================
   举报处理
   ======================================== */

/**
 * 获取举报列表
 * @param {Object} params 查询参数（status/keyword/page/page_size）
 */
export function fetchReports(params = {}) {
  return request({ url: '/admin/reports/', method: 'GET', params })
}

/**
 * 处理举报
 * @param {number|string} id 举报 ID
 * @param {string} action 处理动作（warn 警告 / takedown 下架 / ban 封禁）
 * @param {string} remark 备注
 */
export function handleReport(id, action, remark = '') {
  return request({ url: `/admin/reports/${id}/handle/`, method: 'POST', data: { action, remark } })
}

/**
 * 获取举报各状态数量
 * @param {Object} params { status: 'pending' | 'handled' | 'dismissed' }
 */
export function fetchReportsCount(params = {}) {
  return request({ url: '/admin/reports/count/', method: 'GET', params })
}

/* ========================================
   仪表盘
   ======================================== */

/**
 * 获取平台仪表盘聚合数据
 */
export function fetchAdminDashboard() {
  return request({ url: '/admin/dashboard/', method: 'GET' })
}

/**
 * 获取用户增长趋势（最近 30 天）
 * @param {Object} [params] { days = 30 }
 */
export function fetchUserTrend(params = { days: 30 }) {
  return request({ url: '/admin/dashboard/trend/', method: 'GET', params })
}

/**
 * 获取商品按分类的分布
 */
export function fetchCategoryDistribution() {
  return request({ url: '/admin/dashboard/category-distribution/', method: 'GET' })
}

/* ========================================
   审计日志
   ======================================== */

/**
 * 获取审计日志
 * @param {Object} params 查询参数（operator/action_type/start_date/end_date/page/page_size）
 */
export function fetchAuditLogs(params = {}) {
  return request({ url: '/admin/audit-logs/', method: 'GET', params })
}

/* ========================================
   AI 监控
   ======================================== */

/**
 * 获取 AI 配置
 */
export function fetchAiConfig() {
  return request({ url: '/admin/ai/config/', method: 'GET' })
}

/**
 * 更新 AI 配置
 * @param {Object} data { enabled, api_key, model, base_url }
 */
export function updateAiConfig(data) {
  return request({ url: '/admin/ai/config/', method: 'PUT', data })
}

/**
 * 测试 AI 连接
 */
export function testAiConnection() {
  return request({ url: '/admin/ai/health/', method: 'POST' })
}

/* ========================================
   兼容旧字段（保留以避免破坏现有调用）
   ======================================== */
export const getDashboard = fetchAdminDashboard
export const login = (data) => request.post('/auth/login/', data)
export const getMe = () => request.get('/users/me/')
