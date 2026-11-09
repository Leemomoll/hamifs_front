import { defineStore } from 'pinia'
import {
  getToken,
  getUserInfo,
  removeToken,
  removeUserInfo,
  setToken,
  setUserInfo,
} from '@/utils/auth'
import { login as loginApi, logout as logoutApi, getInfo as getInfoApi } from '@/api/auth'
import { useTagsViewStore } from './tagsView'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    // 刷新后先用本地缓存顶上，等接口回来再覆盖
    userInfo: getUserInfo(),
    // 本次会话是否已拉过用户信息，路由守卫靠它判断要不要补拉
    loaded: false,
  }),

  getters: {
    name: state => state.userInfo?.name || state.userInfo?.username || '',
    avatar: state => state.userInfo?.avatar || '',
    roles: state => state.userInfo?.roles || [],
    permissions: state => state.userInfo?.permissions || [],
  },

  actions: {
    /** 登录：取 token -> 落本地 -> 拉用户信息 */
    async login({ username, password, rememberMe }) {
      const data = await loginApi({ username, password, rememberMe })
      // 后端约定返回 { token, expiresIn }；同时兼容直接返回字符串的情况
      const token = typeof data === 'string' ? data : data?.token
      if (!token) {
        throw new Error('登录失败：接口未返回 token')
      }
      this.token = token
      setToken(token)
      await this.getInfo()
    },

    /** 拉取当前登录用户信息 */
    async getInfo() {
      const info = await getInfoApi()
      this.userInfo = info || null
      this.loaded = true
      setUserInfo(this.userInfo)
      return this.userInfo
    },

    /** 退出：后端失败也不阻塞前端退出 */
    async logout() {
      try {
        await logoutApi()
      } catch {
        // 后端异常不影响前端退出
      } finally {
        this.reset()
      }
    },

    reset() {
      this.token = ''
      this.userInfo = null
      this.loaded = false
      removeToken()
      removeUserInfo()
      // 标签栏属于上个账号的痕迹，一并清掉
      try {
        useTagsViewStore().clearAll()
      } catch {
        // 标签栏 store 尚未初始化时忽略
      }
    },
  },
})
