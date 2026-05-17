<template>
  <div class="extract-editor">
    <div class="extract-editor__head" v-if="extracts.length > 0">
      <div class="col-key">变量名</div>
      <div class="col-path">JSONPath</div>
      <div class="col-ops"></div>
    </div>

    <div
      v-for="(row, idx) in extracts"
      :key="idx"
      class="extract-editor__row"
    >
      <div class="col-key">
        <el-input
          v-model="row.variableName"
          placeholder="如 token"
          size="small"
          maxlength="50"
        />
      </div>
      <div class="col-path">
        <el-input
          v-model="row.jsonPath"
          placeholder="如 $.data.token"
          size="small"
          maxlength="255"
          class="et-mono"
        />
      </div>
      <div class="col-ops">
        <el-button link type="danger" size="small" @click="onRemove(idx)">删除</el-button>
      </div>
    </div>

    <div class="extract-editor__add" @click="onAdd">
      <el-icon><Plus /></el-icon>
      添加变量提取
    </div>
  </div>
</template>

<script setup>
/**
 * 变量提取编辑器
 * - 双向绑定整个 extracts 数组（v-model）
 * - 不在前端阻断空行；提交前由编辑器 wrapper 统一清洗
 */
import { computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue'])

const extracts = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

function onAdd() {
  emit('update:modelValue', [...extracts.value, { variableName: '', jsonPath: '' }])
}
function onRemove(idx) {
  const next = [...extracts.value]
  next.splice(idx, 1)
  emit('update:modelValue', next)
}
</script>

<style scoped>
.extract-editor {
  border: 1px solid var(--et-border-card);
  border-radius: 4px;
  background: var(--et-bg-card);
}
.extract-editor__head,
.extract-editor__row {
  display: grid;
  grid-template-columns: 180px 1fr 60px;
  gap: 10px;
  padding: 8px 12px;
  align-items: center;
}
.extract-editor__head {
  background: var(--et-bg-table-head);
  color: var(--et-text-4);
  font-size: 12px;
  font-weight: 500;
  border-bottom: 1px solid var(--et-border-card);
}
.extract-editor__row {
  border-bottom: 1px solid var(--et-border-soft);
}
.extract-editor__row:last-of-type {
  border-bottom: none;
}
.extract-editor__add {
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
.extract-editor__add:hover {
  background: var(--et-bg-active);
}
</style>
