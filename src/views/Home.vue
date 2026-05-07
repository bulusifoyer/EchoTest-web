<template>
  <div class="layout-container">
    <!-- ========== 顶部导航栏 ========== -->
    <el-header class="layout-header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-text">分层自动化接口测试平台</span>
        </div>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="32" :src="userStore.userInfo.avatar || ''" />
              <span class="username">{{ userStore.userInfo.username || '用户' }}</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="settings">系统设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <!-- ========== 主体区域（侧边栏 + 内容区） ========== -->
    <div class="layout-body">
      <!-- 侧边栏导航 -->
      <el-aside class="layout-aside" width="220px">
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          router
          :collapse="false"
        >
          <el-menu-item index="/dashboard">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/project">
            <el-icon><FolderOpened /></el-icon>
            <span>项目管理</span>
          </el-menu-item>
          <!-- 后续模块入口在此处扩展 -->
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </div>
  </div>
</template>

<script setup>
/**
 * 主布局组件
 * 提供顶部导航栏 + 侧边栏菜单 + 路由内容区的基本布局结构
 */

import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, HomeFilled, FolderOpened } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 当前激活的菜单项，根据路由路径高亮
const activeMenu = computed(() => route.path)

// 下拉菜单命令处理
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    ElMessage({
      message: '已退出登录',
      type: 'success',
      duration: 2000
    })
    router.push('/login')
  }).catch(() => {
    // 用户取消退出
  })
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

/* 顶部导航栏 */
.layout-header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  padding: 0;
  height: 60px;
  flex-shrink: 0;
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.user-dropdown:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #303133;
}

/* 主体区域 */
.layout-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 侧边栏 */
.layout-aside {
  background: white;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
}

.sidebar-menu {
  border-right: none;
}

/* 主内容区 */
.layout-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f5f7fa;
}
</style>
