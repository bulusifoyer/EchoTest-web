<template>
  <div class="case-editor">
    <!-- 面包屑 + 操作 -->
    <div class="editor-header">
      <div class="et-breadcrumb">
        <span class="link" @click="$router.push('/project')">项目管理</span>
        <span class="sep">/</span>
        <span>{{ projectName || '加载中...' }}</span>
        <span class="sep">/</span>
        <span class="link" @click="goList">用例管理</span>
        <span class="sep">/</span>
        <span class="cur">{{ isNew ? '新建用例' : '编辑用例' }}</span>
      </div>

      <div class="editor-header__ops">
        <el-button @click="goList">取消</el-button>
        <el-tooltip
          :content="runDisabledTip"
          placement="bottom"
          :disabled="!runDisabled"
        >
          <span>
            <el-button
              type="warning"
              :icon="VideoPlay"
              :disabled="runDisabled"
              @click="onExecute"
            >
              ▶ 执行用例
            </el-button>
          </span>
        </el-tooltip>
        <el-button type="primary" :icon="Document" :loading="saving" @click="onSave">
          保存用例
        </el-button>
      </div>
    </div>

    <!-- 主体 -->
    <div v-loading="loading" class="case-grid">
      <div class="case-grid__main">
        <CaseMetaCard
          v-model:caseName="caseForm.caseName"
          v-model:description="caseForm.description"
        />
        <StepList
          v-model="caseForm.steps"
          :apis="apis"
          v-model:expanded-index="expandedIndex"
        />
      </div>

      <SideContext
        v-model:selectedEnvId="selectedEnvId"
        :environments="environments"
        :project-id="projectId"
        @pick-assertion="onPickAssertion"
      />
    </div>

    <!-- 执行用例对话框（与 /execution、/case 共用） -->
    <ExecuteEnvDialog
      v-model="execDialogVisible"
      :case-id="caseId"
      :case-name="caseForm.caseName"
      :project-id="projectId"
      :prefer-env-id="selectedEnvId"
      @success="onExecuted"
    />
  </div>
</template>

<script setup>
/**
 * 用例编辑器（阶段 5）
 *
 * 路由：/case/edit?projectId=N&caseId=N|new
 * 数据流：
 *   - 进入：并发拉项目详情 + 接口列表 + 环境列表；caseId !== 'new' 时再拉用例详情回填
 *   - 保存：前端校验 + 数据清洗（剔除空 extracts/assertions、删除 _frontendId、trim 字符串）
 *           → 调 addCaseAPI / updateCaseAPI
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { VideoPlay, Document } from '@element-plus/icons-vue'

import { getProjectDetailAPI } from '@/api/project'
import { getEnvironmentListAPI } from '@/api/environment'
import { getApiDefinitionListAPI } from '@/api/apiDefinition'
import { addCaseAPI, updateCaseAPI, getCaseDetailAPI } from '@/api/testCase'
import { useProjectStore } from '@/store/project'
import { resolveProjectId } from '@/utils/projectContext'

import CaseMetaCard from './components/CaseMetaCard.vue'
import StepList from './components/StepList.vue'
import SideContext from './components/SideContext.vue'
import ExecuteEnvDialog from '@/components/ExecuteEnvDialog.vue'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

const projectId = computed(() => resolveProjectId(route, projectStore))
const caseIdRaw = computed(() => route.query.caseId)
const isNew = computed(() => caseIdRaw.value === 'new' || caseIdRaw.value == null)
const caseId = computed(() => {
  if (isNew.value) return null
  const n = Number(caseIdRaw.value)
  return Number.isFinite(n) && n > 0 ? n : null
})

const projectName = ref('')
const apis = ref([])
const environments = ref([])

const loading = ref(false)
const saving = ref(false)

// 当前展开的步骤索引（同时也是"通用断言模板"的目标步骤）
const expandedIndex = ref(-1)

const selectedEnvId = ref(null)

// 表单
const caseForm = reactive({
  caseName: '',
  description: '',
  steps: []
})

function genFid() {
  return 'fid_' + Math.random().toString(36).slice(2, 10)
}

// ========== 数据加载 ==========

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

async function fetchApis(id) {
  try {
    const list = await getApiDefinitionListAPI(id)
    apis.value = Array.isArray(list) ? list : []
  } catch (e) {
    apis.value = []
  }
}

async function fetchEnvironments(id) {
  try {
    const list = await getEnvironmentListAPI(id)
    environments.value = Array.isArray(list) ? list : []
    if (list?.[0] && selectedEnvId.value == null) {
      selectedEnvId.value = list[0].id
    }
  } catch (e) {
    environments.value = []
  }
}

async function fetchCaseDetail(id) {
  try {
    const detail = await getCaseDetailAPI(id)
    if (!detail) return
    caseForm.caseName = detail.caseName || ''
    caseForm.description = detail.description || ''
    const steps = Array.isArray(detail.steps) ? detail.steps : []
    caseForm.steps = steps.map((s) => ({
      _frontendId: genFid(),
      apiId: s.apiId,
      stepName: s.stepName || '',
      overrideRequestBody: s.overrideRequestBody || '',
      extracts: Array.isArray(s.extracts)
        ? s.extracts.map((e) => ({
          variableName: e.variableName || '',
          jsonPath: e.jsonPath || ''
        }))
        : [],
      assertions: Array.isArray(s.assertions)
        ? s.assertions.map((a) => ({
          assertType: a.assertType || 'STATUS_CODE',
          expression: a.expression || '',
          operator: a.operator || 'EQUALS',
          expectedValue: a.expectedValue || ''
        }))
        : []
    }))
    expandedIndex.value = caseForm.steps.length > 0 ? 0 : -1
  } catch (e) {
    ElMessage.error('用例不存在或无权限访问')
    router.replace({ path: '/case', query: { projectId: projectId.value } })
  }
}

onMounted(async () => {
  if (!projectId.value) return
  projectName.value = projectStore.currentProjectName || ''
  loading.value = true
  try {
    const tasks = [
      fetchProjectName(projectId.value),
      fetchApis(projectId.value),
      fetchEnvironments(projectId.value)
    ]
    if (!isNew.value && caseId.value) {
      tasks.push(fetchCaseDetail(caseId.value))
    }
    await Promise.all(tasks)
  } finally {
    loading.value = false
  }
})

// ========== 通用断言模板插入 ==========
function onPickAssertion(payload) {
  if (expandedIndex.value < 0 || expandedIndex.value >= caseForm.steps.length) {
    ElMessage.warning('请先选择一个步骤（点击步骤卡片展开后再选择模板）')
    return
  }
  const step = caseForm.steps[expandedIndex.value]
  const next = Array.isArray(step.assertions) ? [...step.assertions] : []
  next.push({ ...payload })
  // 触发响应式
  caseForm.steps[expandedIndex.value] = { ...step, assertions: next }
  ElMessage.success(`已添加到第 ${expandedIndex.value + 1} 步的断言列表`)
}

// ========== 保存 ==========

function buildPayload() {
  const cleanedSteps = caseForm.steps.map((s) => {
    const extracts = (s.extracts || [])
      .map((e) => ({
        variableName: (e.variableName || '').trim(),
        jsonPath: (e.jsonPath || '').trim()
      }))
      .filter((e) => e.variableName && e.jsonPath)

    const assertions = (s.assertions || [])
      .map((a) => ({
        assertType: a.assertType,
        expression: (a.expression || '').trim(),
        operator: a.operator || 'EQUALS',
        expectedValue: (a.expectedValue || '').trim()
      }))
      // 整行空模板（无类型 + 无期望值）剔除
      .filter((a) => a.assertType && a.expectedValue)

    return {
      apiId: s.apiId,
      stepName: (s.stepName || '').trim() || undefined,
      overrideRequestBody: (s.overrideRequestBody || '').trim() || undefined,
      extracts,
      assertions
    }
  })

  return {
    projectId: Number(projectId.value),
    caseName: (caseForm.caseName || '').trim(),
    description: (caseForm.description || '').trim() || undefined,
    steps: cleanedSteps
  }
}

function validate() {
  if (!caseForm.caseName.trim()) {
    ElMessage.error('用例名称不能为空')
    return false
  }
  if (caseForm.caseName.length > 100) {
    ElMessage.error('用例名称不能超过 100 位')
    return false
  }
  if ((caseForm.description || '').length > 255) {
    ElMessage.error('用例描述不能超过 255 位')
    return false
  }
  if (caseForm.steps.length === 0) {
    ElMessage.error('用例至少需要一个步骤')
    return false
  }
  for (let i = 0; i < caseForm.steps.length; i++) {
    const s = caseForm.steps[i]
    if (!s.apiId) {
      ElMessage.error(`第 ${i + 1} 步未选择接口`)
      return false
    }
    // JSON_PATH 类型断言必须填 expression
    for (let j = 0; j < (s.assertions || []).length; j++) {
      const a = s.assertions[j]
      if (!a.expectedValue?.toString().trim()) continue // 空模板行清洗时会丢弃
      if (a.assertType === 'JSON_PATH' && !(a.expression || '').trim()) {
        ElMessage.error(`第 ${i + 1} 步第 ${j + 1} 条断言（JSON_PATH）缺少 expression`)
        return false
      }
    }
    // extracts 校验：variableName/jsonPath 同时填或同时空，不允许半填
    for (let j = 0; j < (s.extracts || []).length; j++) {
      const e = s.extracts[j]
      const hasName = (e.variableName || '').trim().length > 0
      const hasPath = (e.jsonPath || '').trim().length > 0
      if (hasName !== hasPath) {
        ElMessage.error(`第 ${i + 1} 步第 ${j + 1} 条变量提取的「变量名」与「JSONPath」必须同时填写`)
        return false
      }
    }
  }
  return true
}

async function onSave() {
  if (!validate()) return
  const payload = buildPayload()
  saving.value = true
  try {
    if (isNew.value) {
      const newId = await addCaseAPI(payload)
      ElMessage.success('用例已创建')
      // 切到编辑模式
      router.replace({
        path: '/case/edit',
        query: { projectId: projectId.value, caseId: newId }
      })
    } else {
      await updateCaseAPI(caseId.value, payload)
      ElMessage.success('用例已保存')
    }
  } catch (e) {
    console.error('保存用例失败:', e)
  } finally {
    saving.value = false
  }
}

function goList() {
  router.push({ path: '/case', query: { projectId: projectId.value } })
}

// ---------- 执行用例（接入阶段 7 ExecuteEnvDialog） ----------

const execDialogVisible = ref(false)

const runDisabled = computed(() => isNew.value || saving.value)
const runDisabledTip = computed(() => {
  if (isNew.value) return '请先保存用例后再执行'
  if (saving.value) return '正在保存，请稍候'
  return ''
})

function onExecute() {
  if (runDisabled.value) return
  execDialogVisible.value = true
}

function onExecuted(reportId) {
  router.push({
    path: '/report/detail',
    query: { reportId, projectId: projectId.value }
  })
}
</script>

<style scoped>
.case-editor {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - var(--et-header-h) - var(--et-pad-content) * 2);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}
.editor-header__ops {
  display: flex;
  gap: 8px;
}

.et-breadcrumb { margin-bottom: 0; }
.et-breadcrumb .link {
  color: var(--et-text-3);
  cursor: pointer;
}
.et-breadcrumb .link:hover { color: var(--et-primary); }

/* 主体网格 */
.case-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 16px;
  min-height: 0;
}
.case-grid__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

@media (max-width: 1280px) {
  .case-grid {
    grid-template-columns: 1fr 320px;
  }
}
</style>
