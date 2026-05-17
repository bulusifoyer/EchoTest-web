/**
 * Vue Router 路由配置
 * 阶段 3.5：
 *   - / 默认 redirect 从 /dashboard 改为 /project（项目管理作为登录后第一站）
 *   - 项目内子路由（environment/api/case/execution/report）加 meta.requireProject
 *   - 守卫：项目内路由若 query 与 store 都无 projectId → ElMessage.warning + 跳 /project
 *   - 守卫：query 缺失但 store 有 → 自动补 query.projectId 进入
 */

import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { useProjectStore } from '@/store/project'

// 路由懒加载
const Login = () => import('@/views/Login.vue')
const Home = () => import('@/views/Home.vue')
const Welcome = () => import('@/views/Welcome.vue')
const Placeholder = () => import('@/views/Placeholder.vue')
const Project = () => import('@/views/project/index.vue')
const Environment = () => import('@/views/environment/index.vue')
const ApiManagement = () => import('@/views/api/index.vue')
const CaseList = () => import('@/views/case/index.vue')
const CaseEditor = () => import('@/views/case/editor.vue')

const routes = [
  {
    path: '/',
    component: Home,
    meta: { requiresAuth: true },
    redirect: '/project', // 阶段 3.5：登录后第一站改为项目管理
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
      // —— 项目内子路由：均要求 currentProject ——
      {
        path: 'environment',
        name: 'Environment',
        component: Environment,
        meta: { title: '环境管理', requireProject: true }
      },
      {
        path: 'api',
        name: 'ApiManagement',
        component: ApiManagement,
        meta: { title: '接口管理', requireProject: true }
      },
      {
        path: 'case',
        name: 'CaseManagement',
        component: CaseList,
        meta: { title: '用例管理', requireProject: true }
      },
      {
        path: 'case/edit',
        name: 'CaseEditor',
        component: CaseEditor,
        meta: { title: '用例编辑', requireProject: true }
      },
      {
        path: 'execution',
        name: 'Execution',
        component: Placeholder,
        meta: {
          title: '任务执行',
          moduleName: '任务执行',
          stage: '阶段 6 / 7',
          requireProject: true
        }
      },
      {
        path: 'report',
        name: 'Report',
        component: Placeholder,
        meta: {
          title: '测试报告',
          moduleName: '测试报告',
          stage: '阶段 7',
          requireProject: true
        }
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

// ========== 守卫 1：登录态 ==========
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

// ========== 守卫 2：已登录访问登录页 → 回首页 ==========
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.name === 'Login' && userStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

// ========== 守卫 3：项目内路由 requireProject ==========
// 去重提示：连续点击多个项目内菜单时只弹一次
let lastWarnAt = 0
function warnNoProjectOnce() {
  const now = Date.now()
  if (now - lastWarnAt < 1500) return
  lastWarnAt = now
  ElMessage.warning('请先选择一个项目')
}

router.beforeEach((to, from, next) => {
  if (!to.meta?.requireProject) return next()

  const projectStore = useProjectStore()

  // 1) query.projectId 有效 → 直接放行（页面层用 resolveProjectId 同步 store）
  const queryPid = Number(to.query?.projectId)
  if (Number.isFinite(queryPid) && queryPid > 0) {
    return next()
  }

  // 2) query 缺失但 store 有 currentProject → 自动补 query 进入
  if (projectStore.hasCurrentProject) {
    return next({
      path: to.path,
      query: { ...to.query, projectId: projectStore.currentProjectId },
      replace: true
    })
  }

  // 3) 都无 → 提示并跳项目管理
  warnNoProjectOnce()
  return next({ path: '/project' })
})

export default router
