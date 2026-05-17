<template>
  <div class="env-list">
    <!-- 表头：标题 + 新增 -->
    <div class="env-list__head">
      <span class="env-list__title">环境列表</span>
      <el-button type="primary" size="small" :icon="Plus" @click="$emit('add')">新增</el-button>
    </div>

    <!-- 列表 -->
    <div class="env-list__items">
      <div
        v-for="env in environments"
        :key="env.id"
        :class="['env-item', { 'env-item--active': env.id === activeId }]"
        @click="$emit('select', env)"
      >
        <div class="env-item__row1">
          <span :class="['env-tag', `env-tag--${envType(env.envName)}`]">
            {{ envTypeLabel(env.envName) }}
          </span>
          <span class="env-item__name">{{ env.envName }}</span>
        </div>
        <div class="env-item__url">{{ env.baseUrl || '—' }}</div>
        <div class="env-item__foot">
          <span>{{ headerCountText(env.globalHeaders) }}</span>
          <span class="env-item__status">
            <span class="env-item__dot"></span>
            未检测
          </span>
        </div>
      </div>

      <el-empty
        v-if="environments.length === 0"
        description="暂无环境"
        :image-size="60"
        class="env-list__empty"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * 环境列表（左侧 280px）
 * - env tag 按 envName 关键字推导（DEV/TEST/PRE/PROD/ENV），仅展示用，不入库
 * - 状态点统一显示灰色「未检测」，避免误导用户以为已做连通性检测
 * - 变量数 = JSON.parse(globalHeaders) 的 key 数，解析失败显示 "格式异常"
 */
import { Plus } from '@element-plus/icons-vue'

defineProps({
  environments: { type: Array, default: () => [] },
  activeId: { type: [Number, String, null], default: null }
})

defineEmits(['add', 'select'])

// ========== env tag 推导 ==========
function envType(name = '') {
  const n = String(name).toLowerCase()
  if (n.includes('prod') || name.includes('生产')) return 'prod'
  if (n.includes('pre') || n.includes('staging')) return 'pre'
  if (n.includes('test') || name.includes('测试')) return 'test'
  if (n.includes('dev') || name.includes('开发')) return 'dev'
  return 'other'
}
function envTypeLabel(name) {
  const map = { dev: 'DEV', test: 'TEST', pre: 'PRE', prod: 'PROD', other: 'ENV' }
  return map[envType(name)]
}

// ========== 全局请求头数量统计 ==========
function headerCountText(globalHeaders) {
  if (!globalHeaders) return '0 个请求头'
  try {
    const obj = JSON.parse(globalHeaders)
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      return `${Object.keys(obj).length} 个请求头`
    }
    return '格式异常'
  } catch (e) {
    return '格式异常'
  }
}
</script>

<style scoped>
.env-list {
  background: var(--et-bg-card);
  border: 1px solid var(--et-border-card);
  border-radius: var(--et-radius-card);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* 表头 */
.env-list__head {
  padding: 12px 14px;
  border-bottom: 1px solid var(--et-border-card);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.env-list__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--et-text-1);
}

/* 列表区 */
.env-list__items {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.env-list__empty {
  padding: 32px 0;
}

/* 单个条目 */
.env-item {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s;
}
.env-item:hover {
  background: var(--et-bg-hover);
}
.env-item--active {
  background: var(--et-bg-active);
  border-color: var(--et-border-active);
}
.env-item__row1 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.env-item__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--et-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.env-item--active .env-item__name {
  color: var(--et-primary);
}
.env-item__url {
  font-size: 11px;
  color: var(--et-text-4);
  font-family: var(--et-font-mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.env-item__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: var(--et-text-4);
}
.env-item__status {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--et-text-4);
}
.env-item__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c0c4cc; /* 灰色：未检测 */
}

/* env tag */
.env-tag {
  height: 18px;
  line-height: 16px;
  padding: 0 6px;
  border-radius: 3px;
  font-size: 10px;
  border: 1px solid;
  font-weight: 500;
}
.env-tag--dev   { color: #409eff; background: #ecf5ff; border-color: #b3d8ff; }
.env-tag--test  { color: #67c23a; background: #f0f9eb; border-color: #c2e7b0; }
.env-tag--pre   { color: #e6a23c; background: #fdf6ec; border-color: #f5dab1; }
.env-tag--prod  { color: #f56c6c; background: #fef0f0; border-color: #fbc4c4; }
.env-tag--other { color: #909399; background: #f4f4f5; border-color: #d3d4d6; }
</style>
