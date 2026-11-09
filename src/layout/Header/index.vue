<template>
  <div class="header-container">
    <div class="header-left">
      <!-- 侧边导航栏展开 / 收起 -->
      <el-icon class="icon-btn" :size="24" @click="toggleSidebar">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="4" width="18" height="16" rx="2.5" />
          <path d="M3 9.5h18" />
          <path d="M9 9.5V20" />
        </svg>
      </el-icon>
      <Breadcrumb />
    </div>

    <div class="header-right">
      <!-- 搜索：点击或 Ctrl+K 唤起 -->
      <div class="header-search" @click="openSearch">
        <el-icon class="search-icon"><Search /></el-icon>
        <span class="search-placeholder">搜索</span>
        <kbd class="search-kbd">Ctrl K</kbd>
      </div>

      <el-tooltip content="刷新" placement="bottom" effect="light">
        <el-icon class="icon-btn" :size="24" @click="appStore.refreshView()">
          <Refresh />
        </el-icon>
      </el-tooltip>

      <el-tooltip content="全屏" placement="bottom" effect="light">
        <el-icon class="icon-btn" :size="24" @click="toggleFullscreen">
          <FullScreen />
        </el-icon>
      </el-tooltip>

      <!-- 通知 -->
      <el-popover
        placement="bottom-end"
        :width="320"
        trigger="click"
        :teleported="false"
        popper-class="notice-popper"
      >
        <template #reference>
          <el-badge :value="noticeCount" :max="99">
            <el-icon class="icon-btn" :size="24"><Bell /></el-icon>
          </el-badge>
        </template>

        <div class="notice-panel">
          <div class="notice-header">全部通知</div>
          <div class="notice-list">
            <div v-for="item in notices" :key="item.id" class="notice-item">
              <div class="notice-title">{{ item.title }}</div>
              <div class="notice-time">{{ item.time }}</div>
            </div>
          </div>
          <div class="notice-footer">加载更多</div>
        </div>
      </el-popover>

      <!-- 用户 -->
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="avatar-wrapper">
          <el-avatar :size="28" class="user-avatar">{{ avatarText }}</el-avatar>
          <span class="username">{{ userStore.name }}</span>
          <el-icon :size="12"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人中心</el-dropdown-item>
            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>

  <!-- 搜索面板 -->
  <div v-if="searchVisible" class="search-mask" @click="closeSearch">
    <div class="search-panel" @click.stop>
      <el-input
        ref="searchInputRef"
        v-model="keyword"
        placeholder="搜索菜单、页面"
        size="large"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <div class="search-result">
        <div v-if="!searchResults.length" class="search-empty">没有找到相关内容</div>
        <div
          v-for="item in searchResults"
          :key="item.path"
          class="search-item"
          @click="handleSelect(item)"
        >
          <el-icon class="search-item-icon"><Document /></el-icon>
          <span class="search-item-title">{{ item.title }}</span>
          <span class="search-item-path">{{ item.path }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowDown,
  Bell,
  Document,
  FullScreen,
  Refresh,
  Search,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/store/modules/app'
import { useUserStore } from '@/store/modules/user'
import { constantRoutes } from '@/router/routes'
import Breadcrumb from './Breadcrumb.vue'

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const avatarText = computed(() => (userStore.name || 'U').charAt(0).toUpperCase())

const toggleSidebar = () => appStore.toggleSidebar()

const toggleFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen?.()
  }
}

/* ===== 搜索面板 ===== */
const searchVisible = ref(false)
const keyword = ref('')
const searchInputRef = ref(null)

// 从路由表提取可搜索的菜单项
const menuOptions = computed(() => {
  const list = []
  constantRoutes.forEach(route => {
    if (route.meta?.hidden) return
    const children = (route.children || []).filter(child => !child.meta?.hidden)
    if (children.length) {
      children.forEach(child => {
        if (!child.meta?.title) return
        const path = !child.path
          ? route.path
          : child.path.startsWith('/')
            ? child.path
            : `${route.path}/${child.path}`
        list.push({ title: child.meta.title, path })
      })
    } else if (route.meta?.title) {
      list.push({ title: route.meta.title, path: route.path })
    }
  })
  return list
})

const searchResults = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return menuOptions.value
  return menuOptions.value.filter(item => item.title.toLowerCase().includes(kw))
})

const openSearch = () => {
  searchVisible.value = true
  nextTick(() => searchInputRef.value?.focus())
}

const closeSearch = () => {
  searchVisible.value = false
  keyword.value = ''
}

const handleSelect = item => {
  closeSearch()
  router.push(item.path)
}

const handleKeydown = event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    openSearch()
    return
  }
  if (event.key === 'Escape' && searchVisible.value) {
    closeSearch()
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))

/* ===== 通知（静态数据，后续接接口） ===== */
const noticeCount = 10
const notices = [
  { id: 1, title: '你收到了 3 条新的工作消息', time: '刚刚' },
  { id: 2, title: '用户 Jeffrey 提交了权限申请', time: '10 分钟前' },
  { id: 3, title: '系统将于今晚 23:00 进行维护', time: '1 小时前' },
  { id: 4, title: '你负责的项目「工作台改版」已通过评审', time: '昨天 15:20' },
  { id: 5, title: '有 12 个待办任务即将到期', time: '昨天 09:40' },
]

/* ===== 用户菜单 ===== */
const handleCommand = command => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
      .then(async () => {
        await userStore.logout()
        ElMessage.success('已退出登录')
        router.push('/login')
      })
      .catch(() => {})
    return
  }
  ElMessage.info('功能开发中')
}
</script>

<style scoped>
.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 auto;
  height: var(--hamifs-header-height);
  padding: 0 16px;
  background-color: #ffffff;
  border-bottom: 1px solid var(--hamifs-border-color);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.icon-btn {
  /* 图标本体是 1em×1em：这里用 content-box，让 padding 长在尺寸之外。
     否则在全局 box-sizing: border-box 下，24px 的图标会被 10px 的 padding 挤成一个小点 */
  box-sizing: content-box;
  padding: 6px;
  color: #4a4f57;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

/* svg 不参与 flex 收缩，避免容器变窄时被压扁 */
.icon-btn :deep(svg) {
  flex: 0 0 auto;
}

.icon-btn:hover {
  color: var(--hamifs-primary);
  background-color: rgba(242, 243, 245, 0.7);
}

/* ===== 搜索框 ===== */
.header-search {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 180px;
  height: 32px;
  padding: 0 10px;
  color: var(--hamifs-text-secondary);
  background-color: rgba(247, 248, 250, 0.6);
  border: 1px solid var(--hamifs-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.header-search:hover {
  color: var(--hamifs-text-regular);
  border-color: var(--hamifs-primary);
}

.search-icon {
  font-size: 16px;
}

.search-placeholder {
  flex: 1;
  font-size: 13px;
}

.search-kbd {
  padding: 1px 5px;
  font-size: 11px;
  font-family: inherit;
  color: var(--hamifs-text-secondary);
  background-color: #fff;
  border: 1px solid var(--hamifs-border-color);
  border-radius: 4px;
}

/* ===== 搜索面板 ===== */
.search-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background-color: rgba(0, 0, 0, 0.25);
}

.search-panel {
  width: 520px;
  max-width: calc(100vw - 32px);
  margin: 12vh auto 0;
  background-color: #ffffff;
  border: 1px solid var(--hamifs-border-color);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.search-result {
  max-height: 320px;
  padding: 6px;
  overflow-y: auto;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.search-item:hover {
  background-color: var(--hamifs-sidebar-hover-bg);
}

.search-item-icon {
  color: var(--hamifs-text-secondary);
}

.search-item-title {
  font-size: 14px;
  color: var(--hamifs-text-primary);
}

.search-item-path {
  margin-left: auto;
  font-size: 12px;
  color: var(--hamifs-text-secondary);
}

.search-empty {
  padding: 28px 0;
  text-align: center;
  font-size: 13px;
  color: var(--hamifs-text-secondary);
}

/* ===== 通知面板 ===== */
:deep(.notice-popper) {
  padding: 0;
}

.notice-header {
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 1px solid var(--hamifs-border-color);
}

.notice-list {
  max-height: 280px;
  overflow-y: auto;
}

.notice-item {
  padding: 10px 14px;
  border-bottom: 1px solid #f4f5f7;
  cursor: pointer;
}

.notice-item:hover {
  background-color: #f7f8fa;
}

.notice-title {
  font-size: 13px;
  color: var(--hamifs-text-primary);
}

.notice-time {
  margin-top: 4px;
  font-size: 12px;
  color: var(--hamifs-text-secondary);
}

.notice-footer {
  padding: 10px;
  text-align: center;
  font-size: 13px;
  color: var(--hamifs-primary);
  cursor: pointer;
}

/* ===== 用户区 ===== */
.avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 8px;
  cursor: pointer;
  outline: none;
}

.avatar-wrapper:hover {
  background-color: #f2f3f5;
}

.user-avatar {
  background-color: var(--hamifs-primary);
  font-size: 14px;
}

.username {
  font-size: 14px;
  color: var(--hamifs-text-primary);
}
</style>
