/**
 * Axios 请求封装
 * 特性：
 * - 自动注入 JWT
 * - 统一错误处理（ElMessage 提示）
 * - 401 自动登出并跳登录
 * - 兼容 DRF 标准响应（{ code, message, data }）与裸数据
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

/**
 * 创建 axios 实例
 * - baseURL 优先使用 VITE_API_BASE_URL，否则使用 /api（依赖 vite proxy 转发到后端）
 * - timeout 30s 适配大文件/批量操作
 */
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
})

/**
 * 请求拦截器
 * - 注入 Authorization: Bearer <token>
 * - 多文件上传时透传 Content-Type（让浏览器自动生成 boundary）
 */
request.interceptors.request.use(
  (config) => {
    const store = useUserStore()
    if (store.token) {
      config.headers.Authorization = `Bearer ${store.token}`
    }
    // 文件上传场景：若 data 是 FormData，移除默认 Content-Type
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (err) => Promise.reject(err)
)

/**
 * 响应拦截器
 * - DRF 标准响应 { code, message, data } 解包
 * - 401 -> 登出并跳登录
 * - 其它错误 -> 统一 ElMessage 提示
 */
request.interceptors.response.use(
  (res) => {
    const body = res.data
    // 兼容 DRF 标准返回
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0 || body.code === 200) {
        return body.data !== undefined ? body.data : body
      }
      ElMessage.error(body.message || '请求失败')
      return Promise.reject(new Error(body.message || '请求失败'))
    }
    return body
  },
  (err) => {
    const status = err.response?.status
    if (status === 401) {
      ElMessage.warning('登录已过期，请重新登录')
      useUserStore().logout()
      router.push('/login')
    } else if (status === 403) {
      ElMessage.error('您没有权限执行该操作')
    } else if (status === 404) {
      ElMessage.error('资源不存在')
    } else if (status >= 500) {
      ElMessage.error('服务器开小差了，请稍后再试')
    } else {
      const msg = err.response?.data?.message || err.response?.data?.detail || err.message
      ElMessage.error(msg || '网络异常')
    }
    return Promise.reject(err)
  }
)

export default request
