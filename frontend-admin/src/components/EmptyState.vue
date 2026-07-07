<!--
  通用空状态组件
  - 用于列表/页面无数据时的友好提示
  - 支持插画 / 文案 / 操作按钮
-->
<template>
  <div :class="['empty-state', { 'empty-state--compact': compact }]" role="status">
    <div class="empty-illust" :style="illustStyle">
      <!-- 内置 SVG 插画：空盒子 -->
      <svg
        v-if="!iconSlot"
        :width="size"
        :height="size"
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          x="14"
          y="30"
          width="68"
          height="48"
          rx="8"
          fill="#F5F5F7"
          stroke="#DDDDDD"
          stroke-width="1.5"
        />
        <path d="M14 38L48 16L82 38" stroke="#DDDDDD" stroke-width="1.5" fill="none" />
        <path d="M48 16V60" stroke="#DDDDDD" stroke-width="1.5" />
        <circle cx="74" cy="22" r="4" fill="#FFE5DA" />
        <circle cx="22" cy="70" r="3" fill="#FFE5DA" />
      </svg>
      <slot name="icon" />
    </div>

    <h3 v-if="title" class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-desc">{{ description }}</p>

    <div v-if="$slots.default" class="empty-actions">
      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * 空状态组件
 * @prop {string} title - 标题
 * @prop {string} description - 描述
 * @prop {number} size - 插画尺寸
 * @prop {boolean} compact - 紧凑模式
 */
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '暂无数据' },
  description: { type: String, default: '' },
  size: { type: Number, default: 96 },
  compact: { type: Boolean, default: false },
  // 是否使用自定义插画 slot
  iconSlot: { type: Boolean, default: false },
})

const illustStyle = computed(() => ({
  width: props.size + 'px',
  height: props.size + 'px',
}))
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-10) var(--space-4);
  text-align: center;
  color: var(--color-text-secondary);
}

.empty-state--compact {
  padding: var(--space-6) var(--space-4);
}

.empty-illust {
  margin-bottom: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.empty-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  max-width: 320px;
  line-height: var(--line-height-normal);
  margin-bottom: var(--space-4);
}

.empty-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
}
</style>
