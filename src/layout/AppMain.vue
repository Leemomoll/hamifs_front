<template>
  <section class="app-main">
    <router-view v-slot="{ Component }">
      <transition name="fade-transform" mode="out-in">
        <keep-alive :max="10">
          <component :is="Component" :key="routeKey" />
        </keep-alive>
      </transition>
    </router-view>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/modules/app'

const route = useRoute()
const appStore = useAppStore()

// refreshKey 变化即重建组件，用于「刷新」当前页
const routeKey = computed(() => `${route.fullPath}_${appStore.refreshKey}`)
</script>

<style scoped>
.app-main {
  flex: 1;
  min-height: 0;
  overflow: auto;
  /* 把内容区的重绘/布局约束在这个盒子内，避免每次换页都触发整页
     （尤其是多个 backdrop-filter 毛玻璃层）重新合成 */
  contain: layout paint;
  /* 只留极淡一层，让壁纸透出来，同时保证裸文字可读 */
  background-color: var(--hamifs-bg-page-glass);
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
