import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import './style.css'
// Liquid Glass 全局设计 Token 与工具类
import './styles/liquid-glass.css'

import { useThemeStore } from './stores/theme'

const app = createApp(App)

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

app.mount('#app')

/* ============== 主题初始化 ==============
 * 必须在 Pinia 安装完成后调用,因为 store 依赖 pinia
 */
const themeStore = useThemeStore()
// 1. 从 localStorage 恢复
themeStore.loadFromStorage()
// 2. 立即把当前主题应用到 <html>(避免刷新时主题闪烁)
themeStore.applyToDOM()
