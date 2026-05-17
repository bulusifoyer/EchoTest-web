<template>
  <div class="layout-root">
    <!-- ========== 顶栏 ========== -->
    <header class="layout-header">
      <div class="layout-header__title">分层自动化接口测试平台</div>

      <!-- 中部：当前项目（仅项目内页面显示） -->
      <div class="layout-header__center">
        <div
          v-if="showCurrentProject"
          class="ws-chip"
        >
          <el-icon class="ws-chip__icon"><FolderOpened /></el-icon>
          <span class="ws-chip__label">当前项目</span>
          <span class="ws-chip__name">{{ projectStore.currentProjectName || '#' + projectStore.currentProjectId }}</span>
          <el-button
            type="primary"
            link
            size="small"
            @click="onSwitchProject"
          >
            切换项目
          </el-button>
        </div>
      </div>

      <div class="layout-header__user">
        <el-dropdown @command="handleCommand">
          <span class="user-trigger">
            <el-avatar :size="28" class="user-trigger__avatar">{{ usernameInitial }}</el-avatar>
            <span class="user-trigger__name">{{ usernameDisplay }}</span>
            <el-icon class="user-trigger__caret"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- ========== 主体（侧栏 + 内容） ========== -->
    <div class="layout-body">
      <!-- 侧栏 -->
      <aside class="layout-aside">
        <el-menu
          :default-active="activeMenu"
          class="layout-menu"
          router
        >
          <el-menu-item
            v-for="item in menuItems"
            :key="item.path"
            :index="item.path"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.label }}</template>
          </el-menu-item>
        </el-menu>
      </aside>

      <!-- 主内容 -->
      <main class="layout-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
/**
 * 主布局组件
 * 阶段 3.5：顶栏中部增加"当前项目 · 切换项目"chip；项目内菜单的"无项目"
 *           拦截已由 router 守卫统一处理（meta.requireProject），此处不重复。
 */

import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowDown,
  HomeFilled,
  FolderOpened,
  Connection,
  Link,
  Document,
  VideoPlay,
  DataAnalysis
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { useProjectStore } from '@/store/project'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const projectStore = useProjectStore()

// 当前激活菜单（按当前路径前缀匹配，支持二级路由高亮父菜单）
const activeMenu = computed(() => {
  const path = route.path
  const match = menuItems.find((m) => path === m.path || path.startsWith(m.path + '/'))
  return match ? match.path : path
})

const usernameDisplay = computed(() => userStore.userInfo?.username || '用户')
const usernameInitial = computed(() => (usernameDisplay.value || '?').charAt(0).toUpperCase())

// "当前项目"chip 的显示规则：
//   - 已选项目（store 有 currentProject）
//   - 当前路径不是项目管理（避免在项目选择页干扰）
const showCurrentProject = computed(() => {
  if (!projectStore.hasCurrentProject) return false
  return route.path !== '/project'
})

// 菜单 ↔ 路由映射，对照参考截图顺序
const menuItems = [
  { path: '/dashboard', label: '首页', icon: HomeFilled },
  { path: '/project', label: '项目管理', icon: FolderOpened },
  { path: '/environment', label: '环境管理', icon: Connection },
  { path: '/api', label: '接口管理', icon: Link },
  { path: '/case', label: '用例管理', icon: Document },
  { path: '/execution', label: '任务执行', icon: VideoPlay },
  { path: '/report', label: '测试报告', icon: DataAnalysis }
]

function onSwitchProject() {
  router.push('/project')
}

const handleCommand = (command) => {
  if (command === 'logout') {
    handleLogout()
  } else if (command === 'profile') {
    ElMessage.info('个人中心待开发')
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      userStore.logout()
      projectStore.clearCurrentProject()
      ElMessage.success('已退出登录')
      router.push('/login')
    })
    .catch(() => {})
}
</script>

<style scoped>
.layout-root {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--et-bg-card);
}

/* ========== 顶栏 ========== */
.layout-header {
  height: var(--et-header-h);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: var(--et-bg-card);
  border-bottom: 1px solid var(--et-border-card);
  gap: 16px;
}
.layout-header__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--et-text-1);
  flex-shrink: 0;
}

/* 中部：当前项目 chip */
.layout-header__center {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-left: 24px;
  min-width: 0;
}
.ws-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  background: var(--et-bg-active);
  border: 1px solid var(--et-border-active);
  border-radius: 16px;
  color: var(--et-primary);
  font-size: 13px;
  max-width: 100%;
  overflow: hidden;
}
.ws-chip__icon {
  font-size: 14px;
  flex-shrink: 0;
}
.ws-chip__label {
  color: var(--et-text-4);
  font-size: 12px;
  flex-shrink: 0;
}
.ws-chip__name {
  font-weight: 500;
  color: var(--et-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 220px;
}

.layout-header__user {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--et-text-3);
  font-size: 14px;
  outline: none;
}
.user-trigger__avatar {
  background: #d3d6db;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
}
.user-trigger__name {
  color: var(--et-text-3);
}
.user-trigger__caret {
  color: var(--et-text-5);
  font-size: 12px;
}

/* ========== 主体 ========== */
.layout-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* ========== 侧栏 ========== */
.layout-aside {
  width: var(--et-aside-w);
  flex-shrink: 0;
  background: var(--et-bg-card);
  border-right: 1px solid var(--et-border-card);
  padding: 12px 8px;
  overflow-y: auto;
}

/* ========== 主内容 ========== */
.layout-main {
  flex: 1;
  padding: var(--et-pad-content);
  background: var(--et-bg-page);
  overflow: auto;
  min-height: 0;
}
</style>

<!-- 非 scoped：定制 Element Plus 菜单选中样式（截图一致） -->
<style>
.layout-menu.el-menu {
  background: transparent;
  border-right: none;
}
.layout-menu.el-menu .el-menu-item {
  height: var(--et-menu-h);
  line-height: var(--et-menu-h);
  padding: 0 14px !important;
  margin-bottom: 4px;
  border-radius: 6px;
  color: var(--et-text-3);
  font-size: 14px;
}
.layout-menu.el-menu .el-menu-item .el-icon {
  font-size: 16px;
  opacity: 0.75;
  margin-right: 10px;
}
.layout-menu.el-menu .el-menu-item:hover {
  background: var(--et-bg-hover);
  color: var(--et-text-2);
}
.layout-menu.el-menu .el-menu-item.is-active {
  background: var(--et-bg-active);
  color: var(--et-primary);
}
.layout-menu.el-menu .el-menu-item.is-active .el-icon {
  opacity: 1;
  color: var(--et-primary);
}
</style>
