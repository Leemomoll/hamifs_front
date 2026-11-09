/**
 * 格式转换 Mock 服务。
 * 模拟"提交任务 → 排队 → 转换中（进度推进）→ 完成/失败"的完整生命周期，
 * 接口形状与未来 Python 转换服务保持一致，后端就绪后换 @/api/convert 实现即可。
 * 任务状态仅存内存，刷新后清空（转换是短生命周期数据，无需持久化）。
 */

const LATENCY = 150

/** 支持的转换方向：key = `${from}>${to}` */
export const CONVERSION_OPTIONS = [
  { from: 'docx', to: 'pdf', label: 'Word → PDF' },
  { from: 'docx', to: 'md', label: 'Word → Markdown' },
  { from: 'docx', to: 'html', label: 'Word → HTML' },
  { from: 'pdf', to: 'docx', label: 'PDF → Word' },
  { from: 'pdf', to: 'png', label: 'PDF → 图片' },
  { from: 'md', to: 'docx', label: 'Markdown → Word' },
  { from: 'md', to: 'pdf', label: 'Markdown → PDF' },
  { from: 'xlsx', to: 'csv', label: '表格 → CSV' },
  { from: 'html', to: 'pdf', label: 'HTML → PDF' },
]

let tasks = []
let seq = 1
const listeners = new Set()

const now = () => Date.now()
const uid = () => `t_${now().toString(36)}_${(seq++).toString(36)}`

function emitChange() {
  const snapshot = [...tasks]
  listeners.forEach(fn => fn(snapshot))
}

/** 订阅任务列表变化（轮询替代方案，组件 onUnmounted 时取消） */
export function subscribeTasks(fn) {
  listeners.add(fn)
  fn([...tasks])
  return () => listeners.delete(fn)
}

/**
 * 提交转换任务。
 * @param {{fileName: string, from: string, to: string}} payload
 */
export function createConversion({ fileName, from, to }) {
  const task = {
    id: uid(),
    fileName,
    from,
    to,
    // 约 8% 概率失败，演示失败态 UI
    willFail: Math.random() < 0.08,
    status: 'queued',
    progress: 0,
    createdAt: now(),
    finishedAt: null,
    error: '',
  }
  tasks = [task, ...tasks]
  emitChange()

  // 模拟调度：排队 600ms 后开始转换，进度阶梯推进
  setTimeout(() => {
    if (task.status !== 'queued') return
    task.status = 'processing'
    emitChange()
    const timer = setInterval(() => {
      // 页面停留期间每 500ms 推进 8%~18%
      task.progress = Math.min(100, task.progress + 8 + Math.random() * 10)
      if (task.progress >= 100) {
        clearInterval(timer)
        task.progress = 100
        task.status = task.willFail ? 'failed' : 'done'
        task.finishedAt = now()
        task.error = task.willFail ? '转换失败：文件格式异常或内容加密' : ''
      }
      emitChange()
    }, 500)
  }, 600)

  return new Promise(resolve => setTimeout(() => resolve({ ...task }), LATENCY))
}

/** 清除已结束的任务记录 */
export function clearFinished() {
  tasks = tasks.filter(t => t.status === 'queued' || t.status === 'processing')
  emitChange()
}

/** 单个文件名推断扩展名 */
export function extOf(name) {
  return (name.split('.').pop() || '').toLowerCase()
}
