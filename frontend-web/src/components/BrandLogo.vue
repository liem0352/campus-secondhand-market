<!--
  校园易物 · 通用品牌 logo 组件
  - variant: 'mark' | 'horizontal' | 'text' 三种
  - theme: 'color'（主色填充） | 'inverse'（透明底主色描边）
  - size: 像素值（仅控制宽高比例，正方形）
  - 内部使用内联 SVG，可被 CSS color/filter 调整
-->
<template>
  <!-- 仅 mark 徽标 -->
  <div
    v-if="variant === 'mark'"
    class="brand-logo brand-logo--mark"
    :style="markStyle"
    role="img"
    :aria-label="BRAND_TEXT.ARIA_LABEL"
  >
    <svg
      :width="sizeValue"
      :height="sizeValue"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" :stop-color="gradientStart" />
          <stop offset="100%" :stop-color="gradientEnd" />
        </linearGradient>
        <!-- 底部磨砂遮罩：顶部微透、底部更白 -->
        <linearGradient :id="`${gradientId}-mask`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.04" />
          <stop offset="55%" stop-color="#FFFFFF" stop-opacity="0.14" />
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.34" />
        </linearGradient>
      </defs>
      <rect
        v-if="theme === 'color'"
        x="0" y="0" width="64" height="64" rx="14"
        :fill="`url(#${gradientId})`"
      />
      <!-- 底部磨砂遮罩 -->
      <rect
        v-if="theme === 'color'"
        x="0" y="0" width="64" height="64" rx="14"
        :fill="`url(#${gradientId}-mask)`"
      />
      <g
        fill="none"
        :stroke="strokeColor"
        stroke-width="4.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M 16 28 A 16 16 0 0 1 36 14" />
        <polyline points="30,10 36,14 32,20" />
        <path d="M 48 36 A 16 16 0 0 1 28 50" />
        <polyline points="34,54 28,50 32,44" />
      </g>
      <circle cx="32" cy="32" r="2.2" :fill="strokeColor" />
    </svg>
  </div>

  <!-- mark + wordmark 横向组合 -->
  <div
    v-else
    class="brand-logo brand-logo--horizontal"
    :style="horizontalStyle"
    role="img"
    :aria-label="BRAND_TEXT.ARIA_LABEL"
  >
    <svg
      :width="markSize"
      :height="markSize"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      class="brand-logo__mark"
    >
      <defs>
        <linearGradient :id="`${gradientId}-h`" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" :stop-color="gradientStart" />
          <stop offset="100%" :stop-color="gradientEnd" />
        </linearGradient>
        <linearGradient :id="`${gradientId}-h-mask`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.04" />
          <stop offset="55%" stop-color="#FFFFFF" stop-opacity="0.14" />
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.34" />
        </linearGradient>
      </defs>
      <rect
        v-if="theme === 'color'"
        x="0" y="0" width="64" height="64" rx="14"
        :fill="`url(#${gradientId}-h)`"
      />
      <rect
        v-if="theme === 'color'"
        x="0" y="0" width="64" height="64" rx="14"
        :fill="`url(#${gradientId}-h-mask)`"
      />
      <g
        fill="none"
        :stroke="strokeColor"
        stroke-width="4.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M 16 28 A 16 16 0 0 1 36 14" />
        <polyline points="30,10 36,14 32,20" />
        <path d="M 48 36 A 16 16 0 0 1 28 50" />
        <polyline points="34,54 28,50 32,44" />
      </g>
      <circle cx="32" cy="32" r="2.2" :fill="strokeColor" />
    </svg>

    <div v-if="showText" class="brand-logo__text" :style="textStyle">
      <span class="brand-logo__title">{{ title }}</span>
      <span v-if="subtitle" class="brand-logo__subtitle">{{ subtitle }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 校园易物 · 通用 logo 组件
 * - 内联 SVG，无网络请求，颜色随主题切换
 * - 支持 mark-only / horizontal / text-only 三种变体
 * - 字体使用系统中文无衬线栈，保证跨平台一致性
 */
import { computed, useId } from 'vue'
import { BRAND_TEXT } from '@/constants'

interface Props {
  /** logo 变体 */
  variant?: 'mark' | 'horizontal'
  /** 主题：color=主色填充 / inverse=主色描边（用于浅色背景） */
  theme?: 'color' | 'inverse'
  /** 主尺寸（mark 边长 / horizontal 高度）单位 px */
  size?: number
  /** 主标题文字（默认从 BRAND_TEXT.TITLE 读取） */
  title?: string
  /** 副标题（管理后台场景下用，如 BRAND_TEXT.SUBTITLE_ADMIN） */
  subtitle?: string
  /** 是否显示文字部分（horizontal 下有效） */
  showText?: boolean
  /** 文字主色（horizontal 下有效），默认随主题 */
  textColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'mark',
  theme: 'color',
  size: 32,
  title: () => BRAND_TEXT.TITLE,
  subtitle: '',
  showText: true,
  textColor: '',
})

/** 唯一 id（避免同页面多实例 gradient 冲突） */
const uid = useId()
const gradientId = computed(() => `brand-grad-${uid.replace(/:/g, '')}`)

/** 渐变色:跟随主题主色动态生成 */
const gradientStart = computed(() => {
  /* 从 :root 的 --color-primary-500 与 --color-primary-700 派生 */
  return 'var(--color-primary-300)'
})
const gradientEnd = computed(() => {
  return 'var(--color-primary-700)'
})

/** 描边色（mark 内图形的颜色） */
const strokeColor = computed(() => {
  return props.theme === 'color' ? '#FFFFFF' : '#FF7A45'
})

/** mark 渲染尺寸（mark / horizontal 共用） */
const sizeValue = computed(() => `${props.size}px`)

/** horizontal 模式下 mark 高度（与 size 一致） */
const markSize = computed(() => `${props.size}px`)

/** mark 容器样式 */
const markStyle = computed(() => ({
  width: sizeValue.value,
  height: sizeValue.value,
  display: 'inline-flex',
}))

/** horizontal 容器样式 */
const horizontalStyle = computed(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: `${Math.max(8, Math.round(props.size * 0.3))}px`,
  height: sizeValue.value,
}))

/** 文字样式 */
const textStyle = computed(() => {
  /* 默认色:用 CSS 变量,跟随主题 */
  /* - theme='color' → 深色(用于浅色背景,如登录页) */
  /* - theme='inverse' → 主色(用于深色背景) */
  const defaultColor = props.theme === 'color'
    ? 'var(--color-text-primary)'
    : 'var(--color-primary)'
  return {
    color: props.textColor || defaultColor,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    lineHeight: 1.2,
  }
})
</script>

<style scoped>
.brand-logo {
  flex-shrink: 0;
}

.brand-logo__mark {
  display: block;
}

.brand-logo__title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 2px;
  font-family:
    'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB',
    'Source Han Sans CN', sans-serif;
}

.brand-logo__subtitle {
  font-size: 11px;
  opacity: 0.65;
  margin-top: 2px;
  font-family:
    'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB',
    'Source Han Sans CN', sans-serif;
}
</style>
