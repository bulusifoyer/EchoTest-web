<template>
  <div id="app">
    <!-- 路由视图出口 -->
    <router-view />
  </div>
</template>

<script setup>
/**
 * 应用根组件
 * 只包含路由视图，不包含其他布局元素
 */

// 不需要额外的逻辑，路由守卫等在路由配置中处理
</script>

<style>
/**
 * 全局样式重置和基础样式
 */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #303133;
}

#app {
  height: 100%;
}
</style>