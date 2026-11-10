<template>
  <div class="detail-shell" v-loading="loading">
    <!-- ── 顶栏 ── -->
    <div class="detail-header">
      <el-button text class="back-btn" @click="emit('back')">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <span class="type-icon" :style="{ background: meta.color }">
        <el-icon :size="15" color="#fff"><component :is="meta.icon" /></el-icon>
      </span>
      <span class="item-name" title="点击重命名" @click="rename">{{ item?.name }}</span>
      <el-tag size="small" effect="plain">{{ meta.label }}</el-tag>
      <el-icon class="star-btn" :class="{ on: item?.starred }" @click="toggleStar">
        <StarFilled v-if="item?.starred" />
        <Star v-else />
      </el-icon>

      <span class="save-state">
        <el-icon v-if="saveState === 'saving'" class="is-loading"><Loading /></el-icon>
        <el-icon v-else><CircleCheck /></el-icon>
        {{ saveState === 'saving' ? '保存中…' : '已自动保存' }}
      </span>
    </div>

    <!-- ══════════ 文档编辑器 ══════════ -->
    <div v-if="item && item.type === 'doc'" class="doc-wrap">
      <div class="doc-paper">
        <div class="doc-title">{{ item.name }}</div>
        <el-input
          v-model="item.content"
          type="textarea"
          :autosize="{ minRows: 22 }"
          resize="none"
          placeholder="开始记录…（支持 Markdown 语法，后端就绪后可接入 vditor 富文本编辑器）"
          class="doc-editor"
          @input="scheduleDocSave"
        />
        <div class="doc-foot">约 {{ (item.content || '').length }} 字 · 自动保存至本地</div>
      </div>
    </div>

    <!-- ══════════ 表格编辑器（智能表格 / 表格 共用网格） ══════════ -->
    <div v-else-if="item" class="grid-wrap">
      <!-- 批量操作条 -->
      <div class="grid-toolbar">
        <el-button size="small" :disabled="!selectedRows.size" @click="clearSelection">
          取消选择（{{ selectedRows.size }}）
        </el-button>
        <el-button
          size="small"
          type="danger"
          plain
          :disabled="!selectedRows.size"
          @click="deleteSelected"
        >
          删除选中行
        </el-button>
        <span class="grid-tip">点击单元格直接编辑 · 点击列头名字旁的箭头可改字段</span>
      </div>

      <div class="grid-scroll">
        <div class="grid">
          <!-- 表头：字段行 -->
          <div class="g-row g-head">
            <div class="g-cell g-check">
              <el-checkbox
                :model-value="allSelected"
                :indeterminate="selectedRows.size > 0 && !allSelected"
                @change="toggleSelectAll"
              />
            </div>
            <div class="g-cell g-index">#</div>
            <div
              v-for="f in item.fields"
              :key="f.id"
              class="g-cell g-th"
              :style="{ width: (f.width || 150) + 'px' }"
            >
              <span class="th-name" :title="f.name">{{ f.name }}</span>
              <span class="th-type">{{ typeLabel(f.type) }}</span>
              <el-dropdown trigger="click" @command="cmd => handleFieldCmd(cmd, f)">
                <el-icon class="th-caret"><ArrowDown /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="rename">
                      <el-icon><Edit /></el-icon>重命名
                    </el-dropdown-item>
                    <el-dropdown-item divided command="t_text">
                      <el-icon><Document /></el-icon>设为文本
                    </el-dropdown-item>
                    <el-dropdown-item command="t_number">
                      <el-icon><Ticket /></el-icon>设为数字
                    </el-dropdown-item>
                    <el-dropdown-item command="t_date">
                      <el-icon><Calendar /></el-icon>设为日期
                    </el-dropdown-item>
                    <el-dropdown-item command="t_select">
                      <el-icon><Collection /></el-icon>设为单选
                    </el-dropdown-item>
                    <el-dropdown-item command="remove" divided>
                      <el-icon><Delete /></el-icon>
                      <span class="danger-text">删除此字段</span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="g-cell g-add" title="添加字段" @click="addField">
              <el-icon><Plus /></el-icon>
            </div>
          </div>

          <!-- 数据行 -->
          <div v-for="(row, ri) in item.rows" :key="row.id" class="g-row">
            <div class="g-cell g-check">
              <el-checkbox
                :model-value="selectedRows.has(row.id)"
                @change="v => toggleRow(row.id, v)"
              />
            </div>
            <div class="g-cell g-index">{{ ri + 1 }}</div>
            <div
              v-for="f in item.fields"
              :key="f.id"
              class="g-cell g-td"
              :style="{ width: (f.width || 150) + 'px' }"
              @click="startEdit(row, f)"
            >
              <!-- 编辑态 -->
              <template v-if="editing && editing.rowId === row.id && editing.fieldId === f.id">
                <el-input
                  v-if="f.type === 'text' || f.type === 'number'"
                  ref="editInputRef"
                  v-model="editValue"
                  size="small"
                  @keyup.enter="commitEdit(row, f)"
                  @blur="commitEdit(row, f)"
                />
                <el-select
                  v-else-if="f.type === 'select'"
                  v-model="editValue"
                  size="small"
                  placeholder="选择"
                  @change="commitEdit(row, f)"
                  @visible-change="v => !v && cancelEdit()"
                >
                  <el-option
                    v-for="o in f.options || []"
                    :key="o.id"
                    :label="o.label"
                    :value="o.label"
                  />
                </el-select>
                <el-date-picker
                  v-else-if="f.type === 'date'"
                  v-model="editValue"
                  type="date"
                  size="small"
                  value-format="x"
                  @change="commitEdit(row, f)"
                  @visible-change="v => !v && cancelEdit()"
                />
              </template>

              <!-- 展示态 -->
              <template v-else>
                <span v-if="f.type === 'select'" class="select-chip" :style="chipStyle(f, row.values[f.id])">
                  {{ row.values[f.id] || '' }}
                </span>
                <span v-else-if="f.type === 'date'" class="cell-text">
                  {{ formatDate(row.values[f.id]) }}
                </span>
                <span v-else class="cell-text">{{ row.values[f.id] ?? '' }}</span>
              </template>
            </div>
            <div class="g-cell g-add-ghost" />
          </div>

          <!-- 底部：新增记录 -->
          <div class="grid-footer">
            <el-button text type="primary" @click="appendRow">
              <el-icon><Plus /></el-icon>
              新增记录
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as api from '@/api/factory'

const props = defineProps({ itemId: { type: String, required: true } })
const emit = defineEmits(['back', 'changed'])

const TYPE_META = {
  smart: { label: '智能表格', icon: 'Grid', color: '#36b37e' },
  grid: { label: '表格', icon: 'Tickets', color: '#165dff' },
  doc: { label: '文档', icon: 'Document', color: '#7c5cff' },
}

// ─── 状态 ────────────────────────────────────────────────────────────────────

const item = ref(null)
const loading = ref(false)
const saveState = ref('saved') // saved | saving
const selectedRows = ref(new Set())
const editing = ref(null) // { rowId, fieldId }
const editValue = ref('')

const meta = computed(() => TYPE_META[item.value?.type] || TYPE_META.smart)
const allSelected = computed(
  () => item.value?.rows.length > 0 && selectedRows.value.size === item.value.rows.length,
)

// ─── 加载 ────────────────────────────────────────────────────────────────────

onMounted(async () => {
  loading.value = true
  try {
    item.value = await api.getItem(props.itemId)
  } finally {
    loading.value = false
  }
})

// ─── 通用操作 ────────────────────────────────────────────────────────────────

async function rename() {
  try {
    const { value } = await ElMessageBox.prompt('请输入新名称', '重命名', {
      inputValue: item.value.name,
      inputPattern: /\S+/,
      inputErrorMessage: '名称不能为空',
    })
    item.value = await api.renameItem(item.value.id, value.trim())
    emit('changed')
  } catch {
    /* 取消 */
  }
}

async function toggleStar() {
  item.value = await api.toggleStar(item.value.id)
  emit('changed')
}

function markSaving() {
  saveState.value = 'saving'
  setTimeout(() => {
    saveState.value = 'saved'
  }, 400)
}

// ─── 单元格编辑 ──────────────────────────────────────────────────────────────

function startEdit(row, field) {
  editing.value = { rowId: row.id, fieldId: field.id }
  const v = row.values[field.id]
  editValue.value = v === null || v === undefined ? '' : v
}

function cancelEdit() {
  editing.value = null
}

async function commitEdit(row, field) {
  if (!editing.value || editing.value.rowId !== row.id || editing.value.fieldId !== field.id) return
  editing.value = null
  let value = editValue.value
  if (field.type === 'number') value = value === '' ? '' : Number(value)
  if (field.type === 'date') value = value ? Number(value) : null
  if (row.values[field.id] === value) return
  row.values[field.id] = value
  markSaving()
  await api.updateCell(item.value.id, row.id, field.id, value)
}

// ─── 行操作 ──────────────────────────────────────────────────────────────────

async function appendRow() {
  const row = await api.addRow(item.value.id)
  item.value.rows.push(row)
  markSaving()
}

function toggleRow(id, checked) {
  const next = new Set(selectedRows.value)
  checked ? next.add(id) : next.delete(id)
  selectedRows.value = next
}

function toggleSelectAll(checked) {
  selectedRows.value = checked ? new Set(item.value.rows.map(r => r.id)) : new Set()
}

function clearSelection() {
  selectedRows.value = new Set()
}

async function deleteSelected() {
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.size} 行吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    const ids = [...selectedRows.value]
    await api.removeRows(item.value.id, ids)
    item.value.rows = item.value.rows.filter(r => !ids.includes(r.id))
    clearSelection()
    markSaving()
  } catch {
    /* 取消 */
  }
}

// ─── 字段操作 ────────────────────────────────────────────────────────────────

function typeLabel(t) {
  return api.FIELD_TYPES.find(x => x.value === t)?.label || '文本'
}

async function addField() {
  try {
    const { value } = await ElMessageBox.prompt('请输入字段名称', '添加字段', {
      inputValue: '新字段',
      inputPattern: /\S+/,
      inputErrorMessage: '名称不能为空',
    })
    const field = await api.addField(item.value.id, { name: value.trim(), type: 'text' })
    item.value.fields.push(field)
    markSaving()
  } catch {
    /* 取消 */
  }
}

async function handleFieldCmd(cmd, field) {
  if (cmd === 'rename') {
    try {
      const { value } = await ElMessageBox.prompt('请输入字段名称', '重命名字段', {
        inputValue: field.name,
        inputPattern: /\S+/,
        inputErrorMessage: '名称不能为空',
      })
      field.name = value.trim()
      await api.updateField(item.value.id, field.id, { name: field.name })
      markSaving()
    } catch {
      /* 取消 */
    }
  } else if (cmd.startsWith('t_')) {
    const type = cmd.slice(2)
    if (field.type === type) return
    field.type = type
    if (type === 'select' && !field.options) {
      field.options = [
        { id: `o_${Date.now()}_1`, label: '选项一', color: '#165dff' },
        { id: `o_${Date.now()}_2`, label: '选项二', color: '#18a058' },
      ]
    }
    await api.updateField(item.value.id, field.id, { type, options: field.options })
    markSaving()
  } else if (cmd === 'remove') {
    if (item.value.fields.length <= 1) {
      ElMessage.warning('至少保留一个字段')
      return
    }
    try {
      await ElMessageBox.confirm(`确定删除字段「${field.name}」吗？该列数据将一并清除。`, '删除确认', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      })
      item.value.fields = item.value.fields.filter(f => f.id !== field.id)
      await api.removeField(item.value.id, field.id)
      markSaving()
    } catch {
      /* 取消 */
    }
  }
}

// ─── 文档 ────────────────────────────────────────────────────────────────────

let docTimer = null
function scheduleDocSave() {
  clearTimeout(docTimer)
  docTimer = setTimeout(async () => {
    markSaving()
    await api.saveDoc(item.value.id, item.value.content)
  }, 600)
}

// ─── 展示工具 ────────────────────────────────────────────────────────────────

function chipStyle(field, label) {
  if (!label) return {}
  const opt = (field.options || []).find(o => o.label === label)
  if (!opt) return { background: '#f2f3f5', color: '#606266' }
  return { background: `${opt.color}1a`, color: opt.color }
}

function formatDate(v) {
  if (!v) return ''
  const d = new Date(Number(v))
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<style scoped>
.detail-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border: 1px solid var(--hamifs-border-color);
  border-radius: 8px;
  overflow: hidden;
}

/* ── 顶栏 ── */
.detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--hamifs-border-color);
  flex-shrink: 0;
}
.back-btn {
  padding: 6px 8px;
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
  font-size: 15px;
  font-weight: 600;
  color: var(--hamifs-text-primary);
  cursor: pointer;
}
.item-name:hover {
  color: var(--hamifs-primary);
}
.star-btn {
  color: #cdd0d6;
  cursor: pointer;
}
.star-btn.on {
  color: #f7ba2a;
}
.save-state {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

/* ═══ 文档 ═══ */
.doc-wrap {
  flex: 1;
  overflow-y: auto;
  background: #f5f7f9;
  padding: 24px;
}
.doc-paper {
  max-width: 860px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid var(--hamifs-border-color);
  border-radius: 8px;
  padding: 40px 48px;
}
.doc-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--hamifs-text-primary);
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--hamifs-border-color);
}
.doc-editor :deep(.el-textarea__inner) {
  font-size: 14px;
  line-height: 1.9;
  padding: 0;
  box-shadow: none !important;
}
.doc-foot {
  margin-top: 16px;
  font-size: 12px;
  color: #a8abb2;
  text-align: right;
}

/* ═══ 表格 ═══ */
.grid-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.grid-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--hamifs-border-color);
  flex-shrink: 0;
}
.grid-tip {
  margin-left: auto;
  font-size: 12px;
  color: #a8abb2;
}
.grid-scroll {
  flex: 1;
  overflow: auto;
  padding: 0 16px 16px;
}
.grid {
  min-width: fit-content;
}

/* 网格行/单元格 */
.g-row {
  display: flex;
  border-bottom: 1px solid #eceef1;
  min-width: max-content;
}
.g-head {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f7f8fa;
  border-bottom: 1px solid var(--hamifs-border-color);
}
.g-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 10px;
  font-size: 13px;
  border-right: 1px solid #f2f3f5;
  flex-shrink: 0;
  box-sizing: border-box;
}
.g-check {
  width: 44px;
  justify-content: center;
}
.g-index {
  width: 48px;
  justify-content: center;
  color: #a8abb2;
  font-size: 12px;
}
.g-th {
  font-weight: 600;
  color: #454c55;
}
.th-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.th-type {
  font-size: 11px;
  font-weight: 400;
  color: #a8abb2;
}
.th-caret {
  color: #a8abb2;
  cursor: pointer;
  border-radius: 3px;
  padding: 2px;
}
.th-caret:hover {
  background: #eceef1;
  color: var(--hamifs-primary);
}
.g-add {
  width: 40px;
  justify-content: center;
  color: #909399;
  cursor: pointer;
}
.g-add:hover {
  color: var(--hamifs-primary);
  background: #f5f8ff;
}
.g-add-ghost {
  width: 40px;
}
.g-td {
  cursor: pointer;
  min-height: 36px;
}
.g-td:hover {
  background: #f7f9fc;
  box-shadow: inset 0 0 0 1px var(--el-color-primary-light-7);
}
.cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.select-chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 18px;
}
.grid-footer {
  padding: 8px 0 0 10px;
}
.danger-text {
  color: var(--el-color-danger);
}
</style>
