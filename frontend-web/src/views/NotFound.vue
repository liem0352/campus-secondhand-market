<!--
  校园易物 H5 端 · 404 页面不存在
  - 居中卡片 + 渐变插画
  - 提供"返回工作台"和"联系管理员"操作
-->
<template>
  <div class="error-page">
    <div class="error-card">
      <div class="error-illust">
        <div class="error-code">404</div>
        <div class="error-ring error-ring--1"></div>
        <div class="error-ring error-ring--2"></div>
      </div>
      <h1 class="error-title">页面不存在</h1>
      <p class="error-desc">你访问的页面已下架，或者链接拼写有误。</p>
      <div class="error-actions">
        <el-button type="primary" :icon="Back" @click="goBack">返回上一页</el-button>
        <el-button :icon="HomeFilled" @click="$router.push('/dashboard')">回到工作台</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 404 页面
 * - 兜底路由（router 中通配符匹配）
 * - 提供返回上一页 / 回到工作台两个动作
 */
import { useRouter } from 'vue-router'
import { Back, HomeFilled } from '@element-plus/icons-vue'

const router = useRouter()

/** 返回上一页（兜底：返回工作台） */
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/dashboard')
  }
}
</script>

<style scoped>
.error-page {
  min-height: calc(100vh - var(--header-height) - 40px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
  background: var(--color-bg-page);
}

.error-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-base);
  padding: var(--space-12) var(--space-10);
  max-width: 480px;
  width: 100%;
  text-align: center;
}

.error-illust {
  position: relative;
  width: 180px;
  height: 180px;
  margin: 0 auto var(--space-6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-code {
  position: relative;
  z-index: 2;
  font-size: 96px;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  line-height: 1;
  font-family: var(--font-family-mono);
  letter-spacing: -4px;
}

.error-ring {
  position: absolute;
  border-radius: 50%;
  background: var(--color-primary-soft);
  opacity: 0.5;
}

.error-ring--1 {
  width: 180px;
  height: 180px;
  top: 0;
  left: 0;
  animation: ring-pulse 2.4s var(--ease-in-out) infinite;
}

.error-ring--2 {
  width: 140px;
  height: 140px;
  top: 20px;
  left: 20px;
  opacity: 0.7;
  animation: ring-pulse 2.4s var(--ease-in-out) 0.6s infinite;
}

@keyframes ring-pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.08); opacity: 0.3; }
}

.error-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2);
}

.error-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-6);
  line-height: var(--line-height-normal);
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .error-card {
    padding: var(--space-8) var(--space-5);
  }
  .error-illust {
    width: 140px;
    height: 140px;
  }
  .error-code {
    font-size: 72px;
  }
  .error-ring--1 {
    width: 140px;
    height: 140px;
  }
  .error-ring--2 {
    width: 110px;
    height: 110px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .error-ring--1,
  .error-ring--2 {
    animation: none;
  }
}
</style>
