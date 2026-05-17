<template>
  <div
    :class="['step-card', { 'step-card--expanded': expanded, 'step-card--dragging': dragging }]"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @dragover.prevent="$emit('dragover', index)"
    @drop.prevent="$emit('drop', index)"
    @click="onCardClick"
  >
    <!-- 拖拽 handle + 序号 -->
    <div class="step-card__index" :title="'拖动 / 点击展开'">
      {{ index + 1 }}
    </div>

    <!-- 主体 -->
    <div class="step-card__body" @click.stop>
      <!-- row1：method + name + path + actions -->
      <div class="step-card__row1" @click="toggleExpanded">
        <span :class="['method-tag', `method-tag--${methodClass}`]">{{ shortMethod }}</span>
        <span class="step-card__name">{{ stepDisplayName }}</span>
        <span class="step-card__url et-mono">{{ apiPath || '请选择接口' }}</span>
        <div class="step-card__actions" @click.stop>
          <el-tooltip content="上移" placement="top">
            <el-button link size="small" :icon="ArrowUp" :disabled="!canMoveUp" @click="$emit('move-up', index)" />
          </el-tooltip>
          <el-tooltip content="下移" placement="top">
            <el-button link size="small" :icon="ArrowDown" :disabled="!canMoveDown" @click="$emit('move-down', index)" />
          </el-tooltip>
          <el-tooltip content="删除步骤" placement="top">
            <el-button link size="small" type="danger" :icon="Close" @click="$emit('remove', index)" />
          </el-tooltip>
        </div>
      </div>

      <!-- row2 折叠预览（未展开时） -->
      <div v-if="!expanded" class="step-card__preview">
        <div class="preview-cell">
          <div class="lbl">变量提取</div>
          <div class="v">{{ extractsPreview }}</div>
        </div>
        <div class="preview-cell">
          <div class="lbl">断言</div>
          <div class="v">{{ assertionsPreview }}</div>
        </div>
        <div class="preview-cell">
          <div class="lbl">覆盖请求体</div>
          <div class="v et-mono">{{ overridePreview }}</div>
        </div>
      </div>

      <!-- 展开区 -->
      <div v-else class="step-card__expand" @click.stop>
        <!-- 步骤别名 -->
        <div class="form-row">
          <span class="lab">步骤别名</span>
          <el-input
            :model-value="step.stepName"
            placeholder="选填，便于识别该步骤；留空时显示接口名"
            maxlength="100"
            size="small"
            class="form-row__input"
            @update:model-value="onUpdate('stepName', $event)"
          />
        </div>

        <!-- 接口（只显示，提供"换接口"按钮交给父组件处理） -->
        <div class="form-row">
          <span class="lab">引用接口</span>
          <span class="form-row__api et-mono">
            <span :class="['method-tag', `method-tag--${methodClass}`]">{{ shortMethod }}</span>
            {{ apiPath || '尚未选择' }}
            <span class="form-row__api-name">{{ apiName ? `(${apiName})` : '' }}</span>
          </span>
          <el-button link type="primary" size="small" @click="$emit('change-api', index)">
            更换
          </el-button>
        </div>

        <!-- 覆盖请求体 -->
        <div class="form-row form-row--align-top">
          <span class="lab">覆盖请求体</span>
          <el-input
            :model-value="step.overrideRequestBody"
            type="textarea"
            :rows="4"
            placeholder='留空使用接口定义的请求体；支持 ${var} 占位（M3 才解析）'
            class="form-row__textarea et-mono"
            @update:model-value="onUpdate('overrideRequestBody', $event)"
          />
        </div>

        <!-- 变量提取 -->
        <div class="form-section">
          <div class="form-section__title">变量提取（响应中提取后续步骤可引用的变量）</div>
          <ExtractEditor
            :model-value="step.extracts"
            @update:model-value="onUpdate('extracts', $event)"
          />
        </div>

        <!-- 断言 -->
        <div class="form-section">
          <div class="form-section__title">断言</div>
          <AssertionEditor
            :model-value="step.assertions"
            @update:model-value="onUpdate('assertions', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 单步骤卡片
 * - 折叠/展开切换；展开后才显示完整编辑区
 * - 通过 emit('select') 通知父组件"当前选中步骤"，便于通用断言模板插入到正确位置
 * - dnd：dragstart/dragover/drop 由父 StepList 接收，组合排序
 */
import { computed, ref } from 'vue'
import { ArrowUp, ArrowDown, Close } from '@element-plus/icons-vue'
import ExtractEditor from './ExtractEditor.vue'
import AssertionEditor from './AssertionEditor.vue'

const props = defineProps({
  step: { type: Object, required: true },
  index: { type: Number, required: true },
  apiInfo: { type: Object, default: null }, // 由父组件根据 apiId 查 apiMap 后传入
  expanded: { type: Boolean, default: false },
  canMoveUp: { type: Boolean, default: true },
  canMoveDown: { type: Boolean, default: true }
})

const emit = defineEmits([
  'update',           // (index, patch)
  'remove',           // (index)
  'move-up',          // (index)
  'move-down',        // (index)
  'change-api',       // (index)
  'select',           // (index)  → 父组件记录"当前选中步骤"
  'dragover',         // (index)
  'drop',             // (index)
  'dragstart',        // (index)
  'dragend'
])

// ========== 接口展示信息 ==========
const apiPath = computed(() => props.apiInfo?.path || '')
const apiName = computed(() => props.apiInfo?.name || '')
const methodRaw = computed(() => (props.apiInfo?.method || 'GET').toUpperCase())
const shortMethod = computed(() => (methodRaw.value === 'DELETE' ? 'DEL' : methodRaw.value))
const methodClass = computed(() => {
  const m = methodRaw.value
  if (m === 'GET') return 'get'
  if (m === 'POST') return 'post'
  if (m === 'PUT') return 'put'
  if (m === 'DELETE') return 'del'
  if (m === 'PATCH') return 'patch'
  return 'other'
})

const stepDisplayName = computed(() => {
  return props.step.stepName?.trim() || apiName.value || '未命名步骤'
})

// ========== 折叠预览文本 ==========
const extractsPreview = computed(() => {
  const arr = (props.step.extracts || []).filter((e) => e.variableName?.trim())
  if (arr.length === 0) return '—'
  const first = `${arr[0].variableName} = ${arr[0].jsonPath || ''}`
  return arr.length > 1 ? `${first} 等 ${arr.length} 条` : first
})
const assertionsPreview = computed(() => {
  const arr = (props.step.assertions || []).filter((a) => (a.expectedValue ?? '').toString())
  if (arr.length === 0) return '—'
  const a = arr[0]
  const exprPart = a.assertType === 'STATUS_CODE' ? '状态码' : (a.expression || '')
  const first = `${exprPart} ${a.operator} ${a.expectedValue}`
  return arr.length > 1 ? `${first} 等 ${arr.length} 条` : first
})
const overridePreview = computed(() => {
  const t = (props.step.overrideRequestBody || '').trim()
  if (!t) return '—'
  return t.length > 60 ? t.slice(0, 60) + '...' : t
})

// ========== 拖拽 ==========
const dragging = ref(false)
function onDragStart(e) {
  dragging.value = true
  // 必须 setData，Firefox 才会触发 drop
  try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(props.index)) } catch (err) {}
  emit('dragstart', props.index)
}
function onDragEnd() {
  dragging.value = false
  emit('dragend')
}

// ========== 交互 ==========
function toggleExpanded() {
  emit('select', props.index)
}
function onCardClick() {
  // 卡片整体点击也算"选中"，但具体展开/收起仍由父组件 expanded 控制
  emit('select', props.index)
}
function onUpdate(key, value) {
  emit('update', props.index, { [key]: value })
}
</script>

<style scoped>
.step-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--et-border-card);
  border-radius: var(--et-radius-card);
  background: #fafcff;
  transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s;
  cursor: pointer;
}
.step-card:hover {
  border-color: var(--et-primary);
}
.step-card--expanded {
  background: var(--et-bg-card);
  border-color: var(--et-primary);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.12);
}
.step-card--dragging {
  opacity: 0.5;
}

/* 序号圆点（也是拖拽 handle） */
.step-card__index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--et-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
  flex-shrink: 0;
  cursor: grab;
}
.step-card--dragging .step-card__index { cursor: grabbing; }

.step-card__body {
  flex: 1;
  min-width: 0;
}
.step-card__row1 {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.step-card__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--et-text-2);
  flex-shrink: 0;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.step-card__url {
  flex: 1;
  font-size: 12px;
  color: var(--et-text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.step-card__actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

/* 折叠预览 */
.step-card__preview {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-top: 8px;
  font-size: 12px;
}
.preview-cell {
  background: var(--et-bg-card);
  border: 1px solid var(--et-border-card);
  border-radius: 4px;
  padding: 6px 10px;
  min-width: 0;
}
.preview-cell .lbl {
  color: var(--et-text-4);
  font-size: 11px;
  margin-bottom: 2px;
}
.preview-cell .v {
  color: var(--et-text-2);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 展开区 */
.step-card__expand {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--et-border-card);
  cursor: default;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.form-row--align-top { align-items: flex-start; }
.form-row--align-top .lab { padding-top: 6px; }
.lab {
  width: 90px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--et-text-3);
  text-align: right;
}
.form-row__input { flex: 1; }
.form-row__textarea { flex: 1; }
.form-row__api {
  flex: 1;
  font-size: 12px;
  color: var(--et-text-2);
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.form-row__api-name {
  color: var(--et-text-4);
}

.form-section {
  margin-top: 14px;
}
.form-section__title {
  font-size: 12px;
  color: var(--et-text-3);
  margin-bottom: 6px;
  font-weight: 500;
}

/* method tag（与接口管理一致） */
.method-tag {
  display: inline-block;
  height: 18px;
  line-height: 16px;
  padding: 0 6px;
  border-radius: 3px;
  font-size: 10px;
  border: 1px solid;
  font-weight: 600;
  flex-shrink: 0;
}
.method-tag--get   { color: #409eff; background: #ecf5ff; border-color: #b3d8ff; }
.method-tag--post  { color: #67c23a; background: #f0f9eb; border-color: #c2e7b0; }
.method-tag--put   { color: #e6a23c; background: #fdf6ec; border-color: #f5dab1; }
.method-tag--del   { color: #f56c6c; background: #fef0f0; border-color: #fbc4c4; }
.method-tag--patch { color: #8b5cf6; background: #f3e5f5; border-color: #d1c4e9; }
.method-tag--other { color: #909399; background: #f4f4f5; border-color: #d3d4d6; }
</style>
