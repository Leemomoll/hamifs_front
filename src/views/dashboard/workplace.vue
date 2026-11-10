<template>
  <div class="workplace page-container">
    <el-row :gutter="16">
      <!-- 左：AI 对话（页面级） -->
      <el-col :xs="24" :lg="14" class="col-block">
        <div class="panel-card chat-card">
          <div class="card-head">
            <div class="head-left">
              <el-icon class="head-icon" :size="18"><MagicStick /></el-icon>
              <span class="card-title">AI 助手</span>
              <el-tag size="small" type="warning" effect="plain">演示模式</el-tag>
            </div>
            <span class="head-hint">基于你的文档与记事回答问题</span>
          </div>
          <AiChat class="chat-area" />
        </div>
      </el-col>

      <!-- 右：任务中心 + 收藏 -->
      <el-col :xs="24" :lg="10" class="col-block">
        <div class="panel-card">
          <div class="card-head">
            <div class="head-left">
              <span class="card-title">任务中心</span>
              <el-tag v-if="activeCount" size="small" type="primary" effect="plain">
                {{ activeCount }} 个进行中
              </el-tag>
            </div>
            <el-button text size="small" type="primary" @click="go('/convert/index')">
              完整转换页
            </el-button>
          </div>

          <!-- 快速发起 -->
          <div class="quick-submit">
            <el-input
              v-model="quickForm.fileName"
              class="quick-file"
              placeholder="文件名，如 报告.docx"
              size="small"
              clearable
              @keyup.enter="handleQuickSubmit"
            />
            <el-select v-model="quickForm.direction" size="small" class="quick-select" placeholder="目标格式">
              <el-option
                v-for="opt in CONVERSION_OPTIONS"
                :key="`${opt.from}>${opt.to}`"
                :label="opt.label"
                :value="`${opt.from}>${opt.to}`"
              />
            </el-select>
            <el-button type="primary" size="small" :disabled="!canQuickSubmit" @click="handleQuickSubmit">
              发起
            </el-button>
          </div>
          <div v-if="quickError" class="quick-error">{{ quickError }}</div>

          <!-- 任务列表：实时进度 -->
          <div class="task-list">
            <div v-for="task in tasks" :key="task.id" class="task-item">
              <el-icon class="task-icon" :size="18" :color="resolveFileType(task.fileName).color">
                <component :is="resolveFileType(task.fileName).icon" />
              </el-icon>
              <div class="task-main">
                <div class="task-title">
                  <span class="task-name" :title="task.fileName">{{ task.fileName }}</span>
                  <span class="task-direction">{{ task.from }} → {{ task.to }}</span>
                </div>
                <el-progress
                  v-if="task.status === 'processing'"
                  :percentage="Math.floor(task.progress)"
                  :stroke-width="5"
                  class="task-progress"
                />
                <div v-else-if="task.status === 'queued'" class="task-sub">排队等待中</div>
                <div v-else-if="task.status === 'failed'" class="task-sub failed">{{ task.error }}</div>
                <div v-else class="task-sub done">完成 · {{ formatTime(task.finishedAt) }}</div>
              </div>
              <el-tag :type="STATUS_TYPE[task.status]" size="small" effect="light">
                {{ STATUS_LABEL[task.status] }}
              </el-tag>
            </div>
            <el-empty v-if="!tasks.length" description="暂无任务，发起一个试试" :image-size="70" />
          </div>
        </div>

        <div class="panel-card star-card">
          <div class="card-head">
            <span class="card-title">我的收藏</span>
            <el-button text size="small" type="primary" @click="go('/hamifs-storage/index')">
              文档中心
            </el-button>
          </div>
          <div class="star-list">
            <div
              v-for="doc in starredDocs"
              :key="doc.id"
              class="star-item"
              :title="doc.name"
              @click="go('/hamifs-storage/index')"
            >
              <el-icon :size="16" :color="resolveFileType(doc.name).color">
                <component :is="resolveFileType(doc.name).icon" />
              </el-icon>
              <span class="star-name">{{ doc.name }}</span>
              <span class="star-time">{{ formatRelativeTime(doc.updatedAt) }}</span>
            </div>
            <el-empty v-if="!starredDocs.length" description="暂无收藏文档" :image-size="60" />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { MagicStick } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import AiChat from '@/components/AiAssistant/AiChat.vue'
import { CONVERSION_OPTIONS, createConversion, subscribeTasks } from '@/api/convert'
import { listDocuments } from '@/api/doc'
import { formatTime, formatRelativeTime, resolveFileType } from '@/utils/fileType'

const router = useRouter()

// ─── 任务中心 ────────────────────────────────────────────────────────────────
const STATUS_TYPE = { queued: 'info', processing: 'primary', done: 'success', failed: 'danger' }
const STATUS_LABEL = { queued: '排队', processing: '转换中', done: '完成', failed: '失败' }

const tasks = ref([])
let unsubscribe = null

const activeCount = computed(() =>
  tasks.value.filter(t => t.status === 'queued' || t.status === 'processing').length,
)

const quickForm = reactive({ fileName: '', direction: '' })
const quickError = ref('')

const canQuickSubmit = computed(() => {
  const name = quickForm.fileName.trim()
  if (!name || !name.includes('.') || !quickForm.direction) return false
  // 方向的源格式要与文件扩展名匹配
  const from = quickForm.direction.split('>')[0]
  const ext = (name.split('.').pop() || '').toLowerCase()
  return ext === from
})

function handleQuickSubmit() {
  const name = quickForm.fileName.trim()
  if (!name) {
    quickError.value = '请填写文件名'
    return
  }
  if (!name.includes('.')) {
    quickError.value = '文件名需要带扩展名，如 报告.docx'
    return
  }
  if (!quickForm.direction) {
    quickError.value = '请选择目标格式'
    return
  }
  const [from, to] = quickForm.direction.split('>')
  if ((name.split('.').pop() || '').toLowerCase() !== from) {
    quickError.value = `当前方向要求源文件是 .${from} 格式`
    return
  }
  quickError.value = ''
  createConversion({ fileName: name, from, to })
  ElMessage.success('任务已发起')
  quickForm.fileName = ''
}

// ─── 收藏汇总 ────────────────────────────────────────────────────────────────
const starredDocs = ref([])

const go = path => router.push(path)

onMounted(async () => {
  // 订阅转换任务实时变化（mock 推送），离开页面时取消
  unsubscribe = subscribeTasks(list => {
    tasks.value = list
  })
  starredDocs.value = await listDocuments({ starred: true })
})

onBeforeUnmount(() => {
  unsubscribe?.()
})
</script>

<style scoped>
.workplace {
  height: calc(100vh - var(--hamifs-header-height) - var(--hamifs-tagsview-height) - 32px);
  overflow: hidden;
}

.col-block {
  height: 100%;
  margin-bottom: 16px;
}

.workplace :deep(.el-row),
.workplace :deep(.el-col) {
  height: 100%;
}

/* ─── 通用面板 ─────────────────────────────────────────────────────────────── */
.panel-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 20px;
  background: var(--hamifs-bg-card);
  border: 1px solid var(--hamifs-border-color);
  border-radius: var(--hamifs-radius);
  box-shadow: var(--hamifs-shadow-card);
  overflow: hidden;
}

.card-head {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.head-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.head-icon {
  color: var(--el-color-primary);
}

.head-hint {
  font-size: 12px;
  color: var(--hamifs-text-secondary);
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--hamifs-text-primary);
}

/* ─── AI 对话卡 ────────────────────────────────────────────────────────────── */
.chat-card {
  padding: 0;
}

.chat-card .card-head {
  padding: 12px 16px 0;
}

.chat-area {
  min-height: 0;
}

/* ─── 任务中心 ─────────────────────────────────────────────────────────────── */
.quick-submit {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  margin-bottom: 8px;
}

.quick-file {
  flex: 1;
}

.quick-select {
  width: 160px;
  flex-shrink: 0;
}

.quick-error {
  flex-shrink: 0;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--el-color-danger);
}

.task-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-height: 120px;
  overflow: auto;
}

.task-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.task-main {
  flex: 1;
  min-width: 0;
}

.task-title {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.task-name {
  overflow: hidden;
  font-size: 13px;
  color: var(--hamifs-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-direction {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--hamifs-text-secondary);
}

.task-progress {
  width: 100%;
  margin-top: 4px;
}

.task-sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--hamifs-text-secondary);
}

.task-sub.failed {
  color: var(--el-color-danger);
}

.task-sub.done {
  color: var(--el-color-success);
}

/* ─── 收藏卡 ───────────────────────────────────────────────────────────────── */
.star-card {
  margin-top: 16px;
  flex: 1;
  min-height: 140px;
}

.star-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  overflow: auto;
}

.star-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 7px 8px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.star-item:hover {
  background: var(--el-fill-color-light);
}

.star-name {
  flex: 1;
  overflow: hidden;
  font-size: 13px;
  color: var(--hamifs-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.star-time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--hamifs-text-secondary);
}

/* 窄屏：上下堆叠，去掉固定高度 */
@media (max-width: 992px) {
  .workplace {
    height: auto;
    overflow: visible;
  }

  .workplace :deep(.el-row),
  .workplace :deep(.el-col),
  .col-block {
    height: auto;
  }

  .chat-card {
    min-height: 480px;
  }

  .task-list {
    max-height: 320px;
  }
}
</style>

