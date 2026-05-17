<template>
  <div class="assertion-editor">
    <div class="assertion-editor__head" v-if="assertions.length > 0">
      <div class="col-type">类型</div>
      <div class="col-expr">表达式</div>
      <div class="col-op">比较</div>
      <div class="col-val">期望值</div>
      <div class="col-ops"></div>
    </div>

    <div
      v-for="(row, idx) in assertions"
      :key="idx"
      class="assertion-editor__row"
    >
      <div class="col-type">
        <el-select v-model="row.assertType" size="small">
          <el-option label="STATUS_CODE" value="STATUS_CODE" />
          <el-option label="JSON_PATH" value="JSON_PATH" />
        </el-select>
      </div>
      <div class="col-expr">
        <el-input
          v-model="row.expression"
          :placeholder="row.assertType === 'JSON_PATH' ? '$.code' : 'STATUS_CODE 类型可留空'"
          :disabled="row.assertType === 'STATUS_CODE'"
          size="small"
          class="et-mono"
        />
      </div>
      <div class="col-op">
        <el-select v-model="row.operator" size="small">
          <el-option label="EQUALS" value="EQUALS" />
          <el-option label="CONTAINS" value="CONTAINS" />
          <el-option label="GREATER_THAN" value="GREATER_THAN" />
        </el-select>
      </div>
      <div class="col-val">
        <el-input
          v-model="row.expectedValue"
          :placeholder="row.assertType === 'STATUS_CODE' ? '200' : '0'"
          size="small"
        />
      </div>
      <div class="col-ops">
        <el-button link type="danger" size="small" @click="onRemove(idx)">删除</el-button>
      </div>
    </div>

    <div class="assertion-editor__add" @click="onAdd">
      <el-icon><Plus /></el-icon>
      添加断言
    </div>
  </div>
</template>

<script setup>
/**
 * 断言编辑器
 * - assertType 仅 STATUS_CODE / JSON_PATH
 * - operator 三选：EQUALS / CONTAINS / GREATER_THAN
 * - 表达式：STATUS_CODE 类型禁用；JSON_PATH 类型必填
 * - 提交校验由编辑器 wrapper 统一处理
 */
import { computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue'])

const assertions = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

function newAssertion() {
  return {
    assertType: 'STATUS_CODE',
    expression: '',
    operator: 'EQUALS',
    expectedValue: ''
  }
}
function onAdd() {
  emit('update:modelValue', [...assertions.value, newAssertion()])
}
function onRemove(idx) {
  const next = [...assertions.value]
  next.splice(idx, 1)
  emit('update:modelValue', next)
}
</script>

<style scoped>
.assertion-editor {
  border: 1px solid var(--et-border-card);
  border-radius: 4px;
  background: var(--et-bg-card);
}
.assertion-editor__head,
.assertion-editor__row {
  display: grid;
  grid-template-columns: 130px 1.4fr 130px 1fr 60px;
  gap: 8px;
  padding: 8px 12px;
  align-items: center;
}
.assertion-editor__head {
  background: var(--et-bg-table-head);
  color: var(--et-text-4);
  font-size: 12px;
  font-weight: 500;
  border-bottom: 1px solid var(--et-border-card);
}
.assertion-editor__row {
  border-bottom: 1px solid var(--et-border-soft);
}
.assertion-editor__row:last-of-type {
  border-bottom: none;
}
.assertion-editor__add {
  padding: 8px 12px;
  border-top: 1px dashed var(--et-border-card);
  color: var(--et-primary);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--et-bg-hover);
}
.assertion-editor__add:hover {
  background: var(--et-bg-active);
}
</style>
