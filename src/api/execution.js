/**
 * 测试执行与报告 API（对接后端 M3 / api-contract.md §6）
 *
 * 状态枚举（与后端严格一致）：
 *   - report.status: RUNNING / PASSED / FAILED
 *   - detail.status: PASSED / FAILED
 *
 * 注意：request.js 的 baseURL 已经是 'http://localhost:8080/api'，
 *       这里 url 必须以 '/executions' 开头，**不要**再写 '/api/executions'。
 *
 * @author 测试平台前端
 * @since 2026-05-18
 */
import request from '@/utils/request'

/**
 * 执行用例（同步串行 + 遇错即停）
 * @param {{caseId: number, envId: number, timeoutMs?: number}} payload
 * @returns {Promise<number>} 新建报告 ID
 */
export function runExecutionAPI(payload) {
  return request({
    url: '/executions/run',
    method: 'post',
    data: payload
  })
}

/**
 * 报告详情（含明细列表）
 * @param {number} reportId
 * @returns {Promise<{report: object, details: object[]}>}
 */
export function getReportDetailAPI(reportId) {
  return request({
    url: `/executions/${reportId}`,
    method: 'get'
  })
}

/**
 * 项目下当前用户的报告列表（按创建时间倒序）
 * @param {number} projectId
 * @returns {Promise<object[]>}
 */
export function listReportsByProjectAPI(projectId) {
  return request({
    url: `/executions/list/${projectId}`,
    method: 'get'
  })
}

/**
 * 软删报告（明细不物理删除）
 * @param {number} reportId
 */
export function deleteReportAPI(reportId) {
  return request({
    url: `/executions/${reportId}`,
    method: 'delete'
  })
}
