/**
 * 加工工厂 API。
 * 当前对接 @/mock/factory（纯前端模拟），Java 后端就绪后换成 request() 调用。
 */
import * as mock from '@/mock/factory'

export const FIELD_TYPES = mock.FIELD_TYPES
export const listItems = mock.listItems
export const counts = mock.counts
export const createItem = mock.createItem
export const getItem = mock.getItem
export const renameItem = mock.renameItem
export const toggleStar = mock.toggleStar
export const removeItem = mock.removeItem
export const updateCell = mock.updateCell
export const addRow = mock.addRow
export const removeRows = mock.removeRows
export const addField = mock.addField
export const updateField = mock.updateField
export const removeField = mock.removeField
export const saveDoc = mock.saveDoc
