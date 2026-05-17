<template>
  <div class="side-context">
    <!-- 运行环境（只读） -->
    <div class="side-block">
      <div class="side-block__title">运行环境</div>
      <el-select
        v-if="environments.length > 0"
        :model-value="selectedEnvId"
        placeholder="选择环境（M3 后用于执行）"
        class="side-block__env-select"
        :disabled="environments.length === 0"
        size="small"
        @update:model-value="$emit('update:selectedEnvId', $event)"
      >
        <el-option
          v-for="env in environments"
          :key="env.id"
          :value="env.id"
          :label="`${env.envName} · ${env.baseUrl}`"
        />
      </el-select>
      <div v-else class="side-block__hint">
        当前项目暂无环境，可在
        <el-link type="primary" :underline="false" @click="goEnv">环境管理</el-link>
        创建。
      </div>
      <div v-if="selectedEnv" class="side-block__url et-mono">
        base_url: {{ selectedEnv.baseUrl }}
      </div>
    </div>

    <!-- 上下文变量（占位） -->
    <div class="side-block">
      <div class="side-block__title">上下文变量预览</div>
      <div class="ctx-empty">
        <el-icon class="ctx-empty__icon"><InfoFilled /></el-icon>
        <span>用例执行后将在此展示运行时变量。</span>
      </div>
    </div>

    <!-- 通用断言模板 -->
    <div class="side-block">
      <div class="side-block__title">通用断言模板</div>
      <div class="tpl-list">
        <div
          v-for="tpl in templates"
          :key="tpl.label"
          :class="['tpl-row', { 'tpl-row--disabled': tpl.disabled }]"
          :title="tpl.disabled ? '执行引擎完成后启用' : '点击插入到当前选中步骤'"
          @click="onPick(tpl)"
        >
          <el-icon class="tpl-row__icon">
            <CircleCheck v-if="!tpl.disabled" />
            <Lock v-else />
          </el-icon>
          <span class="tpl-row__label">{{ tpl.label }}</span>
        </div>
      </div>
      <div class="muted side-block__hint">
        点击模板会追加到当前展开步骤的断言列表。
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 编辑器右侧边栏
 *  - 运行环境：纯展示 + 选中（实际执行在 M3，后端目前不会接收 envId）
 *  - 上下文变量：M3 之后才有数据，先占位
 *  - 通用断言模板：点击 emit('pick-assertion', tplObj)，由编辑器插到"当前展开步骤"
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { InfoFilled, CircleCheck, Lock } from '@element-plus/icons-vue'

const props = defineProps({
  environments: { type: Array, default: () => [] },
  selectedEnvId: { type: [Number, null], default: null },
  projectId: { type: [Number, String, null], default: null }
})

const emit = defineEmits(['update:selectedEnvId', 'pick-assertion'])

const router = useRouter()

const selectedEnv = computed(() => {
  return props.environments.find((e) => e.id === props.selectedEnvId) || null
})

// 通用断言模板（disabled 项暂不可点）
const templates = [
  {
    label: 'HTTP 状态码 == 200',
    disabled: false,
    payload: {
      assertType: 'STATUS_CODE',
      expression: '',
      operator: 'EQUALS',
      expectedValue: '200'
    }
  },
  {
    label: '响应 JSON $.code == 0',
    disabled: false,
    payload: {
      assertType: 'JSON_PATH',
      expression: '$.code',
      operator: 'EQUALS',
      expectedValue: '0'
    }
  },
  {
    label: '响应包含 success',
    disabled: false,
    payload: {
      assertType: 'JSON_PATH',
      expression: '$',
      operator: 'CONTAINS',
      expectedValue: 'success'
    }
  },
  {
    label: '响应耗时 < 2000 ms（M3 后启用）',
    disabled: true,
    payload: null
  }
]

function onPick(tpl) {
  if (tpl.disabled) {
    ElMessage.info('该断言模板需要执行引擎支持，将在 M3 完成后启用')
    return
  }
  emit('pick-assertion', { ...tpl.payload })
}

function goEnv() {
  router.push({ path: '/environment', query: { projectId: props.projectId } })
}
</script>

<style scoped>
.side-context {
  background: var(--et-bg-card);
  border: 1px solid var(--et-border-card);
  border-radius: var(--et-radius-card);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.side-block__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--et-text-2);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.side-block__title::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 13px;
  background: var(--et-primary);
  border-radius: 2px;
}
.side-block__env-select { width: 100%; }
.side-block__url {
  font-size: 12px;
  color: var(--et-text-4);
  margin-top: 8px;
  word-break: break-all;
}
.side-block__hint {
  font-size: 12px;
  color: var(--et-text-4);
  margin-top: 6px;
}

/* 上下文变量占位 */
.ctx-empty {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  background: var(--et-bg-hover);
  border: 1px dashed var(--et-border-card);
  border-radius: 4px;
  font-size: 12px;
  color: var(--et-text-4);
}
.ctx-empty__icon {
  font-size: 14px;
}

/* 模板列表 */
.tpl-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.tpl-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--et-border-card);
  border-radius: 4px;
  font-size: 12px;
  color: var(--et-text-2);
  cursor: pointer;
  background: var(--et-bg-card);
  transition: border-color 0.12s, background 0.12s;
}
.tpl-row:hover:not(.tpl-row--disabled) {
  border-color: var(--et-primary);
  background: var(--et-bg-active);
}
.tpl-row__icon {
  font-size: 14px;
  color: var(--et-success);
}
.tpl-row--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.tpl-row--disabled .tpl-row__icon {
  color: var(--et-text-4);
}
.muted { color: var(--et-text-4); }
</style>
