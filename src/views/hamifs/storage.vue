<template>
  <div class="doc-center page-container">
    <!-- 左侧：目录树 + 标签 -->
    <aside class="side-panel">
      <div class="side-header">
        <span class="side-title">我的文档</span>
        <el-tooltip content="新建根文件夹" placement="top">
          <el-button circle size="small" @click="handleCreateFolder(null)">
            <el-icon><Plus /></el-icon>
          </el-button>
        </el-tooltip>
      </div>

      <el-tree
        ref="treeRef"
        class="folder-tree"
        :data="treeData"
        node-key="id"
        :props="{ label: 'name', children: 'children' }"
        :expand-on-click-node="false"
        :current-node-key="currentFolderId"
        highlight-current
        @node-click="handleFolderClick"
      >
        <template #default="{ data }">
          <div class="tree-node">
            <el-icon class="tree-icon" :class="{ 'is-root': data.id === ALL_ID }">
              <component :is="data.id === ALL_ID ? Files : Folder" />
            </el-icon>
            <span
              class="tree-label"
              :title="data.name + '（双击重命名）'"
              @dblclick="handleRenameFolder(data)"
            >
              {{ data.name }}
            </span>
            <span class="tree-actions" v-if="data.id !== ALL_ID" @click.stop>
              <el-icon title="新建子文件夹" @click="handleCreateFolder(data.id)"><Plus /></el-icon>
              <el-icon title="删除" @click="handleRemoveFolder(data)"><Delete /></el-icon>
            </span>
          </div>
        </template>
      </el-tree>

      <div class="side-filter">
        <div class="filter-title">
          标签
          <el-switch v-model="starredOnly" size="small" active-text="只看收藏" />
        </div>
        <div class="tag-chips">
          <el-tag
            v-for="tag in allTags"
            :key="tag"
            :type="tag === activeTag ? 'primary' : 'info'"
            :effect="tag === activeTag ? 'dark' : 'plain'"
            class="tag-chip"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </el-tag>
          <span v-if="!allTags.length" class="filter-empty">暂无标签</span>
        </div>
      </div>
    </aside>

    <!-- 右侧：工具栏 + 文件区 -->
    <main class="main-panel">
      <div class="toolbar">
        <el-breadcrumb separator="/" class="breadcrumb">
          <el-breadcrumb-item
            v-for="crumb in breadcrumbs"
            :key="crumb.id"
            :class="{ clickable: crumb.id !== currentFolderId }"
            @click="crumb.id !== currentFolderId && handleCrumbClick(crumb.id)"
          >
            {{ crumb.name }}
          </el-breadcrumb-item>
        </el-breadcrumb>

        <div class="toolbar-actions">
          <el-input
            v-model="keyword"
            placeholder="搜索文件名"
            clearable
            class="search-input"
            :prefix-icon="Search"
          />
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button value="grid">
              <el-icon><Grid /></el-icon>
            </el-radio-button>
            <el-radio-button value="list">
              <el-icon><Expand /></el-icon>
            </el-radio-button>
          </el-radio-group>
          <el-upload
            :show-file-list="false"
            :http-request="handleUpload"
            multiple
          >
            <el-button type="primary">
              <el-icon class="btn-icon"><UploadFilled /></el-icon>
              上传文件
            </el-button>
          </el-upload>
        </div>
      </div>

      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" v-loading="loading" class="file-grid">
        <div
          v-for="doc in documents"
          :key="doc.id"
          class="file-card"
          @click="openPreview(doc)"
          @dblclick="handleRenameDocument(doc)"
        >
          <el-icon class="file-icon" :size="38" :color="resolveFileType(doc.name).color">
            <component :is="resolveFileType(doc.name).icon" />
          </el-icon>
          <div class="file-name" :title="doc.name">{{ doc.name }}</div>
          <div class="file-meta">
            {{ formatSize(doc.size) }} · {{ formatTime(doc.updatedAt) }}
          </div>
          <div class="file-ops" @click.stop>
            <el-icon
              class="op-icon star"
              :class="{ active: doc.starred }"
              title="收藏"
              @click="handleToggleStar(doc)"
            >
              <StarFilled v-if="doc.starred" />
              <Star v-else />
            </el-icon>
            <el-dropdown trigger="click" @command="cmd => handleDocCommand(cmd, doc)">
              <el-icon class="op-icon" title="更多"><MoreFilled /></el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="rename">重命名</el-dropdown-item>
                  <el-dropdown-item command="preview">预览</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <el-empty
          v-if="!loading && !documents.length"
          class="grid-empty"
          description="这里还没有文件，上传或新建一个吧"
        />
      </div>

      <!-- 列表视图 -->
      <el-card v-else shadow="never" class="list-card" v-loading="loading">
        <el-table :data="documents" style="width: 100%">
          <el-table-column label="名称" min-width="260">
            <template #default="{ row }">
              <div class="list-name" @click="openPreview(row)">
                <el-icon :color="resolveFileType(row.name).color">
                  <component :is="resolveFileType(row.name).icon" />
                </el-icon>
                <span class="list-name-text" :title="row.name">{{ row.name }}</span>
                <el-icon
                  v-if="row.starred"
                  class="op-icon star active"
                  @click.stop="handleToggleStar(row)"
                >
                  <StarFilled />
                </el-icon>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="标签" width="180">
            <template #default="{ row }">
              <el-tag v-for="tag in row.tags" :key="tag" size="small" type="info" class="list-tag">
                {{ tag }}
              </el-tag>
              <span v-if="!row.tags.length" class="text-secondary">-</span>
            </template>
          </el-table-column>
          <el-table-column label="大小" width="100">
            <template #default="{ row }">{{ formatSize(row.size) }}</template>
          </el-table-column>
          <el-table-column label="修改时间" width="160">
            <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ row }">
              <el-dropdown trigger="click" @command="cmd => handleDocCommand(cmd, row)">
                <el-icon class="op-icon"><MoreFilled /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="rename">重命名</el-dropdown-item>
                    <el-dropdown-item command="preview">预览</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!loading && !documents.length" description="这里还没有文件" />
      </el-card>
    </main>

    <!-- 预览抽屉 -->
    <FilePreviewDrawer :doc="previewDoc" @close="previewDoc = null" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Delete,
  Expand,
  Files,
  Folder,
  Grid,
  MoreFilled,
  Plus,
  Search,
  Star,
  StarFilled,
  UploadFilled,
} from '@element-plus/icons-vue'
import FilePreviewDrawer from '@/components/FilePreviewDrawer.vue'
import {
  addFolder,
  listAllTags,
  listDocuments,
  listFolders,
  removeDocument,
  removeFolder,
  renameDocument,
  renameFolder,
  toggleStarDocument,
  uploadDocuments,
} from '@/api/doc'
import { formatSize, formatTime, resolveFileType } from '@/utils/fileType'

/** "全部文件"伪节点 id */
const ALL_ID = '__all__'

// ─── 状态 ────────────────────────────────────────────────────────────────────
const loading = ref(false)
const folders = ref([])
const documents = ref([])
const allTags = ref([])
const currentFolderId = ref(ALL_ID)
const keyword = ref('')
const activeTag = ref('')
const starredOnly = ref(false)
const viewMode = ref('grid')
const previewDoc = ref(null)

// ─── 目录树 ──────────────────────────────────────────────────────────────────
const treeData = computed(() => [
  { id: ALL_ID, name: '全部文件', children: buildTree(folders.value) },
])

/** 平铺文件夹列表转树结构 */
function buildTree(list) {
  const childrenOf = parentId => list.filter(f => f.parentId === parentId)
  const toNode = f => {
    const children = childrenOf(f.id)
    return { id: f.id, name: f.name, children: children.map(toNode) }
  }
  return childrenOf(null).map(toNode)
}

/** 面包屑：从当前文件夹向上回溯到根 */
const breadcrumbs = computed(() => {
  const chain = []
  let node = folders.value.find(f => f.id === currentFolderId.value)
  while (node) {
    chain.unshift({ id: node.id, name: node.name })
    node = folders.value.find(f => f.id === node.parentId)
  }
  return [{ id: ALL_ID, name: '全部文件' }, ...chain]
})

function handleFolderClick(data) {
  currentFolderId.value = data.id
}

function handleCrumbClick(id) {
  currentFolderId.value = id
}

function toggleTag(tag) {
  activeTag.value = activeTag.value === tag ? '' : tag
}

// ─── 文件列表 ────────────────────────────────────────────────────────────────
async function refreshDocuments() {
  loading.value = true
  try {
    documents.value = await listDocuments({
      // "__all__" 时不按文件夹过滤；普通文件夹按 id 过滤
      folderId: currentFolderId.value === ALL_ID ? undefined : currentFolderId.value,
      keyword: keyword.value,
      tag: activeTag.value,
      starred: starredOnly.value || undefined,
    })
  } catch (err) {
    ElMessage.error(err.message || '加载文件失败')
  } finally {
    loading.value = false
  }
}

async function refreshMeta() {
  try {
    const [folderList, tagList] = await Promise.all([listFolders(), listAllTags()])
    folders.value = folderList
    allTags.value = tagList
  } catch (err) {
    ElMessage.error(err.message || '加载目录失败')
  }
}

const searchDebounce = debounce(refreshDocuments, 300)
watch(keyword, searchDebounce)
watch([activeTag, starredOnly, currentFolderId], refreshDocuments)

// ─── 文件操作 ────────────────────────────────────────────────────────────────
function openPreview(doc) {
  previewDoc.value = doc
}

async function handleUpload({ file }) {
  try {
    await uploadDocuments([file], currentFolderId.value === ALL_ID ? null : currentFolderId.value)
    ElMessage.success(`已上传：${file.name}`)
    await Promise.all([refreshDocuments(), refreshMeta()])
  } catch (err) {
    ElMessage.error(err.message || '上传失败')
  }
}

async function handleToggleStar(doc) {
  try {
    doc.starred = await toggleStarDocument(doc.id)
  } catch (err) {
    ElMessage.error(err.message || '操作失败')
  }
}

async function handleRenameDocument(doc) {
  const { value } = await ElMessageBox.prompt('新的文件名', '重命名', {
    inputValue: doc.name,
    inputValidator: v => (v && v.trim() ? true : '名称不能为空'),
  })
  await renameDocument(doc.id, value.trim())
  ElMessage.success('已重命名')
  await refreshDocuments()
}

async function handleRemoveDocument(doc) {
  await ElMessageBox.confirm(`确定删除「${doc.name}」吗？`, '删除文件', { type: 'warning' })
  await removeDocument(doc.id)
  ElMessage.success('已删除')
  await Promise.all([refreshDocuments(), refreshMeta()])
}

function handleDocCommand(cmd, doc) {
  const actions = {
    preview: () => openPreview(doc),
    rename: () => handleRenameDocument(doc),
    delete: () => handleRemoveDocument(doc),
  }
  actions[cmd]?.()
}

// ─── 文件夹操作 ──────────────────────────────────────────────────────────────
async function handleRenameFolder(folder) {
  const { value } = await ElMessageBox.prompt('新的文件夹名称', '重命名文件夹', {
    inputValue: folder.name,
    inputValidator: v => (v && v.trim() ? true : '名称不能为空'),
  })
  await renameFolder(folder.id, value.trim())
  ElMessage.success('已重命名')
  await refreshMeta()
}

async function handleCreateFolder(parentId) {
  const { value } = await ElMessageBox.prompt('文件夹名称', '新建文件夹', {
    inputValidator: v => (v && v.trim() ? true : '名称不能为空'),
  })
  const folder = await addFolder(value.trim(), parentId)
  await refreshMeta()
  // 新建的子文件夹立即进入，方便继续操作
  currentFolderId.value = folder.id
  ElMessage.success(`已创建「${folder.name}」`)
}

async function handleRemoveFolder(folder) {
  await ElMessageBox.confirm(`确定删除文件夹「${folder.name}」吗？`, '删除文件夹', {
    type: 'warning',
  })
  await removeFolder(folder.id)
  // 删的是当前所在文件夹则退回"全部文件"
  if (currentFolderId.value === folder.id) {
    currentFolderId.value = ALL_ID
  }
  ElMessage.success('已删除')
  await refreshMeta()
}

// ─── 工具 ────────────────────────────────────────────────────────────────────
function debounce(fn, wait) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}

onMounted(async () => {
  await refreshMeta()
  await refreshDocuments()
})
</script>

<style scoped>
.doc-center {
  display: flex;
  gap: 16px;
  height: calc(100vh - var(--hamifs-header-height) - var(--hamifs-tagsview-height) - 32px);
  overflow: hidden;
}

/* ─── 左侧目录面板 ─────────────────────────────────────────────────────────── */
.side-panel {
  display: flex;
  flex-direction: column;
  width: 240px;
  flex-shrink: 0;
  padding: 12px;
  background: var(--hamifs-bg-card);
  border: 1px solid var(--hamifs-border-color);
  border-radius: var(--hamifs-radius);
  overflow: hidden;
}

.side-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.side-title {
  font-size: 15px;
  font-weight: 600;
}

.folder-tree {
  flex: 1;
  overflow: auto;
  background: transparent;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
  font-size: 13px;
}

.tree-icon {
  flex-shrink: 0;
  color: #e6a23c;
}

.tree-icon.is-root {
  color: var(--el-color-primary);
}

.tree-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-actions {
  display: none;
  gap: 4px;
  margin-left: auto;
  color: var(--hamifs-text-secondary);
}

.tree-actions .el-icon:hover {
  color: var(--el-color-primary);
}

:deep(.el-tree-node__content:hover) .tree-actions {
  display: inline-flex;
}

.side-filter {
  padding-top: 10px;
  border-top: 1px solid var(--hamifs-border-color);
}

.filter-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--hamifs-text-regular);
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-chip {
  cursor: pointer;
}

.filter-empty {
  font-size: 12px;
  color: var(--hamifs-text-secondary);
}

/* ─── 右侧文件面板 ─────────────────────────────────────────────────────────── */
.main-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.breadcrumb {
  font-size: 14px;
}

.breadcrumb :deep(.clickable) {
  cursor: pointer;
}

.breadcrumb :deep(.clickable:hover) .el-breadcrumb__inner {
  color: var(--el-color-primary);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 200px;
}

.btn-icon {
  margin-right: 4px;
}

/* ─── 网格视图 ─────────────────────────────────────────────────────────────── */
.file-grid {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  align-content: start;
  padding: 4px;
  overflow: auto;
}

.file-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 10px 12px;
  text-align: center;
  cursor: pointer;
  background: var(--hamifs-bg-card);
  border: 1px solid var(--hamifs-border-color);
  border-radius: var(--hamifs-radius);
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}

.file-card:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.file-icon {
  flex-shrink: 0;
}

.file-name {
  max-width: 100%;
  overflow: hidden;
  font-size: 13px;
  color: var(--hamifs-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  font-size: 11px;
  color: var(--hamifs-text-secondary);
}

.file-ops {
  position: absolute;
  top: 6px;
  right: 8px;
  display: flex;
  gap: 6px;
}

.op-icon {
  padding: 3px;
  color: var(--hamifs-text-secondary);
  cursor: pointer;
  border-radius: 4px;
}

.op-icon:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.op-icon.star.active {
  color: #f7ba2a;
}

.grid-empty {
  grid-column: 1 / -1;
}

/* ─── 列表视图 ─────────────────────────────────────────────────────────────── */
.list-card {
  flex: 1;
  overflow: auto;
}

.list-name {
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
}

.list-name:hover .list-name-text {
  color: var(--el-color-primary);
}

.list-name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-tag {
  margin-right: 4px;
}

.text-secondary {
  font-size: 12px;
  color: var(--hamifs-text-secondary);
}

/* ─── 窄屏适配 ─────────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .doc-center {
    flex-direction: column;
    height: auto;
    overflow: visible;
  }

  .side-panel {
    width: 100%;
  }

  .folder-tree {
    max-height: 220px;
  }
}
</style>
