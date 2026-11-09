import request from '@/utils/request'

/**
 * 登录，返回 { token, expiresIn }。
 * skipAuthRedirect：登录接口自己返回 401 时（账号密码错）不能被当成"会话过期"，
 * 否则会弹一堆"登录已过期"并把用户往外踢。由调用方在页面内提示。
 */
export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data,
    skipAuthRedirect: true,
  })
}

/** 获取当前登录用户信息 */
export function getInfo() {
  return request({ url: '/auth/info', method: 'get' })
}

/** 退出登录 */
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post',
    // 退出失败（token 已过期等）也不需要再弹"登录已过期"
    skipAuthRedirect: true,
  })
}
