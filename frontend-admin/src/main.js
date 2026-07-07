/**
 * 平台管理后台 · 应用入口
 * 职责：
 * 1. 加载全局 design token 样式（./style.css）
 * 2. 注册 Vue、Pinia、Vue Router、Element Plus 国际化
 * 3. 注册 Element Plus Icons（按需使用的图标在业务组件中按需 import，避免打包膨胀）
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

// 全局 design token（与 frontend-web 卖家台保持一致，支持 8 主题 + 深浅模式）
import './style.css'
// Liquid Glass 全局设计 Token 与工具类
import './styles/liquid-glass.css'

import App from './App.vue'
import router from './router'

import { useThemeStore } from './stores/theme'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn, size: 'default' })

app.mount('#app')

/* ============== 主题初始化 ==============
 * 必须在 Pinia 安装完成后调用,因为 store 依赖 pinia
 */
const themeStore = useThemeStore()
// 1. 从 localStorage 恢复
themeStore.loadFromStorage()
// 2. 立即把当前主题应用到 <html>(避免刷新时主题闪烁)
themeStore.applyToDOM()
