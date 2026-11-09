<template>
  <div class="tags-view-container">
    <div class="tags-view-wrapper">
      <div
        v-for="tag in visitedViews"
        :key="tag.fullPath"
        class="tags-view-item"
        :class="{ 'is-active': isActive(tag) }"
        @click="goTo(tag)"
        @contextmenu.prevent="openMenu(tag, $event)"
      >
        <span>{{ tag.title }}</span>
        <el-icon v-if="!tag.affix" class="tag-close" @click.stop="closeTag(tag)">
          <Close />
        </el-icon>
      </div>
    </div>

    <ul
      v-show="menuVisible"
      class="contextmenu"
      :style="{ left: menuLeft + 'px', top: menuTop + 'px' }"
    >
      <li @click="refreshSelectedTag">刷新</li>
      <li v-if="selectedTag && !selectedTag.affix" @click="closeSelectedTag">关闭</li>
      <li @click="closeOthersTags">关闭其他</li>
      <li @click="closeAllTags">关闭所有</li>
    </ul>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Close } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/modules/app'
import { useTagsViewStore } from '@/store/modules/tagsView'

const route = useRoute()
const router = useRouter()
const tagsStore = useTagsViewStore()
const appStore = useAppStore()

const visitedViews = computed(() => tagsStore.visitedViews)

const isActive = tag => tag.path === route.path

const addTag = () => {
  if (!route.name || route.meta?.hidden) return
  tagsStore.addView(route)
}

watch(() => route.path, addTag, { immediate: true })

const goTo = tag => {
  if (tag.path !== route.path) {
    router.push(tag.fullPath)
  }
}

const closeTag = tag => {
  const index = visitedViews.value.findIndex(v => v.path === tag.path)
  const next = visitedViews.value[index + 1] || visitedViews.value[index - 1]
  tagsStore.delView(tag)
  if (isActive(tag) && next) {
    router.push(next.fullPath)
  }
}

/* ===== 右键菜单 ===== */
const menuVisible = ref(false)
const menuLeft = ref(0)
const menuTop = ref(0)
const selectedTag = ref(null)

const openMenu = (tag, event) => {
  selectedTag.value = tag
  menuLeft.value = event.clientX
  menuTop.value = event.clientY
  menuVisible.value = true
}

const closeMenu = () => {
  menuVisible.value = false
}

watch(menuVisible, visible => {
  if (visible) {
    document.addEventListener('click', closeMenu)
  } else {
    document.removeEventListener('click', closeMenu)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenu)
})

const refreshSelectedTag = () => {
  appStore.refreshView()
}

const closeSelectedTag = () => {
  if (selectedTag.value) {
    closeTag(selectedTag.value)
  }
}

const closeOthersTags = () => {
  if (!selectedTag.value) return
  tagsStore.delOthersViews(selectedTag.value)
  if (!isActive(selectedTag.value)) {
    router.push(selectedTag.value.fullPath)
  }
}

const closeAllTags = () => {
  tagsStore.delAllViews()
  const first = tagsStore.visitedViews[0]
  router.push(first ? first.fullPath : '/')
}
</script>

<style scoped>
.tags-view-container {
  position: relative;
  flex: 0 0 auto;
  height: var(--hamifs-tagsview-height);
  background-color: #ffffff;
  border-bottom: 1px solid var(--hamifs-border-color);
}

.tags-view-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  padding: 0 12px;
  overflow-x: auto;
}

.tags-view-item {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 4px;
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
  color: var(--hamifs-text-regular);
  background-color: rgba(244, 245, 247, 0.6);
  border: 1px solid var(--hamifs-border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.tags-view-item:hover {
  color: var(--hamifs-primary);
  border-color: var(--hamifs-primary);
}

.tags-view-item.is-active {
  color: #fff;
  background-color: var(--hamifs-primary);
  border-color: var(--hamifs-primary);
}

.tag-close {
  font-size: 12px;
  border-radius: 50%;
}

.tag-close:hover {
  background-color: rgba(0, 0, 0, 0.12);
}

.contextmenu {
  position: fixed;
  z-index: 3000;
  margin: 0;
  padding: 4px 0;
  font-size: 13px;
  list-style: none;
  background-color: #fff;
  border: 1px solid var(--hamifs-border-color);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.contextmenu li {
  padding: 6px 16px;
  white-space: nowrap;
  cursor: pointer;
}

.contextmenu li:hover {
  color: var(--hamifs-primary);
  background-color: #f2f3f5;
}
</style>
