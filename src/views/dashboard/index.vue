<template>
  <div class="dashboard page-container">
    <!-- ① 天气 / 日期条 -->
    <WeatherCard />

    <el-row :gutter="16">
      <!-- ② 文档类型扇形图 -->
      <el-col :xs="24" :lg="10" class="col-block">
        <DocTypeChart :segments="data.docTypes" :total="data.docTotal" :total-size="data.totalSize" />
      </el-col>

      <!-- ③ 今日概览：三类记事 + 存储用量 -->
      <el-col :xs="24" :lg="14" class="col-block">
        <div class="overview-card">
          <div class="card-head">
            <span class="card-title">今日概览</span>
            <el-button text size="small" type="primary" @click="go('/memo/index')">
              进入个人记事
              <el-icon class="btn-arrow"><ArrowRight /></el-icon>
            </el-button>
          </div>

          <div class="stat-grid">
            <div class="stat-item" @click="go('/memo/index')">
              <div class="stat-icon todo">
                <el-icon :size="20"><Finished /></el-icon>
              </div>
              <div class="stat-body">
                <div class="stat-num">
                  {{ data.stats.todo.total - data.stats.todo.done }}<i>/{{ data.stats.todo.total }}</i>
                </div>
                <div class="stat-name">待办未完成</div>
              </div>
            </div>
            <div class="stat-item" @click="go('/memo/index')">
              <div class="stat-icon journal">
                <el-icon :size="20"><Notebook /></el-icon>
              </div>
              <div class="stat-body">
                <div class="stat-num">{{ data.stats.journal }}</div>
                <div class="stat-name">手记</div>
              </div>
            </div>
            <div class="stat-item" @click="go('/memo/index')">
              <div class="stat-icon memo">
                <el-icon :size="20"><Bell /></el-icon>
              </div>
              <div class="stat-body">
                <div class="stat-num">{{ data.stats.memo }}</div>
                <div class="stat-name">备忘</div>
              </div>
            </div>
          </div>

          <div class="divider" />

          <div class="storage-row">
            <div class="storage-info">
              <span class="card-title">存储用量</span>
              <span class="storage-text">{{ formatSize(data.storage.used) }} / {{ formatSize(data.storage.quota) }}</span>
            </div>
            <el-progress
              class="storage-bar"
              :percentage="storagePct"
              :stroke-width="8"
              :show-text="false"
              :color="storageColor"
            />
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="row-block">
      <!-- ④ 快捷操作 -->
      <el-col :xs="24" :lg="8" class="col-block">
        <div class="panel-card">
          <div class="card-head">
            <span class="card-title">快捷操作</span>
          </div>
          <div class="quick-grid">
            <div v-for="act in quickActions" :key="act.label" class="quick-item" @click="go(act.path)">
              <el-icon :size="22" :color="act.color"><component :is="act.icon" /></el-icon>
              <span class="quick-label">{{ act.label }}</span>
            </div>
          </div>
        </div>
      </el-col>

      <!-- ⑤ 最近文档 -->
      <el-col :xs="24" :lg="8" class="col-block">
        <div class="panel-card">
          <div class="card-head">
            <span class="card-title">最近文档</span>
            <el-button text size="small" type="primary" @click="go('/hamifs-storage/index')">查看全部</el-button>
          </div>
          <div v-loading="loading" class="panel-list">
            <div
              v-for="doc in data.recentDocs"
              :key="doc.id"
              class="recent-item"
              @click="go('/hamifs-storage/index')"
            >
              <el-icon :size="18" :color="resolveFileType(doc.name).color">
                <component :is="resolveFileType(doc.name).icon" />
              </el-icon>
              <span class="recent-name" :title="doc.name">{{ doc.name }}</span>
              <span class="recent-time">{{ formatRelativeTime(doc.updatedAt) }}</span>
            </div>
            <el-empty v-if="!loading && !data.recentDocs.length" description="暂无文档" :image-size="60" />
          </div>
        </div>
      </el-col>

      <!-- ⑥ 置顶记事 -->
      <el-col :xs="24" :lg="8" class="col-block">
        <div class="panel-card">
          <div class="card-head">
            <span class="card-title">置顶记事</span>
            <el-button text size="small" type="primary" @click="go('/memo/index')">去处理</el-button>
          </div>
          <div v-loading="loading" class="panel-list">
            <div
              v-for="memo in data.pinnedMemos"
              :key="memo.id"
              class="pinned-item"
              @click="go('/memo/index')"
            >
              <div class="pinned-title">
                <el-tag
                  v-if="memo.type !== 'memo'"
                  size="small"
                  :type="memo.type === 'todo' ? 'warning' : 'success'"
                  effect="plain"
                >
                  {{ memo.type === 'todo' ? '待办' : '手记' }}
                </el-tag>
                {{ memo.title }}
              </div>
              <div class="pinned-content">{{ memo.content || '（无内容）' }}</div>
            </div>
            <el-empty v-if="!loading && !data.pinnedMemos.length" description="暂无置顶记事" :image-size="60" />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Bell, EditPen, Finished, Grid, Notebook, Switch, UploadFilled } from '@element-plus/icons-vue'
import WeatherCard from './components/WeatherCard.vue'
import DocTypeChart from './components/DocTypeChart.vue'
import { getDashboardData } from '@/api/dashboard'
import { formatSize, formatRelativeTime, resolveFileType } from '@/utils/fileType'

const router = useRouter()
const loading = ref(false)

/** 聚合数据，先给全零默认值避免模板空引用 */
const data = reactive({
  docTotal: 0,
  totalSize: 0,
  docTypes: [],
  stats: { todo: { total: 0, done: 0 }, journal: 0, memo: 0 },
  recentDocs: [],
  pinnedMemos: [],
  storage: { used: 0, quota: 1, pct: 0 },
})

const quickActions = [
  { label: '写记事', icon: EditPen, color: '#165dff', path: '/memo/index' },
  { label: '上传文档', icon: UploadFilled, color: '#e6a23c', path: '/hamifs-storage/index' },
  { label: '格式转换', icon: Switch, color: '#9254de', path: '/convert/index' },
  { label: '智能加工', icon: Grid, color: '#217346', path: '/factory/index' },
]

const storagePct = computed(() => Math.min(Math.round(data.storage.pct * 100), 100))
const storageColor = computed(() => {
  if (data.storage.pct > 0.9) return '#e5484d'
  if (data.storage.pct > 0.7) return '#e6a23c'
  return '#165dff'
})

const go = path => router.push(path)

onMounted(async () => {
  loading.value = true
  try {
    const result = await getDashboardData()
    Object.assign(data, result)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.col-block {
  margin-bottom: 16px;
}

/* ─── 通用卡片头 ───────────────────────────────────────────────────────────── */
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--hamifs-text-primary);
}

.btn-arrow {
  margin-left: 2px;
}

/* ─── 今日概览 ─────────────────────────────────────────────────────────────── */
.overview-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  padding: 16px 20px;
  background: var(--hamifs-bg-card);
  border: 1px solid var(--hamifs-border-color);
  border-radius: var(--hamifs-radius);
  box-shadow: var(--hamifs-shadow-card);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  background: var(--el-fill-color-lighter);
  border-radius: var(--hamifs-radius);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: #fff;
}

.stat-icon.todo {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.stat-icon.journal {
  background: linear-gradient(135deg, #10b981, #34d399);
}

.stat-icon.memo {
  background: linear-gradient(135deg, #165dff, #60a5fa);
}

.stat-num {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--hamifs-text-primary);
}

.stat-num i {
  font-size: 13px;
  font-style: normal;
  font-weight: 400;
  color: var(--hamifs-text-secondary);
}

.stat-name {
  margin-top: 2px;
  font-size: 12px;
  color: var(--hamifs-text-secondary);
}

.divider {
  height: 1px;
  margin: 16px 0;
  background: var(--hamifs-border-color);
}

.storage-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.storage-info {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.storage-text {
  font-size: 13px;
  color: var(--hamifs-text-regular);
}

.storage-bar {
  width: 100%;
}

/* ─── 下排三张面板 ─────────────────────────────────────────────────────────── */
.panel-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 220px;
  padding: 16px 20px;
  background: var(--hamifs-bg-card);
  border: 1px solid var(--hamifs-border-color);
  border-radius: var(--hamifs-radius);
  box-shadow: var(--hamifs-shadow-card);
}

.panel-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  overflow: auto;
}

/* 快捷操作 */
.quick-grid {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  align-content: center;
}

.quick-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 18px 12px;
  cursor: pointer;
  background: var(--el-fill-color-lighter);
  border-radius: var(--hamifs-radius);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.quick-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.quick-label {
  font-size: 13px;
  color: var(--hamifs-text-regular);
}

/* 最近文档 */
.recent-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 6px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.recent-item:hover {
  background: var(--el-fill-color-light);
}

.recent-name {
  flex: 1;
  overflow: hidden;
  font-size: 13px;
  color: var(--hamifs-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--hamifs-text-secondary);
}

/* 置顶记事 */
.pinned-item {
  padding: 8px 6px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.pinned-item:hover {
  background: var(--el-fill-color-light);
}

.pinned-title {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--hamifs-text-primary);
}

.pinned-content {
  display: -webkit-box;
  margin-top: 4px;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.6;
  color: var(--hamifs-text-secondary);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

/* 窄屏 */
@media (max-width: 992px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }

  .quick-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
