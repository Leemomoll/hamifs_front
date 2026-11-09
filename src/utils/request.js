import axios from 'axios'
import { ElMessage } from 'element-plus'
import { TOKEN_KEY, getToken, removeToken, isAuthEnabled } from '@/utils/auth'

// 兼容旧的引用路径：历史代码从 request 里 import TOKEN_KEY
export { TOKEN_KEY }

const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API || '/api',
  timeout: 15000,
})

/**
 * 错误提示去重：连点、并发请求同时失败时，同一条消息短时间内只弹一次，
 * 避免屏幕被同一个 toast 刷满。
 */
let lastMessage = ''
let lastMessageAt = 0

const notify = message => {
  const now = Date.now()
  if (message === lastMessage && now - lastMessageAt < 1500) return
  lastMessage = message
  lastMessageAt = now
  ElMessage.error(message)
}

/**
 * 401 / 403 的跳转出口。
 * 这里刻意用动态 import 拿 router：api → request → router 会形成静态循环依赖，
 * 放到实际触发时再异步加载即可绕开。
 */
let redirecting = false

const pushRoute = async target => {
  // 并发请求会同时报 401，只允许第一次发出跳转
  if (redirecting) return
  redirecting = true
  try {
    const { default: router } = await import('@/router')
    await router.push(target)
  } finally {
    // 留出路由切换的时间，避免这段时间内其它请求的 401 再次触发跳转
    setTimeout(() => {
      redirecting = false
    }, 300)
  }
}

/** 是否是登录/登出这类"自带 401 语义"的接口（账号密码错就是 401） */
const isAuthFreeRequest = config => !!config?.skipAuthRedirect

/** token 失效：清本地凭据后回登录页，并带上原地址方便登录后回跳 */
const handleUnauthorized = async message => {
  removeToken()
  notify(message)
  if (!isAuthEnabled()) return

  const { default: router } = await import('@/router')
  // 已经在登录页就别再跳，避免和守卫互相打架
  if (router.currentRoute.value.path === '/login') return

  const redirect = router.currentRoute.value.fullPath
  pushRoute({
    path: '/login',
    query: redirect && redirect !== '/login' ? { redirect } : {},
  })
}

/** 无权限：跳 403 页 */
const handleForbidden = message => {
  notify(message)
  if (!isAuthEnabled()) return
  pushRoute({ path: '/403' })
}

// 请求拦截：附加 token
service.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截：拆包 + 统一错误提示
service.interceptors.response.use(
  response => {
    const res = response.data
    // 非标准结构（如文件流）直接返回
    if (!res || typeof res !== 'object' || res.code === undefined) {
      return res
    }
    // 约定：与后端统一为 200 表示成功（不再兼容 0，避免后端混用导致误判）
    if (res.code === 200) {
      return res.data !== undefined ? res.data : res
    }

    const msg = res.message || '请求失败'
    const authFree = isAuthFreeRequest(response.config)

    if (res.code === 401) {
      if (!authFree) handleUnauthorized(msg || '登录已过期，请重新登录')
    } else if (res.code === 403) {
      if (!authFree) handleForbidden(msg || '没有权限访问该资源')
    } else {
      notify(msg)
    }

    return Promise.reject(new Error(msg))
  },
  error => {
    // 优先看 HTTP 状态码：Spring Security 的出口一定会落到这里
    const status = error.response?.status
    const body = error.response?.data
    // 只有自家信封 {code,message,data} 里的 message 才是给业务用户看的，
    // 框架原始错误体（可能是英文技术信息）不展示，改用固定中文文案
    const backendMsg = body && body.code !== undefined ? body.message : ''
    const msg = backendMsg || error.message
    const authFree = isAuthFreeRequest(error.config)

    if (error.code === 'ECONNABORTED') {
      notify('请求超时，请稍后重试')
    } else if (status === 401) {
      if (authFree) {
        // 登录接口的 401 = 账号密码错：交给页面内提示，不弹 toast、不跳转、不清 token
        return Promise.reject(new Error(backendMsg || '账号或密码错误'))
      }
      handleUnauthorized(backendMsg || '登录已过期，请重新登录')
    } else if (status === 403) {
      if (!authFree) handleForbidden(backendMsg || '没有权限访问该资源')
    } else if (status >= 500) {
      notify('服务器异常，请稍后重试')
    } else {
      notify(msg || '网络异常')
    }
    return Promise.reject(authFree && backendMsg ? new Error(backendMsg) : error)
  }
)

export default service
