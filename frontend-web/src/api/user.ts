/**
 * 用户模块 API
 * 对应后端路由：/api/users/, /api/users/me/, /api/auth/
 */
import request from '@/utils/request'

/** 用户完整信息接口（校园二手场景扩展） */
export interface User {
  /** 用户 ID */
  id: number
  /** 登录用户名 */
  username: string
  /** 昵称/展示名 */
  nickname?: string
  /** 学校 */
  school: string
  /** 学号 */
  student_id: string
  /** 信用分（0-100） */
  credit_score: number
  /** 头像 URL */
  avatar: string
  /** 个人简介 */
  bio: string
  /** 是否校园认证 */
  is_certified: boolean
  /** 角色：user / admin */
  role: 'user' | 'admin'
  /** 注册时间 */
  created_at: string
}

/** 用户登录入参 */
export interface LoginPayload {
  username: string
  password: string
}

/** 登录响应：JWT + 用户信息 */
export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

/**
 * 用户登录
 * @param payload 用户名 + 密码
 */
export function login(payload: LoginPayload): Promise<LoginResponse> {
  return request.post('/auth/login/', payload)
}

/**
 * 刷新 Token
 * @param refresh 旧 refresh token
 */
export function refreshToken(refresh: string) {
  return request.post('/auth/refresh/', { refresh })
}

/**
 * 用户登出（让后端失效 token）
 */
export function logout() {
  return request.post('/auth/logout/')
}

/**
 * 获取当前登录用户信息
 */
export function fetchMe(): Promise<User> {
  return request.get('/users/me/')
}

/**
 * 更新个人资料
 * @param data 可更新字段：nickname / school / student_id / bio / avatar
 */
export function updateProfile(data: Partial<User>): Promise<User> {
  return request.patch('/users/me/', data)
}

/**
 * 上传头像（multipart/form-data）
 * @param file 头像文件
 * @returns 图片 URL
 */
export function uploadAvatar(file: File): Promise<{ url: string }> {
  const form = new FormData()
  form.append('file', file)
  return request.post('/upload/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  })
}

/**
 * 修改密码
 */
export function changePassword(payload: {
  old_password: string
  new_password: string
  confirm_password: string
}) {
  return request.post('/users/me/change-password/', payload)
}
