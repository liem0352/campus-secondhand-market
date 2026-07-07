/**
 * 主题状态管理
 * - 维护当前主题 id、明暗模式、自定义主色
 * - 自动持久化到 localStorage
 * - 支持跟随系统
 * - 提供 setMode / setTheme / setCustomColor / reset / cycleTheme 等便捷方法
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import {
  DEFAULT_MODE,
  DEFAULT_THEME_ID,
  THEME_PRESETS,
  getThemeById,
  type ThemeId,
  type ThemeMode,
} from '@/config/themes'

const STORAGE_KEY = 'campus-market.theme'
const MODE_KEY = 'campus-market.mode'
const CUSTOM_KEY = 'campus-market.custom-color'

/**
 * 主题持久化数据结构
 */
interface ThemeStorage {
  themeId: ThemeId
  mode: ThemeMode
  customColor?: string
}

/**
 * 把 hex 颜色解析为 {r,g,b},用于动态 CSS 变量
 * @param hex #RRGGBB / #RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const s = hex.replace('#', '').trim()
  const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s
  const n = parseInt(full, 16)
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff }
}

/**
 * 由主色生成 9 阶色阶(50~900),用于全套 token
 * 使用 HSL 微调明度,生成完整调色板
 * @param hex #RRGGBB
 * @returns 9 阶色板
 */
export function generatePalette(hex: string): Record<string, string> {
  const { r, g, b } = hexToRgb(hex)
  // 转为 HSL
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l0 = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l0 > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break
      case gn: h = (bn - rn) / d + 2; break
      case bn: h = (rn - gn) / d + 4; break
    }
    h /= 6
  }
  /** 按明度阶生成 */
  const steps: Array<[number, number]> = [
    [50, 0.97],
    [100, 0.93],
    [200, 0.86],
    [300, 0.76],
    [400, 0.62],
    [500, 0.5],
    [600, 0.4],
    [700, 0.3],
    [800, 0.2],
    [900, 0.12],
  ]
  const out: Record<string, string> = {}
  for (const [step, l] of steps) {
    // 饱和度随明度变化(浅色饱和度低,深色饱和度略提)
    const sat = step <= 200 ? s * 0.35 : s * (step >= 700 ? 1.05 : 1)
    out[`--color-primary-${step}`] = hslToHex(h * 360, sat, l)
  }
  return out
}

/**
 * HSL 转 hex
 * @param h 0~360
 * @param s 0~1
 * @param l 0~1
 */
function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * 主题 store
 */
export const useThemeStore = defineStore('theme', () => {
  /* ============== 状态 ============== */
  const themeId = ref<ThemeId>(DEFAULT_THEME_ID)
  const mode = ref<ThemeMode>(DEFAULT_MODE)
  /** 用户自定义主色(仅 themeId=custom 时生效) */
  const customColor = ref<string>('#5B8FF9')

  /* ============== 计算属性 ============== */
  const themeMeta = computed(() => getThemeById(themeId.value))
  /** 实际主色(自定义时取 customColor) */
  const primaryColor = computed(() => {
    if (themeId.value === 'custom') return customColor.value
    return mode.value === 'dark' ? themeMeta.value.dark.primary : themeMeta.value.light.primary
  })
  const isDark = computed(() => mode.value === 'dark')
  const themePresets = computed(() => THEME_PRESETS)

  /* ============== 持久化 ============== */
  /**
   * 从 localStorage 恢复
   */
  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data: ThemeStorage = JSON.parse(stored)
        if (data.themeId && THEME_PRESETS.some((t) => t.id === data.themeId)) {
          themeId.value = data.themeId
        }
        if (data.mode === 'light' || data.mode === 'dark') {
          mode.value = data.mode
        }
        if (data.customColor) customColor.value = data.customColor
      }
    } catch {
      // ignore
    }
  }

  /**
   * 持久化到 localStorage
   */
  function saveToStorage() {
    try {
      const data: ThemeStorage = {
        themeId: themeId.value,
        mode: mode.value,
        customColor: customColor.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // ignore
    }
  }

  /* ============== 应用主题到 DOM ============== */
  /**
   * 把主题应用到 <html>:data-theme + data-mode + 动态 CSS 变量
   */
  function applyToDOM() {
    const html = document.documentElement
    html.setAttribute('data-theme', themeId.value)
    html.setAttribute('data-mode', mode.value)
    // 注入主色变量(主色 + 派生 9 阶)
    const palette = generatePalette(primaryColor.value)
    const styleEl = ensureStyleEl()
    let css = `:root[data-theme="${themeId.value}"][data-mode="${mode.value}"]{`
    css += `--color-primary: ${primaryColor.value};`
    css += `--color-primary-rgb: ${hexToRgb(primaryColor.value).r}, ${hexToRgb(primaryColor.value).g}, ${hexToRgb(primaryColor.value).b};`
    Object.entries(palette).forEach(([k, v]) => {
      css += `${k}: ${v};`
    })
    css += '}'
    styleEl.textContent = css
  }

  /** 用于动态注入的 <style> 元素 */
  let _styleEl: HTMLStyleElement | null = null
  function ensureStyleEl(): HTMLStyleElement {
    if (_styleEl) return _styleEl
    _styleEl = document.createElement('style')
    _styleEl.id = 'theme-injection'
    document.head.appendChild(_styleEl)
    return _styleEl
  }

  /* ============== 系统主题同步 ============== */
  let systemListener: ((e: MediaQueryListEvent) => void) | null = null
  /**
   * 启用"跟随系统"模式:mode 由系统决定
   */
  function startFollowSystem() {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = (e: MediaQueryListEvent | MediaQueryList) => {
      mode.value = e.matches ? 'dark' : 'light'
    }
    apply(mq)
    systemListener = apply
    mq.addEventListener('change', systemListener)
  }
  /**
   * 停止跟随系统
   */
  function stopFollowSystem() {
    if (!systemListener) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.removeEventListener('change', systemListener)
    systemListener = null
  }

  /* ============== Actions ============== */
  /**
   * 设置主题
   * @param id 主题 id
   */
  function setTheme(id: ThemeId) {
    themeId.value = id
  }
  /**
   * 设置模式
   * @param m 模式
   */
  function setMode(m: ThemeMode) {
    mode.value = m
  }
  /**
   * 切换明暗
   */
  function toggleMode() {
    mode.value = mode.value === 'light' ? 'dark' : 'light'
  }
  /**
   * 设置自定义主色(自动切到 custom 主题)
   * @param hex #RRGGBB
   */
  function setCustomColor(hex: string) {
    customColor.value = hex
    themeId.value = 'custom'
  }
  /**
   * 重置为默认
   */
  function reset() {
    themeId.value = DEFAULT_THEME_ID
    mode.value = DEFAULT_MODE
    customColor.value = '#5B8FF9'
  }
  /**
   * 循环到下一个预设主题
   */
  function cycleTheme() {
    const idx = THEME_PRESETS.findIndex((t) => t.id === themeId.value)
    const next = THEME_PRESETS[(idx + 1) % (THEME_PRESETS.length - 1)] // 排除 custom
    themeId.value = next.id
  }

  /* ============== 监听 ============== */
  watch([themeId, mode, customColor], () => {
    applyToDOM()
    saveToStorage()
  }, { deep: true })

  return {
    /* state */
    themeId,
    mode,
    customColor,
    /* computed */
    themeMeta,
    primaryColor,
    isDark,
    themePresets,
    /* actions */
    setTheme,
    setMode,
    toggleMode,
    setCustomColor,
    reset,
    cycleTheme,
    startFollowSystem,
    stopFollowSystem,
    loadFromStorage,
    applyToDOM,
  }
})
