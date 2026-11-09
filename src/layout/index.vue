<template>
  <div class="app-wrapper">
    <Sidebar class="sidebar-container" />
    <div class="main-container">
      <Header />
      <TagsView />
      <AppMain />
    </div>

    <!-- 全局 AI 助手：右侧可折叠对话面板 -->
    <AiAssistant />
  </div>
</template>

<script setup>
import Sidebar from './Sidebar/index.vue'
import Header from './Header/index.vue'
import TagsView from './TagsView/index.vue'
import AppMain from './AppMain.vue'
import AiAssistant from '@/components/AiAssistant/index.vue'
</script>

<style scoped>
.app-wrapper {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  background-color: var(--hamifs-bg-page);
}

.sidebar-container {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  width: var(--hamifs-sidebar-width);
  /* 缓入缓出、时长略长，收起/展开都是"慢慢收回"的节奏 */
  transition: width var(--hamifs-sidebar-transition);
  overflow: hidden;
}

.sidebar-container.is-collapsed {
  width: var(--hamifs-sidebar-collapsed-width);
}

.main-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  height: 100%;
}
</style>
