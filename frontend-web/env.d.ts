/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ApiResult<T = any> {
  code: number
  message: string
  data: T
}

interface PageResult<T = any> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
