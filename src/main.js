/**
 * Vue 3 应用入口文件
 * 初始化 Vue 应用，配置插件和全局样式
 */

import { createApp } from 'vue'

// 1. 设计 tokens（须最先，使 Element Plus override 生效）
import './styles/tokens.css'

// 2. Element Plus 框架样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 3. 全局基线样式（在 element 之后，可覆盖）
import './styles/global.css'

import App from './App.vue'
import router from './router'
import pinia from './store'

// 创建 Vue 应用实例
const app = createApp(App)

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
app.use(ElementPlus)
app.use(router)
app.use(pinia)

// 挂载应用
app.mount('#app')