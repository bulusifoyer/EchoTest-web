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
        @edit="onEditClick"
        @delete="onDeleteClick"
        @open-env="goEnvironment"
        @open-api="goApi"
        @open-case="goCase"
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
 * 项目管理页（阶段 2 重做）
 * 视觉对照 docs/screenshots/html/project_management.html
 *
 * 功能：
 *   - 网格卡片展示项目列表（前端本地搜索过滤）
 *   - 顶部「新建项目」+ 末尾虚线「+」卡片均可触发新建对话框
 *   - 卡片 ⋯ 下拉菜单：编辑 / 删除 / 跳环境/接口/用例
 *
 * MVP 简化：
 *   - 统计字段（接口数/用例数/通过率）暂以 — 占位
 *   - 不分页（与后端 list 保持一致）
 *   - 环境/接口/用例入口仅做路由跳转（带 projectId），具体页面由后续阶段实现
 */

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

import { getProjectListAPI, deleteProjectAPI } from '@/api/project'
import ProjectCard from './components/ProjectCard.vue'
import NewProjectCard from './components/NewProjectCard.vue'
import ProjectFormDialog from './components/ProjectFormDialog.vue'

const router = useRouter()

// ========== 列表数据 ==========
const allProjects = ref([])
const loading = ref(false)
const keyword = ref('')

const fetchProjects = async () => {
  loading.value = true
  try {
    const list = await getProjectListAPI()
    allProjects.value = Array.isArray(list) ? list : []
  } catch (error) {
    // request.js 已统一 toast
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
        ElMessage.success('项目已删除')
        await fetchProjects()
      } catch (error) {
        console.error('删除项目失败:', error)
      }
    })
    .catch(() => {})
}

// ========== 项目内子模块跳转 ==========
const goEnvironment = (project) => {
  router.push({ path: '/environment', query: { projectId: project.id } })
}
const goApi = (project) => {
  router.push({ path: '/api', query: { projectId: project.id } })
}
const goCase = (project) => {
  router.push({ path: '/case', query: { projectId: project.id } })
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
