<template>
  <div class="meta-card">
    <div class="section-title">用例信息</div>
    <div class="form-row">
      <span class="lab">用例名称</span>
      <el-input
        :model-value="caseName"
        placeholder="例如：登录后查询用户信息并修改昵称"
        maxlength="100"
        show-word-limit
        @update:model-value="$emit('update:caseName', $event)"
      />
    </div>
    <div class="form-row form-row--align-top">
      <span class="lab">用例描述</span>
      <el-input
        :model-value="description"
        type="textarea"
        :rows="3"
        placeholder="可选，最多 255 位"
        maxlength="255"
        show-word-limit
        @update:model-value="$emit('update:description', $event)"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * 用例基础信息卡片
 * MVP 简化：只暴露 caseName + description（后端实有字段）
 *           不显示模块/优先级/标签（后端无字段，避免假功能）
 */
defineProps({
  caseName: { type: String, default: '' },
  description: { type: String, default: '' }
})
defineEmits(['update:caseName', 'update:description'])
</script>

<style scoped>
.meta-card {
  background: var(--et-bg-card);
  border: 1px solid var(--et-border-card);
  border-radius: var(--et-radius-card);
  padding: 18px 20px;
  margin-bottom: 16px;
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--et-text-2);
  border-left: 3px solid var(--et-primary);
  padding-left: 10px;
  line-height: 16px;
  margin-bottom: 14px;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.form-row:last-child { margin-bottom: 0; }
.form-row--align-top { align-items: flex-start; }
.form-row--align-top .lab { padding-top: 8px; }
.lab {
  width: 80px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--et-text-3);
  text-align: right;
}
</style>
