<!--
  通用错误状态组件
  - 用于接口异常、网络断开等场景
  - 提供"重试"操作
-->
<template>
  <div :class="['error-state', { 'error-state--compact': compact }]" role="alert">
    <div class="error-illust" :style="{ width: size + 'px', height: size + 'px' }">
      <svg
        :width="size"
        :height="size"
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <!-- 三角警告 -->
        <path
          d="M48 14L86 78H10L48 14Z"
          fill="#FFF1F0"
          stroke="#FF4D4F"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <line
          x1="48"
          y1="38"
          x2="48"
          y2="58"
          stroke="#FF4D4F"
          stroke-width="3"
          stroke-linecap="round"
        />
        <circle cx="48" cy="68" r="2.5" fill="#FF4D4F" />
        <!-- 装饰圆点 -->
        <circle cx="18" cy="84" r="3" fill="#FFE5DA" />
        <circle cx="80" cy="20" r="3" fill="#FFE5DA" />
      </svg>
    </div>

    <h3 class="error-title">{{ title }}</h3>
    <p v-if="description" class="error-desc">{{ description }}</p>
    <p v-else-if="errorMessage" class="error-desc">{{ errorMessage }}</p>

    <div v-if="showRetry" class="error-actions">
      <el-button type="primary" :icon="RefreshRight" :loading="retrying" @click="onRetry">
        {{ retryText }}
      </el-button>
      <slot />
    </div>
    <div v-else class="error-actions">
      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * 错误状态组件
 * @prop {string} title - 标题
 * @prop {string} description - 描述
 * @prop {string} errorMessage - 错误详情（来自 catch）
 * @prop {boolean} showRetry - 是否显示重试按钮
 * @prop {string} retryText - 重试按钮文案
 * @prop {number} size - 插画尺寸
 * @prop {boolean} compact - 紧凑模式
 * @event retry - 点击重试
 */
import { ref } from 'vue'
import { RefreshRight } from '@element-plus/icons-vue'

const props = defineProps({
  title: { type: String, default: '加载失败' },
  description: { type: String, default: '' },
  errorMessage: { type: String, default: '' },
  showRetry: { type: Boolean, default: true },
  retryText: { type: String, default: '重新加载' },
  size: { type: Number, default: 96 },
  compact: { type: Boolean, default: false },
})

const emit = defineEmits(['retry'])

const retrying = ref(false)

/**
 * 重试：触发 retry 事件，外部加载逻辑完成后回传
 */
async function onRetry() {
  retrying.value = true
  try {
    emit('retry')
    // 给一个最小视觉反馈时间，避免按钮 loading 一闪而过
    await new Promise((r) => setTimeout(r, 400))
  } finally {
    retrying.value = false
  }
}
</script>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-10) var(--space-4);
  text-align: center;
}

.error-state--compact {
  padding: var(--space-6) var(--space-4);
}

.error-illust {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
}

.error-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.error-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  max-width: 360px;
  line-height: var(--line-height-normal);
  margin-bottom: var(--space-4);
  word-break: break-word;
}

.error-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
}
</style>
