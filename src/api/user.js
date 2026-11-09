import request from '@/utils/request'

/** 用户列表（分页） */
export function getUserList(params) {
  return request({ url: '/user/list', method: 'get', params })
}

/** 新增用户 */
export function createUser(data) {
  return request({ url: '/user', method: 'post', data })
}

/** 修改用户 */
export function updateUser(id, data) {
  return request({ url: `/user/${id}`, method: 'put', data })
}

/** 删除用户 */
export function deleteUser(id) {
  return request({ url: `/user/${id}`, method: 'delete' })
}
