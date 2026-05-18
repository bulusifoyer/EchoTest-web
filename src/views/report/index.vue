<template>
  <div class="report-list-page">
    <!-- 面包屑 -->
    <div class="et-breadcrumb">
      <span class="link" @click="$router.push('/project')">项目管理</span>
      <span class="sep">/</span>
      <span>{{ projectName || '加载中...' }}</span>
      <span class="sep">/</span>
      <span class="cur">测试报告</span>
    </div>

    <!-- 工具条 -->
    <div class="et-card report-toolbar">
      <div class="left">
        <span class="title">执行报告</span>
        <span class="hint">共 {{ reports.length }} 份报告</span>
      </div>
      <div class="right">
        <el-button :icon="Refresh" @click="reload">刷新</el-button>
        <el-button type="primary" @click="$router.push({ path: '/execution', query: { projectId } })">
          ▶ 去执行用例
        </el-button>
      </div>
    </div>

    <!-- 主体 -->
    <div v-loading="loading" class="report-body et-card">
      <el-empty
        v-if="!loading && reports.length === 0"
        description="暂无执行报告，运行一条用例后将在这里展示结果"
      >
        <el-button type="primary" @click="$router.push({ path: '/execution', query: { projectId } })">
          前往任务执行
        </el-button>
      </el-empty>

      <el-table
        v-else
        :data="reports"
        stripe
        style="width: 100%"
        :row-style="{ height: '52px', cursor: 'pointer' }"
        @row-click="goDetail"
      >
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <span class="et-tag" :class="statusClass(row.status)">
              {{ statusLabel(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="用例" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.caseName">{{ row.caseName }}</span>
            <span v-else class="cell-deleted">已删除用例</span>
          </template>
        </el-table-column>
        <el-table-column label="环境" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.envName">{{ row.envName }}</span>
            <span v-else class="cell-deleted">已删除环境</span>
          </template>
        </el-table-column>
        <el-table-column label="步骤(通过/总)" width="140">
          <template #default="{ row }">
            <span class="et-mono">{{ row.passedSteps || 0 }}/{{ row.totalSteps || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="通过率" width="100">
          <template #default="{ row }">
            <span class="et-mono">{{ passRate(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="110">
          <template #default="{ row }">
            <span class="et-mono">{{ formatDuration(row.totalDurationMs) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="执行时间" width="170">
          <template #default="{ row }">
            <span>{{ row.startTime || row.createTime || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="goDetail(row)">详情</el-button>
            <el-button type="danger" link @click.stop="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
/**
 * 报告列表（阶段 7）
 *
 * 路由：/report?projectId=N（requireProject 守卫已保证 projectId 存在）
 *
 * 数据源：listReportsByProjectAPI（按 createTime 倒序，含 caseName / envName 冗余）
 *
 * 状态枚举（与后端严格一致）：RUNNING / PASSED / FAILED
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

import { getProjectDetailAPI } from '@/api/project'
import { listReportsByProjectAPI, deleteReportAPI } from '@/api/execution'
import { useProjectStore } from '@/store/project'
import { resolveProjectId } from '@/utils/projectContext'
import { formatDuration } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

const projectId = computed(() => resolveProjectId(route, projectStore))

const projectName = ref('')
const reports = ref([])
const loading = ref(false)

async function fetchProjectName(id) {
  try {
    const proj = await getProjectDetailAPI(id)
    if (proj?.name) {
      projectName.value = proj.name
      projectStore.syncProjectName(proj.name)
    } else {
      projectName.value = projectStore.currentProjectName || ''
    }
  } catch (e) {
    projectStore.clearCurrentProject()
    ElMessage.warning('项目不存在或无权限访问')
    router.replace('/project')
  }
}

async function fetchReports(id) {
  try {
    const list = await listReportsByProjectAPI(id)
    reports.value = Array.isArray(list) ? list : []
  } catch (e) {
    reports.value = []
  }
}

async function reload() {
  if (!projectId.value) return
  loading.value = true
  try {
    await Promise.all([fetchProjectName(projectId.value), fetchReports(projectId.value)])
  } finally {
    loading.value = false
  }
}

onMounted(reload)
watch(projectId, reload)

// ---------- 交互 ----------

function goDetail(row) {
  router.push({
    path: '/report/detail',
    query: { reportId: row.id, projectId: projectId.value }
  })
}

function onDelete(row) {
  ElMessageBox.confirm(
    `确定要删除报告 #${row.id} 吗？该操作为软删除，明细数据保留在数据库中。`,
    '删除确认',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  )
    .then(async () => {
      try {
        await deleteReportAPI(row.id)
        ElMessage.success('报告已删除')
        await reload()
      } catch (e) {
        // request.js 已统一处理
      }
    })
    .catch(() => {})
}

// ---------- 视图工具 ----------

function statusClass(s) {
  if (s === 'PASSED') return 'et-tag--pass'
  if (s === 'FAILED') return 'et-tag--fail'
  if (s === 'RUNNING') return 'et-tag--running'
  return 'et-tag--skip'
}
function statusLabel(s) {
  if (s === 'PASSED') return '✓ 通过'
  if (s === 'FAILED') return '✗ 失败'
  if (s === 'RUNNING') return '○ 执行中'
  return s || '—'
}
function passRate(row) {
  const total = Number(row.totalSteps) || 0
  const passed = Number(row.passedSteps) || 0
  if (total === 0) return '—'
  return `${((passed / total) * 100).toFixed(1)}%`
}
</script>

<style scoped>
.report-list-page {
  min-height: calc(100vh - var(--et-header-h) - var(--et-pad-content) * 2);
  display: flex;
  flex-direction: column;
}

.et-breadcrumb .link { color: var(--et-text-3); cursor: pointer; }
.et-breadcrumb .link:hover { color: var(--et-primary); }

.report-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  margin-bottom: 12px;
}
.report-toolbar .left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.report-toolbar .left .title {
  font-size: 14px;
  font-weight: 600;
  color: var(--et-text-1);
}
.report-toolbar .left .hint {
  font-size: 12px;
  color: var(--et-text-3);
}

.report-body {
  flex: 1;
  padding: 8px 0;
}

.cell-deleted {
  color: var(--et-text-4);
  font-style: italic;
}

/* 仅扩展 RUNNING 状态（其余 pass/fail/skip 已在 global.css 提供） */
.et-tag--running { color: #409eff; background: #ecf5ff; border-color: #d9ecff; }
</style>
