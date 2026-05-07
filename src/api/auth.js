/**
 * 认证相关 API 接口
 * 包含登录、注册、验证等接口
 */

import request from '@/utils/request'

/**
 * 用户登录
 * @param {Object} data - 登录数据
 * @param {string} data.username - 登录账号，3-20位
 * @param {string} data.password - 登录密码，至少6位
 * @param {boolean} data.rememberMe - 记住我，默认false
 * @param {string} data.captcha - 验证码，用于防止暴力破解
 * @param {string} data.captchaId - 验证码唯一标识
 * @returns {Promise} 登录结果，包含 token
 */
export const loginAPI = (data) => {
  return request({
    url: '/auth/login',
    method: 'POST',
    data
  })
}

/**
 * 用户注册
 * @param {Object} data - 注册数据
 * @param {string} data.username - 登录账号，3-20位，只能包含字母、数字和下划线
 * @param {string} data.password - 登录密码，至少6位，不能包含空格
 * @param {string} data.confirmPassword - 确认密码，必须与password字段一致
 * @param {string} data.nickname - 用户昵称，长度不超过30位
 * @param {string} data.email - 邮箱地址，符合邮箱格式，长度不超过100位
 * @param {string} data.captcha - 验证码，用于防止恶意注册
 * @returns {Promise} 注册结果，包含 userId
 */
export const registerAPI = (data) => {
  return request({
    url: '/auth/register',
    method: 'POST',
    data
  })
}

/**
 * 检查用户名是否可用
 * @param {string} username - 待检查的用户名
 * @returns {Promise} 检查结果，包含 available 字段
 */
export const checkUsernameAPI = (username) => {
  return request({
    url: '/auth/check-username',
    method: 'GET',
    params: { username }
  })
}

/**
 * 检查邮箱是否可用
 * @param {string} email - 待检查的邮箱地址
 * @returns {Promise} 检查结果，包含 available 字段
 */
export const checkEmailAPI = (email) => {
  return request({
    url: '/auth/check-email',
    method: 'GET',
    params: { email }
  })
}

/**
 * 刷新JWT令牌
 * @returns {Promise} 刷新结果，包含 newToken
 */
export const refreshTokenAPI = () => {
  return request({
    url: '/auth/refresh-token',
    method: 'POST'
  })
}

/**
 * 用户退出登录
 * @returns {Promise} 退出结果
 */
export const logoutAPI = () => {
  return request({
    url: '/auth/logout',
    method: 'POST'
  })
}