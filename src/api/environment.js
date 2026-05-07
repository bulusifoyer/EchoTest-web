/**
 * 环境配置管理模块 API 接口（MVP版本）
 * 遵循 RESTful 风格，与后端 EnvironmentController 对应
 * 注意：URL 路径为 /api/environments/ 前缀
 */

import request from '@/utils/request'

/**
 * 创建环境配置
 * @param {Object} data - { projectId: Long, envName: string, baseUrl: string, globalHeaders?: string }
 * @returns {Promise<Long>} 环境配置ID
 */
export const addEnvironmentAPI = (data) => {
  return request({
    url: '/environments/add',
    method: 'POST',
    data
  })
}

/**
 * 查询项目下环境列表
 * @param {Long} projectId - 所属项目ID
 * @returns {Promise<Array>} 环境配置列表
 */
export const getEnvironmentListAPI = (projectId) => {
  return request({
    url: `/environments/list/${projectId}`,
    method: 'GET'
  })
}

/**
 * 查询环境配置详情
 * @param {Long} id - 环境配置ID
 * @returns {Promise<Object>} 环境配置对象
 */
export const getEnvironmentDetailAPI = (id) => {
  return request({
    url: `/environments/${id}`,
    method: 'GET'
  })
}

/**
 * 更新环境配置
 * @param {Object} data - { id: Long, projectId: Long, envName: string, baseUrl: string, globalHeaders?: string }
 * @returns {Promise<void>}
 */
export const updateEnvironmentAPI = (data) => {
  return request({
    url: '/environments/update',
    method: 'PUT',
    data
  })
}

/**
 * 删除环境配置（物理删除）
 * @param {Long} id - 环境配置ID
 * @returns {Promise<void>}
 */
export const deleteEnvironmentAPI = (id) => {
  return request({
    url: `/environments/${id}`,
    method: 'DELETE'
  })
}
