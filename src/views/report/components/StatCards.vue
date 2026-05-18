<template>
  <div class="cards-row" :class="{ 'cards-row--running': running }">
    <div class="stat-card">
      <div class="lbl">总步骤</div>
      <div class="num">{{ total }}</div>
    </div>
    <div class="stat-card pass">
      <div class="lbl">✓ 通过</div>
      <div class="num">{{ passed }}</div>
    </div>
    <div class="stat-card fail">
      <div class="lbl">✗ 失败</div>
      <div class="num">{{ failed }}</div>
    </div>
    <div class="stat-card skip">
      <div class="lbl">⊝ 跳过</div>
      <div class="num">{{ skipped }}</div>
    </div>
    <div class="stat-card rate">
      <div class="lbl">通过率</div>
      <div class="num">{{ passRate }}</div>
    </div>
  </div>
</template>

<script setup>
/**
 * 5 张统计卡（步骤维度）
 *
 * 视觉对照 docs/screenshots/html/report_detail.html .cards-row
 *
 * 语义说明（约束 2）：
 *   - 总步骤    = report.totalSteps   （用例步骤总数，遇错即停时仍记录全部）
 *   - 通过步骤  = report.passedSteps
 *   - 失败步骤  = report.failedSteps
 *   - 跳过步骤  = 0（M3 不引入 SKIP；前端写死 0，不造假数据）
 *   - 通过率    = passedSteps / totalSteps
 *
 * RUNNING 态：所有数字灰显 + "—"，用 :class running 控制
 */
import { computed } from 'vue'

const props = defineProps({
  report: { type: Object, required: true }
})

const running = computed(() => props.report.status === 'RUNNING')
const total = computed(() => Number(props.report.totalSteps) || 0)
const passed = computed(() => Number(props.report.passedSteps) || 0)
const failed = computed(() => Number(props.report.failedSteps) || 0)
const skipped = computed(() => 0)
const passRate = computed(() => {
  if (running.value) return '—'
  if (total.value === 0) return '—'
  return `${((passed.value / total.value) * 100).toFixed(1)}%`
})
</script>

<style scoped>
.cards-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.stat-card {
  background: #fff;
  border: 1px solid var(--et-border-card);
  border-radius: var(--et-radius-card);
  padding: 16px 18px;
}
.stat-card .lbl {
  font-size: 12px;
  color: var(--et-text-3);
  margin-bottom: 8px;
}
.stat-card .num {
  font-size: 26px;
  font-weight: 600;
  color: var(--et-text-1);
}
.stat-card.pass .num { color: var(--et-success); }
.stat-card.fail .num { color: var(--et-danger); }
.stat-card.skip .num { color: var(--et-text-3); }
.stat-card.rate .num { color: var(--et-primary); }

/* RUNNING 态灰显 */
.cards-row--running .stat-card .num {
  color: var(--et-text-3) !important;
}
</style>
