/**
 * 多主题预设
 * 每套主题包含:明亮 / 暗色 两套 CSS 变量集
 * 通过 data-theme + data-mode 两个属性切换:
 *  <html data-theme="warm-orange" data-mode="dark">
 *
 * 颜色变量命名规范:
 *  --color-primary        : 主色
 *  --color-primary-hover  : 主色 hover
 *  --color-primary-soft   : 主色弱化背景(chip)
 *  --color-bg-page        : 页面底色
 *  --color-bg-card        : 卡片底色
 *  --color-bg-section     : 分区底色
 *  --color-text-primary   : 主文本
 *  --color-text-secondary : 次文本
 *  --color-text-tertiary  : 三级文本
 *  --color-border-light   : 浅边框
 *  --color-border-base    : 普通边框
 *  --color-shadow         : 全局阴影 rgba
 *
 * 同步自 frontend-web/src/config/themes.ts
 */

/** 8 套预设主题(其中 custom 是用户自定义主色) */
export const THEME_PRESETS = [
  {
    id: 'warm-orange',
    name: '暖橙',
    label: 'Warm Orange',
    desc: '校园易物品牌色,亲和、温暖',
    light: { primary: '#F25C2A', secondary: '#FF8A5C', accent: '#E84B25' },
    dark:  { primary: '#FF8A5C', secondary: '#FFB07A', accent: '#FF6B45' },
  },
  {
    id: 'midnight-blue',
    name: '午夜蓝',
    label: 'Midnight Blue',
    desc: '专业、冷静、商务感强',
    light: { primary: '#2F80ED', secondary: '#56CCF2', accent: '#1B62C7' },
    dark:  { primary: '#56CCF2', secondary: '#6FB1FF', accent: '#2F80ED' },
  },
  {
    id: 'rose-pink',
    name: '玫瑰粉',
    label: 'Rose Pink',
    desc: '柔美、少女、年轻化',
    light: { primary: '#E94B82', secondary: '#FF8AA8', accent: '#C73066' },
    dark:  { primary: '#FF7AA0', secondary: '#FFA8C2', accent: '#E94B82' },
  },
  {
    id: 'forest-green',
    name: '森林绿',
    label: 'Forest Green',
    desc: '自然、清新、可持续',
    light: { primary: '#2F9E54', secondary: '#6FCF8B', accent: '#1F7A40' },
    dark:  { primary: '#6FCF8B', secondary: '#9DDDB1', accent: '#2F9E54' },
  },
  {
    id: 'royal-purple',
    name: '皇家紫',
    label: 'Royal Purple',
    desc: '神秘、高端、艺术感',
    light: { primary: '#7E57C2', secondary: '#B39DDB', accent: '#5E35B1' },
    dark:  { primary: '#B39DDB', secondary: '#D1C4E9', accent: '#7E57C2' },
  },
  {
    id: 'graphite',
    name: '石墨灰',
    label: 'Graphite',
    desc: '克制、高级、设计师向',
    light: { primary: '#37474F', secondary: '#78909C', accent: '#263238' },
    dark:  { primary: '#90A4AE', secondary: '#B0BEC5', accent: '#37474F' },
  },
  {
    id: 'sunset',
    name: '日落红',
    label: 'Sunset',
    desc: '热情、活力、节日感',
    light: { primary: '#E94560', secondary: '#FF8066', accent: '#C73050' },
    dark:  { primary: '#FF8066', secondary: '#FFA899', accent: '#E94560' },
  },
  {
    id: 'custom',
    name: '自定义',
    label: 'Custom',
    desc: '由用户自定义主色',
    light: { primary: '#5B8FF9', secondary: '#5AD8A6', accent: '#F6BD16' },
    dark:  { primary: '#5B8FF9', secondary: '#5AD8A6', accent: '#F6BD16' },
  },
]

/** 根据 id 取主题 */
export function getThemeById(id) {
  return THEME_PRESETS.find((t) => t.id === id) || THEME_PRESETS[0]
}

/** 默认主题 */
export const DEFAULT_THEME_ID = 'warm-orange'

/** 默认模式 */
export const DEFAULT_MODE = 'light'