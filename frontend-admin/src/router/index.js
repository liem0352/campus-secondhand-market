/**
 * 平台管理后台 · 路由
 * - /login           公开
 * - /                主布局
 * - /dashboard       仪表盘
 * - /users           用户管理
 * - /audit-products  商品审核
 * - /categories      分类管理
 * - /reports         举报处理
 * - /audit-logs      审计日志
 * - /ai-config       AI 配置
 * - /403, /404       错误页
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  // 登录页（公开）
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { public: true, title: '管理员登录' } },

  // 主布局（受保护）
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '仪表盘' } },
      { path: 'users', name: 'Users', component: () => import('@/views/Users.vue'), meta: { title: '用户管理' } },
      { path: 'audit-products', name: 'AuditProducts', component: () => import('@/views/AuditProducts.vue'), meta: { title: '商品审核' } },
      { path: 'categories', name: 'Categories', component: () => import('@/views/Categories.vue'), meta: { title: '分类管理' } },
      { path: 'reports', name: 'Reports', component: () => import('@/views/Reports.vue'), meta: { title: '举报处理' } },
      { path: 'audit-logs', name: 'AuditLogs', component: () => import('@/views/AuditLogs.vue'), meta: { title: '审计日志' } },
      { path: 'ai-config', name: 'AiConfig', component: () => import('@/views/AiConfig.vue'), meta: { title: 'AI 配置' } },
    ],
  },

  // 错误页（公开）
  { path: '/403', name: 'Forbidden', component: () => import('@/views/Forbidden.vue'), meta: { public: true, title: '无权限' } },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue'), meta: { public: true, title: '页面不存在' } },
]

const router = createRouter({ history: createWebHistory(), routes })

/**
 * 全局路由守卫
 * - 公开路由直接放行
 * - 未登录 -> 跳登录
 * - 已登录但非管理员 -> 跳 403
 */
router.beforeEach((to) => {
  const store = useUserStore()
  if (to.meta.public) return true
  if (!store.token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (!store.isAdmin) {
    return { path: '/403' }
  }
  return true
})

/**
 * 动态标题
 */
router.afterEach((to) => {
  const base = '校园易物 · 平台后台'
  document.title = to.meta.title ? `${to.meta.title} - ${base}` : base
})

export default router
