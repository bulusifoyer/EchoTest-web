/**
 * 接口管理 API 封装（对应后端 ApiDefinitionController + ApiTryRunController）
 * 路径前缀均为 /api/apis；命名 apiDefinition 是为了与 axios 实例 request.js 区分
 */

import request from '@/utils/request'

/**
 * 创建接口定义
 * @param {Object} data - { projectId, name, method, path, requestHeaders?, requestBody? }
 * @returns {Promise<Long>} 新接口 ID
 */
export const addApiDefinitionAPI = (data) => {
  return request({
    url: '/apis/add',
    method: 'POST',
    data
  })
}

/**
 * 查询项目下接口列表
 * @param {Long|Number} projectId
 * @returns {Promise<Array>}
 */
export const getApiDefinitionListAPI = (projectId) => {
  return request({
    url: `/apis/list/${projectId}`,
    method: 'GET'
  })
}

/**
 * 查询接口详情
 * @param {Long|Number} id
 * @returns {Promise<Object>}
 */
export const getApiDefinitionDetailAPI = (id) => {
  return request({
    url: `/apis/${id}`,
    method: 'GET'
  })
}

/**
 * 更新接口定义
 * @param {Object} data - { id, projectId, name, method, path, requestHeaders?, requestBody? }
 * @returns {Promise<void>}
 */
export const updateApiDefinitionAPI = (data) => {
  return request({
    url: '/apis/update',
    method: 'PUT',
    data
  })
}

/**
 * 删除接口定义（逻辑删除）
 * @param {Long|Number} id
 * @returns {Promise<void>}
 */
export const deleteApiDefinitionAPI = (id) => {
  return request({
    url: `/apis/${id}`,
    method: 'DELETE'
  })
}

/**
 * 在线试调接口
 * @param {Object} data - { apiId, envId, overrideHeaders?, overrideBody?, timeoutMs? }
 * @returns {Promise<{statusCode, elapsedMs, responseHeaders, responseBody, success, errorMessage}>}
 */
export const tryRunApiAPI = (data) => {
  return request({
    url: '/apis/try-run',
    method: 'POST',
    data
  })
}
