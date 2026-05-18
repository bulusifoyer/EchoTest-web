<template>
  <div class="exec-page">
    <!-- 面包屑 -->
    <div class="et-breadcrumb">
      <span class="link" @click="$router.push('/project')">项目管理</span>
      <span class="sep">/</span>
      <span>{{ projectName || '加载中...' }}</span>
      <span class="sep">/</span>
      <span class="cur">任务执行</span>
    </div>

    <!-- 工具条 -->
    <div class="et-card exec-toolbar">
      <div class="exec-toolbar__left">
        <span class="title">任务执行中心</span>
        <span class="hint">选中用例后单条 ▶ 执行（批量执行后续版本支持）</span>
      </div>
      <div class="exec-toolbar__right">
        <el-input
          v-model="keyword"
          placeholder="搜索用例名"
          clearable
          :prefix-icon="Search"
          style="width: 240px"
        />
      </div>
    </div>

    <!-- 主体 -->
    <div v-loading="loading" class="exec-body et-card">
      <!-- 项目无用例 -->
      <el-empty
        v-if="!loading && cases.length === 0"
        description="当前项目暂无测试用例，请先创建用例"
      >
        <el-button type="primary" @click="$router.push({ path: '/case', query: { projectId } })">
          前往用例管理
        </el-button>
      </el-empty>

      <el-table
        v-else
        :data="filteredCases"
        stripe
        style="width: 100%"
        :row-style="{ height: '52px' }"
      >
        <el-table-column type="selection" width="40" disabled />
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="caseName" label="用例名称" min-width="220" show-overflow-tooltip />
        <el-table-column label="步骤数" width="90">
          <template #default>—</template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.description" class="cell-desc">{{ row.description }}</span>
            <span v-else class="cell-empty">—</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="170">
          <template #default="{ row }">{{ row.updateTime || row.createTime || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="onExecute(row)">▶ 执行</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 共用执行对话框 -->
    <ExecuteEnvDialog
      v-model="dialogVisible"
      :case-id="executingCase?.id"
      :case-name="executingCase?.caseName"
      :project-id="projectId"
      @success="onExecuted"
    />
  </div>
</template>

<script setup>
/**
 * 任务执行中心（阶段 7）
 *
 * 职责：列出当前项目下的用例，单条 ▶ 执行（弹 ExecuteEnvDialog 选环境）
 *
 * 路由：/execution?projectId=N（requireProject 守卫保证 projectId 存在）
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

import { getProjectDetailAPI } from '@/api/project'
import { getCaseListAPI } from '@/api/testCase'
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

const dialogVisible = ref(false)
const executingCase = ref(null)

const filteredCases = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return cases.value
  return cases.value.filter((c) => (c.caseName || '').toLowerCase().includes(k))
})

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

async function fetchCases(id) {
  try {
    const list = await getCaseListAPI(id)
    cases.value = Array.isArray(list) ? list : []
  } catch (e) {
    cases.value = []
  }
}

async function reload() {
  if (!projectId.value) return
  loading.value = true
  try {
    await Promise.all([fetchProjectName(projectId.value), fetchCases(projectId.value)])
  } finally {
    loading.value = false
  }
}

onMounted(reload)
watch(projectId, reload)

function onExecute(row) {
  executingCase.value = row
  dialogVisible.value = true
}

function onExecuted(reportId) {
  router.push({
    path: '/report/detail',
    query: { reportId, projectId: projectId.value }
  })
}
</script>

<style scoped>
.exec-page {
  min-height: calc(100vh - var(--et-header-h) - var(--et-pad-content) * 2);
  display: flex;
  flex-direction: column;
}

.et-breadcrumb .link { color: var(--et-text-3); cursor: pointer; }
.et-breadcrumb .link:hover { color: var(--et-primary); }

.exec-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  margin-bottom: 12px;
}
.exec-toolbar__left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.exec-toolbar__left .title {
  font-size: 14px;
  font-weight: 600;
  color: var(--et-text-1);
}
.exec-toolbar__left .hint {
  font-size: 12px;
  color: var(--et-text-3);
}

.exec-body {
  flex: 1;
  padding: 8px 0;
}

.cell-desc { color: var(--et-text-2); }
.cell-empty { color: var(--et-text-4); }
</style>
