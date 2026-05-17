<template>
  <div class="env-page">
    <!-- 面包屑 -->
    <div class="et-breadcrumb">
      <span class="link" @click="$router.push('/project')">项目管理</span>
      <span class="sep">/</span>
      <span>{{ projectName || '加载中...' }}</span>
      <span class="sep">/</span>
      <span class="cur">环境管理</span>
    </div>

    <!-- 左右分栏 -->
    <div v-loading="loading" class="env-grid">
      <EnvList
        :environments="environments"
        :active-id="currentEnv?.id"
        @add="onAdd"
        @select="onSelect"
      />

      <EnvDetail
        v-if="currentEnv"
        :env="currentEnv"
        :project-name="projectName"
        @edit="onEdit"
        @delete="onDelete"
        @updated="reload"
      />

      <div v-else class="env-detail-empty et-card">
        <el-empty description="该项目下暂无环境">
          <el-button type="primary" :icon="Plus" @click="onAdd">立即新建</el-button>
        </el-empty>
      </div>
    </div>

    <!-- 新建/编辑对话框 -->
    <EnvFormDialog
      v-if="projectId"
      v-model="dialogVisible"
      :project-id="projectId"
      :env="editingEnv"
      @submitted="onDialogSubmitted"
    />
  </div>
</template>

<script setup>
/**
 * 环境管理（阶段 3.5 适配）
 * 视觉对照 docs/screenshots/html/env_management.html
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
import { getEnvironmentListAPI, deleteEnvironmentAPI } from '@/api/environment'
import { useProjectStore } from '@/store/project'
import { resolveProjectId } from '@/utils/projectContext'

import EnvList from './components/EnvList.vue'
import EnvDetail from './components/EnvDetail.vue'
import EnvFormDialog from './components/EnvFormDialog.vue'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

// ========== 当前 projectId（query 优先 → store fallback） ==========
const projectId = computed(() => resolveProjectId(route, projectStore))

// ========== 状态 ==========
const projectName = ref('')
const environments = ref([])
const currentEnv = ref(null)
const loading = ref(false)

const dialogVisible = ref(false)
const editingEnv = ref(null)

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
    // 项目可能已被删 / 无权限：清掉 store 并跳回项目管理
    projectStore.clearCurrentProject()
    ElMessage.warning('项目不存在或无权限访问')
    router.replace('/project')
  }
}

async function fetchEnvironments(id, preselectEnvId = null) {
  try {
    const list = await getEnvironmentListAPI(id)
    environments.value = Array.isArray(list) ? list : []

    if (preselectEnvId != null) {
      currentEnv.value = environments.value.find((e) => e.id === preselectEnvId) || environments.value[0] || null
    } else if (currentEnv.value) {
      const stay = environments.value.find((e) => e.id === currentEnv.value.id)
      currentEnv.value = stay || environments.value[0] || null
    } else {
      currentEnv.value = environments.value[0] || null
    }
  } catch (e) {
    environments.value = []
    currentEnv.value = null
  }
}

async function reload(preselectEnvId = null) {
  if (!projectId.value) return
  loading.value = true
  try {
    await fetchEnvironments(projectId.value, preselectEnvId)
  } finally {
    loading.value = false
  }
}

// 路由 query 变化时重新加载
watch(
  projectId,
  async (id) => {
    if (!id) return
    projectName.value = projectStore.currentProjectName || ''
    environments.value = []
    currentEnv.value = null
    loading.value = true
    try {
      await Promise.all([fetchProjectName(id), fetchEnvironments(id)])
    } finally {
      loading.value = false
    }
  },
  { immediate: false }
)

onMounted(async () => {
  if (!projectId.value) return
  // 先用 store 缓存的名字垫一下，避免面包屑短暂"加载中"
  projectName.value = projectStore.currentProjectName || ''
  loading.value = true
  try {
    await Promise.all([
      fetchProjectName(projectId.value),
      fetchEnvironments(projectId.value)
    ])
  } finally {
    loading.value = false
  }
})

// ========== 列表交互 ==========
function onSelect(env) {
  currentEnv.value = env
}

function onAdd() {
  editingEnv.value = null
  dialogVisible.value = true
}

function onEdit(env) {
  editingEnv.value = env
  dialogVisible.value = true
}

function onDialogSubmitted(newId) {
  reload(newId || currentEnv.value?.id || null)
}

function onDelete(env) {
  ElMessageBox.confirm(
    `确定要删除环境「${env.envName}」吗？该操作为物理删除，不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        await deleteEnvironmentAPI(env.id)
        ElMessage.success('环境已删除')

        // 删除后选中相邻：先取下一个，再取上一个
        const idx = environments.value.findIndex((e) => e.id === env.id)
        const fallback = environments.value[idx + 1] || environments.value[idx - 1]
        const preselectId = fallback?.id ?? null
        currentEnv.value = null
        await reload(preselectId)
      } catch (e) {
        console.error('删除环境失败:', e)
      }
    })
    .catch(() => {})
}
</script>

<style scoped>
.env-page {
  min-height: calc(100vh - var(--et-header-h) - var(--et-pad-content) * 2);
  display: flex;
  flex-direction: column;
}

/* 面包屑 link */
.et-breadcrumb .link {
  color: var(--et-text-3);
  cursor: pointer;
}
.et-breadcrumb .link:hover {
  color: var(--et-primary);
}

/* 左右分栏 */
.env-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  min-height: 0;
}

.env-detail-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
</style>
