/**
 * 主控台聚合数据。
 * 内部复用文档 / 记事接口做统计聚合，页面只拿结果；
 * 后端就绪后把每个函数换成 request() 调用即可，页面代码无需改动。
 */
import { listDocuments } from '@/api/doc'
import { listMemos } from '@/api/memo'
import { resolveFileType } from '@/utils/fileType'

/** 存储配额（mock）：2GB */
const STORAGE_QUOTA = 2 * 1024 ** 3

/** 图中类型的展示顺序，未列出的排最后 */
const TYPE_ORDER = ['word', 'pdf', 'excel', 'image', 'video', 'audio', 'text', 'file']

/**
 * 一次拉全量并聚合出主控台需要的所有数据。
 * @returns {Promise<{
 *   docTotal:number, totalSize:number, docTypes:Array,
 *   stats:{todo:{total:number,done:number}, journal:number, memo:number},
 *   recentDocs:Array, pinnedMemos:Array,
 *   storage:{used:number, quota:number, pct:number}
 * }>}
 */
export async function getDashboardData() {
  const [documents, memos] = await Promise.all([listDocuments({}), listMemos({})])

  // ─── 文档类型分布（数量 + 体积） ───────────────────────────────────────────
  const groups = new Map()
  let totalSize = 0
  documents.forEach(doc => {
    const info = resolveFileType(doc.name)
    totalSize += doc.size || 0
    const group =
      groups.get(info.type) || { type: info.type, label: info.label, color: info.color, count: 0, size: 0 }
    group.count += 1
    group.size += doc.size || 0
    groups.set(info.type, group)
  })

  const docTypes = [...groups.values()].sort(
    (a, b) =>
      (TYPE_ORDER.indexOf(a.type) + 1 || 99) - (TYPE_ORDER.indexOf(b.type) + 1 || 99) || b.count - a.count,
  )
  docTypes.forEach(g => {
    g.pct = documents.length ? g.count / documents.length : 0
  })

  // ─── 记事三类统计 ──────────────────────────────────────────────────────────
  const stats = {
    todo: { total: 0, done: 0 },
    journal: 0,
    memo: 0,
  }
  memos.forEach(m => {
    if (m.type === 'todo') {
      stats.todo.total += 1
      if (m.done) stats.todo.done += 1
    } else if (m.type === 'journal') {
      stats.journal += 1
    } else {
      stats.memo += 1
    }
  })

  // ─── 最近文档 / 置顶记事 ───────────────────────────────────────────────────
  const recentDocs = [...documents].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5)
  const pinnedMemos = memos.filter(m => m.pinned).slice(0, 3)

  return {
    docTotal: documents.length,
    totalSize,
    docTypes,
    stats,
    recentDocs,
    pinnedMemos,
    storage: {
      used: totalSize,
      quota: STORAGE_QUOTA,
      pct: totalSize / STORAGE_QUOTA,
    },
  }
}
