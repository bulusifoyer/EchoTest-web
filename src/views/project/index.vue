<template>
  <div class="project-page">
    <!-- 标题区 -->
    <div class="page-header">
      <div>
        <div class="page-header__title">项目管理</div>
        <div class="page-header__sub">
          管理您参与的所有测试项目，每个项目独立维护接口、用例和测试数据
        </div>
      </div>
      <el-button type="primary" :icon="Plus" @click="onCreateClick">
        新建项目
      </el-button>
    </div>

    <!-- 工具条 -->
    <div class="toolbar">
      <el-input
        v-model="keyword"
        :prefix-icon="Search"
        placeholder="搜索项目名称或描述"
        clearable
        class="toolbar__search"
      />
      <span class="toolbar__count">
        共 <strong>{{ filteredProjects.length }}</strong> 个项目
      </span>
    </div>

    <!-- 项目网格 -->
    <div v-loading="loading" class="proj-grid">
      <ProjectCard
        v-for="project in filteredProjects"
        :key="project.id"
        :project="project"
        @enter="onEnter"
        @edit="onEditClick"
        @delete="onDeleteClick"
      />
      <NewProjectCard @click="onCreateClick" />
    </div>

    <!-- 空状态（仅过滤后无结果时显示，初始的"无项目"由末尾新建卡承担） -->
    <el-empty
      v-if="!loading && allProjects.length > 0 && filteredProjects.length === 0"
      description="未找到匹配的项目"
      class="empty-state"
    />

    <!-- 新建/编辑对话框 -->
    <ProjectFormDialog
      v-model="dialogVisible"
      :project="editingProject"
      @submitted="fetchProjects"
    />
  </div>
</template>

<script setup>
/**
 * 项目管理页（阶段 3.5）
 * 视觉对照 docs/screenshots/html/project_management.html
 *
 * 阶段 3.5 改动：
 *   - 卡片主体点击 → onEnter：写入 currentProject 后跳 /environment?projectId=X
 *   - ⋯ 下拉只剩"编辑 / 删除"，环境/接口/用例入口移到侧栏统一处理
 *   - 删除当前项目时清空 currentProject 并提示
 */

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

import { getProjectListAPI, deleteProjectAPI } from '@/api/project'
import { useProjectStore } from '@/store/project'
import ProjectCard from './components/ProjectCard.vue'
import NewProjectCard from './components/NewProjectCard.vue'
import ProjectFormDialog from './components/ProjectFormDialog.vue'

const router = useRouter()
const projectStore = useProjectStore()

// ========== 列表数据 ==========
const allProjects = ref([])
const loading = ref(false)
const keyword = ref('')

const fetchProjects = async () => {
  loading.value = true
  try {
    const list = await getProjectListAPI()
    allProjects.value = Array.isArray(list) ? list : []

    // 同步：如果 currentProject 被外部删了 / 不在列表里，清掉
    if (projectStore.hasCurrentProject) {
      const stillExists = allProjects.value.some(
        (p) => p.id === projectStore.currentProjectId
      )
      if (!stillExists) {
        projectStore.clearCurrentProject()
      } else {
        // 名字可能被改过，同步一下
        const fresh = allProjects.value.find(
          (p) => p.id === projectStore.currentProjectId
        )
        if (fresh && fresh.name !== projectStore.currentProjectName) {
          projectStore.syncProjectName(fresh.name)
        }
      }
    }
  } catch (error) {
    console.error('获取项目列表失败:', error)
    allProjects.value = []
  } finally {
    loading.value = false
  }
}

// 前端本地搜索：名称 / 描述
const filteredProjects = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return allProjects.value
  return allProjects.value.filter((p) => {
    return (
      (p.name || '').toLowerCase().includes(kw) ||
      (p.description || '').toLowerCase().includes(kw)
    )
  })
})

// ========== 进入项目 ==========
function onEnter(project) {
  projectStore.setCurrentProject(project)
  // 进入项目工作区，默认跳"环境管理"
  router.push({ path: '/environment', query: { projectId: project.id } })
}

// ========== 新建 / 编辑对话框 ==========
const dialogVisible = ref(false)
const editingProject = ref(null)

const onCreateClick = () => {
  editingProject.value = null
  dialogVisible.value = true
}

const onEditClick = (project) => {
  editingProject.value = project
  dialogVisible.value = true
}

// ========== 删除 ==========
const onDeleteClick = (project) => {
  ElMessageBox.confirm(
    `确定要删除项目「${project.name}」吗？删除后不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        await deleteProjectAPI(project.id)

        // 若删的是当前项目，清空工作区上下文
        const isCurrent = projectStore.currentProjectId === project.id
        if (isCurrent) {
          projectStore.clearCurrentProject()
          ElMessage.info('当前项目已删除，请重新选择项目')
        } else {
          ElMessage.success('项目已删除')
        }

        await fetchProjects()
      } catch (error) {
        console.error('删除项目失败:', error)
      }
    })
    .catch(() => {})
}

// ========== 生命周期 ==========
onMounted(fetchProjects)
</script>

<style scoped>
.project-page {
  /* 内容区已经由 Home.vue Main 提供 padding，这里不再加外层 max-width */
}

/* ========== 标题区 ========== */
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

/* ========== 工具条 ========== */
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
.toolbar__search {
  width: 320px;
}
.toolbar__count {
  font-size: 13px;
  color: var(--et-text-4);
}
.toolbar__count strong {
  color: var(--et-text-2);
}

/* ========== 项目网格 ========== */
.proj-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  min-height: 200px;
}

@media (max-width: 1280px) {
  .proj-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .proj-grid {
    grid-template-columns: 1fr;
  }
}

.empty-state {
  margin-top: 40px;
}
</style>
