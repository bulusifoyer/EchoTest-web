/**
 * 项目工作区上下文工具
 *
 * 解析优先级：
 *   1) route.query.projectId（来自项目卡片"进入项目"或路由守卫自动补的 query）
 *   2) projectStore.currentProjectId（store + localStorage 恢复值）
 *
 * 不做"无项目时跳转 /project"——这一职责由 router 守卫统一承担，
 * 页面层只负责"已经被守卫放行 → 解析出 projectId 后开始拉数据"。
 */

/**
 * 解析当前页面应使用的 projectId，并按需把 query 同步到 store
 * @param {import('vue-router').RouteLocationNormalized} route
 * @param {ReturnType<typeof import('@/store/project').useProjectStore>} projectStore
 * @returns {number|null}
 */
export function resolveProjectId(route, projectStore) {
  const queryRaw = route.query?.projectId
  const queryPid = Number(queryRaw)
  const queryValid = Number.isFinite(queryPid) && queryPid > 0

  // 1) query 有效：query 胜出，并同步到 store（如不一致）
  if (queryValid) {
    if (projectStore.currentProjectId !== queryPid) {
      // 仅持有 id；项目名将由页面拉详情后通过 syncProjectName 回填
      projectStore.setCurrentProject({ id: queryPid, name: projectStore.currentProjectName || '' })
    }
    return queryPid
  }

  // 2) fallback: store
  if (projectStore.hasCurrentProject) {
    return projectStore.currentProjectId
  }

  return null
}
