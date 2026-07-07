<!--
  通用数据加载包装器
  - 自动处理 loading / error / empty / data 四种状态
  - 业务页面只需关心 data 渲染
-->
<template>
  <div class="data-shell" :style="minHeightStyle">
    <!-- 加载中 -->
    <SkeletonBlock
      v-if="loading && !data.length"
      :rows="skeletonRows"
      :widths="skeletonWidths"
      :show-header="showHeaderSkeleton"
    />

    <!-- 错误 -->
    <ErrorState
      v-else-if="error"
      :title="errorTitle"
      :error-message="errorMessage"
      :show-retry="showRetry"
      :retry-text="retryText"
      :compact="compact"
      @retry="handleRetry"
    >
      <slot name="error-extra" />
    </ErrorState>

    <!-- 空数据 -->
    <EmptyState
      v-else-if="!data || !data.length"
      :title="emptyTitle"
      :description="emptyDescription"
      :compact="compact"
    >
      <slot name="empty" />
    </EmptyState>

    <!-- 正常渲染 -->
    <template v-else>
      <slot :data="data" :loading="loading" :refresh="refresh" />
    </template>
  </div>
</template>

<script setup>
/**
 * 数据加载包装器
 * @prop {Array|Object} data - 数据
 * @prop {boolean} loading - 加载中
 * @prop {Error|string} error - 错误信息
 * @prop {string} emptyTitle - 空状态标题
 * @prop {string} emptyDescription - 空状态描述
 * @prop {string} errorTitle - 错误状态标题
 * @prop {boolean} showRetry - 是否显示重试
 * @prop {string} retryText - 重试文案
 * @prop {number} skeletonRows - 骨架行数
 * @prop {string[]} skeletonWidths - 骨架列宽
 * @prop {boolean} showHeaderSkeleton - 是否显示表头骨架
 * @prop {boolean} compact - 紧凑模式
 * @prop {string} minHeight - 最小高度
 * @event retry - 重试
 * @event refresh - 刷新
 */
import { computed, ref } from 'vue'
import SkeletonBlock from './SkeletonBlock.vue'
import ErrorState from './ErrorState.vue'
import EmptyState from './EmptyState.vue'

const props = defineProps({
  data: { type: [Array, Object], default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: [Error, String, Boolean], default: false },
  emptyTitle: { type: String, default: '暂无数据' },
  emptyDescription: { type: String, default: '' },
  errorTitle: { type: String, default: '加载失败' },
  showRetry: { type: Boolean, default: true },
  retryText: { type: String, default: '重新加载' },
  skeletonRows: { type: Number, default: 6 },
  skeletonWidths: {
    type: Array,
    default: () => ['180px', '120px', '100px', '80px', '120px'],
  },
  showHeaderSkeleton: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  minHeight: { type: String, default: '320px' },
})

const emit = defineEmits(['retry', 'refresh'])

/**
 * 内部：手动触发刷新
 */
function refresh() {
  emit('refresh')
}

/**
 * 内部：重试
 */
function handleRetry() {
  emit('retry')
}

const dataList = computed(() => {
  if (Array.isArray(props.data)) return props.data
  if (props.data && Array.isArray(props.data.results)) return props.data.results
  return []
})

const errorMessage = computed(() => {
  if (!props.error) return ''
  if (typeof props.error === 'string') return props.error
  if (props.error?.message) return props.error.message
  return '网络异常，请稍后重试'
})

const minHeightStyle = computed(() => ({ minHeight: props.minHeight }))
</script>

<style scoped>
.data-shell {
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style>
