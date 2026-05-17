<template>
  <div class="welcome">
    <div class="et-card welcome__hero">
      <h2 class="welcome__title">欢迎使用分层自动化接口测试平台</h2>
      <p class="welcome__sub">
        在左侧菜单选择具体模块开始工作。建议从「项目管理」创建第一个项目，并在该项目下维护环境、接口与测试用例。
      </p>
    </div>
  </div>
</template>

<script setup>
/**
 * 首页占位（阶段 0）
 * MVP 阶段不做仪表盘统计图表，等核心模块完成后再补充
 */
</script>

<style scoped>
.welcome {
  max-width: 1200px;
}
.welcome__hero {
  padding: 32px;
}
.welcome__title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 600;
  color: var(--et-text-1);
}
.welcome__sub {
  margin: 0;
  color: var(--et-text-3);
  font-size: 14px;
  line-height: 1.7;
}
</style>
