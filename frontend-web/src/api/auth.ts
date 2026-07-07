/**
 * 鉴权模块 API
 * 登录/注册/Token 刷新/登出
 */
import request from '@/utils/request'

/** 注册入参 */
export interface RegisterPayload {
  username: string
  password: string
  nickname?: string
  school?: string
  student_id?: string
}

/**
 * 用户注册
 */
export function register(data: RegisterPayload) {
  return request.post('/auth/register/', data)
}

/**
 * 用户登录
 */
export function login(data: { username: string; password: string }) {
  return request.post('/auth/login/', data)
}

/**
 * 刷新 JWT Token
 */
export function refreshToken(refresh: string) {
  return request.post('/auth/refresh/', { refresh })
}

/**
 * 登出
 */
export function logout() {
  return request.post('/auth/logout/')
}
