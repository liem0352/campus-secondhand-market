/**
 * Axios 统一封装
 * - baseURL / timeout 来自 env 配置
 * - 自动注入 JWT Token
 * - 自动 401 刷新 + 重试
 * - 业务码(code)统一解包
 */
import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import env from '@/config/env'
import { AUTH_ENDPOINTS, joinUrl, ERROR_TEXT } from '@/constants'
import { APP_TEXT } from '@/constants/text'

const request = axios.create({
  baseURL: env.API_BASE,
  timeout: env.REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

/* ============== 去重 / 401 刷新 ============== */
// 避免并发 401 触发多次刷新 token：用 Promise 缓存正在进行的刷新动作。
let refreshing: Promise<string | null> | null = null
// 用于防止重复弹窗：相同 message 在短时间内只显示一次。
const recentErrorMessages = new Map<string, number>()
const ERROR_DEDUPE_MS = 1500
// 业务错误码:未登录 / token 过期
const AUTH_ERROR_CODES = [40100, 40101]

/**
 * 在指定时间窗口内对相同错误消息去重,避免 401 并发时弹十几个"账号已过期"
 * @param msg 错误提示
 */
function notify(msg: string) {
  const now = Date.now()
  const last = recentErrorMessages.get(msg) || 0
  if (now - last < ERROR_DEDUPE_MS) return
  recentErrorMessages.set(msg, now)
  ElMessage.error(msg)
}

/**
 * 清空本地登录态并跳转到登录页;避免循环跳转:仅在非登录页时执行
 */
function clearAuthAndRedirect() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user_info')
  const current = router.currentRoute.value
  if (current.name !== 'Login') {
    router.push({ name: 'Login', query: { redirect: current.fullPath } })
  }
}

/**
 * 尝试用 refresh token 换新的 access token;并发请求共用同一个 Promise
 * @returns 新 access token;refresh 失败时返回 null
 */
async function doRefreshToken(): Promise<string | null> {
  if (refreshing) return refreshing
  const refresh = localStorage.getItem('refresh_token')
  if (!refresh) return null
  const url = joinUrl(env.API_BASE, AUTH_ENDPOINTS.REFRESH)
  refreshing = axios
    .post(url, { refresh })
    .then((res) => {
      const newToken = res.data?.data?.access || res.data?.access
      const newRefresh = res.data?.data?.refresh || res.data?.refresh
      if (newToken) {
        localStorage.setItem('access_token', newToken)
        if (newRefresh) localStorage.setItem('refresh_token', newRefresh)
      }
      return newToken || null
    })
    .catch(() => null)
    .finally(() => {
      // 释放缓存,允许下一轮刷新
      setTimeout(() => {
        refreshing = null
      }, 0)
    })
  return refreshing
}

/* ============== 拦截器 ============== */
// 请求拦截器:自动附带 JWT Token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器:统一错误处理 + 自动解包 { code, message, data }
request.interceptors.response.use(
  (response) => {
    const res = response.data
    // 后端统一响应格式 { code, message, data }
    // - code !== 0 视为业务错误:弹 toast + 拒绝
    // - code === 0 或没有 code 字段:自动解包到 data,业务代码直接用 res.results
    if (res && typeof res === 'object' && 'code' in res && res.code !== 0) {
      if (AUTH_ERROR_CODES.includes(res.code) || response.status === 401) {
        clearAuthAndRedirect()
      } else {
        notify(res.message || ERROR_TEXT.REQUEST_FAILED)
      }
      return Promise.reject(new Error(res.message || ERROR_TEXT.REQUEST_FAILED))
    }
    // 解包:让业务代码直接拿到 payload(`{ results: [...] }` 或普通对象)
    // 非包装响应(如纯数组 / 无 code 字段的对象)原样返回,保持向后兼容
    if (res && typeof res === 'object' && 'data' in res && (res as any).code === 0) {
      return (res as any).data
    }
    return res
  },
  async (error: AxiosError<any>) => {
    const status = error.response?.status
    const originalConfig = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (status === 401) {
      // 已重试过仍失败:清理登录态,避免再次进入刷新流程
      if (originalConfig?._retry) {
        clearAuthAndRedirect()
        return Promise.reject(error)
      }
      // 尝试用 refresh token 换取新 access
      const newToken = await doRefreshToken()
      if (newToken && originalConfig) {
        originalConfig._retry = true
        // Axios v1 使用 AxiosHeaders;旧版是普通对象。这里用 set 方法兜底。
        try {
          (originalConfig.headers as any)?.set?.('Authorization', `Bearer ${newToken}`)
        } catch {
          // ignore
        }
        if (!originalConfig.headers) originalConfig.headers = {} as any
        ;(originalConfig.headers as any)['Authorization'] = `Bearer ${newToken}`
        return request(originalConfig)
      }
      // refresh 失败:清登录态 + 跳登录页
      clearAuthAndRedirect()
      return Promise.reject(error)
    }

    if (status === 403) {
      notify(ERROR_TEXT.FORBIDDEN)
    } else if (status === 404) {
      notify(ERROR_TEXT.NOT_FOUND)
    } else if (status && status >= 500) {
      notify(ERROR_TEXT.SERVER)
    } else {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        ERROR_TEXT.NETWORK
      notify(msg)
    }
    return Promise.reject(error)
  }
)

/* ============== 业务便捷方法 ============== */
/**
 * 业务错误异常(携带业务码,便于调用方按业务码处理)
 */
export class BizError extends Error {
  /** 业务码(后端 0 为成功) */
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
    this.name = 'BizError'
  }
}

/** 登录业务常量引用,避免循环 */
export const LOGIN_SUCCESS_MSG = APP_TEXT.LOGIN_SUCCESS

export default request
