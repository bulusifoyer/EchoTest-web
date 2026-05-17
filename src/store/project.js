/**
 * 当前项目上下文（工作区）状态管理
 *
 * 用途：
 *   登录后用户先在 /project 选择一个项目作为"工作区"，进入项目内模块
 *   （环境管理 / 接口管理 / 用例管理 / 任务执行 / 测试报告）时，
 *   通过 currentProject 自动注入 projectId，免去每次重复传 query。
 *
 * 持久化：localStorage("echotest_current_project") 存储完整对象，刷新可恢复。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'echotest_current_project'

export const useProjectStore = defineStore('project', () => {
  // ========== 状态 ==========
  const currentProject = ref(null) // 完整项目对象 { id, name, description, ... }

  // ========== 计算属性 ==========
  const currentProjectId = computed(() => currentProject.value?.id ?? null)
  const currentProjectName = computed(() => currentProject.value?.name ?? '')
  const hasCurrentProject = computed(() => !!currentProject.value?.id)

  // ========== 方法 ==========

  /**
   * 设置当前项目；同时写入 localStorage
   * @param {Object} project - 项目对象，至少含 id；推荐含 name
   */
  function setCurrentProject(project) {
    if (!project || project.id == null) {
      clearCurrentProject()
      return
    }
    currentProject.value = { ...project }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProject.value))
    } catch (e) {
      // 容量异常或 SSR 时静默失败
    }
  }

  /**
   * 仅同步当前项目的名称（用于 query.projectId 进入但 store 里只有 id 的场景，
   * 拉取项目详情后回填名字）
   * @param {string} name
   */
  function syncProjectName(name) {
    if (!currentProject.value) return
    currentProject.value = { ...currentProject.value, name: name || '' }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProject.value))
    } catch (e) {}
  }

  /**
   * 清空当前项目（本地与 localStorage）
   */
  function clearCurrentProject() {
    currentProject.value = null
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {}
  }

  /**
   * 从 localStorage 恢复当前项目；在应用启动时（main.js）调用
   */
  function restoreCurrentProject() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const obj = JSON.parse(raw)
      if (obj && obj.id != null) {
        currentProject.value = obj
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (e) {
      // JSON 异常 / 存储被改坏 → 直接清掉
      localStorage.removeItem(STORAGE_KEY)
      currentProject.value = null
    }
  }

  return {
    // state
    currentProject,
    // getters
    currentProjectId,
    currentProjectName,
    hasCurrentProject,
    // actions
    setCurrentProject,
    syncProjectName,
    clearCurrentProject,
    restoreCurrentProject
  }
})
