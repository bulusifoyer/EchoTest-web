<template>
  <div class="new-card" @click="$emit('click')">
    <div class="new-card__plus">
      <el-icon><Plus /></el-icon>
    </div>
    <div class="new-card__text">新建项目</div>
    <div class="new-card__sub">点击创建一个新的测试项目</div>
  </div>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue'
defineEmits(['click'])
</script>

<style scoped>
.new-card {
  border: 1px dashed var(--et-text-5);
  background: var(--et-bg-hover);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.new-card:hover {
  border-color: var(--et-primary);
  background: var(--et-bg-active);
}
.new-card__plus {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--et-bg-active);
  color: var(--et-primary);
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}
.new-card__text {
  font-size: 14px;
  color: var(--et-primary);
  font-weight: 500;
}
.new-card__sub {
  font-size: 12px;
  color: var(--et-text-4);
  margin-top: 4px;
}
</style>
