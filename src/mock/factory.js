/**
 * 加工工厂 Mock 服务：智能表格 / 表格 / 文档三类内容的纯前端模拟。
 *
 * 阶段目的：后端（Java）尚未就绪，先用它把 UI 完整跑起来。
 * 接口形状与未来后端保持一致（sheet_table / sheet_field / sheet_row 三表结构），
 * 后端就绪后只需把 @/api/factory 的实现换成 request()，页面代码不动。
 *
 * 数据模型：
 *   item.type = 'smart'（智能表格：字段定义 + 记录）
 *             | 'grid' （表格：等价于全文本字段的智能表格，列头 A/B/C…）
 *             | 'doc'  （文档：标题 + 正文）
 */

const STORE_KEY = 'hamifs_factory_v1'
/** 模拟接口延迟区间（毫秒） */
const LATENCY = [100, 220]

const now = () => Date.now()
const uid = () => `${now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
const delay = () =>
  new Promise(resolve => setTimeout(resolve, LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0])))
const clone = value => JSON.parse(JSON.stringify(value))

// ─── 字段类型与状态选项 ──────────────────────────────────────────────────────

export const FIELD_TYPES = [
  { value: 'text', label: '文本' },
  { value: 'number', label: '数字' },
  { value: 'date', label: '日期' },
  { value: 'select', label: '单选' },
]

// ─── 持久化 ──────────────────────────────────────────────────────────────────

let db = null

function load() {
  if (db) return db
  try {
    db = JSON.parse(localStorage.getItem(STORE_KEY))
  } catch {
    db = null
  }
  if (!db || !Array.isArray(db.items)) db = buildSeed()
  return db
}

function persist() {
  localStorage.setItem(STORE_KEY, JSON.stringify(db))
}

function touch(item) {
  item.updatedAt = now()
}

// ─── 种子数据 ────────────────────────────────────────────────────────────────

const DAY = 86400000
const HOUR = 3600000

function excelFields(n) {
  // 表格（Excel 模式）：列头用 A/B/C…，全部是文本字段
  return Array.from({ length: n }, (_, i) => ({
    id: `c${i}`,
    name: String.fromCharCode(65 + i),
    type: 'text',
    width: 150,
  }))
}

function buildSeed() {
  const t = now()
  return {
    items: [
      {
        id: 's_1',
        type: 'smart',
        name: '项目进度跟踪',
        starred: true,
        createdAt: t - 3 * DAY,
        updatedAt: t - 2 * HOUR,
        fields: [
          { id: 'f_1', name: '任务', type: 'text', width: 220 },
          {
            id: 'f_2',
            name: '状态',
            type: 'select',
            width: 120,
            options: [
              { id: 'o1', label: '未开始', color: '#909399' },
              { id: 'o2', label: '进行中', color: '#165dff' },
              { id: 'o3', label: '已完成', color: '#18a058' },
              { id: 'o4', label: '已延期', color: '#e6a23c' },
            ],
          },
          { id: 'f_3', name: '负责人', type: 'text', width: 110 },
          { id: 'f_4', name: '截止日期', type: 'date', width: 130 },
          {
            id: 'f_5',
            name: '优先级',
            type: 'select',
            width: 110,
            options: [
              { id: 'p3', label: '高', color: '#f56c6c' },
              { id: 'p2', label: '中', color: '#e6a23c' },
              { id: 'p1', label: '低', color: '#909399' },
            ],
          },
        ],
        rows: [
          {
            id: 'r_1',
            values: { f_1: '格式转换服务对接', f_2: 'o2', f_3: '我', f_4: t + 3 * DAY, f_5: 'p3' },
          },
          { id: 'r_2', values: { f_1: '知识库问答联调', f_2: 'o1', f_3: '', f_4: null, f_5: 'p2' } },
          {
            id: 'r_3',
            values: { f_1: '备忘录导出 PDF', f_2: 'o3', f_3: '我', f_4: t - 2 * DAY, f_5: 'p1' },
          },
        ],
      },
      {
        id: 'g_1',
        type: 'grid',
        name: '记账本',
        starred: false,
        createdAt: t - 5 * DAY,
        updatedAt: t - 1 * DAY,
        fields: excelFields(6),
        rows: [
          {
            id: 'r_1',
            values: { c0: '11月', c1: '项目', c2: '金额', c3: '备注' },
          },
          { id: 'r_2', values: { c0: '11/01', c1: '域名续费', c2: '55', c3: 'hamifs.cn' } },
          { id: 'r_3', values: { c0: '11/03', c1: '云服务器', c2: '89', c3: '轻量 2C4G' } },
          { id: 'r_4', values: {} },
          { id: 'r_5', values: {} },
        ],
      },
      {
        id: 'd_1',
        type: 'doc',
        name: 'RAG 实现要点笔记',
        starred: true,
        createdAt: t - 2 * DAY,
        updatedAt: t - 4 * HOUR,
        content:
          '# RAG 问答实现要点\n\n' +
          '1. 文档解析：PDF 用 PyMuPDF，Word 用 python-docx\n' +
          '2. 切块：按段落 / 标题分块，每块 300~800 字\n' +
          '3. 向量化后存 Chroma，检索时附带元数据（文档名、页码）\n' +
          '4. 回答时展示出处卡片，方便回溯原文\n' +
          '5. RAG 效果八成取决于解析与切块质量\n\n' +
          '（点击正文任意位置即可开始编辑，自动保存）',
      },
    ],
  }
}

// ─── 对外 API ────────────────────────────────────────────────────────────────

/** 列表：scope = all | mine | star | recent；type = all | smart | grid | doc */
export async function listItems({ scope = 'all', type = 'all' } = {}) {
  await delay()
  const data = load()
  let items = clone(data.items)
  if (type !== 'all') items = items.filter(it => it.type === type)
  if (scope === 'star') items = items.filter(it => it.starred)
  if (scope === 'recent') items = items.slice(0, 5)
  // mine 与 all 相同（当前单用户），保留 scope 便于后端接入
  items.sort((a, b) => b.updatedAt - a.updatedAt)
  return items
}

/** 各分类的数量徽标 */
export async function counts() {
  await delay()
  const items = load().items
  return {
    all: items.length,
    mine: items.length,
    star: items.filter(it => it.starred).length,
    recent: Math.min(5, items.length),
  }
}

/** 新建：type = smart | grid | doc */
export async function createItem({ type, name }) {
  await delay()
  const data = load()
  const t = now()
  const item = { id: uid(), type, name, starred: false, createdAt: t, updatedAt: t }
  if (type === 'smart') {
    item.fields = [
      { id: 'f_1', name: '名称', type: 'text', width: 220 },
      { id: 'f_2', name: '状态', type: 'select', width: 120, options: [
        { id: 'o1', label: '未开始', color: '#909399' },
        { id: 'o2', label: '进行中', color: '#165dff' },
        { id: 'o3', label: '已完成', color: '#18a058' },
      ] },
      { id: 'f_3', name: '备注', type: 'text', width: 180 },
    ]
    item.rows = [{ id: uid(), values: {} }]
  } else if (type === 'grid') {
    item.fields = excelFields(8)
    item.rows = Array.from({ length: 10 }, () => ({ id: uid(), values: {} }))
  } else {
    item.content = ''
  }
  data.items.unshift(item)
  persist()
  return clone(item)
}

export async function getItem(id) {
  await delay()
  const item = load().items.find(it => it.id === id)
  return item ? clone(item) : null
}

export async function renameItem(id, name) {
  await delay()
  const item = load().items.find(it => it.id === id)
  if (item) {
    item.name = name
    touch(item)
    persist()
  }
  return item ? clone(item) : null
}

export async function toggleStar(id) {
  await delay()
  const item = load().items.find(it => it.id === id)
  if (item) {
    item.starred = !item.starred
    persist()
  }
  return item ? clone(item) : null
}

export async function removeItem(id) {
  await delay()
  const data = load()
  data.items = data.items.filter(it => it.id !== id)
  persist()
}

// ─── 表格编辑（smart / grid 共用） ───────────────────────────────────────────

export async function updateCell(itemId, rowId, fieldId, value) {
  await delay()
  const item = load().items.find(it => it.id === itemId)
  const row = item?.rows.find(r => r.id === rowId)
  if (row) {
    row.values[fieldId] = value
    touch(item)
    persist()
  }
}

export async function addRow(itemId) {
  await delay()
  const item = load().items.find(it => it.id === itemId)
  if (!item) return null
  const row = { id: uid(), values: {} }
  item.rows.push(row)
  touch(item)
  persist()
  return clone(row)
}

export async function removeRows(itemId, rowIds) {
  await delay()
  const item = load().items.find(it => it.id === itemId)
  if (item) {
    item.rows = item.rows.filter(r => !rowIds.includes(r.id))
    touch(item)
    persist()
  }
}

export async function addField(itemId, { name, type = 'text' }) {
  await delay()
  const item = load().items.find(it => it.id === itemId)
  if (!item) return null
  const field = { id: uid(), name, type, width: 150 }
  if (type === 'select') {
    field.options = [
      { id: uid(), label: '选项一', color: '#165dff' },
      { id: uid(), label: '选项二', color: '#18a058' },
    ]
  }
  item.fields.push(field)
  touch(item)
  persist()
  return clone(field)
}

export async function updateField(itemId, fieldId, patch) {
  await delay()
  const item = load().items.find(it => it.id === itemId)
  const field = item?.fields.find(f => f.id === fieldId)
  if (field) {
    Object.assign(field, patch)
    touch(item)
    persist()
  }
}

export async function removeField(itemId, fieldId) {
  await delay()
  const item = load().items.find(it => it.id === itemId)
  if (item) {
    item.fields = item.fields.filter(f => f.id !== fieldId)
    touch(item)
    persist()
  }
}

// ─── 文档编辑 ────────────────────────────────────────────────────────────────

export async function saveDoc(itemId, content) {
  await delay()
  const item = load().items.find(it => it.id === itemId)
  if (item) {
    item.content = content
    touch(item)
    persist()
  }
}
