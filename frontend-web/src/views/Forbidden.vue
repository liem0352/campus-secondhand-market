<!--
  校园易物 H5 端 · 403 无权限
  - 兜底无权访问的页面（如尝试访问管理员接口）
-->
<template>
  <div class="error-page">
    <div class="error-card">
      <div class="error-illust">
        <el-icon :size="96" color="#FF4D4F"><Lock /></el-icon>
      </div>
      <h1 class="error-title">无访问权限</h1>
      <p class="error-desc">当前账号无权访问此页面。如确认是误操作，请联系平台管理员开通权限。</p>
      <div class="error-actions">
        <el-button type="primary" :icon="Back" @click="goBack">返回上一页</el-button>
        <el-button :icon="HomeFilled" @click="$router.push('/dashboard')">回到工作台</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 403 页面
 * - 当前账号权限不足
 * - 提供返回上一页 / 回到工作台
 */
import { useRouter } from 'vue-router'
import { Back, HomeFilled, Lock } from '@element-plus/icons-vue'

const router = useRouter()

/** 返回上一页 */
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
  width: 140px;
  height: 140px;
  margin: 0 auto var(--space-6);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 77, 79, 0.1);
  border-radius: var(--radius-full);
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
  line-height: var(--line-height-loose);
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
    width: 110px;
    height: 110px;
  }
}
</style>
