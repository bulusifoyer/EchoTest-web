<template>
  <div class="welcome-container">
    <div class="welcome-card">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <h2>欢迎回来！</h2>
          </div>
        </template>

        <div class="welcome-content">
          <p>欢迎使用分层自动化接口测试平台。这是一个专业的接口测试解决方案，提供全面的测试管理功能。</p>

          <div class="quick-actions">
            <h3>快捷操作</h3>
            <div class="action-buttons">
              <el-button type="primary" icon="Plus" @click="createTest">创建测试用例</el-button>
              <el-button type="success" icon="PlayCircle" @click="runTest">执行测试</el-button>
              <el-button type="info" icon="Document" @click="viewReports">查看报告</el-button>
            </div>
          </div>

          <div class="recent-activity">
            <h3>最近活动</h3>
            <el-empty description="暂无最近活动" v-if="!recentActivities.length" />
            <ul v-else class="activity-list">
              <li v-for="activity in recentActivities" :key="activity.id">
                {{ activity.text }}
              </li>
            </ul>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
/**
 * 首页仪表盘组件
 * 登录成功后默认展示的欢迎页面
 */

import { ref } from 'vue'
import { ElMessage } from 'element-plus'

// 最近活动数据（示例）
const recentActivities = ref([])

// 快捷操作函数
const createTest = () => {
  ElMessage.info('创建测试用例功能开发中...')
}

const runTest = () => {
  ElMessage.info('执行测试功能开发中...')
}

const viewReports = () => {
  ElMessage.info('查看报告功能开发中...')
}
</script>

<style scoped>
.welcome-container {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.welcome-content {
  padding: 20px 0;
}

.welcome-content > p {
  margin-bottom: 30px;
  font-size: 16px;
  color: #606266;
  line-height: 1.6;
}

.quick-actions {
  margin-bottom: 40px;
}

.quick-actions h3 {
  margin-bottom: 16px;
  font-size: 18px;
  color: #303133;
}

.action-buttons {
  display: flex;
  gap: 16px;
}

.recent-activity h3 {
  margin-bottom: 16px;
  font-size: 18px;
  color: #303133;
}

.activity-list {
  list-style: none;
  padding: 0;
}

.activity-list li {
  padding: 8px 0;
  border-bottom: 1px solid #e4e7ed;
  color: #606266;
}

.activity-list li:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons .el-button {
    width: 100%;
  }
}
</style>
