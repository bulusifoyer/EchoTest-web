<template>
  <div class="placeholder">
    <div class="et-card placeholder__card">
      <el-empty
        :image-size="120"
        :description="description"
      >
        <template #description>
          <p class="placeholder__title">{{ moduleName }}</p>
          <p class="placeholder__hint">{{ description }}</p>
        </template>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
/**
 * 通用「建设中」占位页
 * 通过路由 meta 传入 moduleName 与 stage
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const moduleName = computed(() => route.meta?.moduleName || '功能模块')
const stage = computed(() => route.meta?.stage || '后续')
const description = computed(() => `${moduleName.value} 将在${stage.value}阶段上线，敬请期待。`)
</script>

<style scoped>
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - var(--et-header-h) - var(--et-pad-content) * 2);
}
.placeholder__card {
  width: 480px;
  padding: 40px 32px;
  text-align: center;
}
.placeholder__title {
  margin: 8px 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: var(--et-text-1);
}
.placeholder__hint {
  margin: 0;
  font-size: 13px;
  color: var(--et-text-4);
}
</style>
