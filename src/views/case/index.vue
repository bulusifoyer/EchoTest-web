<template>
  <div class="case-page">
    <!-- 面包屑 -->
    <div class="et-breadcrumb">
      <span class="link" @click="$router.push('/project')">项目管理</span>
      <span class="sep">/</span>
      <span>{{ projectName || '加载中...' }}</span>
      <span class="sep">/</span>
      <span class="cur">用例管理</span>
    </div>

    <!-- 标题区 -->
    <div class="page-header">
      <div>
        <div class="page-header__title">用例管理</div>
        <div class="page-header__sub">
          管理测试用例（业务流），每个用例由多个步骤聚合而成，支持变量提取与断言
        </div>
      </div>
      <el-button type="primary" :icon="Plus" @click="onCreate">新建用例</el-button>
    </div>

    <!-- 工具条 -->
    <div class="toolbar">
      <el-input
        v-model="keyword"
        :prefix-icon="Search"
        placeholder="搜索用例名称或描述"
        clearable
        class="toolbar__search"
      />
      <span class="toolbar__count">
        共 <strong>{{ filtered.length }}</strong> 个用例
      </span>
    </div>

    <!-- 表格 -->
    <div class="et-card case-table-card">
      <el-table
        v-loading="loading"
        :data="filtered"
        stripe
        empty-text="该项目下暂无用例，点击右上角「新建用例」开始"
        @row-click="onRowClick"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="caseName" label="用例名称" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="case-name">{{ row.caseName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="muted">{{ row.description || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="步骤数" width="90" align="center">
          <template #default>
            <span class="muted" title="后端列表接口暂未返回 stepCount，进入编辑器可见">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="最后更新" width="180" />
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="onExecute(row)">▶ 执行</el-button>
            <el-button link type="primary" size="small" @click.stop="onEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click.stop="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 执行用例对话框（与 /execution、/case/edit 共用） -->
    <ExecuteEnvDialog
      v-model="execDialogVisible"
      :case-id="executingCase?.id"
      :case-name="executingCase?.caseName"
      :project-id="projectId"
      @success="onExecuted"
    />
  </div>
</template>

<script setup>
/**
 * 用例管理列表页（阶段 5）
 *   - /case?projectId=N
 *   - 顶部"+ 新建用例" → /case/edit?projectId=N&caseId=new
 *   - 行点击 / 「编辑」按钮 → /case/edit?projectId=N&caseId=:id
 *   - 步骤数列暂以 — 占位（后端列表无 stepCount）
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

import { getProjectDetailAPI } from '@/api/project'
import { getCaseListAPI, deleteCaseAPI } from '@/api/testCase'
import { useProjectStore } from '@/store/project'
import { resolveProjectId } from '@/utils/projectContext'

import ExecuteEnvDialog from '@/components/ExecuteEnvDialog.vue'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

const projectId = computed(() => resolveProjectId(route, projectStore))
const projectName = ref('')

const cases = ref([])
const loading = ref(false)
const keyword = ref('')

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return cases.value
  return cases.value.filter((c) =>
    (c.caseName || '').toLowerCase().includes(kw) ||
    (c.description || '').toLowerCase().includes(kw)
  )
})

async function fetchProjectName(id) {
  try {
    const proj = await getProjectDetailAPI(id)
    if (proj?.name) {
      projectName.value = proj.name
      projectStore.syncProjectName(proj.name)
    }
  } catch (e) {
    projectStore.clearCurrentProject()
    ElMessage.warning('项目不存在或无权限访问')
    router.replace('/project')
  }
}

async function fetchCases(id) {
  loading.value = true
  try {
    const list = await getCaseListAPI(id)
    cases.value = Array.isArray(list) ? list : []
  } catch (e) {
    cases.value = []
  } finally {
    loading.value = false
  }
}

watch(projectId, async (id) => {
  if (!id) return
  projectName.value = projectStore.currentProjectName || ''
  await Promise.all([fetchProjectName(id), fetchCases(id)])
})

onMounted(async () => {
  if (!projectId.value) return
  projectName.value = projectStore.currentProjectName || ''
  await Promise.all([fetchProjectName(projectId.value), fetchCases(projectId.value)])
})

function onCreate() {
  router.push({ path: '/case/edit', query: { projectId: projectId.value, caseId: 'new' } })
}

function onEdit(row) {
  router.push({ path: '/case/edit', query: { projectId: projectId.value, caseId: row.id } })
}

const execDialogVisible = ref(false)
const executingCase = ref(null)

function onExecute(row) {
  executingCase.value = row
  execDialogVisible.value = true
}

function onExecuted(reportId) {
  router.push({
    path: '/report/detail',
    query: { reportId, projectId: projectId.value }
  })
}

function onRowClick(row) {
  onEdit(row)
}

function onDelete(row) {
  ElMessageBox.confirm(
    `确定要删除用例「${row.caseName}」吗？关联的步骤、变量提取与断言会一并物理清除。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        await deleteCaseAPI(row.id)
        ElMessage.success('用例已删除')
        await fetchCases(projectId.value)
      } catch (e) {
        console.error('删除用例失败:', e)
      }
    })
    .catch(() => {})
}
</script>

<style scoped>
.case-page {
  display: flex;
  flex-direction: column;
}

.et-breadcrumb .link {
  color: var(--et-text-3);
  cursor: pointer;
}
.et-breadcrumb .link:hover {
  color: var(--et-primary);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.page-header__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--et-text-1);
  margin-bottom: 4px;
}
.page-header__sub {
  font-size: 13px;
  color: var(--et-text-4);
}

.toolbar {
  background: var(--et-bg-card);
  border: 1px solid var(--et-border-card);
  border-radius: var(--et-radius-card);
  padding: 14px 18px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.toolbar__search { width: 320px; }
.toolbar__count { font-size: 13px; color: var(--et-text-4); }
.toolbar__count strong { color: var(--et-text-2); }

.case-table-card { padding: 0; overflow: hidden; }
.case-name { color: var(--et-text-2); font-weight: 500; }
.muted { color: var(--et-text-4); }

:deep(.el-table__row) { cursor: pointer; }
</style>
