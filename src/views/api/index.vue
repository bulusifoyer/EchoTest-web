<template>
  <div class="api-page">
    <!-- 面包屑 -->
    <div class="et-breadcrumb">
      <span class="link" @click="$router.push('/project')">项目管理</span>
      <span class="sep">/</span>
      <span>{{ projectName || '加载中...' }}</span>
      <span class="sep">/</span>
      <span class="cur">接口管理</span>
    </div>

    <!-- 左右分栏 -->
    <div v-loading="loading" class="api-grid">
      <ApiTree
        :apis="apis"
        :active-id="currentApi?.id"
        @add="onAdd"
        @select="onSelect"
      />

      <div class="api-right">
        <template v-if="currentApi">
          <ApiEditor
            :api="currentApi"
            @delete="onDelete"
            @updated="onApiUpdated"
          />
          <ApiTryRun
            :api="currentApi"
            :environments="environments"
            :project-id="projectId"
          />
        </template>

        <div v-else class="api-right__empty et-card">
          <el-empty description="该项目下暂无接口">
            <el-button type="primary" :icon="Plus" @click="onAdd">立即新建</el-button>
          </el-empty>
        </div>
      </div>
    </div>

    <!-- 新建对话框 -->
    <ApiFormDialog
      v-if="projectId"
      v-model="dialogVisible"
      :project-id="projectId"
      @submitted="onDialogSubmitted"
    />
  </div>
</template>

<script setup>
/**
 * 接口管理（阶段 3.5 适配）
 * 视觉对照 docs/screenshots/html/api_management.html
 *
 * 阶段 3.5 改动：
 *   - projectId 通过 resolveProjectId(route, projectStore) 解析（query 优先 → store fallback）
 *   - 不再渲染"请先从项目管理选择"空状态卡：路由守卫已统一处理，无 projectId 不会进入此页
 *   - 拉到项目详情后 syncProjectName 回填工作区 chip 名称
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

import { getProjectDetailAPI } from '@/api/project'
import { getEnvironmentListAPI } from '@/api/environment'
import {
  getApiDefinitionListAPI,
  getApiDefinitionDetailAPI,
  deleteApiDefinitionAPI
} from '@/api/apiDefinition'
import { useProjectStore } from '@/store/project'
import { resolveProjectId } from '@/utils/projectContext'

import ApiTree from './components/ApiTree.vue'
import ApiEditor from './components/ApiEditor.vue'
import ApiTryRun from './components/ApiTryRun.vue'
import ApiFormDialog from './components/ApiFormDialog.vue'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

// ========== 当前 projectId（query 优先 → store fallback） ==========
const projectId = computed(() => resolveProjectId(route, projectStore))

// ========== 状态 ==========
const projectName = ref('')
const apis = ref([])
const environments = ref([])
const currentApi = ref(null)
const loading = ref(false)

const dialogVisible = ref(false)

// ========== 数据加载 ==========
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

async function fetchApis(id, preselectId = null) {
  try {
    const list = await getApiDefinitionListAPI(id)
    apis.value = Array.isArray(list) ? list : []

    if (preselectId != null) {
      const found = apis.value.find((a) => a.id === preselectId)
      if (found) {
        await loadApiDetail(found.id)
        return
      }
    }
    if (currentApi.value) {
      const stay = apis.value.find((a) => a.id === currentApi.value.id)
      if (stay) {
        await loadApiDetail(stay.id)
        return
      }
    }
    if (apis.value[0]) {
      await loadApiDetail(apis.value[0].id)
    } else {
      currentApi.value = null
    }
  } catch (e) {
    apis.value = []
    currentApi.value = null
  }
}

async function loadApiDetail(id) {
  try {
    const detail = await getApiDefinitionDetailAPI(id)
    currentApi.value = detail
  } catch (e) {
    currentApi.value = apis.value.find((a) => a.id === id) || null
  }
}

async function fetchEnvironments(id) {
  try {
    const list = await getEnvironmentListAPI(id)
    environments.value = Array.isArray(list) ? list : []
  } catch (e) {
    environments.value = []
  }
}

async function reload(preselectId = null) {
  if (!projectId.value) return
  loading.value = true
  try {
    await Promise.all([
      fetchApis(projectId.value, preselectId),
      fetchEnvironments(projectId.value)
    ])
  } finally {
    loading.value = false
  }
}

// 路由 query 变化时重新加载
watch(projectId, async (id) => {
  if (!id) return
  projectName.value = projectStore.currentProjectName || ''
  apis.value = []
  environments.value = []
  currentApi.value = null
  loading.value = true
  try {
    await Promise.all([
      fetchProjectName(id),
      fetchApis(id),
      fetchEnvironments(id)
    ])
  } finally {
    loading.value = false
  }
})

onMounted(async () => {
  if (!projectId.value) return
  projectName.value = projectStore.currentProjectName || ''
  loading.value = true
  try {
    await Promise.all([
      fetchProjectName(projectId.value),
      fetchApis(projectId.value),
      fetchEnvironments(projectId.value)
    ])
  } finally {
    loading.value = false
  }
})

// ========== 交互 ==========
function onSelect(api) {
  loadApiDetail(api.id)
}

function onAdd() {
  dialogVisible.value = true
}

function onDialogSubmitted(newId) {
  reload(newId)
}

function onApiUpdated(id) {
  reload(id)
}

function onDelete(api) {
  ElMessageBox.confirm(
    `确定要删除接口「${api.name}」吗？该操作为逻辑删除。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        await deleteApiDefinitionAPI(api.id)
        ElMessage.success('接口已删除')
        const idx = apis.value.findIndex((a) => a.id === api.id)
        const fallback = apis.value[idx + 1] || apis.value[idx - 1]
        currentApi.value = null
        await reload(fallback?.id || null)
      } catch (e) {
        console.error('删除接口失败:', e)
      }
    })
    .catch(() => {})
}
</script>

<style scoped>
.api-page {
  min-height: calc(100vh - var(--et-header-h) - var(--et-pad-content) * 2);
  display: flex;
  flex-direction: column;
}

.et-breadcrumb .link {
  color: var(--et-text-3);
  cursor: pointer;
}
.et-breadcrumb .link:hover { color: var(--et-primary); }

/* 左右分栏 */
.api-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  min-height: 0;
}

/* 右侧：编辑器 + 试调 堆叠 */
.api-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}
.api-right__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
}
</style>
