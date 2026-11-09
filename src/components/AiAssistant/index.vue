<template>
  <!-- 收起态：右侧悬浮按钮 -->
  <div v-show="!open" class="ai-fab" title="AI 助手" @click="open = true">
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

      <div ref="scrollRef" class="ai-messages">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="ai-message"
          :class="msg.role"
        >
          <div class="ai-avatar">
            <el-icon v-if="msg.role === 'bot'"><MagicStick /></el-icon>
            <el-icon v-else><UserFilled /></el-icon>
          </div>
          <div class="ai-bubble">
            <span>{{ msg.text }}</span>
            <!-- 引用出处：后端 RAG 就绪后由接口返回 -->
            <div v-if="msg.refs?.length" class="ai-refs">
              <div class="ai-refs-title">引用出处：</div>
              <div v-for="(refItem, j) in msg.refs" :key="j" class="ai-ref-item">
                <el-icon><Document /></el-icon>
                {{ refItem }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="thinking" class="ai-message bot">
          <div class="ai-avatar"><el-icon><MagicStick /></el-icon></div>
          <div class="ai-bubble thinking">正在思考…</div>
        </div>
      </div>

      <div class="ai-quick">
        <el-tag
          v-for="q in quickQuestions"
          :key="q"
          class="ai-quick-tag"
          effect="plain"
          @click="send(q)"
        >
          {{ q }}
        </el-tag>
      </div>

      <div class="ai-input">
        <el-input
          v-model="draft"
          placeholder="问我任何关于你文档的问题…"
          :disabled="thinking"
          @keydown.enter="send()"
        />
        <el-button type="primary" :disabled="!draft.trim() || thinking" @click="send()">
          <el-icon><Promotion /></el-icon>
        </el-button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import { ChatDotRound, Close, Document, MagicStick, Promotion, UserFilled } from '@element-plus/icons-vue'

const open = ref(false)
const draft = ref('')
const thinking = ref(false)
const scrollRef = ref(null)

const messages = ref([
  {
    role: 'bot',
    text: '你好，我是你的文档助手。目前处于演示模式，等后端 AI 服务就绪后，我就能基于你的文档回答问题了。',
    refs: [],
  },
])

const quickQuestions = [
  '总结一下我的方案设计文档',
  '我上周记了什么备忘？',
  '知识库整体架构是什么？',
]

/** 演示用预设回答（轮换），带模拟引用出处 */
const cannedReplies = [
  {
    text: '根据你的《方案设计》文档：系统采用 Java 主后端 + Python AI 微服务架构，MySQL 存元数据，MinIO 存文件本体，分四个阶段交付。',
    refs: ['个人智能文档与知识库系统-方案设计.docx'],
  },
  {
    text: '你最近记的备忘里有三条置顶相关：买服务器（已置顶）、格式转换工具选型、RAG 切块参数记录。',
    refs: ['备忘录 · 置顶与最近'],
  },
  {
    text: 'RAG 的效果约八成取决于文档解析与切块质量，建议切块 300~800 字并附带来源元数据，向量库起步用 Chroma。',
    refs: ['RAG 问答实现要点.md'],
  },
]
let replyIndex = 0

async function scrollToBottom() {
  await nextTick()
  scrollRef.value?.scrollTo({ top: scrollRef.value.scrollHeight, behavior: 'smooth' })
}

function send(preset) {
  const text = (preset ?? draft.value).trim()
  if (!text || thinking.value) return
  draft.value = ''
  messages.value.push({ role: 'user', text })
  scrollToBottom()

  thinking.value = true
  // 演示回复：延迟 + 预设话术轮换；后端就绪后替换为真实问答接口
  setTimeout(() => {
    const reply = cannedReplies[replyIndex % cannedReplies.length]
    replyIndex += 1
    thinking.value = false
    messages.value.push({ role: 'bot', ...reply })
    scrollToBottom()
  }, 900)
}
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

/* ─── 消息流 ───────────────────────────────────────────────────────────────── */
.ai-messages {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  overflow-y: auto;
}

.ai-message {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.ai-message.user {
  flex-direction: row-reverse;
}

.ai-avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: #fff;
  background: var(--el-color-primary);
  border-radius: 50%;
}

.ai-message.user .ai-avatar {
  background: #909399;
}

.ai-bubble {
  max-width: 78%;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--hamifs-text-primary);
  word-break: break-word;
  background: var(--el-fill-color-light);
  border-radius: 10px;
}

.ai-message.user .ai-bubble {
  color: #fff;
  background: var(--el-color-primary);
}

.ai-bubble.thinking {
  color: var(--hamifs-text-secondary);
}

.ai-refs {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--hamifs-border-color);
}

.ai-refs-title {
  margin-bottom: 4px;
  font-size: 11px;
  color: var(--hamifs-text-secondary);
}

.ai-ref-item {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 3px 0;
  font-size: 12px;
  color: var(--el-color-primary);
}

/* ─── 快捷提问 ─────────────────────────────────────────────────────────────── */
.ai-quick {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 16px 10px;
}

.ai-quick-tag {
  cursor: pointer;
}

.ai-quick-tag:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

/* ─── 输入区 ───────────────────────────────────────────────────────────────── */
.ai-input {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  padding: 12px 16px 16px;
  border-top: 1px solid var(--hamifs-border-color);
}
</style>
