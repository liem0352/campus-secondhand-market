<!--
  平台管理后台 · 主布局
  - 左侧深色侧边栏（240px）：Logo + 菜单
  - 右侧白底主体：顶栏（标题 + 时间 + 头像）+ 内容区
  - 使用 Element Plus 的 el-container / el-aside / el-header / el-main
  - 视觉风格与 frontend-web 卖家工作台保持一致
-->
<template>
  <el-container class="admin-layout">
    <!-- ========================================
         左侧侧边栏（桌面固定 / 移动端抽屉）
         ======================================== -->
    <el-aside
      :width="isMobile ? '240px' : (isCollapse ? '64px' : '240px')"
      class="sidebar"
      :class="{ 'sidebar--mobile': isMobile, 'sidebar--open': mobileDrawerOpen }"
    >
      <div class="logo">
        <BrandLogo
          :variant="isCollapse && !isMobile ? 'mark' : 'horizontal'"
          :size="32"
          subtitle="平台后台"
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
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        <el-menu-item index="/audit-products">
          <el-icon><Goods /></el-icon>
          <template #title>商品审核</template>
        </el-menu-item>
        <el-menu-item index="/categories">
          <el-icon><Menu /></el-icon>
          <template #title>分类管理</template>
        </el-menu-item>
        <el-menu-item index="/reports">
          <el-icon><Warning /></el-icon>
          <template #title>举报处理</template>
        </el-menu-item>
        <el-menu-item index="/audit-logs">
          <el-icon><Document /></el-icon>
          <template #title>审计日志</template>
        </el-menu-item>
        <el-menu-item index="/ai-config">
          <el-icon><MagicStick /></el-icon>
          <template #title>AI 配置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 移动端遮罩 -->
    <div
      v-if="isMobile && mobileDrawerOpen"
      class="sidebar-mask"
      @click="mobileDrawerOpen = false"
    />

    <!-- ========================================
         右侧主体
         ======================================== -->
    <el-container class="main-container">
      <!-- 顶栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon
            class="collapse-btn"
            :title="isCollapse ? '展开侧边栏' : '折叠侧边栏'"
            @click="toggleSidebar"
          >
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <span class="page-title">{{ currentTitle }}</span>
        </div>

        <div class="header-right">
          <!-- 当前时间 -->
          <span class="header-time" :title="'当前服务器时间'">
            <el-icon><Clock /></el-icon>
            <span>{{ now }}</span>
          </span>

          <!-- 用户下拉 -->
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="36" :src="user?.avatar || ''">
                {{ (userStore.displayName || 'A').charAt(0).toUpperCase() }}
              </el-avatar>
              <div class="user-meta">
                <span class="name">{{ userStore.displayName }}</span>
                <span class="role">{{ user?.role === 'admin' ? '超级管理员' : '运营管理员' }}</span>
              </div>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人资料
                </el-dropdown-item>
                <el-dropdown-item command="refresh" divided>
                  <el-icon><Refresh /></el-icon>刷新资料
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>退出登录
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

<script setup>
/**
 * 主布局组件
 * - 侧边栏：深色背景 + 橙品牌色激活项
 * - 顶栏：标题 + 实时时间 + 管理员信息
 * - 内容区：白底卡片
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataAnalysis,
  User,
  Goods,
  Menu,
  Warning,
  Document,
  MagicStick,
  Fold,
  Expand,
  Clock,
  ArrowDown,
  Refresh,
  SwitchButton,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import BrandLogo from '@/components/BrandLogo.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const user = computed(() => userStore.user)

/** 桌面端折叠状态（< 1024px 视为移动端，不使用折叠态） */
const isCollapse = ref(false)
/** 移动端抽屉开关 */
const mobileDrawerOpen = ref(false)
/** 是否移动端（< 1024px） */
const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth < 1024 : false)

/** 侧边栏宽度：桌面端根据折叠态 64/240，移动端固定 240 */
const sidebarWidth = computed(() => {
  if (isMobile.value) return '240px'
  return isCollapse.value ? '64px' : '240px'
})

/** 当前页标题（来自 route.meta） */
const currentTitle = computed(() => route.meta.title || '仪表盘')

/** 当前激活菜单 */
const activeMenu = computed(() => route.path)

/** 当前时间字符串，10 秒刷新一次 */
const now = ref('')
let timer = null
/**
 * 格式化当前时间
 * @returns {string} 形如 2026-06-06 18:30:25
 */
function refreshTime() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  now.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * 切换侧边栏
 * - 桌面端：折叠 / 展开
 * - 移动端：打开 / 关闭抽屉
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
 * @param {string} command 命令名
 */
async function handleCommand(command) {
  if (command === 'profile') {
    ElMessage.info('个人资料页面开发中')
  } else if (command === 'refresh') {
    await userStore.fetchProfile()
    ElMessage.success('资料已刷新')
  } else if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确认退出管理后台？', '提示', {
        type: 'warning',
        confirmButtonText: '退出',
        cancelButtonText: '取消',
      })
    } catch {
      return // 用户取消
    }
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}

onMounted(() => {
  refreshTime()
  timer = setInterval(refreshTime, 1000)
  window.addEventListener('resize', handleResize)
  // 进入后台时尝试刷新一次资料
  if (userStore.isLoggedIn && userStore.user) {
    userStore.fetchProfile().catch(() => {})
  }
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* ========================================
   整体布局
   ======================================== */
.admin-layout {
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
  flex-shrink: 0;
}

/* 移动端：侧边栏变成抽屉 */
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

/* 移动端抽屉背后的遮罩 */
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

.logo {
  height: 72px;
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
  width: 36px;
  height: 36px;
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
  letter-spacing: 1px;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
}

.logo-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.logo-subtitle {
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.55);
}

/* 折叠时只显示 logo-mark */
:deep(.el-menu--collapse) ~ * .logo-text,
.sidebar:has(.el-menu--collapse) .logo-text {
  display: none;
}

.side-menu {
  border-right: none;
  padding-top: var(--space-2);
}

.side-menu :deep(.el-menu-item) {
  height: 46px;
  line-height: 46px;
  border-radius: var(--radius-base);
  transition: background var(--duration-fast) var(--ease-out);
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

.header-time {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-mono);
}

.header-time .el-icon {
  font-size: 16px;
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

/* 响应式：< 1024px 隐藏用户 meta */
@media (max-width: 1024px) {
  .user-meta,
  .header-time {
    display: none;
  }
}
</style>
