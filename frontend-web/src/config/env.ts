/**
 * 环境变量统一访问层
 * 集中管理 Vite 注入的 import.meta.env,避免散落硬编码
 */

/**
 * 解析字符串,提供默认值
 * @param value 原始值
 * @param fallback 默认值
 * @returns 字符串
 */
function str(value: string | undefined, fallback: string): string {
  return value && value.length > 0 ? value : fallback
}

/**
 * 解析数字,提供默认值
 * @param value 原始值
 * @param fallback 默认值
 * @returns 数字
 */
function num(value: string | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/**
 * 解析布尔,提供默认值
 * @param value 原始值
 * @param fallback 默认值
 * @returns 布尔
 */
function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback
  return value === 'true' || value === '1'
}

/** 运行时环境 */
export const APP_MODE = (import.meta.env.MODE as 'development' | 'production' | 'test') || 'development'

/** 是否为开发环境 */
export const IS_DEV = APP_MODE === 'development'

/** 是否为生产环境 */
export const IS_PROD = APP_MODE === 'production'

/** 后端 API 基础路径(由 Vite 代理转发,前端仅关心相对路径) */
export const API_BASE = str(import.meta.env.VITE_API_BASE, '/api')

/** 后端真实地址(Vite dev proxy target 用) */
export const API_PROXY_TARGET = str(import.meta.env.VITE_API_PROXY_TARGET, 'http://127.0.0.1:8000')

/** Dev Server 端口 */
export const APP_PORT = num(import.meta.env.VITE_APP_PORT, 3000)

/** 应用标题 */
export const APP_TITLE = str(import.meta.env.VITE_APP_TITLE, '校园易物 H5')

/** 管理后台地址 */
export const ADMIN_URL = str(import.meta.env.VITE_ADMIN_URL, 'http://localhost:5173/')

/** 文件上传最大体积(MB) */
export const UPLOAD_MAX_SIZE_MB = num(import.meta.env.VITE_UPLOAD_MAX_SIZE_MB, 10)

/** 全局默认超时(毫秒) */
export const REQUEST_TIMEOUT = num(import.meta.env.VITE_REQUEST_TIMEOUT, 15000)

/** 是否启用 Mock */
export const USE_MOCK = bool(import.meta.env.VITE_USE_MOCK, false)

/** 统一对外的 env 对象 */
export const env = {
  APP_MODE,
  IS_DEV,
  IS_PROD,
  API_BASE,
  API_PROXY_TARGET,
  APP_PORT,
  APP_TITLE,
  ADMIN_URL,
  UPLOAD_MAX_SIZE_MB,
  REQUEST_TIMEOUT,
  USE_MOCK,
}

export default env
