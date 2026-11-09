import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { constantRoutes, notFoundRoute } from './routes'
import { getToken, isAuthEnabled } from '@/utils/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...constantRoutes, notFoundRoute],
  scrollBehavior: () => ({ top: 0 }),
})

const baseTitle = import.meta.env.VITE_APP_TITLE || 'Hamifs'

/** 不需要登录就能访问的白名单 */
const WHITE_LIST = ['/login', '/403', '/404']

router.beforeEach(async (to, from, next) => {
  document.title = to.meta?.title ? `${to.meta.title} - ${baseTitle}` : baseTitle

  // 鉴权总开关关闭：后端没起时也能正常看页面
  if (!isAuthEnabled()) {
    next()
    return
  }

  // 已登录时不用再看登录页，直接回首页
  if (to.path === '/login') {
    if (getToken()) {
      next({ path: '/dashboard/index', replace: true })
      return
    }
    next()
    return
  }

  if (WHITE_LIST.includes(to.path)) {
    next()
    return
  }

  const token = getToken()
  if (!token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 有 token 但信息还没拉过（典型场景：刷新页面）
  const userStore = useUserStore()
  if (!userStore.loaded) {
    try {
      await userStore.getInfo()
    } catch {
      // 401 的跳转由 request 拦截器负责，这里兜底网络异常等拿不到用户信息的情况
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
  }

  next()
})

export default router
