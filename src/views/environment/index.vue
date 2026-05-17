<template>
  <div class="env-page">
    <!-- 缺少 projectId：空状态引导 -->
    <div v-if="!projectId" class="empty-guide">
      <div class="et-card empty-guide__card">
        <el-empty description="请先从「项目管理」选择一个项目，再进入环境管理">
          <el-button type="primary" @click="$router.push('/project')">
            返回项目管理
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 正常态 -->
    <template v-else>
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
    </template>

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
 * 环境管理（阶段 3）
 * 视觉对照 docs/screenshots/html/env_management.html
 *
 * 入口：/environment?projectId=X
 * 数据源：
 *   - getProjectDetailAPI(projectId) → 面包屑显示项目名
 *   - getEnvironmentListAPI(projectId) → 左侧列表
 *
 * MVP 简化：
 *   - 不做连通性测试 / SSL / 默认环境 / 复制环境 / 健康状态
 *   - 状态点统一显示灰色"未检测"
 *   - globalHeaders 编辑由 EnvDetail 内部完成（行级表格）
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

import { getProjectDetailAPI } from '@/api/project'
import { getEnvironmentListAPI, deleteEnvironmentAPI } from '@/api/environment'

import EnvList from './components/EnvList.vue'
import EnvDetail from './components/EnvDetail.vue'
import EnvFormDialog from './components/EnvFormDialog.vue'

const route = useRoute()
const router = useRouter()

// ========== query 解析 ==========
const projectId = computed(() => {
  const raw = route.query.projectId
  const num = Number(raw)
  return Number.isFinite(num) && num > 0 ? num : null
})

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
    projectName.value = proj?.name || ''
  } catch (e) {
    projectName.value = ''
  }
}

async function fetchEnvironments(id, preselectEnvId = null) {
  try {
    const list = await getEnvironmentListAPI(id)
    environments.value = Array.isArray(list) ? list : []

    // 选中策略：preselect 优先 → 当前选中保持 → 列表第一个
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
    projectName.value = ''
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
  loading.value = true
  try {
    await Promise.all([fetchProjectName(projectId.value), fetchEnvironments(projectId.value)])
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
  // 新建：选中新建项；编辑：保持当前
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
        currentEnv.value = null // 提前清空，让 reload 选中策略走 preselect 分支
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

/* 空状态引导 */
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
