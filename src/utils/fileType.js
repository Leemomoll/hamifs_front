import { Document, Folder, Picture, Tickets, VideoPlay, Headset } from '@element-plus/icons-vue'

/**
 * 根据文件名后缀推断类型信息，供图标与标签展示使用。
 * 返回 { type, icon, color, label }；未知类型按"文件"处理。
 */
const TYPE_MAP = [
  { type: 'folder', icon: Folder, color: '#e6a23c', label: '文件夹', exts: [] },
  {
    type: 'image',
    icon: Picture,
    color: '#409eff',
    label: '图片',
    exts: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
  },
  {
    type: 'word',
    icon: Document,
    color: '#2b7cd3',
    label: 'Word',
    exts: ['doc', 'docx'],
  },
  {
    type: 'pdf',
    icon: Document,
    color: '#e5484d',
    label: 'PDF',
    exts: ['pdf'],
  },
  {
    type: 'excel',
    icon: Tickets,
    color: '#217346',
    label: '表格',
    exts: ['xls', 'xlsx', 'csv'],
  },
  {
    type: 'video',
    icon: VideoPlay,
    color: '#9254de',
    label: '视频',
    exts: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  },
  {
    type: 'audio',
    icon: Headset,
    color: '#d46b08',
    label: '音频',
    exts: ['mp3', 'wav', 'flac', 'aac', 'ogg'],
  },
  {
    type: 'text',
    icon: Tickets,
    color: '#606266',
    label: '文本',
    exts: ['txt', 'md', 'json', 'log', 'yml', 'yaml', 'html', 'css', 'js'],
  },
]

/** 兜底类型 */
const FALLBACK = { type: 'file', icon: Document, color: '#909399', label: '文件' }

const extOf = name => (name.split('.').pop() || '').toLowerCase()

export function resolveFileType(name, isFolder = false) {
  if (isFolder) return TYPE_MAP[0]
  const ext = extOf(name)
  return TYPE_MAP.find(t => t.exts.includes(ext)) || FALLBACK
}

/** 字节数格式化为可读文本 */
export function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  if (!bytes) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log2(bytes) / 10), units.length - 1)
  const val = bytes / 2 ** (10 * i)
  return `${val >= 100 ? Math.round(val) : val.toFixed(1)} ${units[i]}`
}

/** 时间格式化为 YYYY-MM-DD HH:mm */
export function formatTime(ts) {
  if (!ts) return '-'
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 相对时间：刚刚 / n 分钟前 / n 小时前 / n 天前，超出 7 天回退日期 */
export function formatRelativeTime(ts) {
  if (!ts) return '-'
  const diff = Date.now() - ts
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 3600 * 1000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400 * 1000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 7 * 86400 * 1000) return `${Math.floor(diff / 86400000)} 天前`
  return formatTime(ts).slice(0, 10)
}
