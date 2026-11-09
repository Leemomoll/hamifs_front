/**
 * 文档中心 API。
 * 当前对接 @/mock/knowledge（纯前端 mock），后端就绪后把每个函数的实现
 * 换成 request() 调用即可，页面代码无需改动。
 */
import * as mock from '@/mock/knowledge'

export const listFolders = mock.listFolders
export const addFolder = mock.addFolder
export const renameFolder = mock.renameFolder
export const removeFolder = mock.removeFolder

export const listDocuments = mock.listDocuments
export const uploadDocuments = mock.uploadDocuments
export const renameDocument = mock.renameDocument
export const removeDocument = mock.removeDocument
export const toggleStarDocument = mock.toggleStarDocument
export const listAllTags = mock.listAllTags
