<template>
  <el-drawer
    v-model="visible"
    :title="doc?.name || '预览'"
    size="46%"
    :destroy-on-close="true"
    class="preview-drawer"
  >
    <div class="preview-body">
      <!-- 图片：直接渲染 -->
      <div v-if="isImage" class="preview-image">
        <img :src="doc.preview.src" :alt="doc.name" />
      </div>

      <!-- 文本/Markdown：等宽字体阅读视图 -->
      <pre v-else-if="isText" class="preview-text">{{ doc.preview.content }}</pre>

      <!-- 其余类型：mock 阶段占位，后端转换/预览服务就绪后接入 -->
      <div v-else class="preview-empty">
        <el-icon :size="56" :color="fileType.color">
          <component :is="fileType.icon" />
        </el-icon>
        <p class="empty-name">{{ doc?.name }}</p>
        <p class="empty-hint">
          {{ fileType.label }} 文件在线预览将在后端预览服务就绪后支持
          <br />
          （Word/PDF 计划统一转 PDF 后用 pdf.js 渲染）
        </p>
      </div>
    </div>

    <template #footer>
      <div class="preview-footer">
        <span class="meta">{{ sizeText }} · 更新于 {{ timeText }}</span>
        <el-button :disabled="!canDownload" type="primary" plain size="small">
          <el-icon class="btn-icon"><Download /></el-icon>
          下载
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { formatSize, formatTime, resolveFileType } from '@/utils/fileType'

const props = defineProps({
  /** 传入 null 表示关闭 */
  doc: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const visible = ref(false)
watch(
  () => props.doc,
  doc => {
    visible.value = !!doc
  }
)
watch(visible, v => {
  if (!v) emit('close')
})

const fileType = computed(() => resolveFileType(props.doc?.name || ''))
const isImage = computed(() => props.doc?.preview?.kind === 'image')
const isText = computed(() => props.doc?.preview?.kind === 'text')
/** mock 数据没有真实文件本体，只有带 preview 的能"下载" */
const canDownload = computed(() => isImage.value)
const sizeText = computed(() => formatSize(props.doc?.size))
const timeText = computed(() => formatTime(props.doc?.updatedAt))
</script>

<style scoped>
.preview-body {
  height: 100%;
  overflow: auto;
}

.preview-image {
  display: flex;
  justify-content: center;
  padding: 12px;
}

.preview-image img {
  max-width: 100%;
  border-radius: var(--hamifs-radius);
}

.preview-text {
  margin: 0;
  padding: 16px;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.8;
  color: var(--hamifs-text-regular);
  white-space: pre-wrap;
  word-break: break-word;
}

.preview-empty {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
  text-align: center;
}

.empty-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--hamifs-text-primary);
}

.empty-hint {
  font-size: 13px;
  line-height: 1.8;
  color: var(--hamifs-text-secondary);
}

.preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meta {
  font-size: 12px;
  color: var(--hamifs-text-secondary);
}

.btn-icon {
  margin-right: 4px;
}
</style>
