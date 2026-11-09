<template>
  <div class="memo-page page-container">
    <!-- 左侧：备忘录列表 -->
    <aside class="memo-list-panel">
      <div class="list-toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索备忘录"
          clearable
          size="small"
          :prefix-icon="Search"
        />
        <el-button type="primary" size="small" @click="handleCreate">
          <el-icon class="btn-icon"><Plus /></el-icon>
          新建
        </el-button>
      </div>

      <div v-loading="loading" class="memo-items">
        <div
          v-for="memo in memos"
          :key="memo.id"
          class="memo-item"
          :class="{ active: memo.id === activeId, pinned: memo.pinned }"
          @click="selectMemo(memo.id)"
        >
          <div class="memo-item-top">
            <span class="memo-item-title">
              <el-icon v-if="memo.pinned" class="pin-icon"><Top /></el-icon>
              {{ memo.title }}
            </span>
            <el-icon
              class="pin-toggle"
              :class="{ active: memo.pinned }"
              :title="memo.pinned ? '取消置顶' : '置顶'"
              @click.stop="handleTogglePin(memo)"
            >
              <Top />
            </el-icon>
          </div>
          <div class="memo-item-content">{{ memo.content || '（无内容）' }}</div>
          <div class="memo-item-meta">
            <el-tag v-for="tag in memo.tags" :key="tag" size="small" type="info" effect="plain">
              {{ tag }}
            </el-tag>
            <span class="memo-item-time">{{ formatTime(memo.updatedAt) }}</span>
          </div>
        </div>

        <el-empty
          v-if="!loading && !memos.length"
          description="还没有备忘录"
          :image-size="80"
        />
      </div>
    </aside>

    <!-- 右侧：编辑区 -->
    <main class="memo-editor-panel">
      <template v-if="activeMemo">
        <input
          v-model="draft.title"
          class="editor-title"
          placeholder="标题"
          @input="markDirty"
        />
        <div class="editor-toolbar">
          <el-select
            v-model="draft.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="添加标签"
            size="small"
            class="editor-tags"
            @change="markDirty"
          >
            <el-option v-for="tag in allTags" :key="tag" :label="tag" :value="tag" />
          </el-select>
          <div class="editor-actions">
            <el-button size="small" type="danger" plain @click="handleRemove">
              删除
            </el-button>
            <el-button size="small" type="primary" :disabled="!dirty" :loading="saving" @click="handleSave">
              {{ dirty ? '保存' : '已保存' }}
            </el-button>
          </div>
        </div>
        <el-input
          v-model="draft.content"
          class="editor-content"
          type="textarea"
          :autosize="false"
          resize="none"
          placeholder="记录重要信息…（支持 Markdown，编辑器后续升级为 vditor）"
          @input="markDirty"
        />
        <div class="editor-footer">最后更新：{{ formatTime(activeMemo.updatedAt) }}</div>
      </template>

      <el-empty v-else description="选择左侧备忘录，或新建一条" />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Top, Search } from '@element-plus/icons-vue'
import { addMemo, listMemos, removeMemo, updateMemo } from '@/api/memo'
import { formatTime } from '@/utils/fileType'

const loading = ref(false)
const saving = ref(false)
const memos = ref([])
const keyword = ref('')
const activeId = ref(null)
const dirty = ref(false)
const draft = reactive({ title: '', content: '', tags: [] })

const activeMemo = computed(() => memos.value.find(m => m.id === activeId.value) || null)

/** 已存在的标签合集，供编辑区下拉选择 */
const allTags = computed(() => {
  const set = new Set()
  memos.value.forEach(m => m.tags.forEach(tag => set.add(tag)))
  return [...set]
})

const searchDebounce = debounce(loadMemos, 300)
watch(keyword, searchDebounce)

async function loadMemos() {
  loading.value = true
  try {
    const list = await listMemos(keyword.value)
    memos.value = list
    // 当前选中的被删掉时，自动选中第一条
    if (activeId.value && !list.some(m => m.id === activeId.value)) {
      activeId.value = null
    }
  } catch (err) {
    ElMessage.error(err.message || '加载备忘录失败')
  } finally {
    loading.value = false
  }
}

/** 切换选中：有未保存改动先保存，再把新备忘录内容放进编辑区 */
async function selectMemo(id) {
  if (id === activeId.value) return
  if (dirty.value && activeId.value) {
    await saveDraft(true)
  }
  activeId.value = id
  dirty.value = false
  const memo = memos.value.find(m => m.id === id)
  if (memo) {
    draft.title = memo.title
    draft.content = memo.content
    draft.tags = [...memo.tags]
  }
}

function markDirty() {
  dirty.value = true
}

async function saveDraft(silent = false) {
  saving.value = true
  try {
    const updated = await updateMemo(activeId.value, {
      title: draft.title.trim() || '无标题备忘',
      content: draft.content,
      tags: draft.tags,
    })
    // 用返回值替换列表项，保持排序（置顶在前、时间倒序）由 mock 端统一处理
    const idx = memos.value.findIndex(m => m.id === updated.id)
    if (idx !== -1) memos.value.splice(idx, 1, updated)
    dirty.value = false
    if (!silent) ElMessage.success('已保存')
  } catch (err) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleSave() {
  await saveDraft()
}

async function handleCreate() {
  if (dirty.value && activeId.value) await saveDraft(true)
  const memo = await addMemo({})
  activeId.value = memo.id
  draft.title = memo.title
  draft.content = memo.content
  draft.tags = []
  dirty.value = false
  await loadMemos()
}

async function handleTogglePin(memo) {
  await updateMemo(memo.id, { pinned: !memo.pinned })
  await loadMemos()
}

async function handleRemove() {
  await ElMessageBox.confirm(`确定删除「${activeMemo.value.title}」吗？`, '删除备忘录', {
    type: 'warning',
  })
  await removeMemo(activeId.value)
  activeId.value = null
  dirty.value = false
  ElMessage.success('已删除')
  await loadMemos()
}

function debounce(fn, wait) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}

onMounted(loadMemos)
</script>

<style scoped>
.memo-page {
  display: flex;
  gap: 16px;
  height: calc(100vh - var(--hamifs-header-height) - var(--hamifs-tagsview-height) - 32px);
  overflow: hidden;
}

/* ─── 左侧列表 ─────────────────────────────────────────────────────────────── */
.memo-list-panel {
  display: flex;
  flex-direction: column;
  width: 300px;
  flex-shrink: 0;
  padding: 12px;
  background: var(--hamifs-bg-card);
  border: 1px solid var(--hamifs-border-color);
  border-radius: var(--hamifs-radius);
  overflow: hidden;
}

.list-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.memo-items {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
}

.memo-item {
  padding: 10px 12px;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--hamifs-radius);
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

.memo-item:hover {
  background: var(--el-fill-color-light);
}

.memo-item.active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.memo-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.memo-item-title {
  display: flex;
  gap: 4px;
  align-items: center;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  color: var(--hamifs-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pin-icon {
  color: #f7ba2a;
}

.pin-toggle {
  flex-shrink: 0;
  color: var(--hamifs-text-secondary);
  opacity: 0;
  transition: opacity 0.2s;
}

.pin-toggle:hover {
  color: var(--el-color-primary);
}

.pin-toggle.active {
  color: #f7ba2a;
  opacity: 1;
}

.memo-item:hover .pin-toggle {
  opacity: 1;
}

.memo-item-content {
  display: -webkit-box;
  margin: 4px 0 6px;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.6;
  color: var(--hamifs-text-regular);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.memo-item-meta {
  display: flex;
  gap: 4px;
  align-items: center;
}

.memo-item-time {
  margin-left: auto;
  font-size: 11px;
  color: var(--hamifs-text-secondary);
}

/* ─── 右侧编辑区 ───────────────────────────────────────────────────────────── */
.memo-editor-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  padding: 20px 24px;
  background: var(--hamifs-bg-card);
  border: 1px solid var(--hamifs-border-color);
  border-radius: var(--hamifs-radius);
}

.editor-title {
  margin-bottom: 12px;
  padding: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--hamifs-text-primary);
  background: transparent;
  border: none;
  outline: none;
}

.editor-title::placeholder {
  color: var(--hamifs-text-secondary);
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.editor-tags {
  max-width: 60%;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.editor-content {
  flex: 1;
}

.editor-content :deep(.el-textarea__inner) {
  height: 100%;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.8;
}

.editor-footer {
  padding-top: 8px;
  font-size: 12px;
  color: var(--hamifs-text-secondary);
  text-align: right;
}

/* ─── 窄屏适配 ─────────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .memo-page {
    flex-direction: column;
    height: auto;
    overflow: visible;
  }

  .memo-list-panel {
    width: 100%;
  }

  .memo-items {
    max-height: 260px;
  }

  .memo-editor-panel {
    min-height: 420px;
  }
}
</style>
