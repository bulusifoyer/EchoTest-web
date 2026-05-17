/**
 * 测试用例聚合 API（对应后端 TestCaseController）
 * 路径前缀 /api/cases；用例 + 步骤 + 变量提取 + 断言 一次性提交
 */

import request from '@/utils/request'

/**
 * 创建用例（聚合）
 * @param {Object} data - TestCaseSaveDTO
 * @returns {Promise<Long>} 新用例 ID
 */
export const addCaseAPI = (data) => {
  return request({
    url: '/cases/add',
    method: 'POST',
    data
  })
}

/**
 * 用例详情（含完整步骤树）
 * @param {Long|Number} id
 * @returns {Promise<TestCaseDetailVO>}
 */
export const getCaseDetailAPI = (id) => {
  return request({
    url: `/cases/${id}`,
    method: 'GET'
  })
}

/**
 * 项目下用例列表（轻量，不含步骤）
 * @param {Long|Number} projectId
 * @returns {Promise<Array>}
 */
export const getCaseListAPI = (projectId) => {
  return request({
    url: `/cases/list/${projectId}`,
    method: 'GET'
  })
}

/**
 * 更新用例（全量替换）
 * @param {Long|Number} id
 * @param {Object} data - TestCaseSaveDTO
 */
export const updateCaseAPI = (id, data) => {
  return request({
    url: `/cases/update/${id}`,
    method: 'PUT',
    data
  })
}

/**
 * 删除用例（用例软删，子表硬删）
 * @param {Long|Number} id
 */
export const deleteCaseAPI = (id) => {
  return request({
    url: `/cases/${id}`,
    method: 'DELETE'
  })
}
