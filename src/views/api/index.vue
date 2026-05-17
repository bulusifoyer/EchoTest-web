<template>
  <div class="api-page">
    <!-- 缺 projectId 时：空状态引导 -->
    <div v-if="!projectId" class="empty-guide">
      <div class="et-card empty-guide__card">
        <el-empty description="请先从「项目管理」选择一个项目，再进入接口管理">
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
    </template>

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
 * 接口管理（阶段 4）
 * 视觉对照 docs/screenshots/html/api_management.html
 *
 * 入口：/api?projectId=X
 * 数据源：
 *   - getProjectDetailAPI(projectId)
 *   - getApiDefinitionListAPI(projectId)
 *   - getEnvironmentListAPI(projectId)（试调使用）
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

import ApiTree from './components/ApiTree.vue'
import ApiEditor from './components/ApiEditor.vue'
import ApiTryRun from './components/ApiTryRun.vue'
import ApiFormDialog from './components/ApiFormDialog.vue'

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
const apis = ref([])
const environments = ref([])
const currentApi = ref(null)
const loading = ref(false)

const dialogVisible = ref(false)

// ========== 数据加载 ==========
async function fetchProjectName(id) {
  try {
    const proj = await getProjectDetailAPI(id)
    projectName.value = proj?.name || ''
  } catch (e) {
    projectName.value = ''
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
  // 列表只回基础字段（含 requestHeaders/Body？后端是 select * 直接全字段，所以可直接用）
  // 不过为了和详情接口字段对齐，仍可走详情接口
  try {
    const detail = await getApiDefinitionDetailAPI(id)
    currentApi.value = detail
  } catch (e) {
    // 退回列表里的对象
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
  projectName.value = ''
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
  // 编辑保存后刷列表（更新条目名 / method / path 显示）+ 重新加载详情
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
        // 选相邻
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
