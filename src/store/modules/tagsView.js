import { defineStore } from 'pinia'

export const useTagsViewStore = defineStore('tagsView', {
  state: () => ({
    visitedViews: [],
  }),
  actions: {
    addView(view) {
      if (this.visitedViews.some(v => v.path === view.path)) return
      this.visitedViews.push({
        path: view.path,
        fullPath: view.fullPath,
        name: view.name,
        title: view.meta?.title || '未命名',
        affix: !!view.meta?.affix,
      })
    },
    delView(view) {
      const index = this.visitedViews.findIndex(v => v.path === view.path)
      if (index > -1) this.visitedViews.splice(index, 1)
    },
    delOthersViews(view) {
      this.visitedViews = this.visitedViews.filter(v => v.affix || v.path === view.path)
    },
    delLeftViews(view) {
      const index = this.visitedViews.findIndex(v => v.path === view.path)
      if (index > -1) {
        this.visitedViews = this.visitedViews.filter(
          (v, i) => i >= index || v.affix
        )
      }
    },
    delRightViews(view) {
      const index = this.visitedViews.findIndex(v => v.path === view.path)
      if (index > -1) {
        this.visitedViews = this.visitedViews.filter(
          (v, i) => i <= index || v.affix
        )
      }
    },
    delAllViews() {
      this.visitedViews = this.visitedViews.filter(v => v.affix)
    },
    /** 全清（含 affix）：退出登录 / 切换账号时用 */
    clearAll() {
      this.visitedViews = []
    },
  },
})
