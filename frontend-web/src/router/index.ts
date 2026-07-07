/**
 * 路由配置
 * 校园易物 H5 端路由表（C 端：买卖家共用）
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', guest: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台', icon: 'DataAnalysis' },
      },
      // ===== 买家侧 =====
      {
        path: 'browse',
        name: 'Browse',
        component: () => import('@/views/Browse.vue'),
        meta: { title: '商品大厅', icon: 'Search', group: 'buyer' },
      },
      {
        path: 'browse/:id',
        name: 'ProductDetail',
        component: () => import('@/views/ProductDetail.vue'),
        meta: { title: '商品详情', icon: 'Goods', hidden: true, group: 'buyer' },
      },
      {
        path: 'favorites',
        name: 'Favorites',
        component: () => import('@/views/Favorites.vue'),
        meta: { title: '我的收藏', icon: 'Star', group: 'buyer' },
      },
      {
        path: 'buyer-orders',
        name: 'BuyerOrders',
        component: () => import('@/views/BuyerOrders.vue'),
        meta: { title: '我买到的', icon: 'ShoppingCart', group: 'buyer' },
      },
      // ===== 卖家侧 =====
      {
        path: 'products',
        name: 'MyProducts',
        component: () => import('@/views/MyProducts.vue'),
        meta: { title: '我的商品', icon: 'Goods', group: 'seller' },
      },
      {
        path: 'products/create',
        name: 'CreateProduct',
        component: () => import('@/views/CreateProduct.vue'),
        meta: { title: '发布商品', icon: 'Plus', hidden: true, group: 'seller' },
      },
      {
        path: 'products/:id/edit',
        name: 'EditProduct',
        component: () => import('@/views/CreateProduct.vue'),
        meta: { title: '编辑商品', icon: 'Edit', hidden: true, group: 'seller' },
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/Orders.vue'),
        meta: { title: '卖出订单', icon: 'List', group: 'seller' },
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/Statistics.vue'),
        meta: { title: '销售看板', icon: 'TrendCharts', group: 'seller' },
      },
      // ===== 通用 =====
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人资料', icon: 'User', group: 'common' },
      },
      {
        path: 'messages',
        name: 'Messages',
        component: () => import('@/views/Messages.vue'),
        meta: { title: '消息中心', icon: 'ChatDotRound', group: 'common' },
      },
    ],
  },
  // 错误页（公开）
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/Forbidden.vue'),
    meta: { title: '无权限', guest: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在', guest: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/**
 * 路由守卫
 * - 未登录访问受保护页面 -> /login
 * - 已登录访问 /login -> /
 * - 数据初始化：刷新时从 localStorage 恢复用户信息
 */
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  if (!userStore.user) {
    userStore.restoreUser()
  }

  // 未登录且不是访客页面 -> 跳转登录
  if (!userStore.isLoggedIn && !to.meta.guest) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // 已登录访问登录页 -> 跳转工作台
  if (userStore.isLoggedIn && to.meta.guest) {
    next({ name: 'Dashboard' })
    return
  }

  next()
})

/**
 * 动态标题
 */
router.afterEach((to) => {
  const base = '校园易物 H5 端'
  document.title = to.meta.title ? `${to.meta.title} - ${base}` : base
})

export default router
