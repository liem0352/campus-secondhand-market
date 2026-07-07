/**
 * Vite 配置:所有运行时可调参数从 .env 读取,避免硬编码
 */
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  // 加载当前 mode 的环境变量(供下面用)
  const env = loadEnv(mode, process.cwd(), '')

  /** 解析数字,带默认 */
  const num = (v: string | undefined, fallback: number) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : fallback
  }

  /** 解析字符串,带默认 */
  const str = (v: string | undefined, fallback: string) =>
    v && v.length > 0 ? v : fallback

  const APP_PORT = num(env.VITE_APP_PORT, 3000)
  const API_BASE = str(env.VITE_API_BASE, '/api')
  const API_PROXY_TARGET = str(env.VITE_API_PROXY_TARGET, 'http://127.0.0.1:8000')

  return {
    plugins: [
      vue(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
        imports: ['vue', 'vue-router', 'pinia'],
        dts: 'src/auto-imports.d.ts',
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'src/components.d.ts',
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: APP_PORT,
      // C 端 H5 通过 /api 前缀代理,所有 API_BASE 子路径都转发到后端
      proxy: {
        [API_BASE]: {
          target: API_PROXY_TARGET,
          changeOrigin: true,
        },
      },
    },
    build: {
      // 主题系统会注入动态 CSS 变量,需关闭 cssCodeSplit 防止颜色变量被打散丢失
      cssCodeSplit: false,
      // 上传体积阈值告警(默认值偏小,大项目需放宽)
      chunkSizeWarningLimit: 1500,
    },
  }
})
