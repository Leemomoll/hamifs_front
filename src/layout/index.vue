<template>
  <div class="app-wrapper">
    <!-- 静态壁纸：全屏铺在底层，内容层用 z-index 压在它上面 -->
    <div class="bg-wallpaper" />
    <div class="bg-mask" />

    <Sidebar class="sidebar-container" />
    <div class="main-container">
      <Header />
      <TagsView />
      <AppMain />
    </div>
  </div>
</template>

<script setup>
import Sidebar from './Sidebar/index.vue'
import Header from './Header/index.vue'
import TagsView from './TagsView/index.vue'
import AppMain from './AppMain.vue'
</script>

<style scoped>
.app-wrapper {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
}

/* 壁纸层：fixed 铺满、z-index 0；内容层 z-index 1。
   不用 z-index: -1，避免祖先元素创建层叠上下文后行为失控 */
.bg-wallpaper,
.bg-mask {
  position: fixed;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.bg-wallpaper {
  background-image: var(--hamifs-wallpaper-url);
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  /* 这里刻意不加 filter：全屏滤镜会让每次重绘都要重跑一遍滤镜管线。
     但图层还是要单独提升：壁纸没了自己的合成层，页面每帧重绘都要跟着重新栅格化
     这张全屏大图，上面还压着 5 层 backdrop-filter 要逐帧重新采样+模糊。
     translateZ(0) 只做图层提升，不跑滤镜管线，开销远低于 filter。 */
  transform: translateZ(0);
  backface-visibility: hidden;
}

.bg-mask {
  background-color: var(--hamifs-bg-mask);
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
