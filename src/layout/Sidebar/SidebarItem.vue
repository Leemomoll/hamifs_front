<template>
  <!-- 单菜单项：折叠态用 tooltip 提示名称 -->
  <el-tooltip
    v-if="!isSubMenu"
    :disabled="!isCollapsed"
    :content="menuTitle"
    placement="right"
  >
    <el-menu-item :index="resolvePath(menuItem.path)">
      <el-icon v-if="menuIcon">
        <component :is="menuIcon" />
      </el-icon>
      <template #title>
        <span class="menu-title">{{ menuTitle }}</span>
      </template>
    </el-menu-item>
  </el-tooltip>

  <!-- 多级菜单 -->
  <el-sub-menu v-else :index="resolvePath(item.path)">
    <template #title>
      <el-icon v-if="item.meta?.icon">
        <component :is="item.meta.icon" />
      </el-icon>
      <span class="menu-title">{{ item.meta?.title }}</span>
    </template>

    <SidebarItem
      v-for="child in visibleChildren"
      :key="child.path"
      :item="child"
      :base-path="resolvePath(item.path)"
    />
  </el-sub-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/store/modules/app'

const appStore = useAppStore()
const isCollapsed = computed(() => appStore.sidebarCollapsed)

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  basePath: {
    type: String,
    default: '',
  },
})

const resolvePath = routePath => {
  if (/^(https?:|mailto:|tel:)/.test(routePath)) return routePath
  if (!routePath) return props.basePath
  if (routePath.startsWith('/')) return routePath
  return `${props.basePath.replace(/\/$/, '')}/${routePath}`
}

const visibleChildren = computed(() =>
  (props.item.children || []).filter(child => !child.meta?.hidden)
)

// 只有一个可见子节点且该节点无子节点时，直接渲染该子节点为菜单项
const singleChild = computed(() => {
  if (visibleChildren.value.length !== 1) return null
  const [child] = visibleChildren.value
  const grandChildren = (child.children || []).filter(item => !item.meta?.hidden)
  return grandChildren.length === 0 ? child : null
})

const isSubMenu = computed(() => visibleChildren.value.length > 0 && !singleChild.value)
const menuItem = computed(() => singleChild.value || props.item)
const menuIcon = computed(() => menuItem.value.meta?.icon || props.item.meta?.icon)
const menuTitle = computed(() => menuItem.value.meta?.title || props.item.meta?.title)
</script>
