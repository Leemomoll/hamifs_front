<template>
  <div class="doc-type-chart">
    <div class="chart-head">
      <span class="chart-title">文档总结</span>
      <span class="chart-sub">按类型统计</span>
    </div>

    <div v-if="segments.length" class="chart-body">
      <!-- 环形图：手写 SVG，零依赖 -->
      <div class="chart-wrap">
        <svg viewBox="0 0 120 120">
          <g transform="rotate(-90 60 60)">
            <circle class="track" cx="60" cy="60" :r="RADIUS" />
            <circle
              v-for="seg in arcs"
              :key="seg.type"
              class="arc"
              :class="{ active: hoverType === seg.type }"
              cx="60"
              cy="60"
              :r="RADIUS"
              :stroke="seg.color"
              :stroke-dasharray="seg.dash"
              :stroke-dashoffset="seg.offset"
              @mouseenter="hoverType = seg.type"
              @mouseleave="hoverType = ''"
            />
          </g>
        </svg>
        <div class="chart-center">
          <div class="center-num">{{ total }}</div>
          <div class="center-cap">份文档</div>
          <div class="center-size">{{ totalSizeText }}</div>
        </div>
      </div>

      <!-- 图例 -->
      <ul class="legend">
        <li
          v-for="seg in segments"
          :key="seg.type"
          :class="{ active: hoverType === seg.type }"
          @mouseenter="hoverType = seg.type"
          @mouseleave="hoverType = ''"
        >
          <span class="dot" :style="{ background: seg.color }" />
          <span class="legend-label">{{ seg.label }}</span>
          <span class="legend-num">{{ seg.count }} 份 · {{ percentText(seg.pct) }}</span>
          <span class="legend-size">{{ seg.sizeText }}</span>
        </li>
      </ul>
    </div>

    <el-empty v-else description="还没有文档" :image-size="72" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { formatSize } from '@/utils/fileType'

const props = defineProps({
  /** [{ type, label, color, count, pct, size, sizeText }] */
  segments: {
    type: Array,
    default: () => [],
  },
  total: {
    type: Number,
    default: 0,
  },
  totalSize: {
    type: Number,
    default: 0,
  },
})

const hoverType = ref('')

/* 环形图几何：viewBox 120，半径 48，环宽 14，段间留 3px 缺口 */
const RADIUS = 48
const CIRCUM = 2 * Math.PI * RADIUS
const GAP = 3

/** 每段的 dasharray / dashoffset：按占比切片，依次错开起始位置 */
const arcs = computed(() => {
  let start = 0
  return props.segments.map(seg => {
    const len = Math.max(seg.pct * CIRCUM - GAP, 1)
    const dash = `${len} ${CIRCUM - len}`
    const offset = -start
    start += seg.pct * CIRCUM
    return { ...seg, dash, offset }
  })
})

const totalSizeText = computed(() => formatSize(props.totalSize))

const percentText = pct => `${Math.round(pct * 100)}%`
</script>

<style scoped>
.doc-type-chart {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 20px;
  background: var(--hamifs-bg-card);
  border: 1px solid var(--hamifs-border-color);
  border-radius: var(--hamifs-radius);
  box-shadow: var(--hamifs-shadow-card);
}

.chart-head {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 8px;
}

.chart-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--hamifs-text-primary);
}

.chart-sub {
  font-size: 12px;
  color: var(--hamifs-text-secondary);
}

.chart-body {
  display: flex;
  flex: 1;
  gap: 14px;
  align-items: center;
  min-height: 0;
}

/* ─── 环形图 ───────────────────────────────────────────────────────────────── */
.chart-wrap {
  position: relative;
  flex-shrink: 0;
  width: 150px;
}

.chart-wrap svg {
  display: block;
  width: 100%;
}

.track {
  fill: none;
  stroke: var(--el-fill-color-light);
  stroke-width: 14;
}

.arc {
  fill: none;
  cursor: pointer;
  stroke-width: 14;
  transition: stroke-width 0.2s;
}

.arc.active {
  stroke-width: 18;
}

.chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.center-num {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--hamifs-text-primary);
}

.center-cap {
  font-size: 12px;
  color: var(--hamifs-text-secondary);
}

.center-size {
  margin-top: 2px;
  font-size: 11px;
  color: var(--hamifs-text-secondary);
}

/* ─── 图例 ─────────────────────────────────────────────────────────────────── */
.legend {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  overflow: auto;
}

.legend li {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  font-size: 13px;
  color: var(--hamifs-text-regular);
  cursor: default;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.legend li.active {
  background: var(--el-fill-color-light);
}

.dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.legend-label {
  width: 3.5em;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.legend-num {
  color: var(--hamifs-text-secondary);
}

.legend-size {
  margin-left: auto;
  font-size: 12px;
  color: var(--hamifs-text-secondary);
}

/* 窄屏：图换到上下排布 */
@media (max-width: 992px) {
  .chart-body {
    flex-direction: column;
  }

  .legend {
    width: 100%;
  }
}
</style>
