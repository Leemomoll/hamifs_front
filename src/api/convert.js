/**
 * 格式转换 API。
 * 当前对接 @/mock/convert（纯前端模拟），Python 转换服务就绪后换成 request() 调用。
 */
import * as mock from '@/mock/convert'

export const CONVERSION_OPTIONS = mock.CONVERSION_OPTIONS
export const subscribeTasks = mock.subscribeTasks
export const createConversion = mock.createConversion
export const clearFinished = mock.clearFinished
export const extOf = mock.extOf
