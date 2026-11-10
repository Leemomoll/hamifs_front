<template>
  <!-- 收起态：右侧悬浮按钮（工作台已有页面级 AI 主界面，隐藏悬浮球） -->
  <div v-show="!open && !onWorkplace" class="ai-fab" title="AI 助手" @click="open = true">
    <el-icon :size="24"><ChatDotRound /></el-icon>
  </div>

  <!-- 展开态：右侧对话面板 -->
  <transition name="ai-slide">
    <div v-show="open" class="ai-panel">
      <div class="ai-header">
        <el-icon class="ai-header-icon" :size="18"><MagicStick /></el-icon>
        <span class="ai-header-title">AI 助手</span>
        <span class="ai-header-badge">演示模式</span>
        <el-icon class="ai-header-close" title="收起" @click="open = false"><Close /></el-icon>
      </div>

      <!-- 对话内核：与工作台共用同一组件 -->
      <AiChat class="ai-shell-chat" />
    </div>
  </transition>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ChatDotRound, Close, MagicStick } from '@element-plus/icons-vue'
import AiChat from './AiChat.vue'

const route = useRoute()
const open = ref(false)

/** 工作台自带 AI 主界面，悬浮球不再显示 */
const onWorkplace = computed(() => route.path === '/workplace/index')
</script>

<style scoped>
/* ─── 收起态悬浮按钮 ───────────────────────────────────────────────────────── */
.ai-fab {
  position: fixed;
  right: 24px;
  bottom: 32px;
  z-index: 1600;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  color: #fff;
  cursor: pointer;
  background: var(--el-color-primary);
  border-radius: 50%;
  box-shadow: 0 6px 16px rgba(22, 93, 255, 0.4);
  transition: transform 0.2s;
}

.ai-fab:hover {
  transform: scale(1.08);
}

/* ─── 展开态面板 ───────────────────────────────────────────────────────────── */
.ai-panel {
  position: fixed;
  top: calc(var(--hamifs-header-height) + var(--hamifs-tagsview-height));
  right: 0;
  bottom: 0;
  z-index: 1600;
  display: flex;
  flex-direction: column;
  width: 380px;
  background: var(--hamifs-bg-card);
  border-left: 1px solid var(--hamifs-border-color);
  box-shadow: -6px 0 24px rgba(0, 0, 0, 0.08);
}

/* 与侧栏折叠一致的缓动节奏 */
.ai-slide-enter-active,
.ai-slide-leave-active {
  transition: transform var(--hamifs-sidebar-transition);
}

.ai-slide-enter-from,
.ai-slide-leave-to {
  transform: translateX(100%);
}

.ai-header {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--hamifs-border-color);
}

.ai-header-icon {
  color: var(--el-color-primary);
}

.ai-header-title {
  font-size: 15px;
  font-weight: 600;
}

.ai-header-badge {
  padding: 1px 8px;
  font-size: 11px;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border-radius: 10px;
}

.ai-header-close {
  margin-left: auto;
  color: var(--hamifs-text-secondary);
  cursor: pointer;
}

.ai-header-close:hover {
  color: var(--hamifs-text-primary);
}

/* ─── 对话内核占满面板剩余空间 ─────────────────────────────────────────────── */
.ai-shell-chat {
  flex: 1;
  min-height: 0;
}
</style>
