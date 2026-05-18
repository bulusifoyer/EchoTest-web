<template>
  <div class="report-detail-page">
    <!-- 缺 reportId：空状态引导回 /report -->
    <div v-if="!reportId" class="empty-guide">
      <div class="et-card empty-guide__card">
        <el-empty description="未指定报告 ID，请从「测试报告」列表进入">
          <el-button type="primary" @click="$router.replace({ path: '/report', query: { projectId } })">
            返回报告列表
          </el-button>
        </el-empty>
      </div>
    </div>

    <template v-else>
      <!-- 顶部 toolbar -->
      <div class="flex-between top-bar">
        <div class="et-breadcrumb" style="margin-bottom: 0">
          <span class="link" @click="$router.push({ path: '/report', query: { projectId } })">测试报告</span>
          <span class="sep">/</span>
          <span class="cur">报告详情</span>
        </div>
        <div class="actions">
          <el-tooltip content="导出 PDF 后续版本支持" placement="top">
            <span><el-button disabled>⤓ 导出 PDF</el-button></span>
          </el-tooltip>
          <el-tooltip content="分享链接后续版本支持" placement="top">
            <span><el-button disabled>📤 分享链接</el-button></span>
          </el-tooltip>
          <el-button type="danger" plain :disabled="loading || !report" @click="onDelete">删除报告</el-button>
          <el-button
            type="primary"
            :disabled="!canRerun"
            :loading="rerunning"
            @click="onRerun"
          >
            🔁 重新执行
          </el-button>
        </div>
      </div>

      <!-- 加载错误：兜底 -->
      <div v-if="loadFailed" class="empty-guide">
        <div class="et-card empty-guide__card">
          <el-empty description="报告不存在、已删除或无权限访问">
            <el-button type="primary" @click="$router.replace({ path: '/report', query: { projectId } })">
              返回报告列表
            </el-button>
          </el-empty>
        </div>
      </div>

      <!-- 主体 -->
      <div v-else v-loading="loading" class="report-body">
        <template v-if="report">
          <ReportHead :report="report" />

          <!-- RUNNING 提示 -->
          <el-alert
            v-if="report.status === 'RUNNING'"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 16px"
            title="报告生成中"
            description="当前报告状态为 RUNNING，统计与明细可能未完全写入。请稍后刷新页面查看。"
          />

          <StatCards :report="report" />

          <div class="lower">
            <StepDetailTable :details="details" />
            <ResultDonut :report="report" :details="details" />
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
/**
 * 报告详情主容器（阶段 7）
 *
 * 路由：/report/detail?reportId=N&projectId=M
 *
 * 职责：
 *   1. 拉取报告详情（含明细）；缺 reportId / 报错 → 空状态引导
 *   2. 编排子组件：ReportHead / StatCards / 左下 StepDetailTable / 右下 ResultDonut
 *   3. 重新执行：取当前 caseId + envId 再调一次 /run
 *      · envName 为 null（环境已删）→ ElMessage.error 提示重选
 *   4. 删除报告：成功后跳回 /report
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import { useProjectStore } from '@/store/project'
import { resolveProjectId } from '@/utils/projectContext'
import {
  getReportDetailAPI,
  deleteReportAPI,
  runExecutionAPI
} from '@/api/execution'

import ReportHead from './components/ReportHead.vue'
import StatCards from './components/StatCards.vue'
import StepDetailTable from './components/StepDetailTable.vue'
import ResultDonut from './components/ResultDonut.vue'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

const projectId = computed(() => resolveProjectId(route, projectStore))
const reportId = computed(() => {
  const raw = route.query.reportId
  const num = Number(raw)
  return Number.isFinite(num) && num > 0 ? num : null
})

const report = ref(null)
const details = ref([])
const loading = ref(false)
const loadFailed = ref(false)
const rerunning = ref(false)

// "重新执行"可用条件：报告非 RUNNING、用例和环境均未被删
const canRerun = computed(() => {
  if (!report.value) return false
  if (report.value.status === 'RUNNING') return false
  return !!report.value.caseId
})

async function fetchDetail() {
  if (!reportId.value) return
  loading.value = true
  loadFailed.value = false
  try {
    const data = await getReportDetailAPI(reportId.value)
    if (!data || !data.report) {
      loadFailed.value = true
      return
    }
    report.value = data.report
    details.value = Array.isArray(data.details) ? data.details : []
  } catch (e) {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchDetail)
watch(reportId, fetchDetail)

// ---------- 操作 ----------

async function onRerun() {
  if (!report.value) return
  // 用例已被删 → 无法重新执行
  if (!report.value.caseName) {
    ElMessage.error('原用例已被删除，无法重新执行')
    return
  }
  // 环境已被删 → 引导用户重新选环境
  if (!report.value.envName || !report.value.envId) {
    ElMessage.error('原执行环境不存在，请重新选择环境后执行')
    router.push({
      path: '/case',
      query: { projectId: projectId.value }
    })
    return
  }
  rerunning.value = true
  try {
    const newReportId = await runExecutionAPI({
      caseId: report.value.caseId,
      envId: report.value.envId,
      timeoutMs: 15000
    })
    if (newReportId == null) return
    ElMessage.success('已发起新一轮执行')
    router.replace({
      path: '/report/detail',
      query: { reportId: newReportId, projectId: projectId.value }
    })
  } catch (e) {
    // request.js 已统一处理
  } finally {
    rerunning.value = false
  }
}

function onDelete() {
  if (!report.value) return
  ElMessageBox.confirm(
    `确定要删除报告 #${report.value.id} 吗？该操作为软删除，明细数据保留在数据库中。`,
    '删除确认',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  )
    .then(async () => {
      try {
        await deleteReportAPI(report.value.id)
        ElMessage.success('报告已删除')
        router.replace({
          path: '/report',
          query: { projectId: projectId.value }
        })
      } catch (e) {
        // request.js 已统一处理
      }
    })
    .catch(() => {})
}
</script>

<style scoped>
.report-detail-page {
  min-height: calc(100vh - var(--et-header-h) - var(--et-pad-content) * 2);
  display: flex;
  flex-direction: column;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.actions {
  display: flex;
  gap: 8px;
}

.et-breadcrumb .link {
  color: var(--et-text-3);
  cursor: pointer;
}
.et-breadcrumb .link:hover { color: var(--et-primary); }

/* 主体 */
.report-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.lower {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 16px;
  align-items: start;
}

@media (max-width: 1280px) {
  .lower {
    grid-template-columns: 1fr;
  }
}

.empty-guide {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-guide__card {
  width: 480px;
  padding: 40px 32px;
  text-align: center;
}
</style>
