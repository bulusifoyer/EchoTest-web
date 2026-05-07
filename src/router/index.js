/**
 * Vue Router 路由配置
 * 定义应用的路由和对应的组件
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

// 路由懒加载（提高首屏加载速度）
const Login = () => import('@/views/Login.vue')
const Home = () => import('@/views/Home.vue')
const Welcome = () => import('@/views/Welcome.vue')
const Project = () => import('@/views/project/index.vue')

// 路由配置
const routes = [
  {
    path: '/',
    component: Home,
    meta: {
      requiresAuth: true // 需要登录才能访问
    },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Welcome,
        meta: {
          title: '首页'
        }
      },
      {
        path: 'project',
        name: 'Project',
        component: Project,
        meta: {
          title: '项目管理'
        }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      requiresAuth: false // 不需要登录就能访问
    }
  },
  {
    path: '/:pathMatch(.*)*', // 404 页面
    redirect: '/'
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 权限验证
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // 检查路由是否需要登录
  if (to.meta.requiresAuth) {
    // 需要登录，检查是否已登录
    if (userStore.isLoggedIn) {
      // 已登录，允许访问
      next()
    } else {
      // 未登录，重定向到登录页面
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存目标路径，登录后可以跳转回来
      })
    }
  } else {
    // 不需要登录，直接允许访问
    next()
  }
})

// 路由守卫 - 已登录用户访问登录页的处理
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // 如果已登录且访问的是登录页，重定向到首页
  if (to.name === 'Login' && userStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
