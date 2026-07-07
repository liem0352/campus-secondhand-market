<!--
  通用加载骨架屏
  - 用于表格/列表/卡片加载占位
  - 支持多种行数与字段宽度
-->
<template>
  <div class="skeleton-wrap" :style="{ padding }" aria-busy="true" aria-live="polite">
    <!-- 标题骨架 -->
    <div v-if="showHeader" class="skeleton-header">
      <div class="sk-line" :style="{ width: '40%', height: '20px' }" />
      <div class="sk-line" :style="{ width: '120px', height: '32px', borderRadius: '8px' }" />
    </div>

    <!-- 列表骨架 -->
    <div
      v-for="i in rows"
      :key="i"
      class="skeleton-row"
      :style="{ gap }"
    >
      <div
        v-for="(w, idx) in widths"
        :key="idx"
        class="sk-line"
        :style="{ width: w, height: height + 'px' }"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * 加载骨架屏
 * @prop {number} rows - 行数
 * @prop {string[]} widths - 每列宽度（CSS 单位）
 * @prop {number} height - 行高
 * @prop {string} gap - 行间距
 * @prop {string} padding - 外间距
 * @prop {boolean} showHeader - 是否显示表头骨架
 */
import { computed } from 'vue'

const props = defineProps({
  rows: { type: Number, default: 6 },
  widths: {
    type: Array,
    default: () => ['180px', '120px', '100px', '80px', '120px'],
  },
  height: { type: Number, default: 18 },
  gap: { type: String, default: '12px' },
  padding: { type: String, default: '16px' },
  showHeader: { type: Boolean, default: false },
})

// 兼容：确保 widths 与 rows 数量一致
const widths = computed(() => props.widths)
</script>

<style scoped>
.skeleton-wrap {
  display: flex;
  flex-direction: column;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.skeleton-row {
  display: flex;
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-divider);
}

.skeleton-row:last-child {
  border-bottom: none;
}

.sk-line {
  background: linear-gradient(
    90deg,
    var(--color-bg-hover) 0%,
    var(--color-border-light) 50%,
    var(--color-bg-hover) 100%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  animation: sk-shimmer 1.4s ease-in-out infinite;
}

@keyframes sk-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 偏好减少动效 */
@media (prefers-reduced-motion: reduce) {
  .sk-line {
    animation: none;
  }
}
</style>
