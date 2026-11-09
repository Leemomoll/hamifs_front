import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: false,
    device: 'desktop',
    // 内容区刷新计数：值变化即触发路由组件重建
    refreshKey: 0,
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    setSidebarCollapsed(collapsed) {
      this.sidebarCollapsed = collapsed
    },
    refreshView() {
      this.refreshKey += 1
    },
  },
})
