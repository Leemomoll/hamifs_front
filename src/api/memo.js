/**
 * 备忘录 API。
 * 当前对接 @/mock/knowledge（纯前端 mock），后端就绪后换成 request() 调用。
 */
import * as mock from '@/mock/knowledge'

export const listMemos = mock.listMemos
export const addMemo = mock.addMemo
export const updateMemo = mock.updateMemo
export const removeMemo = mock.removeMemo
