/** Token 在 localStorage 中的 key */
export const TOKEN_KEY = 'hamifs_token'
/** 用户信息缓存的 key（刷新后先用它顶上，避免顶栏闪空） */
export const USER_KEY = 'hamifs_user'

/**
 * 鉴权总开关。
 * 后端没起 / 本地只想看页面时，把 .env.development 的 VITE_AUTH_ENABLED 设为 false，
 * 路由守卫会整体放行，401 也不会把人踢到登录页。
 * 变量不存在时按"开启"处理，保证生产环境默认安全。
 */
export const isAuthEnabled = () => String(import.meta.env.VITE_AUTH_ENABLED ?? 'true') !== 'false'

export const getToken = () => localStorage.getItem(TOKEN_KEY) || ''

export const setToken = token => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

export const getUserInfo = () => {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    // 脏数据直接丢掉，别让 JSON 解析异常拦住登录流程
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export const setUserInfo = info => {
  if (info) {
    localStorage.setItem(USER_KEY, JSON.stringify(info))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

export const removeUserInfo = () => {
  localStorage.removeItem(USER_KEY)
}
