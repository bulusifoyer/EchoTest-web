/**
 * 项目管理模块 API 接口（MVP版本）
 * 遵循 RESTful 风格，与后端 ProjectController 对应
 * 注意：URL 路径为 /api/projects/ 前缀
 */

import request from '@/utils/request'

/**
 * 创建项目
 * @param {Object} data - { name: string, description?: string }
 * @returns {Promise<Long>} 项目ID
 */
export const addProjectAPI = (data) => {
  return request({
    url: '/projects/add',
    method: 'POST',
    data
  })
}

/**
 * 查询项目列表（数据隔离：只返回当前登录用户创建的项目）
 * @returns {Promise<Array>} 项目列表，按更新时间降序排列
 */
export const getProjectListAPI = () => {
  return request({
    url: '/projects/list',
    method: 'GET'
  })
}

/**
 * 查询项目详情（数据隔离：只能查询当前登录用户自己创建的项目）
 * @param {Long} id - 项目ID
 * @returns {Promise<Object>} 项目对象
 */
export const getProjectDetailAPI = (id) => {
  return request({
    url: `/projects/${id}`,
    method: 'GET'
  })
}

/**
 * 更新项目（数据隔离：只能修改当前登录用户自己创建的项目）
 * @param {Object} data - { id: Long, name: string, description?: string }
 * @returns {Promise<void>}
 */
export const updateProjectAPI = (data) => {
  return request({
    url: '/projects/update',
    method: 'PUT',
    data
  })
}

/**
 * 删除项目（逻辑删除，数据隔离：只能删除当前登录用户自己创建的项目）
 * @param {Long} id - 项目ID
 * @returns {Promise<void>}
 */
export const deleteProjectAPI = (id) => {
  return request({
    url: `/projects/${id}`,
    method: 'DELETE'
  })
}
