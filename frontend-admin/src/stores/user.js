/**
 * 管理后台 · 管理员账户 Pinia store
 * - token 持久化到 localStorage（key: token）
 * - user 持久化到 localStorage（key: admin_user）
 * - 暴露 login / fetchProfile / logout 三个核心 action
 */
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { login as loginApi, getMe } from '@/api'
import request from '@/api/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    /** JWT 访问令牌 */
    token: localStorage.getItem('token') || '',
    /** 当前管理员用户信息 */
    user: JSON.parse(localStorage.getItem('admin_user') || 'null'),
  }),

  getters: {
    /** 是否已登录 */
    isLoggedIn: (s) => !!s.token,
    /** 是否为管理员 */
    isAdmin: (s) => s.user?.role === 'admin' || s.user?.is_staff === true,
    /** 显示名（昵称 -> 用户名 -> '管理员'） */
    displayName: (s) => s.user?.nickname || s.user?.username || '管理员',
  },

  actions: {
    /**
     * 管理员登录
     * @param {Object} form { username, password }
     * 后端返回约定（DRF SimpleJWT）：{ access, refresh, user }
     * 也兼容自定义格式：{ code: 0, data: { access, user } }
     */
    async login(form) {
      const res = await loginApi(form)
      // 兼容两种返回：扁平 vs 嵌套
      const payload = res?.access ? res : res?.data || res
      this.token = payload.access || payload.token || ''
      this.user = payload.user || payload.admin || null
      if (!this.token) {
        throw new Error('登录响应缺少 access token')
      }
      if (this.user && this.user.role !== 'admin' && !this.user.is_staff) {
        this.logout()
        throw new Error('仅管理员可登录管理后台')
      }
      // 持久化
      localStorage.setItem('token', this.token)
      localStorage.setItem('admin_user', JSON.stringify(this.user || {}))
      return this.user
    },

    /**
     * 拉取当前管理员资料
     * 用于刷新 user 信息（角色、头像、昵称等）
     */
    async fetchProfile() {
      try {
        const res = await getMe()
        const data = res?.data || res
        this.user = data
        localStorage.setItem('admin_user', JSON.stringify(this.user))
      } catch (e) {
        // 拉取失败不影响登录态
        console.warn('[userStore] fetchProfile failed', e)
      }
      return this.user
    },

    /**
     * 测试当前 JWT 是否仍有效（用于后台"自检"）
     */
    async ping() {
      try {
        await request({ url: '/admin/dashboard/', method: 'GET' })
        return true
      } catch (e) {
        return false
      }
    },

    /**
     * 退出登录：清空 store + localStorage
     */
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('admin_user')
    },
  },
})
