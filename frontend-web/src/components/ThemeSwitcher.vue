<!--
  主题切换器
  - 弹出层展示 8 套预设主色
  - 支持自定义主色(颜色选择器)
  - 顶部明暗模式开关
  - 跟随系统
-->
<template>
  <el-popover
    :width="THEME_TEXT.POPOVER_WIDTH"
    placement="bottom-end"
    trigger="click"
    popper-class="theme-popover"
  >
    <template #reference>
      <button class="theme-trigger" :title="triggerTitle" :aria-label="THEME_TEXT.TRIGGER_ARIA">
        <span class="theme-color-dot" :style="{ background: themeStore.primaryColor }" />
        <el-icon><Brush /></el-icon>
      </button>
    </template>

    <div class="theme-panel">
      <!-- 明暗模式 -->
      <div class="theme-row">
        <span class="row-label">{{ THEME_TEXT.ROW_MODE_LABEL }}</span>
        <el-radio-group v-model="modeProxy" size="small">
          <el-radio-button value="light">
            <el-icon><Sunny /></el-icon>
            {{ THEME_TEXT.MODE_LIGHT_BTN }}
          </el-radio-button>
          <el-radio-button value="dark">
            <el-icon><Moon /></el-icon>
            {{ THEME_TEXT.MODE_DARK_BTN }}
          </el-radio-button>
          <el-radio-button value="auto">
            <el-icon><Monitor /></el-icon>
            {{ THEME_TEXT.MODE_AUTO_BTN }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- 预设主题 -->
      <div class="theme-row">
        <span class="row-label">{{ THEME_TEXT.ROW_PRESET_LABEL }}</span>
        <div class="theme-grid">
          <button
            v-for="t in themeStore.themePresets"
            :key="t.id"
            class="theme-swatch"
            :class="{ active: themeStore.themeId === t.id }"
            :title="THEME_TEXT.SWATCH_TITLE(t.name, t.desc)"
            @click="onSwatchClick(t.id)"
          >
            <span
              class="swatch-color"
              :style="{ background: getSwatchColor(t) }"
            />
            <span class="swatch-name">{{ t.name }}</span>
            <el-icon v-if="themeStore.themeId === t.id" class="swatch-check"><Check /></el-icon>
          </button>
        </div>
      </div>

      <!-- 自定义主色 - 内嵌色板(直接在"自定义"色块上点开) -->
      <transition name="custom-fade">
        <div v-if="showCustomPicker" class="theme-row theme-row--picker">
          <div class="inline-picker">
            <!-- SV (饱和度/明度) 面板 -->
            <div
              ref="svPanelRef"
              class="sv-panel"
              :style="{ background: svPanelBg }"
              @mousedown="onSVPointerDown"
            >
              <div class="sv-white" />
              <div class="sv-black" />
              <div
                class="sv-thumb"
                :style="{ left: svPos.x + 'px', top: svPos.y + 'px' }"
              />
            </div>
            <!-- 色相 + 预览 + hex -->
            <div class="picker-controls">
              <div
                ref="hueRef"
                class="hue-slider"
                @mousedown="onHuePointerDown"
              >
                <div
                  class="hue-thumb"
                  :style="{ left: huePos + 'px' }"
                />
              </div>
              <div class="hex-row">
                <span class="hex-prefix">HEX</span>
                <input
                  v-model="hexInput"
                  class="hex-input"
                  maxlength="7"
                  @change="onHexChange"
                />
                <span
                  class="color-preview"
                  :style="{ background: currentColor }"
                />
              </div>
              <div class="picker-actions">
                <button class="picker-btn" @click="onPickerClear">
                  {{ THEME_TEXT.CUSTOM_PICKER_CLEAR }}
                </button>
                <button class="picker-btn picker-btn--primary" @click="onPickerConfirm">
                  {{ THEME_TEXT.CUSTOM_PICKER_CONFIRM }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- 重置 -->
      <div class="theme-row theme-row--actions">
        <button class="theme-reset-btn" @click="onReset">{{ THEME_TEXT.RESET_BTN }}</button>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
/**
 * 主题切换面板
 * - 浅色/深色/跟随 模式
 * - 8 套预设主色
 * - 自定义主色(色板选择)
 * - 持久化(由 store 自动处理)
 */
import { computed, ref, watch, onUnmounted, reactive, nextTick } from 'vue'
import { Brush, Sunny, Moon, Monitor, Check, ArrowDown } from '@element-plus/icons-vue'
import { useThemeStore } from '@/stores/theme'
import { THEME_TEXT } from '@/constants'
import type { ThemeId, ThemeMode, ThemeMeta } from '@/config/themes'

const themeStore = useThemeStore()

/* ============== 计算属性 / 代理 ============== */
const modeProxy = computed<ThemeMode | 'auto'>({
  get() {
    if (themeStore.isDark === false && !isFollowSystem.value) return 'light'
    if (themeStore.isDark === true && !isFollowSystem.value) return 'dark'
    return 'auto'
  },
  set(v) {
    if (v === 'auto') {
      startFollowSystem()
    } else {
      stopFollowSystem()
      themeStore.setMode(v as ThemeMode)
    }
  },
})

const customProxy = ref(themeStore.customColor)
watch(() => themeStore.customColor, (v) => (customProxy.value = v))

/**
 * 触发按钮的悬浮提示
 * 主题名 · 浅色/深色
 */
const triggerTitle = computed(() =>
  THEME_TEXT.TRIGGER_TITLE(
    themeStore.themeMeta.name,
    themeStore.isDark ? THEME_TEXT.MODE_DARK : THEME_TEXT.MODE_LIGHT
  )
)

/* ============== 跟随系统 ============== */
const isFollowSystem = ref(false)
let systemListener: ((e: MediaQueryListEvent) => void) | null = null

/**
 * 启动跟随系统
 */
function startFollowSystem() {
  if (typeof window === 'undefined' || !window.matchMedia) return
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const apply = (e: MediaQueryListEvent | MediaQueryList) => {
    themeStore.setMode(e.matches ? 'dark' : 'light')
  }
  apply(mq)
  systemListener = apply
  mq.addEventListener('change', systemListener)
  isFollowSystem.value = true
}

/**
 * 停止跟随系统
 */
function stopFollowSystem() {
  if (!systemListener) return
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.removeEventListener('change', systemListener)
  systemListener = null
  isFollowSystem.value = false
}

onUnmounted(stopFollowSystem)

/* ============== 交互 ============== */
/**
 * 获取色块显示色:
 * - 自定义主题:显示当前 customColor(已经过主题主色变换)
 * - 预设主题:跟随当前明暗模式显示对应色
 *   浅色 → t.light.primary / 深色 → t.dark.primary
 * 这样保证色块颜色 = 切换后页面真实主色,所见即所得
 */
function getSwatchColor(t: ThemeMeta): string {
  if (t.id === 'custom') return themeStore.primaryColor
  return themeStore.isDark ? t.dark.primary : t.light.primary
}

/**
 * 色块点击:
 * - 普通预设主题:直接切换
 * - "自定义":切换 + 打开/关闭内嵌色板
 */
function onSwatchClick(id: ThemeId) {
  if (id === 'custom') {
    // 自定义色块:点击切换主题 + 展开/收起色板
    if (themeStore.themeId !== 'custom') {
      // 首次点击:切到自定义主题
      themeStore.setCustomColor(themeStore.primaryColor)
    }
    showCustomPicker.value = !showCustomPicker.value
  } else {
    // 预设主题:直接切换并关闭色板
    themeStore.setTheme(id)
    showCustomPicker.value = false
  }
}

/**
 * 重置主题
 */
function onReset() {
  stopFollowSystem()
  themeStore.reset()
  // 重置后关闭内嵌色板
  showCustomPicker.value = false
  // 恢复 HSV/hex 到当前主题色
  syncFromCurrentColor()
}

/* ============== 内嵌自定义色板 ============== */
/**
 * 控制内嵌色板的展开
 */
const showCustomPicker = ref(false)

/** HSV 色彩空间(色相 0-360, 饱和度 0-100, 明度 0-100) */
const hsv = reactive({ h: 30, s: 90, v: 95 })

/** hex 输入字符串(带 #) */
const hexInput = ref('#F25C2A')

/** SV 面板尺寸 */
const SV_SIZE = 180

/** SV 面板 thumb 位置(SV 面板内像素坐标) */
const svPos = reactive({ x: SV_SIZE, y: 0 })

/** Hue 滑块 thumb 位置(0-SV_SIZE) */
const huePos = ref(15)

/** SV 面板 DOM 引用 */
const svPanelRef = ref<HTMLDivElement | null>(null)
/** Hue 滑块 DOM 引用 */
const hueRef = ref<HTMLDivElement | null>(null)

/* ============== 颜色转换 ============== */
/**
 * HSV -> RGB (0-255)
 */
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  s /= 100
  v /= 100
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

/**
 * RGB -> HSV
 */
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : (d / max) * 100
  const v = max * 100
  return { h, s, v }
}

/**
 * HSV -> Hex (e.g. "#F25C2A")
 */
function hsvToHex(h: number, s: number, v: number): string {
  const { r, g, b } = hsvToRgb(h, s, v)
  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase()
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Hex -> HSV
 */
function hexToHsv(hex: string): { h: number; s: number; v: number } | null {
  const m = /^#?([0-9A-Fa-f]{6})$/.exec(hex)
  if (!m) return null
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  return rgbToHsv(r, g, b)
}

/* ============== 响应式计算 ============== */
/**
 * 当前色(Hex)
 */
const currentColor = computed(() => hsvToHex(hsv.h, hsv.s, hsv.v))

/**
 * SV 面板的背景色 = 当前 hue 的纯色
 */
const svPanelBg = computed(() => hsvToHex(hsv.h, 100, 100))

/**
 * 从 hexInput 同步 HSV / svPos / huePos
 * 使用 DOM 实际尺寸(若 DOM 未挂载则用 SV_SIZE)
 */
function syncFromHex(hex: string) {
  const result = hexToHsv(hex)
  if (!result) return
  hsv.h = result.h
  hsv.s = result.s
  hsv.v = result.v
  // 优先使用面板实际尺寸,避免百分比与像素不匹配
  const panelRect = svPanelRef.value?.getBoundingClientRect()
  const panelW = panelRect?.width || SV_SIZE
  const panelH = panelRect?.height || panelW
  const hueW = hueRef.value?.getBoundingClientRect().width || SV_SIZE
  svPos.x = (hsv.s / 100) * panelW
  svPos.y = ((100 - hsv.v) / 100) * panelH
  huePos.value = (hsv.h / 360) * hueW
}

/**
 * 从当前主题色同步到 HSV / hex
 */
function syncFromCurrentColor() {
  const hex = themeStore.primaryColor
  hexInput.value = hex
  syncFromHex(hex)
}

/* ============== 拖拽事件 ============== */
/**
 * SV 面板按下:开始拖动
 */
function onSVPointerDown(e: MouseEvent) {
  e.preventDefault()
  updateSV(e)
  const onMove = (ev: MouseEvent) => updateSV(ev)
  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

/**
 * 更新 SV 位置 + 同步 HSV
 * 使用面板实际尺寸,避免 width: 100% 与固定 SV_SIZE 不匹配的问题
 */
function updateSV(e: MouseEvent) {
  const el = svPanelRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const w = rect.width
  const h = rect.height
  const x = Math.max(0, Math.min(w, e.clientX - rect.left))
  const y = Math.max(0, Math.min(h, e.clientY - rect.top))
  svPos.x = x
  svPos.y = y
  hsv.s = (x / w) * 100
  hsv.v = ((h - y) / h) * 100
  hexInput.value = currentColor.value
}

/**
 * Hue 滑块按下:开始拖动
 */
function onHuePointerDown(e: MouseEvent) {
  e.preventDefault()
  updateHue(e)
  const onMove = (ev: MouseEvent) => updateHue(ev)
  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

/**
 * 更新 Hue 位置 + 同步 HSV
 * 使用滑块实际尺寸
 */
function updateHue(e: MouseEvent) {
  const el = hueRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const width = rect.width
  const x = Math.max(0, Math.min(width, e.clientX - rect.left))
  huePos.value = x
  hsv.h = (x / width) * 360
  hexInput.value = currentColor.value
}

/**
 * hex 输入变化
 */
function onHexChange() {
  let hex = hexInput.value.trim()
  if (!hex.startsWith('#')) hex = '#' + hex
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    // 非法时回滚
    hexInput.value = currentColor.value
    return
  }
  hexInput.value = hex.toUpperCase()
  syncFromHex(hex)
}

/**
 * 清空自定义色:回到默认主题
 */
function onPickerClear() {
  showCustomPicker.value = false
  themeStore.reset()
  syncFromCurrentColor()
}

/**
 * 确定:把当前色应用到主题
 */
function onPickerConfirm() {
  showCustomPicker.value = false
  themeStore.setCustomColor(currentColor.value)
  syncFromCurrentColor()
}

/* ============== 生命周期钩子 ============== */
/**
 * 首次打开色板时,把当前色同步进 HSV
 */
watch(showCustomPicker, (v) => {
  if (v) {
    nextTick(() => syncFromCurrentColor())
  }
})

/* 组件挂载时同步一次 */
syncFromCurrentColor()
</script>

<style scoped>
/* 触发按钮 */
.theme-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 38px;
  height: 38px;
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-card);
  border-radius: var(--radius-full);
  cursor: pointer;
  color: var(--color-text-secondary);
  position: relative;
  transition: all var(--duration-fast) var(--ease-out);
}
.theme-trigger:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
  transform: translateY(-1px);
}
.theme-color-dot {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  box-shadow: 0 0 0 1.5px var(--color-bg-card);
}

/* 深色模式:让小色点的"白色环"也用主题卡片色,避免与圆形深色容器割裂 */
:root[data-mode='dark'] .theme-color-dot {
  box-shadow: 0 0 0 1.5px var(--color-bg-card),
    0 0 0 2.5px rgba(255, 255, 255, 0.05);
}

/* 深色模式:触发按钮的边框、玻璃感都更弱,与顶栏融合 */
:root[data-mode='dark'] .theme-trigger {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.06);
}
:root[data-mode='dark'] .theme-trigger:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
}

/* 面板内布局 */
.theme-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.theme-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.row-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}
.theme-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
}

/* 主题色块按钮 */
.theme-swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  background: var(--color-bg-section);
  border: 1.5px solid transparent;
  border-radius: var(--radius-base);
  cursor: pointer;
  position: relative;
  transition: all var(--duration-fast) var(--ease-out);
  outline: none;
}
.theme-swatch:hover {
  background: var(--color-bg-hover);
  transform: translateY(-1px);
}
.theme-swatch:focus-visible {
  border-color: var(--color-primary);
  background: var(--color-bg-hover);
  /* 跟其他元素同款焦点环:1.5px 实心 + 2px 软外发光 */
  box-shadow:
    0 0 0 1.5px var(--color-primary),
    0 0 0 3.5px rgba(var(--color-primary-rgb), 0.18);
}
.theme-swatch.active {
  border-color: var(--color-primary);
  background: var(--swatch-active-bg);
}
.theme-swatch.active:focus-visible {
  background: var(--swatch-active-bg);
}
.swatch-color {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}
.swatch-name {
  font-size: 11px;
  line-height: 1.4;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  white-space: nowrap;
  text-align: center;
}
.swatch-check {
  position: absolute;
  top: 2px;
  right: 2px;
  color: var(--color-primary);
  font-size: 14px;
}
/* 自定义主色 - 触发按钮(已废弃,色块本身即触发) */
/*
.custom-trigger { ... }
.custom-trigger:hover { ... }
.custom-trigger:focus-visible { ... }
.custom-trigger.active { ... }
.custom-trigger-color { ... }
.custom-trigger-text { ... }
.custom-trigger-arrow { ... }
.custom-trigger-arrow.is-open { ... }
*/

/* 内嵌色板容器 */
.theme-row--picker {
  padding: 8px 0 4px 0;
}
.inline-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: var(--color-bg-section);
  border-radius: var(--radius-base);
  border: 1px solid var(--color-border-light);
}

/* SV 面板 */
.sv-panel {
  position: relative;
  width: 100%;
  aspect-ratio: 1;          /* 强制正方形,保证宽高一致 */
  max-height: 200px;        /* 容器太宽时不至于拉得过长 */
  border-radius: var(--radius-sm);
  cursor: crosshair;
  user-select: none;
  overflow: hidden;
  border: 1px solid var(--color-border-light);
}
.sv-white {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, #fff, transparent);
}
.sv-black {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, #000, transparent);
}
.sv-thumb {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* 控制区 */
.picker-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hue-slider {
  position: relative;
  width: 100%;
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(
    to right,
    #ff0000 0%,
    #ffff00 17%,
    #00ff00 33%,
    #00ffff 50%,
    #0000ff 67%,
    #ff00ff 83%,
    #ff0000 100%
  );
  cursor: pointer;
  user-select: none;
  border: 1px solid var(--color-border-light);
}
.hue-thumb {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* hex + 预览行 */
.hex-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hex-prefix {
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-tertiary);
  letter-spacing: 0.5px;
  flex-shrink: 0;
}
.hex-input {
  flex: 1;
  height: 28px;
  padding: 0 8px;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-family: 'SF Mono', Menlo, monospace;
  outline: none;
  transition: border-color var(--duration-fast) var(--ease-out);
}
.hex-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.18);
}
.color-preview {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

/* 按钮行 */
.picker-actions {
  display: flex;
  gap: 6px;
}
.picker-btn {
  flex: 1;
  height: 28px;
  padding: 0 12px;
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  outline: none;
}
.picker-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
  border-color: var(--color-primary);
}
.picker-btn:focus-visible {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.18);
}
.picker-btn--primary {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.picker-btn--primary:hover {
  filter: brightness(1.1);
  color: #fff;
  border-color: var(--color-primary);
}

/* 展开/收起动画 */
.custom-fade-enter-active,
.custom-fade-leave-active {
  transition: opacity var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.custom-fade-enter-from,
.custom-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 重置按钮:统一 8px 圆角 + 玻璃质感,跟其他元素呼应 */
.theme-row--actions {
  margin-top: var(--space-1);
}
.theme-reset-btn {
  width: 100%;
  height: 32px;
  padding: 0 var(--space-3);
  background: var(--color-bg-section);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-base);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  outline: none;
  position: relative;
  box-shadow: inset 0 1px 0 var(--glass-hl-color);
}
.theme-reset-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}
.theme-reset-btn:focus-visible {
  border-color: var(--color-primary);
  box-shadow:
    inset 0 1px 0 var(--glass-hl-color),
    0 0 0 1.5px var(--color-primary),
    0 0 0 3.5px rgba(var(--color-primary-rgb), 0.18);
}

/* 弹层内的 radio button 样式在非 scoped 块中定义(因 popover 被 teleport) */
</style>

<!--
  弹层（el-popover）被 teleport 到 body 末尾,作用域样式无法生效。
  这里用非 scoped 块来覆盖 EP 默认的浅色背景和 radio 样式。
-->
<style>
.theme-popover.el-popper {
  background: var(--color-bg-card) !important;
  border: 1px solid var(--color-border-light) !important;
  border-radius: var(--radius-base) !important;
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.18),
    0 2px 8px rgba(0, 0, 0, 0.08) !important;
  color: var(--color-text-primary) !important;
  padding: 4px !important;
}
.theme-popover.el-popper .el-popper__arrow::before {
  background: var(--color-bg-card) !important;
  border-color: var(--color-border-light) !important;
}

/* ============ radio button 容器 + 按钮样式 ============ */
/* 容器:整体 8px 圆角 + 隐藏溢出,让内部按钮跟随容器裁切 */
.theme-popover .el-radio-group {
  display: flex !important;
  width: 100% !important;
  border-radius: var(--radius-base) !important;
  overflow: hidden !important;
  outline: none !important;
  background: var(--color-bg-section) !important;
  padding: 2px !important;
  gap: 2px !important;
}
/* 按钮:无圆角 + 主题感知背景 + 主题感知文字 */
.theme-popover .el-radio-button {
  flex: 1 1 0 !important;
  outline: none !important;
}
.theme-popover .el-radio-button__inner {
  width: 100% !important;
  border-radius: var(--radius-sm) !important;
  border: none !important;
  background: transparent !important;
  color: var(--color-text-secondary) !important;
  transition: all var(--duration-fast) var(--ease-out) !important;
  outline: none !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 4px !important;
}
/* hover:轻微亮起 */
.theme-popover .el-radio-button__inner:hover {
  background: var(--color-bg-hover) !important;
  color: var(--color-text-primary) !important;
}
/* checked 状态:主色填充 */
.theme-popover .el-radio-button__original-radio:checked + .el-radio-button__inner {
  background: var(--color-primary) !important;
  color: #fff !important;
  border-color: transparent !important;
  box-shadow: 0 2px 6px rgba(var(--color-primary-rgb), 0.3) !important;
}
/* focus-visible:内部 inset 焦点环,不会溢出 */
.theme-popover .el-radio-button__inner:focus-visible {
  box-shadow:
    inset 0 0 0 1.5px var(--color-primary),
    inset 0 0 0 4px rgba(var(--color-primary-rgb), 0.18) !important;
}

/* ============ color picker 弹出层 ============ */
/* 弹层内的 color picker 容器:无背景,直接显示色块按钮 */
.theme-popover .el-color-picker {
  background: transparent !important;
}
.theme-popover .el-color-picker__trigger {
  border-radius: var(--radius-sm) !important;
  border-color: var(--color-border-light) !important;
}
/* color picker 下拉面板:teleport 到 body 后,主题感知 */
.el-color-picker__panel,
.el-color-dropdown__panel,
.el-color-picker__panel-wrapper {
  background: var(--color-bg-card) !important;
  border: 1px solid var(--color-border-light) !important;
  border-radius: var(--radius-md) !important;
  color: var(--color-text-primary) !important;
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.18),
    0 2px 8px rgba(0, 0, 0, 0.08) !important;
}
/* 确保弹出层在父 popover 之上(嵌套 popover z-index 问题) */
.el-color-picker__panel-wrapper {
  z-index: 9999 !important;
}

/* color picker 内部所有元素深色感知 */
.el-color-picker__color {
  border-color: var(--color-border-light) !important;
}
.el-color-picker__color-inner {
  border-color: var(--color-border-base) !important;
}
/* 预设颜色按钮 */
.el-color-picker__color-btn {
  border-color: var(--color-border-light) !important;
}
/* 按钮组底部:清空 / 确定 */
.el-color-picker__footer {
  border-top: 1px solid var(--color-border-light) !important;
  background: var(--color-bg-card) !important;
}
.el-color-picker__btn {
  color: var(--color-text-secondary) !important;
  background: transparent !important;
  border: 1px solid var(--color-border-light) !important;
  border-radius: var(--radius-sm) !important;
  padding: 4px 12px !important;
  font-size: 12px !important;
  transition: all var(--duration-fast) var(--ease-out) !important;
}
.el-color-picker__btn:hover {
  background: var(--color-bg-hover) !important;
  color: var(--color-text-primary) !important;
  border-color: var(--color-primary) !important;
}
/* "确定" 按钮:主色填充 */
.el-color-picker__btn.is-primary,
.el-color-picker__btn--primary {
  background: var(--color-primary) !important;
  color: #fff !important;
  border-color: var(--color-primary) !important;
}
.el-color-picker__btn.is-primary:hover,
.el-color-picker__btn--primary:hover {
  filter: brightness(1.1) !important;
}
/* hex 输入框 */
.el-color-picker__input {
  background: var(--color-bg-section) !important;
  color: var(--color-text-primary) !important;
  border: 1px solid var(--color-border-light) !important;
  border-radius: var(--radius-sm) !important;
}
.el-color-picker__input:focus {
  border-color: var(--color-primary) !important;
  outline: none !important;
}
/* 预设颜色区标题 */
.el-color-picker__preset-color {
  border-color: var(--color-border-light) !important;
}
/* SV 面板和 hue 滑块容器(玻璃感) */
.el-color-picker__sv-panel,
.el-color-picker__hue-panel {
  border-radius: var(--radius-sm) !important;
}
</style>
