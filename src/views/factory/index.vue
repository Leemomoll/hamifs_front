<template>
  <div class="factory-page page-container">
    <!-- ===== 列表视图 ===== -->
    <div v-if="!currentId" class="list-shell">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <el-popover v-model:visible="createVisible" placement="bottom-start" :width="440" trigger="click">
          <template #reference>
            <el-button type="primary" class="new-btn">
              <el-icon><Plus /></el-icon>
              新建
              <el-icon class="caret"><ArrowDown /></el-icon>
            </el-button>
          </template>
          <!-- 新建面板：卡片网格（学企微） -->
          <div class="create-panel">
            <div class="panel-title">新建</div>
            <div class="panel-grid">
              <div
                v-for="opt in CREATE_OPTIONS"
                :key="opt.type"
                class="panel-card"
                :class="{ disabled: opt.disabled }"
                @click="opt.disabled ? null : handleCreate(opt)"
              >
                <span class="card-icon" :style="{ background: opt.color }">
                  <el-icon :size="18" color="#fff"><component :is="opt.icon" /></el-icon>
                </span>
                <span class="card-label">{{ opt.label }}</span>
                <el-tag v-if="opt.disabled" size="small" type="info" effect="plain">敬请期待</el-tag>
              </div>
            </div>
          </div>
        </el-popover>

        <el-radio-group v-model="typeFilter" class="type-tabs">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="smart">智能表格</el-radio-button>
          <el-radio-button value="grid">表格</el-radio-button>
          <el-radio-button value="doc">文档</el-radio-button>
        </el-radio-group>

        <div class="toolbar-right">
          <el-tooltip content="从 Excel / CSV 导入（待开发）" placement="top">
            <el-button :disabled="true">
              <el-icon><Upload /></el-icon>
              导入
            </el-button>
          </el-tooltip>
          <el-tooltip content="常用模板（待开发）" placement="top">
            <el-button :disabled="true">
              <el-icon><Files /></el-icon>
              模板库
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <div class="list-body">
        <!-- 左侧分类 -->
        <div class="scope-rail">
          <div class="rail-search">
            <el-icon><Search /></el-icon>
            <input v-model="keyword" placeholder="搜索" class="rail-input" />
          </div>
          <div
            v-for="s in SCOPES"
            :key="s.value"
            class="scope-item"
            :class="{ active: scope === s.value }"
            @click="scope = s.value"
          >
            <el-icon><component :is="s.icon" /></el-icon>
            <span class="scope-name">{{ s.label }}</span>
            <span class="scope-count">{{ scopeCounts[s.value] ?? '' }}</span>
          </div>
        </div>

        <!-- 右侧列表 -->
        <div class="list-main">
          <div class="list-head">
            <span class="col-name">名称</span>
            <span class="col-owner">创建者</span>
            <span class="col-time">最近动态</span>
          </div>

          <el-empty
            v-if="!loading && !filteredItems.length"
            :description="emptyText"
            :image-size="110"
          >
            <el-button type="primary" @click="createVisible = true">去新建</el-button>
          </el-empty>

          <div v-else class="list-rows" v-loading="loading">
            <div
              v-for="item in filteredItems"
              :key="item.id"
              class="list-row"
              @click="openItem(item)"
            >
              <div class="col-name">
                <span class="type-icon" :style="{ background: TYPE_META[item.type].color }">
                  <el-icon :size="15" color="#fff"><component :is="TYPE_META[item.type].icon" /></el-icon>
                </span>
                <span class="item-name" :title="item.name">{{ item.name }}</span>
                <el-icon
                  class="star-flag"
                  :class="{ on: item.starred }"
                  :size="14"
                  @click.stop="handleToggleStar(item)"
                >
                  <StarFilled v-if="item.starred" />
                  <Star v-else />
                </el-icon>
                <span class="row-actions" @click.stop>
                  <el-dropdown trigger="click" @command="cmd => handleRowCommand(cmd, item)">
                    <el-icon class="more-btn"><MoreFilled /></el-icon>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="rename">
                          <el-icon><Edit /></el-icon>重命名
                        </el-dropdown-item>
                        <el-dropdown-item command="star">
                          <el-icon><Star /></el-icon>{{ item.starred ? '取消收藏' : '收藏' }}
                        </el-dropdown-item>
                        <el-dropdown-item command="remove" divided>
                          <el-icon><Delete /></el-icon>
                          <span class="danger-text">删除</span>
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </span>
              </div>
              <span class="col-owner">我</span>
              <span class="col-time">{{ formatTime(item.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 详情/编辑视图 ===== -->
    <FactoryDetail v-else :item-id="currentId" @back="handleBack" @changed="loadList" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as api from '@/api/factory'
import FactoryDetail from './detail.vue'

/** 类型元信息：图标 / 颜色（学企微：智能表格绿、表格蓝、文档紫） */
const TYPE_META = {
  smart: { label: '智能表格', icon: 'Grid', color: '#36b37e' },
  grid: { label: '表格', icon: 'Tickets', color: '#165dff' },
  doc: { label: '文档', icon: 'Document', color: '#7c5cff' },
}

const CREATE_OPTIONS = [
  { type: 'smart', label: '智能表格', icon: 'Grid', color: '#36b37e', disabled: false },
  { type: 'grid', label: '表格', icon: 'Tickets', color: '#165dff', disabled: false },
  { type: 'doc', label: '文档', icon: 'Document', color: '#7c5cff', disabled: false },
  { type: 'collect', label: '收集表', icon: 'Stamp', color: '#e6a23c', disabled: true },
  { type: 'report', label: '汇报', icon: 'DataAnalysis', color: '#f56c6c', disabled: true },
  { type: 'template', label: '模板库', icon: 'Files', color: '#909399', disabled: true },
]

const SCOPES = [
  { value: 'all', label: '与我相关', icon: 'User' },
  { value: 'mine', label: '我创建的', icon: 'EditPen' },
  { value: 'star', label: '我收藏的', icon: 'Star' },
  { value: 'recent', label: '最近查看', icon: 'Clock' },
]

// ─── 状态 ────────────────────────────────────────────────────────────────────

const items = ref([])
const scopeCounts = ref({})
const scope = ref('all')
const typeFilter = ref('all')
const keyword = ref('')
const loading = ref(false)
const currentId = ref(null)
const createVisible = ref(false)

const filteredItems = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return items.value
  return items.value.filter(it => it.name.toLowerCase().includes(kw))
})

const emptyText = computed(() => {
  if (keyword.value) return '没有匹配的内容'
  if (scope.value === 'star') return '还没有收藏的内容'
  return '这里还是空的，新建一个开始吧'
})

// ─── 数据 ────────────────────────────────────────────────────────────────────

async function loadList() {
  loading.value = true
  try {
    const [list, cnt] = await Promise.all([
      api.listItems({ scope: scope.value, type: typeFilter.value }),
      api.counts(),
    ])
    items.value = list
    scopeCounts.value = cnt
  } finally {
    loading.value = false
  }
}

// ─── 交互 ────────────────────────────────────────────────────────────────────

async function handleCreate(opt) {
  createVisible.value = false
  try {
    const { value } = await ElMessageBox.prompt(`请输入「${opt.label}」名称`, `新建${opt.label}`, {
      inputValue: `未命名${opt.label}`,
      inputPattern: /\S+/,
      inputErrorMessage: '名称不能为空',
      confirmButtonText: '创建',
      cancelButtonText: '取消',
    })
    const item = await api.createItem({ type: opt.type, name: value.trim() })
    ElMessage.success(`已创建「${item.name}」`)
    currentId.value = item.id
  } catch {
    /* 取消 */
  }
}

function openItem(item) {
  currentId.value = item.id
}

function handleBack() {
  currentId.value = null
  loadList()
}

async function handleToggleStar(item) {
  await api.toggleStar(item.id)
  item.starred = !item.starred
  scopeCounts.value = await api.counts()
}

async function handleRowCommand(cmd, item) {
  if (cmd === 'rename') {
    try {
      const { value } = await ElMessageBox.prompt('请输入新名称', '重命名', {
        inputValue: item.name,
        inputPattern: /\S+/,
        inputErrorMessage: '名称不能为空',
      })
      await api.renameItem(item.id, value.trim())
      item.name = value.trim()
      ElMessage.success('已重命名')
    } catch {
      /* 取消 */
    }
  } else if (cmd === 'star') {
    handleToggleStar(item)
  } else if (cmd === 'remove') {
    try {
      await ElMessageBox.confirm(`确定删除「${item.name}」吗？删除后不可恢复。`, '删除确认', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      })
      await api.removeItem(item.id)
      ElMessage.success('已删除')
      loadList()
    } catch {
      /* 取消 */
    }
  }
}

// ─── 工具 ────────────────────────────────────────────────────────────────────

function formatTime(ts) {
  const d = new Date(ts)
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  const today = new Date()
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  if (sameDay) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  const yesterday = new Date(today.getTime() - 86400000)
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  if (isYesterday) return '昨天'
  return `${d.getMonth() + 1}/${d.getDate()}`
}

onMounted(loadList)
</script>

<style scoped>
.factory-page {
  height: 100%;
}
.list-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border: 1px solid var(--hamifs-border-color);
  border-radius: 8px;
  overflow: hidden;
}

/* ── 顶部工具栏 ── */
.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--hamifs-border-color);
}
.new-btn .caret {
  margin-left: 2px;
}
.toolbar-right {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

/* ── 新建面板 ── */
.create-panel {
  padding: 4px;
}
.panel-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
}
.panel-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.panel-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 10px;
  border: 1px solid var(--hamifs-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.panel-card:hover:not(.disabled) {
  border-color: var(--hamifs-primary);
  background: #f5f8ff;
}
.panel-card.disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  flex-shrink: 0;
}
.card-label {
  font-size: 13px;
}

/* ── 主体：左分类 + 右列表 ── */
.list-body {
  display: flex;
  flex: 1;
  min-height: 0;
}
.scope-rail {
  width: 172px;
  flex-shrink: 0;
  border-right: 1px solid var(--hamifs-border-color);
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #fafbfc;
}
.rail-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  margin-bottom: 8px;
  background: #ffffff;
  border: 1px solid var(--hamifs-border-color);
  border-radius: 6px;
  color: #a8abb2;
}
.rail-input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 13px;
  background: transparent;
}
.scope-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: #5b6068;
  cursor: pointer;
}
.scope-item:hover {
  background: #eceef1;
}
.scope-item.active {
  background: var(--el-color-primary-light-9);
  color: var(--hamifs-primary);
  font-weight: 600;
}
.scope-count {
  margin-left: auto;
  font-size: 12px;
  color: #a8abb2;
}

/* ── 列表 ── */
.list-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.list-head,
.list-row {
  display: flex;
  align-items: center;
  padding: 0 20px;
}
.list-head {
  height: 40px;
  font-size: 12px;
  color: #909399;
  border-bottom: 1px solid var(--hamifs-border-color);
  flex-shrink: 0;
}
.list-rows {
  flex: 1;
  overflow-y: auto;
}
.list-row {
  height: 48px;
  cursor: pointer;
  border-bottom: 1px solid #f2f3f5;
}
.list-row:hover {
  background: #f7f9fc;
}
.col-name {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.col-owner,
.col-time {
  width: 100px;
  flex-shrink: 0;
  font-size: 13px;
  color: #8a8f99;
}
.type-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  flex-shrink: 0;
}
.item-name {
  font-size: 14px;
  color: var(--hamifs-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.star-flag {
  color: #cdd0d6;
  flex-shrink: 0;
}
.star-flag.on {
  color: #f7ba2a;
}
.row-actions {
  display: none;
  margin-left: 4px;
}
.list-row:hover .row-actions {
  display: inline-flex;
}
.more-btn {
  color: #909399;
  padding: 4px;
  border-radius: 4px;
}
.more-btn:hover {
  background: #eceef1;
  color: var(--hamifs-primary);
}
.danger-text {
  color: var(--el-color-danger);
}
</style>
