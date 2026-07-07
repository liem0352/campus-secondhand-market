<template>
  <el-container class="main-layout">
    <!-- 侧边栏：桌面端固定，移动端抽屉 -->
    <el-aside
      :width="isMobile ? '240px' : (isCollapse ? '64px' : '220px')"
      class="sidebar"
      :class="{ 'sidebar--mobile': isMobile, 'sidebar--open': mobileDrawerOpen }"
    >
      <div class="logo">
        <BrandLogo
          :variant="isCollapse && !isMobile ? 'mark' : 'horizontal'"
          :size="32"
          text-color="var(--color-text-inverse)"
        />
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse && !isMobile"
        :collapse-transition="false"
        router
        background-color="transparent"
        text-color="rgba(255,255,255,0.85)"
        active-text-color="#FFFFFF"
        class="side-menu"
      >
        <el-menu-item :index="ROUTE_PATHS.DASHBOARD">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>{{ LAYOUT_TEXT.MENU_DASHBOARD }}</template>
        </el-menu-item>

        <!-- 买家侧：浏览 / 收藏 / 我买到的 -->
        <el-menu-item :index="ROUTE_PATHS.BROWSE">
          <el-icon><Search /></el-icon>
          <template #title>{{ LAYOUT_TEXT.MENU_BROWSE }}</template>
        </el-menu-item>
        <el-menu-item :index="ROUTE_PATHS.FAVORITES">
          <el-icon><Star /></el-icon>
          <template #title>{{ LAYOUT_TEXT.MENU_FAVORITES }}</template>
        </el-menu-item>
        <el-menu-item :index="ROUTE_PATHS.BUYER_ORDERS">
          <el-icon><ShoppingCart /></el-icon>
          <template #title>{{ LAYOUT_TEXT.MENU_BUYER_ORDERS }}</template>
        </el-menu-item>

        <!-- 卖家侧：商品管理 / 卖出订单 / 销售看板 -->
        <el-menu-item :index="ROUTE_PATHS.PRODUCTS">
          <el-icon><Goods /></el-icon>
          <template #title>{{ LAYOUT_TEXT.MENU_PRODUCTS }}</template>
        </el-menu-item>
        <el-menu-item :index="ROUTE_PATHS.PRODUCT_CREATE">
          <el-icon><Plus /></el-icon>
          <template #title>{{ LAYOUT_TEXT.MENU_PRODUCT_CREATE }}</template>
        </el-menu-item>
        <el-menu-item :index="ROUTE_PATHS.ORDERS">
          <el-icon><List /></el-icon>
          <template #title>{{ LAYOUT_TEXT.MENU_SELLER_ORDERS }}</template>
        </el-menu-item>
        <el-menu-item :index="ROUTE_PATHS.STATISTICS">
          <el-icon><TrendCharts /></el-icon>
          <template #title>{{ LAYOUT_TEXT.MENU_STATISTICS }}</template>
        </el-menu-item>

        <!-- 通用：消息 / 资料 -->
        <el-menu-item :index="ROUTE_PATHS.MESSAGES">
          <el-icon><ChatDotRound /></el-icon>
          <template #title>{{ LAYOUT_TEXT.MENU_MESSAGES }}</template>
        </el-menu-item>
        <el-menu-item :index="ROUTE_PATHS.PROFILE">
          <el-icon><User /></el-icon>
          <template #title>{{ LAYOUT_TEXT.MENU_PROFILE }}</template>
        </el-menu-item>

        <!-- 管理员额外入口：跳到管理后台 -->
        <el-menu-item v-if="userStore.isAdmin" :index="ROUTE_PATHS.ADMIN_INDEX" @click="goAdmin">
          <el-icon><Setting /></el-icon>
          <template #title>{{ LAYOUT_TEXT.MENU_ADMIN }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 移动端遮罩 -->
    <div
      v-if="isMobile && mobileDrawerOpen"
      class="sidebar-mask"
      @click="mobileDrawerOpen = false"
    />

    <!-- 右侧主体 -->
    <el-container class="main-container">
      <!-- 顶部栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon
            class="collapse-btn"
            :title="isCollapse ? LAYOUT_TEXT.COLLAPSE_BTN_EXPAND : LAYOUT_TEXT.COLLAPSE_BTN_COLLAPSE"
            @click="toggleSidebar"
          >
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <span class="page-title">{{ currentTitle }}</span>
        </div>

        <div class="header-right">
          <!-- 主题切换 -->
          <ThemeSwitcher />

          <!-- 消息铃铛 -->
          <el-badge :value="3" class="header-icon-btn" @click="$router.push(ROUTE_PATHS.MESSAGES)">
            <el-icon :size="20"><Bell /></el-icon>
          </el-badge>

          <!-- 信用分徽章 -->
          <div class="credit-pill" :class="creditBadgeClass" :title="`信用分 ${creditScore}`">
            <span class="credit-dot" aria-hidden="true"></span>
            <span class="credit-label">{{ LAYOUT_TEXT.CREDIT_LABEL }}</span>
            <strong class="credit-value">{{ creditScore }}</strong>
          </div>

          <!-- 用户下拉 -->
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="36" :src="userStore.user?.avatar || ''">
                {{ (userStore.nickname || LAYOUT_TEXT.USER_AVATAR_DEFAULT).charAt(0).toUpperCase() }}
              </el-avatar>
              <div class="user-meta">
                <span class="name">{{ userStore.nickname || LAYOUT_TEXT.USER_NICKNAME_DEFAULT }}</span>
                <span class="role">{{ userStore.user?.school || LAYOUT_TEXT.USER_SCHOOL_DEFAULT }}</span>
              </div>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>{{ LAYOUT_TEXT.DROPDOWN_PROFILE }}
                </el-dropdown-item>
                <el-dropdown-item command="publish" divided>
                  <el-icon><Plus /></el-icon>{{ LAYOUT_TEXT.DROPDOWN_PUBLISH }}
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>{{ LAYOUT_TEXT.DROPDOWN_LOGOUT }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
/**
 * 主布局组件
 * - 桌面端：固定侧栏 + 顶栏 + 内容区
 * - 移动端：抽屉式侧栏 + 顶栏 + 内容区
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { env } from '@/config/env'
import { LAYOUT_TEXT, ROUTE_PATHS } from '@/constants'
import BrandLogo from '@/components/BrandLogo.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 桌面端折叠状态
const isCollapse = ref(false)
// 移动端抽屉开关
const mobileDrawerOpen = ref(false)
// 是否移动端（< 1024px）
const isMobile = ref(window.innerWidth < 1024)

/**
 * 当前激活菜单
 * - /products/create 视作 /products 的子菜单
 * - /products/:id/edit 视作 /products 的子菜单
 * - /browse/:id 视作 /browse 的子菜单
 */
const activeMenu = computed(() => {
  if (route.path === ROUTE_PATHS.PRODUCT_CREATE || route.path.match(/^\/products\/\d+\/edit$/)) {
    return ROUTE_PATHS.PRODUCTS
  }
  if (route.path.match(/^\/browse\/\d+$/)) {
    return ROUTE_PATHS.BROWSE
  }
  return route.path
})

/** 当前页标题（来自 route.meta） */
const currentTitle = computed(() => (route.meta.title as string) || LAYOUT_TEXT.DEFAULT_PAGE_TITLE)

/** 信用分：根据分数映射等级 */
const creditScore = computed(() => userStore.creditScore)

/** 信用分等级 class */
const creditBadgeClass = computed(() => {
  const score = creditScore.value
  if (score >= 90) return 'credit-badge--high'
  if (score >= 60) return 'credit-badge--mid'
  return 'credit-badge--low'
})

/**
 * 跳转到管理后台
 * - 通过 location.href 跨域跳转（管理后台端口）
 * - 后台使用同一套后端 API + 同一份 token（localStorage 共享）
 */
function goAdmin() {
  // 关闭移动端抽屉
  if (isMobile.value) mobileDrawerOpen.value = false
  window.location.href = env.ADMIN_URL
}

/**
 * 切换侧边栏
 * - 桌面端：折叠/展开
 * - 移动端：打开/关闭抽屉
 */
function toggleSidebar() {
  if (isMobile.value) {
    mobileDrawerOpen.value = !mobileDrawerOpen.value
  } else {
    isCollapse.value = !isCollapse.value
  }
}

/**
 * 监听窗口尺寸变化
 * 跨断点时切换桌面/移动模式
 */
function handleResize() {
  const wasMobile = isMobile.value
  isMobile.value = window.innerWidth < 1024
  // 切换到桌面端时自动关闭抽屉
  if (wasMobile && !isMobile.value) {
    mobileDrawerOpen.value = false
  }
}

/**
 * 顶栏下拉菜单命令
 */
function handleCommand(command: string) {
  if (command === 'profile') {
    router.push(ROUTE_PATHS.PROFILE)
  } else if (command === 'publish') {
    router.push(ROUTE_PATHS.PRODUCT_CREATE)
  } else if (command === 'logout') {
    userStore.logout()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  // 首次进入尝试拉取最新用户信息
  if (userStore.isLoggedIn && !userStore.user) {
    userStore.fetchProfile().catch(() => {
      // 拉取失败保留 localStorage 中的缓存
    })
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.main-layout {
  height: 100vh;
  background: var(--color-bg-page);
}

/* ========================================
   侧边栏
   ======================================== */
.sidebar {
  background: linear-gradient(180deg, #1F1F1F 0%, #2C2C2C 100%);
  transition: width var(--duration-base) var(--ease-out);
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.sidebar--mobile {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: var(--z-modal);
  box-shadow: var(--shadow-lg);
  transform: translateX(-100%);
  transition: transform var(--duration-base) var(--ease-out);
}

.sidebar--mobile.sidebar--open {
  transform: translateX(0);
}

.sidebar-mask {
  position: fixed;
  inset: 0;
  background: var(--color-bg-mask);
  z-index: calc(var(--z-modal) - 1);
  animation: fadeIn var(--duration-base) var(--ease-out);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Logo 区域 */
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-4);
  color: var(--color-text-inverse);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: padding var(--duration-base) var(--ease-out),
    justify-content var(--duration-base) var(--ease-out);
}

/* 折叠态：让 logo-mark 视觉居中 */
.sidebar:has(.el-menu--collapse) .logo {
  padding: 0;
  justify-content: center;
}

.logo-mark {
  width: 32px;
  height: 32px;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-radius: var(--radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  flex-shrink: 0;
  box-shadow: var(--shadow-orange);
}

.logo-text {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 菜单 */
.side-menu {
  border-right: none;
  padding-top: var(--space-2);
}

.side-menu :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  border-radius: var(--radius-base);
}

/* 展开态：菜单项四周留白 + 文字缩进 */
.side-menu:not(.el-menu--collapse) :deep(.el-menu-item) {
  margin: 4px 8px;
  padding-left: 16px;
}

/* 折叠态：菜单项占满宽度、去掉圆角，交给 el-menu 自身 flex 居中图标 */
.side-menu.el-menu--collapse :deep(.el-menu-item) {
  margin: 4px 0;
  border-radius: 0;
  padding: 0;
}

.side-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.06) !important;
  color: #FFFFFF !important;
}

.side-menu :deep(.el-menu-item.is-active) {
  background: var(--color-primary) !important;
  color: #FFFFFF !important;
  box-shadow: var(--shadow-orange);
}

.side-menu :deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 8px;
}

/* ========================================
   主体容器
   ======================================== */
.main-container {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

/* ========================================
   顶栏（液态玻璃粘性层）
   ======================================== */
.header {
  background: var(--glass-light-3);
  backdrop-filter: var(--glass-blur-3);
  -webkit-backdrop-filter: var(--glass-blur-3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.4) inset,
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 4px 16px rgba(0, 0, 0, 0.04);
  padding: 0 var(--space-5);
  height: var(--header-height);
  z-index: var(--z-sticky);
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: var(--color-text-secondary);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-base);
  transition: background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.collapse-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
}

.page-title {
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.header-icon-btn {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-base);
  color: var(--color-text-secondary);
  transition: background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.header-icon-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
}

/* 顶栏图标按钮:深色模式下加一层弱玻璃,让铃铛/打印按钮在玻璃顶栏上不割裂 */
:root[data-mode='dark'] .header-icon-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
:root[data-mode='dark'] .header-icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
}

/* 顶栏 el-badge:让红点容器不撑出顶栏边界 */
.header-icon-btn :deep(.el-badge__content) {
  box-shadow: 0 0 0 2px var(--glass-light-3);
}

/* 信用分胶囊：弱化圆形徽章，保持顶栏轻量 */
.credit-pill {
  --credit-accent: var(--color-credit-mid);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 12px;
  background: color-mix(in srgb, var(--credit-accent) 10%, var(--color-bg-card));
  border: 1px solid color-mix(in srgb, var(--credit-accent) 26%, transparent);
  box-shadow: 0 1px 2px rgba(var(--shadow-color-rgb), 0.04);
  border-radius: var(--radius-full);
  cursor: default;
}

.credit-pill.credit-badge--high {
  --credit-accent: var(--color-credit-high);
}

.credit-pill.credit-badge--mid {
  --credit-accent: var(--color-credit-mid);
}

.credit-pill.credit-badge--low {
  --credit-accent: var(--color-credit-low);
}

/* 深色模式:信用胶囊背景/边框/光晕全部调弱,避免三重绿色叠加割裂 */
:root[data-mode='dark'] .credit-pill {
  background: color-mix(in srgb, var(--credit-accent) 14%, var(--color-bg-section));
  border-color: color-mix(in srgb, var(--credit-accent) 20%, transparent);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.credit-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background: var(--credit-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--credit-accent) 16%, transparent);
  flex-shrink: 0;
}

/* 深色模式:圆点外光晕更弱,避免与背景边框争抢视觉 */
:root[data-mode='dark'] .credit-dot {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--credit-accent) 22%, transparent);
}

.credit-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

/* 深色模式:把"信用"文字用更柔和的灰,避免和绿色数字同色温争抢 */
:root[data-mode='dark'] .credit-label {
  color: var(--color-text-tertiary);
}

.credit-value {
  color: var(--credit-accent);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: 1;
}

/* 深色模式:把数字略微降饱和,让胶囊整体更"安静" */
:root[data-mode='dark'] .credit-pill.credit-badge--high .credit-value {
  color: color-mix(in srgb, var(--color-credit-high) 85%, var(--color-text-primary));
}
:root[data-mode='dark'] .credit-pill.credit-badge--mid .credit-value {
  color: color-mix(in srgb, var(--color-credit-mid) 85%, var(--color-text-primary));
}
:root[data-mode='dark'] .credit-pill.credit-badge--low .credit-value {
  color: color-mix(in srgb, var(--color-credit-low) 85%, var(--color-text-primary));
}

/* 用户信息 */
.user-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  padding: 4px var(--space-2);
  border-radius: var(--radius-base);
  transition: background var(--duration-fast) var(--ease-out);
}

.user-info:hover {
  background: var(--color-bg-hover);
}

.user-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  margin: 0 4px;
}

.user-meta .name {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.user-meta .role {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

/* ========================================
   主内容
   ======================================== */
.main-content {
  background: var(--color-bg-page);
  padding: 0;
  overflow-y: auto;
  height: calc(100vh - var(--header-height));
}

/* 响应式：< 1024px 隐藏用户 meta 文字 */
@media (max-width: 1024px) {
  .user-meta {
    display: none;
  }
  .credit-pill .credit-label {
    display: none;
  }
  .credit-pill {
    padding: 4px;
  }
}
</style>
