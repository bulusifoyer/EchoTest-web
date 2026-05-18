<template>
  <div class="et-card chart-card">
    <div class="lc-header">
      <div class="title-h2">结果分布</div>
    </div>

    <!-- CSS conic-gradient 饼图 -->
    <div class="donut-wrap">
      <div class="donut" :style="donutStyle">
        <div class="donut-center">
          <div class="big" :class="bigClass">{{ passRateText }}</div>
          <div class="sm">通过率</div>
        </div>
      </div>
    </div>

    <!-- 图例 -->
    <div class="legend">
      <div class="legend-row">
        <span class="dot" style="background: #67c23a"></span>
        <span class="lname">通过</span>
        <span class="lval et-mono">{{ passed }} / {{ ratioText(passed) }}</span>
      </div>
      <div class="legend-row">
        <span class="dot" style="background: #f56c6c"></span>
        <span class="lname">失败</span>
        <span class="lval et-mono">{{ failed }} / {{ ratioText(failed) }}</span>
      </div>
      <div class="legend-row">
        <span class="dot" style="background: #909399"></span>
        <span class="lname">跳过</span>
        <span class="lval et-mono">{{ skipped }} / {{ ratioText(skipped) }}</span>
      </div>
    </div>

    <!-- 耗时 TOP 3 -->
    <div v-if="topSteps.length > 0" class="timeline">
      <div class="tl-title">耗时 TOP 3</div>
      <div v-for="s in topSteps" :key="s.id" class="bar">
        <div class="fill" :style="{ width: s.fillPct + '%' }"></div>
        <div class="lbl">{{ s.label }} — {{ formatDuration(s.elapsedMs) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 结果饼图 + 图例 + TOP 3 耗时
 *
 * 视觉对照 docs/screenshots/html/report_detail.html .chart-card
 *
 * 实现说明（约束 6）：
 *   - 严格使用 CSS conic-gradient，不引入 ECharts
 *   - 颜色：通过 #67C23A / 失败 #F56C6C / 跳过 #909399（与图例对齐）
 *   - 当 total=0 时整圆灰，文字显示 "—"
 */
import { computed } from 'vue'
import { formatDuration } from '@/utils/format'

const props = defineProps({
  report: { type: Object, required: true },
  details: { type: Array, default: () => [] }
})

const total = computed(() => Number(props.report.totalSteps) || 0)
const passed = computed(() => Number(props.report.passedSteps) || 0)
const failed = computed(() => Number(props.report.failedSteps) || 0)
const skipped = computed(() => Math.max(0, total.value - passed.value - failed.value))

const passRateText = computed(() => {
  if (total.value === 0) return '—'
  return `${((passed.value / total.value) * 100).toFixed(1)}%`
})

const bigClass = computed(() => {
  if (total.value === 0) return 'big--muted'
  if (failed.value === 0) return 'big--pass'
  return 'big--fail'
})

const donutStyle = computed(() => {
  if (total.value === 0) {
    // 全灰
    return { background: '#909399' }
  }
  const passPct = (passed.value / total.value) * 100
  const failPct = (failed.value / total.value) * 100
  const passEnd = passPct
  const failEnd = passPct + failPct
  return {
    background:
      `conic-gradient(#67c23a 0 ${passEnd}%, #f56c6c ${passEnd}% ${failEnd}%, #909399 ${failEnd}% 100%)`
  }
})

function ratioText(n) {
  if (total.value === 0) return '—'
  return `${((n / total.value) * 100).toFixed(1)}%`
}

// TOP 3 耗时步骤
const topSteps = computed(() => {
  if (!Array.isArray(props.details) || props.details.length === 0) return []
  const sorted = [...props.details]
    .filter((d) => Number(d.elapsedMs) > 0)
    .sort((a, b) => Number(b.elapsedMs) - Number(a.elapsedMs))
    .slice(0, 3)
  if (sorted.length === 0) return []
  const max = Number(sorted[0].elapsedMs) || 1
  return sorted.map((d) => ({
    id: d.id,
    elapsedMs: d.elapsedMs,
    fillPct: Math.max(8, Math.round((Number(d.elapsedMs) / max) * 100)),
    label: `步骤 ${d.stepOrder} ${d.requestMethod || ''} ${d.requestUrl || ''}`.trim()
  }))
})
</script>

<style scoped>
.chart-card {
  padding: 0;
  display: flex;
  flex-direction: column;
}

.lc-header {
  padding: 14px 20px;
  border-bottom: 1px solid var(--et-border-card);
}
.title-h2 {
  font-size: 14px;
  font-weight: 600;
  color: var(--et-text-1);
  margin: 0;
}

.donut-wrap {
  padding: 24px 20px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.donut {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  position: relative;
}
.donut::after {
  content: '';
  position: absolute;
  inset: 28px;
  background: #fff;
  border-radius: 50%;
}
.donut-center {
  position: absolute;
  inset: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
.donut-center .big {
  font-size: 28px;
  font-weight: 600;
}
.donut-center .big--pass { color: #67c23a; }
.donut-center .big--fail { color: #f56c6c; }
.donut-center .big--muted { color: #909399; }
.donut-center .sm {
  font-size: 12px;
  color: var(--et-text-3);
  margin-top: 2px;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--et-border-card);
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--et-text-2);
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.lname { flex: 1; }

.timeline {
  padding: 0 20px 16px;
  border-top: 1px solid var(--et-border-card);
  padding-top: 14px;
}
.timeline .tl-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--et-text-1);
  margin-bottom: 8px;
}
.bar {
  height: 22px;
  background: #f5f7fa;
  border-radius: 3px;
  position: relative;
  margin-bottom: 8px;
  overflow: hidden;
}
.bar .fill {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
}
.bar .lbl {
  position: absolute;
  inset: 0;
  padding-left: 8px;
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
