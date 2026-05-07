/**
 * 用户状态管理模块
 * 使用 Pinia 管理用户登录状态、Token、用户信息等
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // ========== 状态定义 ==========

  // Token 状态，优先从 localStorage 读取
  const token = ref(localStorage.getItem('token') || '')

  // 用户信息状态
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

  // ========== 计算属性 ==========

  // 是否已登录（根据 token 是否存在判断）
  const isLoggedIn = computed(() => !!token.value)

  // ========== 操作方法 ==========

  /**
   * 保存 Token
   * @param {string} newToken - 新的 token
   */
  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  /**
   * 保存用户信息
   * @param {Object} info - 用户信息对象
   */
  const setUserInfo = (info) => {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  /**
   * 登录成功后的处理
   * @param {string} token - 登录 token
   * @param {Object} [userInfo] - 用户信息（可选）
   */
  const loginSuccess = (token, userInfo = {}) => {
    setToken(token)
    setUserInfo(userInfo)
  }

  /**
   * 退出登录
   * 清除本地存储和状态中的用户信息
   */
  const logout = () => {
    // 清除状态
    token.value = ''
    userInfo.value = {}

    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')

    // 可以在这里添加路由跳转逻辑（在组件中调用）
  }

  /**
   * 清除 Token（部分场景使用）
   */
  const clearToken = () => {
    token.value = ''
    localStorage.removeItem('token')
  }

  /**
   * 清除用户信息（部分场景使用）
   */
  const clearUserInfo = () => {
    userInfo.value = {}
    localStorage.removeItem('userInfo')
  }

  // ========== 返回状态和方法 ==========
  return {
    // 状态
    token,
    userInfo,

    // 计算属性
    isLoggedIn,

    // 方法
    setToken,
    setUserInfo,
    loginSuccess,
    logout,
    clearToken,
    clearUserInfo
  }
})