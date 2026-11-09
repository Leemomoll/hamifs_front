<template>
  <div class="convert-page page-container">
    <!-- 左侧：提交转换 -->
    <el-card shadow="never" class="submit-panel">
      <template #header><span>提交转换</span></template>

      <el-upload
        class="upload-area"
        drag
        multiple
        :show-file-list="false"
        :http-request="handlePickFile"
      >
        <el-icon class="upload-icon" :size="42"><UploadFilled /></el-icon>
        <div class="upload-text">拖拽文件到此处，或点击选择</div>
        <div class="upload-hint">
          支持 Word / PDF / Markdown / 表格 / HTML，单个文件生成一条转换任务
        </div>
      </el-upload>

      <div v-if="picked.length" class="picked-list">
        <div v-for="(file, i) in picked" :key="i" class="picked-item">
          <el-icon class="picked-icon" :color="resolveFileType(file.name).color">
            <component :is="resolveFileType(file.name).icon" />
          </el-icon>
          <span class="picked-name" :title="file.name">{{ file.name }}</span>
          <span class="picked-size">{{ formatSize(file.size) }}</span>
          <el-icon class="picked-remove" title="移除" @click="picked.splice(i, 1)">
            <Close />
          </el-icon>
        </div>
      </div>

      <div class="target-row">
        <span class="target-label">转换为</span>
        <el-select v-model="targetFormat" placeholder="选择目标格式" class="target-select">
          <el-option
            v-for="opt in CONVERSION_OPTIONS"
            :key="`${opt.from}>${opt.to}`"
            :label="opt.label"
            :value="opt.to"
            :disabled="!picked.some(f => extOf(f.name) === opt.from)"
          >
            <span>{{ opt.label }}</span>
            <span class="option-ext">{{ opt.from }} → {{ opt.to }}</span>
          </el-option>
        </el-select>
      </div>
      <div v-if="picked.length && !targetFormat" class="target-hint">
        已选 {{ picked.length }} 个文件，请选择目标格式（按文件扩展名匹配可用方向）
      </div>

      <el-button
        type="primary"
        class="submit-btn"
        :disabled="!canSubmit"
        :loading="submitting"
        @click="handleSubmit"
      >
        开始转换（{{ canSubmit ? picked.length : 0 }} 个文件）
      </el-button>
    </el-card>

    <!-- 右侧：任务列表 -->
    <el-card shadow="never" class="task-panel">
      <template #header>
        <div class="task-header">
          <span>转换任务</span>
          <el-button
            size="small"
            text
            type="primary"
            :disabled="!hasFinished"
            @click="clearFinished"
          >
            清除已完成
          </el-button>
        </div>
      </template>

      <div v-if="!tasks.length" class="task-empty">
        <el-empty description="暂无转换任务" :image-size="90" />
      </div>

      <div v-else class="task-list">
        <div v-for="task in tasks" :key="task.id" class="task-item">
          <el-icon class="task-icon" :size="26" :color="resolveFileType(task.fileName).color">
            <component :is="resolveFileType(task.fileName).icon" />
          </el-icon>

          <div class="task-main">
            <div class="task-title">
              <span class="task-name" :title="task.fileName">{{ task.fileName }}</span>
              <span class="task-direction">{{ task.from }} → {{ task.to }}</span>
            </div>

            <!-- 进度条：排队/转换中显示 -->
            <el-progress
              v-if="task.status === 'processing'"
              :percentage="Math.floor(task.progress)"
              :stroke-width="6"
              class="task-progress"
            />
            <div v-else-if="task.status === 'queued'" class="task-sub queued">
              排队等待中…
            </div>
            <div v-else-if="task.status === 'failed'" class="task-sub failed">
              {{ task.error }}
            </div>
            <div v-else class="task-sub done">
              转换完成 · {{ formatTime(task.finishedAt) }}
            </div>
          </div>

          <div class="task-right">
            <el-tag
              :type="STATUS_TYPE[task.status]"
              size="small"
              :effect="task.status === 'done' ? 'dark' : 'light'"
            >
              {{ STATUS_TEXT[task.status] }}
            </el-tag>
            <el-button
              v-if="task.status === 'done'"
              size="small"
              type="primary"
              plain
              :disabled="!task.downloadUrl"
              title="后端转换服务就绪后开放下载"
            >
              下载
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, UploadFilled } from '@element-plus/icons-vue'
import {
  CONVERSION_OPTIONS,
  clearFinished,
  createConversion,
  extOf,
  subscribeTasks,
} from '@/api/convert'
import { formatSize, formatTime, resolveFileType } from '@/utils/fileType'

const STATUS_TEXT = { queued: '排队中', processing: '转换中', done: '已完成', failed: '失败' }
const STATUS_TYPE = { queued: 'info', processing: 'warning', done: 'success', failed: 'danger' }

const picked = ref([])
const targetFormat = ref('')
const submitting = ref(false)
const tasks = ref([])

let unsubscribe = null
onUnmounted(() => unsubscribe?.())

// 订阅 mock 任务的进度变化
unsubscribe = subscribeTasks(list => {
  tasks.value = list
})

const hasFinished = computed(() => tasks.value.some(t => t.status === 'done' || t.status === 'failed'))

const canSubmit = computed(() => {
  if (!picked.value.length || !targetFormat.value) return false
  const option = CONVERSION_OPTIONS.find(opt => opt.to === targetFormat.value)
  // 所有已选文件都必须匹配该方向允许的源格式；方向本身按首个文件扩展名匹配
  return picked.value.every(f => extOf(f.name) === option.from)
})

function handlePickFile({ file }) {
  picked.value.push(file)
}

async function handleSubmit() {
  submitting.value = true
  try {
    const from = extOf(picked.value[0].name)
    for (const file of picked.value) {
      await createConversion({ fileName: file.name, from, to: targetFormat.value })
    }
    ElMessage.success(`已提交 ${picked.value.length} 个转换任务`)
    picked.value = []
    targetFormat.value = ''
  } catch (err) {
    ElMessage.error(err.message || '提交失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.convert-page {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

/* ─── 左侧提交面板 ─────────────────────────────────────────────────────────── */
.submit-panel {
  width: 380px;
  flex-shrink: 0;
}

.upload-area :deep(.el-upload-dragger) {
  padding: 28px 16px;
}

.upload-icon {
  color: var(--el-color-primary);
}

.upload-text {
  margin-top: 8px;
  font-size: 14px;
  color: var(--hamifs-text-primary);
}

.upload-hint {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--hamifs-text-secondary);
}

.picked-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}

.picked-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 10px;
  font-size: 13px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.picked-icon {
  flex-shrink: 0;
}

.picked-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picked-size {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--hamifs-text-secondary);
}

.picked-remove {
  flex-shrink: 0;
  color: var(--hamifs-text-secondary);
  cursor: pointer;
}

.picked-remove:hover {
  color: var(--el-color-danger);
}

.target-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 14px;
}

.target-label {
  font-size: 13px;
  color: var(--hamifs-text-regular);
}

.target-select {
  flex: 1;
}

.option-ext {
  float: right;
  font-size: 12px;
  color: var(--hamifs-text-secondary);
}

.target-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--hamifs-text-secondary);
}

.submit-btn {
  width: 100%;
  margin-top: 16px;
}

/* ─── 右侧任务面板 ─────────────────────────────────────────────────────────── */
.task-panel {
  flex: 1;
  min-width: 0;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid var(--hamifs-border-color);
  border-radius: var(--hamifs-radius);
}

.task-icon {
  flex-shrink: 0;
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
  font-size: 14px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-direction {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--hamifs-text-secondary);
}

.task-progress {
  margin-top: 6px;
}

.task-sub {
  margin-top: 4px;
  font-size: 12px;
}

.task-sub.queued {
  color: var(--hamifs-text-secondary);
}

.task-sub.failed {
  color: var(--el-color-danger);
}

.task-sub.done {
  color: var(--el-color-success);
}

.task-right {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
}

/* ─── 窄屏适配 ─────────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .convert-page {
    flex-direction: column;
  }

  .submit-panel {
    width: 100%;
  }
}
</style>
