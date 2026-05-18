<template>
  <div class="et-card report-head">
    <div class="r-title">
      <span class="et-tag" :class="statusClass">{{ statusLabel }}</span>
      <span class="r-title__text">
        报告 #{{ report.id }}
        <span class="sep">·</span>
        <span v-if="report.caseName">{{ report.caseName }}</span>
        <span v-else class="cell-deleted">已删除用例</span>
        <span class="sep">·</span>
        <span v-if="report.envName">{{ report.envName }}</span>
        <span v-else class="cell-deleted">已删除环境</span>
      </span>
    </div>
    <div class="r-meta">
      <div><span class="m-lbl">执行人:</span>{{ report.executor || '—' }}</div>
      <div>
        <span class="m-lbl">环境:</span>
        <span v-if="report.envName">{{ report.envName }}</span>
        <span v-else class="cell-deleted">已删除</span>
      </div>
      <div><span class="m-lbl">触发方式:</span>手动执行</div>
      <div><span class="m-lbl">开始时间:</span>{{ report.startTime || '—' }}</div>
      <div><span class="m-lbl">总耗时:</span><span class="et-mono dur">{{ formatDuration(report.totalDurationMs) }}</span></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 报告头：状态 chip + 主标题 + meta 行
 *
 * 视觉对照 docs/screenshots/html/report_detail.html .report-head
 *
 * 触发方式（约束 7）：后端无该字段，前端写死"手动执行"
 */
import { computed } from 'vue'
import { formatDuration } from '@/utils/format'

const props = defineProps({
  report: { type: Object, required: true }
})

const statusClass = computed(() => {
  switch (props.report.status) {
    case 'PASSED': return 'et-tag--pass'
    case 'FAILED': return 'et-tag--fail'
    case 'RUNNING': return 'et-tag--running'
    default: return 'et-tag--skip'
  }
})
const statusLabel = computed(() => {
  switch (props.report.status) {
    case 'PASSED': return '● 已完成'
    case 'FAILED': return '● 失败'
    case 'RUNNING': return '○ 执行中'
    default: return props.report.status || '—'
  }
})
</script>

<style scoped>
.report-head {
  padding: 18px 20px;
  margin-bottom: 16px;
}
.r-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}
.r-title__text { color: var(--et-text-1); }
.r-title .sep { color: var(--et-text-4); margin: 0 6px; font-weight: 400; }

.r-meta {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--et-text-2);
}
.m-lbl {
  color: var(--et-text-3);
  margin-right: 4px;
}
.dur { color: var(--et-text-1); }
.cell-deleted { color: var(--et-text-4); font-style: italic; font-weight: 400; }

/* 扩展 RUNNING 状态（已在列表页提过；scoped 内独立写一份避免依赖顺序） */
.et-tag--running { color: #409eff; background: #ecf5ff; border-color: #d9ecff; }
</style>
