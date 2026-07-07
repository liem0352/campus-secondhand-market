/**
 * 用户 Pinia Store
 * 集中管理 token、用户信息、信用分等
 * 与 api/user.ts 配套使用
 */
import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi } from '@/api/auth'
import { fetchMe, updateProfile as updateProfileApi, type User } from '@/api/user'
import router from '@/router'

export const useUserStore = defineStore('user', {
  state: () => ({
    /** JWT 访问令牌 */
    token: localStorage.getItem('access_token') || '',
    /** 当前用户信息（可能为 null，未登录） */
    user: null as User | null,
  }),

  getters: {
    /** 是否已登录 */
    isLoggedIn: (state) => !!state.token,
    /** 是否管理员 */
    isAdmin: (state) => state.user?.role === 'admin',
    /** 昵称/展示名（用于顶栏） */
    nickname: (state) => state.user?.nickname || state.user?.username || '',
    /** 信用分（默认 0） */
    creditScore: (state) => state.user?.credit_score ?? 0,
  },

  actions: {
    /**
     * 用户登录
     * @param username 用户名
     * @param password 密码
     */
    async login(username: string, password: string) {
      const res: any = await loginApi({ username, password })
      // 后端响应统一封装在 data 中
      const payload = res.data || res
      this.token = payload.access
      this.user = payload.user
      localStorage.setItem('access_token', payload.access)
      if (payload.refresh) {
        localStorage.setItem('refresh_token', payload.refresh)
      }
      localStorage.setItem('user_info', JSON.stringify(payload.user))
      return payload
    },

    /**
     * 从后端拉取最新用户信息
     */
    async fetchProfile() {
      const res: any = await fetchMe()
      this.user = res.data || res
      localStorage.setItem('user_info', JSON.stringify(this.user))
      return this.user
    },

    /**
     * 更新个人资料
     * @param data 可更新字段
     */
    async updateProfile(data: Parameters<typeof updateProfileApi>[0]) {
      const res: any = await updateProfileApi(data)
      this.user = res.data || res
      localStorage.setItem('user_info', JSON.stringify(this.user))
      return this.user
    },

    /**
     * 退出登录
     * 清空 token + user，重定向到登录页
     */
    async logout() {
      try {
        await logoutApi()
      } catch {
        // 即便后端登出失败也要清空本地状态
      }
      this.token = ''
      this.user = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_info')
      router.push('/login')
    },

    /**
     * 从 localStorage 恢复用户信息（用于刷新页面）
     */
    restoreUser() {
      const saved = localStorage.getItem('user_info')
      if (saved) {
        try {
          this.user = JSON.parse(saved)
        } catch {
          this.user = null
        }
      }
    },
  },
})
