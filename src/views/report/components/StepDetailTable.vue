<template>
  <div class="et-card list-card">
    <div class="lc-header">
      <div class="title-h2">步骤执行明细</div>
      <div class="filter-bar">
        <span class="chip" :class="{ active: filter === 'all' }" @click="filter = 'all'">
          全部 ({{ details.length }})
        </span>
        <span class="chip chip-pass" :class="{ active: filter === 'PASSED' }" @click="filter = 'PASSED'">
          通过 {{ passedCount }}
        </span>
        <span class="chip chip-fail" :class="{ active: filter === 'FAILED' }" @click="filter = 'FAILED'">
          失败 {{ failedCount }}
        </span>
      </div>
    </div>

    <el-table
      :data="filteredDetails"
      style="width: 100%"
      :row-class-name="rowClass"
    >
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="step-expanded">
            <div class="panel">
              <div class="panel__title">请求</div>
              <pre class="panel__body">{{ prettyJsonText(row.actualRequest) }}</pre>
            </div>
            <div class="panel">
              <div class="panel__title">响应</div>
              <pre class="panel__body">{{ prettyJsonText(row.actualResponse) }}</pre>
            </div>
            <div class="panel">
              <div class="panel__title">断言 / 提取</div>
              <pre class="panel__body">{{ prettyJsonText(row.assertResult) }}</pre>
            </div>
            <div v-if="row.failReason" class="fail-reason">
              <span class="fail-reason__icon">✗</span>
              <span class="fail-reason__text">{{ row.failReason }}</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="序号" width="80">
        <template #default="{ row }">
          <span class="step-index" :class="row.status === 'FAILED' ? 'idx-fail' : 'idx-pass'">
            {{ row.stepOrder }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="方法" width="84">
        <template #default="{ row }">
          <span class="et-tag" :class="methodTagClass(row.requestMethod)">
            {{ row.requestMethod || '—' }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="URL" min-width="280" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="et-mono url">{{ row.requestUrl || '—' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="状态码" width="100">
        <template #default="{ row }">
          <span class="et-mono">{{ row.statusCode == null ? '—' : row.statusCode }}</span>
        </template>
      </el-table-column>

      <el-table-column label="耗时" width="110">
        <template #default="{ row }">
          <span class="et-mono">{{ formatDuration(row.elapsedMs) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="结果" width="110">
        <template #default="{ row }">
          <span class="et-tag" :class="row.status === 'PASSED' ? 'et-tag--pass' : 'et-tag--fail'">
            {{ row.status === 'PASSED' ? '✓ 通过' : '✗ 失败' }}
          </span>
        </template>
      </el-table-column>
    </el-table>

    <el-empty
      v-if="filteredDetails.length === 0"
      :description="filter === 'all' ? '暂无步骤明细' : `没有${filter === 'PASSED' ? '通过' : '失败'}的步骤`"
    />
  </div>
</template>

<script setup>
/**
 * 步骤执行明细表格 + 展开行（请求 / 响应 / 断言提取 三列）
 *
 * 视觉对照 docs/screenshots/html/report_detail.html .list-card
 *
 * 实现说明（约束 5）：
 *   - actualRequest / actualResponse / assertResult 为 JSON 字符串
 *   - 展开行用 <pre> 等宽字体显示 prettyJson 结果，美化失败则原文展示
 *   - 不引入代码高亮依赖
 */
import { ref, computed } from 'vue'
import { formatDuration, prettyJson } from '@/utils/format'

const props = defineProps({
  details: { type: Array, default: () => [] }
})

const filter = ref('all') // all / PASSED / FAILED

const passedCount = computed(() => props.details.filter((d) => d.status === 'PASSED').length)
const failedCount = computed(() => props.details.filter((d) => d.status === 'FAILED').length)

const filteredDetails = computed(() => {
  if (filter.value === 'all') return props.details
  return props.details.filter((d) => d.status === filter.value)
})

function rowClass({ row }) {
  return row.status === 'FAILED' ? 'row-fail' : 'row-pass'
}

function methodTagClass(method) {
  const m = (method || '').toUpperCase()
  if (m === 'GET') return 'et-tag--get'
  if (m === 'POST') return 'et-tag--post'
  if (m === 'PUT') return 'et-tag--put'
  if (m === 'DELETE') return 'et-tag--del'
  return 'et-tag--skip'
}

function prettyJsonText(text) {
  if (text == null || text === '') return '—'
  return prettyJson(text)
}
</script>

<style scoped>
.list-card { padding: 0; }

.lc-header {
  padding: 14px 20px;
  border-bottom: 1px solid var(--et-border-card);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title-h2 {
  font-size: 14px;
  font-weight: 600;
  color: var(--et-text-1);
  margin: 0;
}

.filter-bar { display: flex; gap: 8px; }
.filter-bar .chip {
  height: 26px;
  padding: 0 12px;
  line-height: 24px;
  border: 1px solid var(--et-border-input);
  border-radius: 13px;
  font-size: 12px;
  color: var(--et-text-2);
  background: #fff;
  cursor: pointer;
  user-select: none;
}
.filter-bar .chip:hover { color: var(--et-primary); border-color: var(--et-primary); }
.filter-bar .chip.active { background: var(--et-primary); color: #fff; border-color: var(--et-primary); }
.filter-bar .chip-pass { color: #67c23a; }
.filter-bar .chip-fail { color: #f56c6c; }

.step-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}
.step-index.idx-pass { background: #67c23a; }
.step-index.idx-fail { background: #f56c6c; }

.url { color: var(--et-text-2); font-size: 12px; }

.step-expanded {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  padding: 12px 20px 4px;
  background: #fafcff;
}
.panel {
  background: #fff;
  border: 1px solid var(--et-border-card);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.panel__title {
  padding: 8px 12px;
  font-size: 12px;
  color: var(--et-text-3);
  border-bottom: 1px solid var(--et-border-card);
  background: #fafafa;
}
.panel__body {
  margin: 0;
  padding: 10px 12px;
  font-family: var(--et-font-mono);
  font-size: 12px;
  line-height: 1.5;
  color: var(--et-text-1);
  background: #fafafa;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 320px;
  overflow: auto;
}

.fail-reason {
  grid-column: 1 / -1;
  margin-top: 4px;
  padding: 8px 12px;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  color: #f56c6c;
  font-size: 12px;
  display: flex;
  gap: 6px;
}
.fail-reason__icon { font-weight: 600; }

/* 行底色微调 */
:deep(.row-fail) { background: #fff8f8 !important; }
</style>
