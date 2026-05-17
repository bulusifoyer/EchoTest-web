/**
 * Vue Router 路由配置
 * 阶段 0：补全顶层菜单对应路由占位（Placeholder），后续阶段逐个落地
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

// 路由懒加载
const Login = () => import('@/views/Login.vue')
const Home = () => import('@/views/Home.vue')
const Welcome = () => import('@/views/Welcome.vue')
const Placeholder = () => import('@/views/Placeholder.vue')
const Project = () => import('@/views/project/index.vue')

const routes = [
  {
    path: '/',
    component: Home,
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Welcome,
        meta: { title: '首页' }
      },
      {
        path: 'project',
        name: 'Project',
        component: Project,
        meta: { title: '项目管理' }
      },
      // —— 以下为阶段 0 占位，后续按计划落地 ——
      {
        path: 'environment',
        name: 'Environment',
        component: Placeholder,
        meta: { title: '环境管理', moduleName: '环境管理', stage: '阶段 3' }
      },
      {
        path: 'api',
        name: 'ApiManagement',
        component: Placeholder,
        meta: { title: '接口管理', moduleName: '接口管理与在线试调', stage: '阶段 4' }
      },
      {
        path: 'case',
        name: 'CaseManagement',
        component: Placeholder,
        meta: { title: '用例管理', moduleName: '用例管理与编辑', stage: '阶段 5' }
      },
      {
        path: 'execution',
        name: 'Execution',
        component: Placeholder,
        meta: { title: '任务执行', moduleName: '任务执行', stage: '阶段 6 / 7' }
      },
      {
        path: 'report',
        name: 'Report',
        component: Placeholder,
        meta: { title: '测试报告', moduleName: '测试报告', stage: '阶段 7' }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：登录态校验
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth) {
    if (userStore.isLoggedIn) {
      next()
    } else {
      next({ path: '/login', query: { redirect: to.fullPath } })
    }
  } else {
    next()
  }
})

// 路由守卫：已登录不允许回到登录页
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.name === 'Login' && userStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
