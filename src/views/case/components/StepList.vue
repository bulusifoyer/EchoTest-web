<template>
  <div class="step-list">
    <div class="step-list__head">
      <span class="step-list__title">
        测试步骤
        <span class="muted">（共 {{ steps.length }} 步）</span>
      </span>
      <span class="muted hint">支持拖拽序号或点击 ↑↓ 调整顺序</span>
    </div>

    <div class="step-list__body">
      <StepCard
        v-for="(step, idx) in steps"
        :key="step._frontendId"
        :step="step"
        :index="idx"
        :api-info="apiMap[step.apiId]"
        :expanded="idx === expandedIndex"
        :can-move-up="idx > 0"
        :can-move-down="idx < steps.length - 1"
        @update="onUpdate"
        @remove="onRemove"
        @move-up="onMoveUp"
        @move-down="onMoveDown"
        @change-api="onChangeApi"
        @select="onSelect"
        @dragstart="onDragStart"
        @dragover="onDragOver"
        @drop="onDrop"
        @dragend="onDragEnd"
      />

      <div class="add-step" @click="onAddStep">
        <el-icon><Plus /></el-icon>
        添加测试步骤（从接口库选择）
      </div>

      <div v-if="steps.length === 0" class="step-list__empty">
        用例至少需要一个步骤；点击上方「添加测试步骤」开始
      </div>
    </div>

    <!-- 接口选择对话框 -->
    <el-dialog
      v-model="apiPickerVisible"
      :title="apiPickerMode === 'add' ? '选择接口添加为新步骤' : '更换当前步骤的接口'"
      width="640px"
    >
      <el-input
        v-model="apiKeyword"
        :prefix-icon="Search"
        placeholder="搜索接口名称或路径"
        size="small"
        clearable
        class="api-picker__search"
      />

      <div class="api-picker__list">
        <div
          v-for="api in filteredApis"
          :key="api.id"
          class="api-picker__item"
          @click="confirmPickApi(api)"
        >
          <span :class="['method-tag', `method-tag--${methodClass(api.method)}`]">
            {{ shortMethod(api.method) }}
          </span>
          <span class="api-picker__name">{{ api.name }}</span>
          <span class="api-picker__path et-mono">{{ api.path }}</span>
        </div>
        <el-empty
          v-if="filteredApis.length === 0"
          :image-size="60"
          description="未找到匹配的接口"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 步骤列表（双向绑定 steps 数组）
 * - 接口选择对话框 add / change 两种模式共用
 * - dnd：基于 dragstart 记录起点 index，drop 时按 splice 重排
 * - 通过 expandedIndex 让父编辑器/边栏知道"当前选中步骤"
 */
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

import StepCard from './StepCard.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] }, // steps
  apis: { type: Array, default: () => [] },        // 该项目下所有接口（用于选择）
  expandedIndex: { type: Number, default: -1 }
})

const emit = defineEmits([
  'update:modelValue',
  'update:expandedIndex'
])

const steps = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

// apiId → apiInfo 映射，传给 StepCard 展示 method/path/name
const apiMap = computed(() => {
  const map = {}
  for (const a of props.apis) map[a.id] = a
  return map
})

// 简单的 frontendId 生成（Vue v-for key 用）
function genId() {
  return 'fid_' + Math.random().toString(36).slice(2, 10)
}

function newEmptyStep(apiId) {
  return {
    _frontendId: genId(),
    apiId: apiId || null,
    stepName: '',
    overrideRequestBody: '',
    extracts: [],
    assertions: []
  }
}

// ========== 步骤增删改 ==========
function onUpdate(idx, patch) {
  const next = [...steps.value]
  next[idx] = { ...next[idx], ...patch }
  emit('update:modelValue', next)
}

function onRemove(idx) {
  const next = [...steps.value]
  next.splice(idx, 1)
  emit('update:modelValue', next)
  // 收缩 expandedIndex
  if (props.expandedIndex === idx) {
    emit('update:expandedIndex', -1)
  } else if (props.expandedIndex > idx) {
    emit('update:expandedIndex', props.expandedIndex - 1)
  }
}

function onMoveUp(idx) {
  if (idx <= 0) return
  swap(idx - 1, idx)
}
function onMoveDown(idx) {
  if (idx >= steps.value.length - 1) return
  swap(idx, idx + 1)
}
function swap(i, j) {
  const next = [...steps.value]
  ;[next[i], next[j]] = [next[j], next[i]]
  emit('update:modelValue', next)
  // 同步 expandedIndex
  const e = props.expandedIndex
  if (e === i) emit('update:expandedIndex', j)
  else if (e === j) emit('update:expandedIndex', i)
}

function onSelect(idx) {
  // 切换展开：再点同一步则折叠
  emit('update:expandedIndex', props.expandedIndex === idx ? -1 : idx)
}

// ========== dnd ==========
let dragFromIndex = -1

function onDragStart(idx) {
  dragFromIndex = idx
}
function onDragOver(/* idx */) {
  // 仅允许 drop（在 StepCard 上已 prevent default）
}
function onDrop(targetIdx) {
  if (dragFromIndex < 0 || dragFromIndex === targetIdx) return
  const next = [...steps.value]
  const [moving] = next.splice(dragFromIndex, 1)
  next.splice(targetIdx, 0, moving)
  emit('update:modelValue', next)

  // 同步 expandedIndex
  const e = props.expandedIndex
  if (e === dragFromIndex) {
    emit('update:expandedIndex', targetIdx)
  } else if (dragFromIndex < e && e <= targetIdx) {
    emit('update:expandedIndex', e - 1)
  } else if (targetIdx <= e && e < dragFromIndex) {
    emit('update:expandedIndex', e + 1)
  }
  dragFromIndex = -1
}
function onDragEnd() {
  dragFromIndex = -1
}

// ========== 接口选择对话框 ==========
const apiPickerVisible = ref(false)
const apiPickerMode = ref('add') // 'add' | 'change'
const apiPickerTargetIndex = ref(-1)
const apiKeyword = ref('')

const filteredApis = computed(() => {
  const kw = apiKeyword.value.trim().toLowerCase()
  if (!kw) return props.apis
  return props.apis.filter((a) =>
    (a.name || '').toLowerCase().includes(kw) ||
    (a.path || '').toLowerCase().includes(kw)
  )
})

function onAddStep() {
  if (props.apis.length === 0) {
    ElMessage.warning('该项目下还没有接口，请先到接口管理创建接口')
    return
  }
  apiPickerMode.value = 'add'
  apiPickerTargetIndex.value = -1
  apiKeyword.value = ''
  apiPickerVisible.value = true
}

function onChangeApi(idx) {
  if (props.apis.length === 0) {
    ElMessage.warning('该项目下还没有接口')
    return
  }
  apiPickerMode.value = 'change'
  apiPickerTargetIndex.value = idx
  apiKeyword.value = ''
  apiPickerVisible.value = true
}

function confirmPickApi(api) {
  if (apiPickerMode.value === 'add') {
    const next = [...steps.value, newEmptyStep(api.id)]
    emit('update:modelValue', next)
    // 默认展开新增的最后一步
    emit('update:expandedIndex', next.length - 1)
  } else {
    const idx = apiPickerTargetIndex.value
    if (idx >= 0) {
      onUpdate(idx, { apiId: api.id })
    }
  }
  apiPickerVisible.value = false
}

// method 工具
function shortMethod(m) {
  const u = (m || '').toUpperCase()
  return u === 'DELETE' ? 'DEL' : u
}
function methodClass(m) {
  const u = (m || '').toUpperCase()
  if (u === 'GET') return 'get'
  if (u === 'POST') return 'post'
  if (u === 'PUT') return 'put'
  if (u === 'DELETE') return 'del'
  if (u === 'PATCH') return 'patch'
  return 'other'
}
</script>

<style scoped>
.step-list {
  background: var(--et-bg-card);
  border: 1px solid var(--et-border-card);
  border-radius: var(--et-radius-card);
  padding: 18px 20px;
}

.step-list__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}
.step-list__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--et-text-1);
}
.muted { color: var(--et-text-4); font-weight: normal; font-size: 12px; }
.hint { font-size: 12px; }

.step-list__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.add-step {
  padding: 14px;
  border: 1px dashed var(--et-text-5);
  border-radius: var(--et-radius-card);
  text-align: center;
  color: var(--et-primary);
  font-size: 13px;
  cursor: pointer;
  background: var(--et-bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.add-step:hover {
  border-color: var(--et-primary);
  background: var(--et-bg-active);
}

.step-list__empty {
  text-align: center;
  font-size: 12px;
  color: var(--et-text-4);
  padding: 8px 0;
}

/* 接口选择对话框 */
.api-picker__search {
  margin-bottom: 12px;
}
.api-picker__list {
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid var(--et-border-card);
  border-radius: 4px;
}
.api-picker__item {
  display: grid;
  grid-template-columns: 60px 1fr 1.5fr;
  gap: 10px;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--et-border-soft);
  cursor: pointer;
  font-size: 13px;
}
.api-picker__item:last-child { border-bottom: none; }
.api-picker__item:hover { background: var(--et-bg-hover); }
.api-picker__name {
  color: var(--et-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.api-picker__path {
  color: var(--et-text-3);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* method tag */
.method-tag {
  display: inline-block;
  height: 18px;
  line-height: 16px;
  padding: 0 6px;
  border-radius: 3px;
  font-size: 10px;
  border: 1px solid;
  font-weight: 600;
  text-align: center;
}
.method-tag--get   { color: #409eff; background: #ecf5ff; border-color: #b3d8ff; }
.method-tag--post  { color: #67c23a; background: #f0f9eb; border-color: #c2e7b0; }
.method-tag--put   { color: #e6a23c; background: #fdf6ec; border-color: #f5dab1; }
.method-tag--del   { color: #f56c6c; background: #fef0f0; border-color: #fbc4c4; }
.method-tag--patch { color: #8b5cf6; background: #f3e5f5; border-color: #d1c4e9; }
.method-tag--other { color: #909399; background: #f4f4f5; border-color: #d3d4d6; }
</style>
