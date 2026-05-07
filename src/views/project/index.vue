<template>
  <div class="project-container">
    <!-- ========== 顶部搜索与操作栏 ========== -->
    <el-card shadow="never" :body-style="{ paddingBottom: '0px' }">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="项目名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入项目名称"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
        <el-form-item style="float: right">
          <el-button type="primary" icon="Plus" @click="openAddDialog">新增项目</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ========== 项目列表表格 ========== -->
    <el-card shadow="never" style="margin-top: 16px">
      <el-table
        :data="tableData"
        v-loading="tableLoading"
        stripe
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="项目ID" width="80" align="center" />
        <el-table-column prop="name" label="项目名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="description" label="项目描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createBy" label="创建人ID" width="100" align="center" />
        <el-table-column prop="createTime" label="创建时间" width="170" align="center" />
        <el-table-column prop="updateTime" label="更新时间" width="170" align="center" />
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditDialog(row)">
              编辑
            </el-button>
            <el-button type="success" link size="small" @click="openEnvDrawer(row)">
              环境配置
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- ========== 新增/编辑项目弹窗 ========== -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增项目' : '编辑项目'"
      width="520px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="projectFormRef"
        :model="projectForm"
        :rules="projectFormRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input
            v-model="projectForm.name"
            placeholder="请输入项目名称，1-100位"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="projectForm.description"
            placeholder="请输入项目描述（可选）"
            type="textarea"
            :rows="4"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          {{ dialogType === 'add' ? '确认新增' : '确认更新' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ========== 环境配置抽屉 ========== -->
    <el-drawer
      v-model="envDrawerVisible"
      :title="`环境配置 - ${currentProject?.name || ''}`"
      size="600px"
      :close-on-click-modal="false"
      @close="handleEnvDrawerClose"
    >
      <template #extra>
        <el-button type="primary" icon="Plus" size="small" @click="openAddEnvDialog">
          新增环境
        </el-button>
      </template>

      <!-- 环境列表 -->
      <el-table
        :data="envTableData"
        v-loading="envTableLoading"
        stripe
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="envName" label="环境名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="baseUrl" label="根路径" min-width="160" show-overflow-tooltip />
        <el-table-column prop="globalHeaders" label="全局请求头" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.globalHeaders" type="info" size="small">已配置</el-tag>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditEnvDialog(row)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDeleteEnv(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态提示 -->
      <el-empty v-if="!envTableLoading && envTableData.length === 0" description="暂无环境配置" />
    </el-drawer>

    <!-- ========== 新增/编辑环境弹窗 ========== -->
    <el-dialog
      v-model="envDialogVisible"
      :title="envDialogType === 'add' ? '新增环境' : '编辑环境'"
      width="520px"
      :close-on-click-modal="false"
      @close="handleEnvDialogClose"
    >
      <el-form
        ref="envFormRef"
        :model="envForm"
        :rules="envFormRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="环境名称" prop="envName">
          <el-input
            v-model="envForm.envName"
            placeholder="如：开发环境、测试环境、生产环境"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="根路径" prop="baseUrl">
          <el-input
            v-model="envForm.baseUrl"
            placeholder="如：http://api.test.com"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="全局请求头" prop="globalHeaders">
          <el-input
            v-model="envForm.globalHeaders"
            placeholder='JSON格式，如：{"Content-Type":"application/json"}'
            type="textarea"
            :rows="4"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="envDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="envSubmitLoading" @click="handleEnvSubmit">
          {{ envDialogType === 'add' ? '确认新增' : '确认更新' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 项目管理页面
 * 功能：项目列表展示、搜索、新增/编辑/删除项目、环境配置管理
 * 环境配置通过 Drawer 在项目页面内聚管理
 */

import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getProjectListAPI,
  addProjectAPI,
  updateProjectAPI,
  deleteProjectAPI
} from '@/api/project'
import {
  getEnvironmentListAPI,
  addEnvironmentAPI,
  updateEnvironmentAPI,
  deleteEnvironmentAPI
} from '@/api/environment'

// ========== 搜索条件 ==========
const searchForm = reactive({
  name: ''
})

// ========== 表格数据与分页 ==========
const tableData = ref([])
const tableLoading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

// 原始项目列表（用于前端分页和搜索过滤）
let allProjects = []

/**
 * 获取项目列表
 * 后端 /project/list 返回全量数据，前端进行分页展示
 */
const fetchProjectList = async () => {
  tableLoading.value = true
  try {
    allProjects = await getProjectListAPI()
    applyFilters()
  } catch (error) {
    console.error('获取项目列表失败:', error)
    allProjects = []
    tableData.value = []
    pagination.total = 0
  } finally {
    tableLoading.value = false
  }
}

/**
 * 根据搜索条件过滤并分页
 */
const applyFilters = () => {
  const keyword = searchForm.name.trim().toLowerCase()
  let filtered = allProjects

  // 按项目名称模糊搜索
  if (keyword) {
    filtered = allProjects.filter(item => item.name.toLowerCase().includes(keyword))
  }

  pagination.total = filtered.length

  // 前端分页截取
  const start = (pagination.current - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  tableData.value = filtered.slice(start, end)
}

// 搜索与重置
const handleSearch = () => {
  pagination.current = 1
  applyFilters()
}

const handleReset = () => {
  searchForm.name = ''
  pagination.current = 1
  applyFilters()
}

// 分页变化
const handlePageChange = () => {
  applyFilters()
}

// ========== 新增/编辑项目弹窗 ==========
const dialogVisible = ref(false)
const dialogType = ref('add') // 'add' | 'edit'
const submitLoading = ref(false)
const projectFormRef = ref(null)

// 当前编辑的项目ID（编辑模式使用）
const editingProjectId = ref(null)

// 项目表单数据，字段与 API 文档 100% 保持一致
const projectForm = reactive({
  name: '',
  description: ''
})

// 项目表单验证规则
const projectFormRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 1, max: 100, message: '项目名称长度为 1-100 位', trigger: 'blur' }
  ],
  description: [
    { max: 255, message: '项目描述不能超过 255 位', trigger: 'blur' }
  ]
}

// 打开新增弹窗
const openAddDialog = () => {
  dialogType.value = 'add'
  editingProjectId.value = null
  projectForm.name = ''
  projectForm.description = ''
  dialogVisible.value = true
}

// 打开编辑弹窗
const openEditDialog = (row) => {
  dialogType.value = 'edit'
  editingProjectId.value = row.id
  // 回填当前行数据
  projectForm.name = row.name
  projectForm.description = row.description
  dialogVisible.value = true
}

// 关闭弹窗时重置表单校验状态
const handleDialogClose = () => {
  projectFormRef.value?.resetFields()
}

// 提交新增/编辑
const handleSubmit = async () => {
  const valid = await projectFormRef.value.validate()
  if (!valid) return

  submitLoading.value = true
  try {
    if (dialogType.value === 'add') {
      // 新增项目，调用 POST /api/project/add
      await addProjectAPI({
        name: projectForm.name.trim(),
        description: projectForm.description.trim() || undefined
      })
      ElMessage({ message: '项目创建成功', type: 'success', duration: 2000 })
    } else {
      // 更新项目，调用 PUT /api/project/update
      await updateProjectAPI({
        id: editingProjectId.value,
        name: projectForm.name.trim(),
        description: projectForm.description.trim() || undefined
      })
      ElMessage({ message: '项目更新成功', type: 'success', duration: 2000 })
    }
    dialogVisible.value = false
    // 刷新列表
    await fetchProjectList()
  } catch (error) {
    console.error('提交项目失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// ========== 删除项目 ==========
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除项目「${row.name}」吗？删除后不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteProjectAPI(row.id)
      ElMessage({ message: '项目已删除', type: 'success', duration: 2000 })
      await fetchProjectList()
    } catch (error) {
      console.error('删除项目失败:', error)
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// ========== 环境配置抽屉 ==========
const envDrawerVisible = ref(false)
const currentProject = ref(null)
const envTableData = ref([])
const envTableLoading = ref(false)

/**
 * 打开环境配置抽屉
 * @param {Object} project - 当前选中的项目对象
 */
const openEnvDrawer = async (project) => {
  currentProject.value = project
  envDrawerVisible.value = true
  await fetchEnvList(project.id)
}

const handleEnvDrawerClose = () => {
  currentProject.value = null
  envTableData.value = []
}

/**
 * 获取当前项目的环境列表
 * @param {Long} projectId - 项目ID
 */
const fetchEnvList = async (projectId) => {
  envTableLoading.value = true
  try {
    envTableData.value = await getEnvironmentListAPI(projectId)
  } catch (error) {
    console.error('获取环境列表失败:', error)
    envTableData.value = []
  } finally {
    envTableLoading.value = false
  }
}

// ========== 新增/编辑环境弹窗 ==========
const envDialogVisible = ref(false)
const envDialogType = ref('add') // 'add' | 'edit'
const envSubmitLoading = ref(false)
const envFormRef = ref(null)

// 当前编辑的环境ID
const editingEnvId = ref(null)

// 环境表单数据，字段与 API 文档 100% 保持一致
const envForm = reactive({
  envName: '',
  baseUrl: '',
  globalHeaders: ''
})

// 环境表单验证规则
const envFormRules = {
  envName: [
    { required: true, message: '请输入环境名称', trigger: 'blur' },
    { max: 50, message: '环境名称不能超过 50 位', trigger: 'blur' }
  ],
  baseUrl: [
    { required: true, message: '请输入根路径', trigger: 'blur' },
    { max: 255, message: '根路径不能超过 255 位', trigger: 'blur' }
  ]
}

/**
 * 打开新增环境弹窗
 * 1. 设置弹窗类型为新增模式
 * 2. 清空编辑环境ID
 * 3. 重置表单数据为空
 * 4. 显示弹窗
 */
const openAddEnvDialog = () => {
  envDialogType.value = 'add'
  editingEnvId.value = null
  envForm.envName = ''
  envForm.baseUrl = ''
  envForm.globalHeaders = ''
  envDialogVisible.value = true
}

/**
 * 打开编辑环境弹窗
 * 1. 设置弹窗类型为编辑模式
 * 2. 记录当前编辑的环境ID
 * 3. 将当前行数据回显到表单中
 * 4. 显示弹窗
 * @param {Object} row - 当前行的环境数据
 */
const openEditEnvDialog = (row) => {
  envDialogType.value = 'edit'
  editingEnvId.value = row.id
  envForm.envName = row.envName
  envForm.baseUrl = row.baseUrl
  envForm.globalHeaders = row.globalHeaders || ''
  envDialogVisible.value = true
}

// 关闭环境弹窗时重置表单
const handleEnvDialogClose = () => {
  envFormRef.value?.resetFields()
}

// 提交新增/编辑环境
const handleEnvSubmit = async () => {
  const valid = await envFormRef.value.validate()
  if (!valid) return

  // 校验 globalHeaders 字段是否为合法的 JSON 格式（如果非空）
  const globalHeadersStr = envForm.globalHeaders.trim()
  if (globalHeadersStr) {
    try {
      JSON.parse(globalHeadersStr)
    } catch (error) {
      ElMessage({
        message: '全局请求头必须是合法的 JSON 格式',
        type: 'error',
        duration: 3000
      })
      return
    }
  }

  envSubmitLoading.value = true
  try {
    // 环境配置始终需要 projectId，新增和更新接口都需要该字段
    const baseData = {
      projectId: currentProject.value.id,
      envName: envForm.envName.trim(),
      baseUrl: envForm.baseUrl.trim(),
      globalHeaders: envForm.globalHeaders.trim() || undefined
    }

    if (envDialogType.value === 'add') {
      // 新增环境：调用创建接口
      await addEnvironmentAPI(baseData)
      ElMessage({ message: '环境创建成功', type: 'success', duration: 2000 })
    } else {
      // 编辑环境：调用更新接口，需要传递环境ID
      await updateEnvironmentAPI({
        id: editingEnvId.value,
        ...baseData
      })
      ElMessage({ message: '环境更新成功', type: 'success', duration: 2000 })
    }
    envDialogVisible.value = false
    // 刷新当前项目的环境列表
    await fetchEnvList(currentProject.value.id)
  } catch (error) {
    console.error('提交环境配置失败:', error)
  } finally {
    envSubmitLoading.value = false
  }
}

// ========== 删除环境 ==========
const handleDeleteEnv = (row) => {
  ElMessageBox.confirm(
    `确定要删除环境「${row.envName}」吗？删除后不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteEnvironmentAPI(row.id)
      ElMessage({ message: '环境已删除', type: 'success', duration: 2000 })
      await fetchEnvList(currentProject.value.id)
    } catch (error) {
      console.error('删除环境失败:', error)
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// ========== 生命周期 ==========
onMounted(() => {
  fetchProjectList()
})
</script>

<style scoped>
.project-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* 搜索表单行内样式 */
.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

/* 分页容器 */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 20px 0 0;
}

/* 空数据占位符 */
.no-data {
  color: #c0c4cc;
}
</style>
