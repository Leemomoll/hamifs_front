<template>
  <div class="sidebar-container" :class="{ 'is-collapsed': isCollapsed }">
    <div class="sidebar-logo">
      <img class="logo-img" :src="logoUrl" alt="Hamifs" />
      <span class="logo-title">Hamifs Admin</span>
    </div>

    <el-scrollbar class="sidebar-scrollbar">
      <el-menu
        :default-active="activeMenu"
        :collapse="menuCollapsed"
        :collapse-transition="false"
        :unique-opened="false"
        background-color="transparent"
        text-color="#5b6068"
        active-text-color="#ffffff"
        router
      >
        <SidebarItem
          v-for="route in menuRoutes"
          :key="route.path"
          :item="route"
          :base-path="route.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/modules/app'
import { constantRoutes } from '@/router/routes'
import logoUrl from '@/assets/logo.png'
import SidebarItem from './SidebarItem.vue'

const route = useRoute()
const appStore = useAppStore()

const isCollapsed = computed(() => appStore.sidebarCollapsed)
const activeMenu = computed(() => route.meta?.activeMenu || route.path)
const menuRoutes = computed(() => constantRoutes.filter(item => !item.meta?.hidden))

/**
 * el-menu 的折叠态会让菜单标题移出侧栏 DOM（改为悬浮提示），结构切换无法过渡。
 * 所以收起时：先让侧栏宽度缓缓收窄、文字淡出，等宽度动画结束再切到折叠布局；
 * 展开时立即恢复文字结构，让它随宽度自然显露。
 */
const COLLAPSE_LAYOUT_DELAY = 320
const menuCollapsed = ref(appStore.sidebarCollapsed)
let collapseTimer = null

// 宽度动画进行中的标记：这段时间由全局样式把三层毛玻璃彻底停掉（见 styles/index.css）
const resizing = ref(false)
let resizeTimer = null

watch(isCollapsed, collapsed => {
  clearTimeout(collapseTimer)
  if (collapsed) {
    collapseTimer = setTimeout(() => {
      menuCollapsed.value = true
    }, COLLAPSE_LAYOUT_DELAY)
  } else {
    menuCollapsed.value = false
  }

  resizing.value = true
  clearTimeout(resizeTimer)
  // 略大于 CSS 里的 0.36s，等动画真正跑完再恢复毛玻璃
  resizeTimer = setTimeout(() => {
    resizing.value = false
  }, 420)
})

// 动画期间给 <html> 挂标记：由全局样式停掉毛玻璃并摘掉全屏背景层。
// 只关侧栏自己不够——顶栏和标签栏的宽度同样在逐帧变化，一起处理才有用。
watch(resizing, active => {
  document.documentElement.classList.toggle('is-sidebar-animating', active)
})

onBeforeUnmount(() => {
  clearTimeout(collapseTimer)
  clearTimeout(resizeTimer)
  document.documentElement.classList.remove('is-sidebar-animating')
})
</script>

<style scoped>
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--hamifs-sidebar-bg);
  /* 毛玻璃：模糊壁纸，保证菜单文字可读 */
  backdrop-filter: blur(var(--hamifs-glass-blur));
  /* 用阴影画右侧分隔线，避免占用布局宽度影响折叠宽度 */
  box-shadow: 1px 0 0 0 var(--hamifs-border-color);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  height: var(--hamifs-header-height);
  padding: 0 16px;
  overflow: hidden;
  white-space: nowrap;
  border-bottom: 1px solid var(--hamifs-border-color);
  transition:
    padding var(--hamifs-sidebar-transition),
    gap var(--hamifs-sidebar-transition);
}

/* 折叠后 64px 宽里让 logo 落到正中（展开态在 16px 处，位移很小，配合内边距过渡很平滑） */
.sidebar-container.is-collapsed .sidebar-logo {
  gap: 0;
  padding: 0 18px;
}

.logo-img {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  object-fit: cover;
  border-radius: 6px;
}

/* 标题不直接移除，随收起淡出、展开淡入，避免文字"啪"地消失 */
.logo-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--hamifs-text-primary);
  transition: opacity 0.3s ease;
}

.sidebar-container.is-collapsed .logo-title {
  opacity: 0;
}

.sidebar-scrollbar {
  flex: 1;
  min-height: 0;
}

/* 收放过程中内容由侧栏的 overflow: hidden 裁切，别冒出横向滚动条 */
:deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

/* 菜单文字随宽度收放淡出/淡入，收起来像被边界慢慢擦掉 */
:deep(.menu-title) {
  transition: opacity 0.3s ease;
}

.sidebar-container.is-collapsed :deep(.menu-title) {
  opacity: 0;
}

:deep(.el-menu) {
  border-right: none;
}

/* 折叠后悬浮弹出的子菜单：不能跟着透明，否则叠在内容上看不清 */
:deep(.el-menu--popup-container),
:deep(.el-menu--popup) {
  background-color: rgba(255, 255, 255, 0.92) !important;
  backdrop-filter: blur(var(--hamifs-glass-blur));
}

/* 浅色菜单 hover / active，主色统一为绿色 */
:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: var(--hamifs-sidebar-hover-bg) !important;
}

:deep(.el-menu-item.is-active) {
  background-color: var(--hamifs-primary) !important;
  color: #fff !important;
}
</style>
