/**
 * 知识库 Mock 服务：纯前端内存数据 + localStorage 持久化。
 *
 * 阶段目的：后端（Java）尚未就绪，先用它把 UI 完整跑起来。
 * 所有方法返回 Promise 并模拟网络延迟，接口形状与未来后端保持一致，
 * 后端就绪后只需把 @/api/doc、@/api/memo 里的实现换成 request() 即可，页面代码不动。
 *
 * 说明：文件本体在真实系统里存对象存储（MinIO/OSS），这里只存元信息，
 * 个别条目带 preview 字段用于前端预览演示（图片地址 / 文本内容）。
 */

const STORE_KEY = 'hamifs_kb_v2'
/** 模拟接口延迟区间（毫秒） */
const LATENCY = [120, 260]

const now = () => Date.now()
const uid = () => `${now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
const delay = () =>
  new Promise(resolve => setTimeout(resolve, LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0])))

/** 深拷贝：持久化读出来的数据要和内存态隔离 */
const clone = value => JSON.parse(JSON.stringify(value))

// ─── 种子数据 ────────────────────────────────────────────────────────────────
// preview: { kind: 'image'|'text', ... } 仅用于演示前端预览能力

function buildSeed() {
  const t = now()
  return {
    folders: [
      { id: 'f_root_1', name: '工作文档', parentId: null, createdAt: t },
      { id: 'f_root_2', name: '学习笔记', parentId: null, createdAt: t },
      { id: 'f_root_3', name: '个人资料', parentId: null, createdAt: t },
      { id: 'f_sub_1', name: 'Java 后端', parentId: 'f_root_2', createdAt: t },
      { id: 'f_sub_2', name: '方案设计', parentId: 'f_root_1', createdAt: t },
    ],
    documents: [
      {
        id: 'd_1',
        name: '个人智能文档与知识库系统-方案设计.docx',
        size: 384 * 1024,
        folderId: 'f_sub_2',
        starred: true,
        tags: ['方案'],
        createdAt: t - 86400000,
        updatedAt: t - 3600000,
      },
      {
        id: 'd_3',
        name: 'RAG 问答实现要点.md',
        size: 12 * 1024,
        folderId: 'f_sub_1',
        starred: true,
        tags: ['AI', '笔记'],
        createdAt: t - 3 * 86400000,
        updatedAt: t - 7200000,
        preview: {
          kind: 'text',
          content:
            '# RAG 问答实现要点\n\n1. 文档解析：PDF 用 PyMuPDF，Word 用 python-docx\n2. 切块：按段落/标题分块，每块 300~800 字\n3. 向量化后存 Chroma，检索时带元数据\n4. 回答时附带出处（文档名 + 片段）\n5. RAG 效果八成取决于解析与切块质量',
        },
      },
      {
        id: 'd_4',
        name: '2026 年度目标.txt',
        size: 3 * 1024,
        folderId: 'f_root_3',
        starred: false,
        tags: ['备忘'],
        createdAt: t - 5 * 86400000,
        updatedAt: t - 5 * 86400000,
        preview: { kind: 'text', content: '1. 完成知识库系统 v1.0\n2. 格式转换工具开源\n3. 接入智能问答' },
      },
      {
        id: 'd_5',
        name: '系统架构图.pdf',
        size: 820 * 1024,
        folderId: 'f_sub_2',
        starred: false,
        tags: ['架构'],
        createdAt: t - 6 * 86400000,
        updatedAt: t - 6 * 86400000,
      },
      {
        id: 'd_6',
        name: '会议记录-周会.md',
        size: 6 * 1024,
        folderId: 'f_root_1',
        starred: false,
        tags: [],
        createdAt: t - 7 * 86400000,
        updatedAt: t - 7 * 86400000,
        preview: { kind: 'text', content: '# 周会记录\n\n- 文档中心 UI 完成\n- 备忘录模块排期\n- 后端接口对齐' },
      },
    ],
    memos: [
      // type: 'memo' 备忘（默认） / 'todo' 待办（带 done 完成态） / 'journal' 手记
      {
        id: 'm_1',
        type: 'todo',
        title: '买服务器',
        content: '轻量云服务器 2C4G，一年一百多，部署 MySQL + MinIO + 前后端。',
        tags: ['部署'],
        pinned: true,
        done: false,
        createdAt: t - 3600000,
        updatedAt: t - 1800000,
      },
      {
        id: 'm_2',
        type: 'memo',
        title: '格式转换工具选型',
        content: 'LibreOffice headless 转 PDF 还原度最高；Pandoc 覆盖 md/html 互转；包一层 FastAPI 即可。',
        tags: ['工具', '开源'],
        pinned: false,
        createdAt: t - 2 * 86400000,
        updatedAt: t - 2 * 86400000,
      },
      {
        id: 'm_3',
        type: 'journal',
        title: 'RAG 切块参数记录',
        content: 'chunk 512 字、overlap 64 字效果最好，等真实语料再调。',
        tags: ['AI'],
        pinned: false,
        createdAt: t - 4 * 86400000,
        updatedAt: t - 3 * 86400000,
      },
      {
        id: 'm_4',
        type: 'todo',
        title: '主控台扇形图数据口径',
        content: '按文档类型统计数量与体积，类型复用 resolveFileType 的口径。',
        tags: ['前端'],
        pinned: false,
        done: true,
        createdAt: t - 6 * 3600000,
        updatedAt: t - 5 * 3600000,
      },
      {
        id: 'm_5',
        type: 'journal',
        title: '周中手记',
        content: '把待办、手记、备忘统一收进个人记事里，主控台只做汇总展示。',
        tags: [],
        pinned: false,
        createdAt: t - 86400000,
        updatedAt: t - 86400000,
      },
    ],
  }
}

// ─── 存取 ────────────────────────────────────────────────────────────────────

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return normalize(JSON.parse(raw))
  } catch {
    localStorage.removeItem(STORE_KEY)
  }
  const seed = buildSeed()
  persist(seed)
  return seed
}

/** 老版本数据兼容：补齐备忘录的 type / done 字段 */
function normalize(data) {
  data.memos?.forEach(m => {
    if (!m.type) m.type = 'memo'
    if (m.type === 'todo' && typeof m.done !== 'boolean') m.done = false
  })
  return data
}

function persist(db) {
  localStorage.setItem(STORE_KEY, JSON.stringify(db))
}

const db = load()

// ─── 文件夹 ──────────────────────────────────────────────────────────────────

export function listFolders() {
  return delay().then(() => clone(db.folders))
}

export function addFolder(name, parentId = null) {
  const folder = { id: uid(), name, parentId, createdAt: now() }
  db.folders.push(folder)
  persist(db)
  return delay().then(() => clone(folder))
}

export function renameFolder(id, name) {
  const folder = db.folders.find(f => f.id === id)
  if (!folder) return Promise.reject(new Error('文件夹不存在'))
  folder.name = name
  persist(db)
  return delay().then(() => clone(folder))
}

export function removeFolder(id) {
  const hasChildren = db.folders.some(f => f.parentId === id)
  const hasDocs = db.documents.some(d => d.folderId === id)
  if (hasChildren || hasDocs) {
    return Promise.reject(new Error('文件夹不为空，请先清空内容'))
  }
  db.folders = db.folders.filter(f => f.id !== id)
  persist(db)
  return delay()
}

// ─── 文档 ────────────────────────────────────────────────────────────────────

/**
 * 文档列表。
 * @param {{folderId?: string|null, keyword?: string, tag?: string, starred?: boolean}} query
 * folderId 传 null 表示"根目录"，不传或传 undefined 表示"全部"
 */
export function listDocuments(query = {}) {
  const { folderId, keyword = '', tag = '', starred } = query
  return delay().then(() => {
    let list = clone(db.documents)
    if (folderId !== undefined) {
      list = list.filter(d => d.folderId === folderId)
    }
    if (keyword) {
      list = list.filter(d => d.name.toLowerCase().includes(keyword.toLowerCase()))
    }
    if (tag) {
      list = list.filter(d => d.tags.includes(tag))
    }
    if (starred !== undefined) {
      list = list.filter(d => d.starred === starred)
    }
    // 更新的在前，置顶优先
    list.sort((a, b) => b.updatedAt - a.updatedAt)
    return list
  })
}

/** 模拟上传：前端传入 File 对象数组（或已构造好的元信息），落一条元数据 */
export function uploadDocuments(files, folderId = null) {
  const added = files.map(file => ({
    id: uid(),
    name: file.name,
    size: file.size,
    folderId,
    starred: false,
    tags: [],
    createdAt: now(),
    updatedAt: now(),
    // 图片走本地 blob 地址即可真实预览
    preview: file.type?.startsWith('image/') ? { kind: 'image', src: URL.createObjectURL(file) } : undefined,
  }))
  db.documents.push(...added)
  persist(db)
  return delay().then(() => clone(added))
}

export function renameDocument(id, name) {
  const doc = db.documents.find(d => d.id === id)
  if (!doc) return Promise.reject(new Error('文件不存在'))
  doc.name = name
  doc.updatedAt = now()
  persist(db)
  return delay().then(() => clone(doc))
}

export function removeDocument(id) {
  db.documents = db.documents.filter(d => d.id !== id)
  persist(db)
  return delay()
}

export function toggleStarDocument(id) {
  const doc = db.documents.find(d => d.id === id)
  if (!doc) return Promise.reject(new Error('文件不存在'))
  doc.starred = !doc.starred
  persist(db)
  return delay().then(() => doc.starred)
}

// ─── 备忘录 ──────────────────────────────────────────────────────────────────

/**
 * 备忘录列表（个人记事）。
 * @param {{keyword?: string, type?: ''|'memo'|'todo'|'journal'}} query
 * type 传空表示全部类型
 */
export function listMemos(query = {}) {
  const { keyword = '', type = '' } = query
  return delay().then(() => {
    let list = clone(db.memos)
    if (type) {
      list = list.filter(m => m.type === type)
    }
    if (keyword) {
      const kw = keyword.toLowerCase()
      list = list.filter(m => m.title.toLowerCase().includes(kw) || m.content.toLowerCase().includes(kw))
    }
    // 置顶在前，组内按更新时间倒序
    list.sort((a, b) => b.pinned - a.pinned || b.updatedAt - a.updatedAt)
    return list
  })
}

export function addMemo(data = {}) {
  const type = data.type || 'memo'
  const memo = {
    id: uid(),
    type,
    title: data.title || '无标题备忘',
    content: data.content || '',
    tags: data.tags || [],
    pinned: false,
    done: type === 'todo' ? false : undefined,
    createdAt: now(),
    updatedAt: now(),
  }
  db.memos.unshift(memo)
  persist(db)
  return delay().then(() => clone(memo))
}

export function updateMemo(id, data = {}) {
  const memo = db.memos.find(m => m.id === id)
  if (!memo) return Promise.reject(new Error('备忘录不存在'))
  Object.assign(memo, data, { updatedAt: now() })
  persist(db)
  return delay().then(() => clone(memo))
}

export function removeMemo(id) {
  db.memos = db.memos.filter(m => m.id !== id)
  persist(db)
  return delay()
}

/** 收集文档里已使用的全部标签（做筛选下拉） */
export function listAllTags() {
  return delay().then(() => {
    const set = new Set()
    db.documents.forEach(d => d.tags.forEach(tag => set.add(tag)))
    db.memos.forEach(m => m.tags.forEach(tag => set.add(tag)))
    return [...set]
  })
}
