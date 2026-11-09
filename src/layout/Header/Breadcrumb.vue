<template>
  <el-breadcrumb class="app-breadcrumb" separator="/">
    <el-breadcrumb-item v-for="(item, index) in levelList" :key="item.path || index">
      <span v-if="index === levelList.length - 1" class="no-redirect">{{ item.meta.title }}</span>
      <a v-else @click.prevent="handleLink(item)">{{ item.meta.title }}</a>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const levelList = ref([])

const getBreadcrumb = () => {
  levelList.value = route.matched.filter(item => item.meta?.title)
}

watch(() => route.fullPath, getBreadcrumb, { immediate: true })

const handleLink = item => {
  if (item.redirect) {
    router.push(item.redirect)
    return
  }
  router.push(item.path)
}
</script>

<style scoped>
.app-breadcrumb {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
}

.no-redirect {
  color: var(--hamifs-text-secondary);
  cursor: text;
}

a {
  font-weight: 400;
  color: var(--hamifs-text-regular);
  cursor: pointer;
}

a:hover {
  color: var(--hamifs-primary);
}
</style>
