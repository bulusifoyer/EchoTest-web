<template>
  <div class="proj-card">
    <!-- 头部：图标块 + 名称/描述 + 操作菜单 -->
    <div class="pc-head">
      <div :class="['pc-icon', `pc-icon--c${colorIndex}`]">
        {{ initial }}
      </div>
      <div class="pc-title">
        <div class="pc-title__name">{{ project.name }}</div>
        <div class="pc-title__desc">{{ project.description || '暂无描述' }}</div>
      </div>
      <el-dropdown trigger="click" @command="onCommand">
        <span class="pc-more" @click.stop>
          <el-icon><MoreFilled /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="env">环境管理</el-dropdown-item>
            <el-dropdown-item command="api">接口管理</el-dropdown-item>
            <el-dropdown-item command="case">用例管理</el-dropdown-item>
            <el-dropdown-item divided command="edit">编辑项目</el-dropdown-item>
            <el-dropdown-item command="delete">
              <span class="pc-more__danger">删除项目</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 统计区：MVP 占位 — -->
    <div class="pc-stats">
      <div class="pc-stat">
        <div class="pc-stat__num" :title="statTooltip">—</div>
        <div class="pc-stat__lbl">接口数</div>
      </div>
      <div class="pc-stat">
        <div class="pc-stat__num" :title="statTooltip">—</div>
        <div class="pc-stat__lbl">用例数</div>
      </div>
      <div class="pc-stat">
        <div class="pc-stat__num" :title="statTooltip">—</div>
        <div class="pc-stat__lbl">通过率</div>
      </div>
    </div>

    <!-- 底部：更新时间 -->
    <div class="pc-foot">
      <span class="pc-foot__status">
        <span class="pc-foot__dot"></span>
        更新于 {{ relativeTime(project.updateTime) }}
      </span>
    </div>
  </div>
</template>

<script setup>
/**
 * 项目卡片组件
 * 视觉对照 docs/screenshots/html/project_management.html
 * MVP：统计字段以 — 占位，等 M3 执行报告完成后再回填真实数据
 */
import { computed } from 'vue'
import { MoreFilled } from '@element-plus/icons-vue'
import { relativeTime } from '@/utils/format'

const props = defineProps({
  project: { type: Object, required: true }
})

const emit = defineEmits(['edit', 'delete', 'open-env', 'open-api', 'open-case'])

// 图标块颜色：按 id % 6 映射 c1~c6（与截图一致）
const colorIndex = computed(() => {
  const id = Number(props.project?.id) || 0
  return (id % 6) + 1
})

// 图标块文字：取项目名首字母（中文取首字）
const initial = computed(() => {
  const name = props.project?.name || ''
  return name.charAt(0).toUpperCase()
})

const statTooltip = '执行报告功能上线后自动统计'

const onCommand = (cmd) => {
  switch (cmd) {
    case 'env':    emit('open-env', props.project); break
    case 'api':    emit('open-api', props.project); break
    case 'case':   emit('open-case', props.project); break
    case 'edit':   emit('edit', props.project); break
    case 'delete': emit('delete', props.project); break
  }
}
</script>

<style scoped>
.proj-card {
  background: var(--et-bg-card);
  border: 1px solid var(--et-border-card);
  border-radius: 8px;
  padding: 18px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.proj-card:hover {
  border-color: var(--et-primary);
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

/* 头部 */
.pc-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}
.pc-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}
.pc-icon--c1 { background: linear-gradient(135deg, #409eff, #66b1ff); }
.pc-icon--c2 { background: linear-gradient(135deg, #67c23a, #95d475); }
.pc-icon--c3 { background: linear-gradient(135deg, #e6a23c, #eebe77); }
.pc-icon--c4 { background: linear-gradient(135deg, #f56c6c, #f89898); }
.pc-icon--c5 { background: linear-gradient(135deg, #909399, #b1b3b8); }
.pc-icon--c6 { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }

.pc-title {
  flex: 1;
  min-width: 0;
}
.pc-title__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--et-text-2);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pc-title__desc {
  font-size: 12px;
  color: var(--et-text-4);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 36px;
}

.pc-more {
  color: var(--et-text-5);
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  outline: none;
}
.pc-more:hover {
  color: var(--et-text-3);
}
.pc-more__danger {
  color: var(--et-danger);
}

/* 统计 */
.pc-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px 0;
  border-top: 1px dashed var(--et-border-card);
  border-bottom: 1px dashed var(--et-border-card);
}
.pc-stat {
  text-align: center;
}
.pc-stat__num {
  font-size: 18px;
  font-weight: 600;
  color: var(--et-text-4);
  line-height: 1.2;
}
.pc-stat__lbl {
  font-size: 11px;
  color: var(--et-text-4);
  margin-top: 2px;
}

/* 底部 */
.pc-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 12px;
  font-size: 12px;
  color: var(--et-text-4);
}
.pc-foot__status {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--et-success);
}
.pc-foot__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--et-success);
}
</style>
