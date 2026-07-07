/**
 * ECharts 主题色工具
 * - ECharts 直接消费字符串色值(走 Canvas 渲染),无法解析 CSS 变量
 * - 这里把"对图表有意义"的色值一次性解析为字符串,
 *   并订阅主题 store 的 isDark,确保主题切换时图表色板自动刷新
 */
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

/**
 * 把 "var(--color-xxx)" / "rgba(...)" / "#xxx" 等任意色值,解析成最终色字符串
 * - 优先从 <html> 上读 computed style;读不到则原样返回
 * - var(--x) 会自动回退到 var 真实值
 * - rgb()/rgba() 直接返回
 */
function resolveColor(value: string): string {
  if (!value) return ''
  // 非 var / 非 CSS 颜色:直接返回
  if (!value.startsWith('var(')) return value
  const match = /var\((--[a-zA-Z0-9-_]+)(?:,\s*(.+))?\)/.exec(value)
  if (!match) return value
  const varName = match[1]
  if (typeof window === 'undefined') return value
  const root = document.documentElement
  const v = getComputedStyle(root).getPropertyValue(varName).trim()
  return v || match[2] || value
}

/**
 * 把 RGBA 字符串再叠一层 alpha(0~1),生成带透明度的色值(给 areaStyle / splitLine 等用)
 *  - 入参 rgb / rgba / hex 都可以
 *  - 返回 rgba(r, g, b, a)
 */
function withAlpha(value: string, alpha: number): string {
  if (!value) return value
  const v = resolveColor(value).trim().toLowerCase()
  // hex
  if (v.startsWith('#')) {
    const hex = v.slice(1)
    const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
    const n = parseInt(full, 16)
    const r = (n >> 16) & 255
    const g = (n >> 8) & 255
    const b = n & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  // rgb / rgba
  const m = /rgba?\(([^)]+)\)/.exec(v)
  if (m) {
    const parts = m[1].split(',').map((s) => s.trim())
    const [r, g, b] = parts
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return v
}

/** ECharts 统一色板(把"对图表有意义的 CSS 变量"集中解析) */
export interface ChartColors {
  /** 主色 */
  primary: string
  /** 主色 + 0.35 alpha(折线面积填充首色) */
  primaryAreaStart: string
  /** 主色 + 0.02 alpha(折线面积填充末色) */
  primaryAreaEnd: string
  /** 主色 + 0.08 alpha(主色柱体) */
  primaryBarStart: string
  /** 主色 + 0.45 alpha(主色柱体收尾) */
  primaryBarEnd: string
  /** 成功色 */
  success: string
  /** 文字:次级(轴标签、tooltip 普通文字) */
  textSecondary: string
  /** 文字:三级(辅助提示) */
  textTertiary: string
  /** 边框:浅(轴线 / splitLine) */
  borderLight: string
  /** 卡片底色(图例背景 / 文本底) */
  cardBg: string
  /** 饼图扇区分隔色(避免深色模式下"白边"突兀) */
  pieBorder: string
  /** 饼图分类色板(8 色,深色下自动加白边) */
  palette: string[]
}

/** 默认浅色饼图 8 色 */
const PIE_PALETTE_LIGHT = [
  '#FF6B35', '#07C160', '#1989FA', '#FFA500',
  '#FF4D4F', '#9B59B6', '#1ABC9C', '#E67E22',
]
/** 默认深色饼图 8 色(提亮饱和度,避免被深背景吞没) */
const PIE_PALETTE_DARK = [
  '#FF8A5C', '#4CD964', '#56CCF2', '#FFB84D',
  '#FF7676', '#B39DDB', '#48D1B3', '#FFA899',
]

/**
 * 当前主题的 ECharts 色板
 * - 用 computed 跟随 isDark 自动重算
 * - 模板里直接 v-bind 引用即可
 */
export function useChartColors() {
  const themeStore = useThemeStore()
  return computed<ChartColors>(() => {
    const isDark = themeStore.isDark
    return {
      primary: resolveColor('var(--color-primary)'),
      primaryAreaStart: withAlpha('var(--color-primary)', isDark ? 0.45 : 0.35),
      primaryAreaEnd: withAlpha('var(--color-primary)', isDark ? 0.04 : 0.02),
      primaryBarStart: withAlpha('var(--color-primary)', isDark ? 0.55 : 0.55),
      primaryBarEnd: withAlpha('var(--color-primary)', isDark ? 0.85 : 1),
      success: resolveColor('var(--color-success)'),
      textSecondary: resolveColor('var(--color-text-secondary)'),
      textTertiary: resolveColor('var(--color-text-tertiary)'),
      borderLight: resolveColor('var(--color-border-light)'),
      cardBg: resolveColor('var(--color-bg-card)'),
      pieBorder: isDark ? resolveColor('var(--color-bg-card)') : '#FFFFFF',
      palette: isDark ? PIE_PALETTE_DARK : PIE_PALETTE_LIGHT,
    }
  })
}
