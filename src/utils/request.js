/**
 * 网络请求封装模块
 * 基于 axios 进行二次封装，提供统一的请求/响应拦截器
 */

import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const request = axios.create({
  baseURL: 'http://localhost:8080/api', // API基础路径，直接请求后端服务器
  timeout: 10000, // 请求超时时间 10 秒
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 从 localStorage 中获取 token
    const token = localStorage.getItem('token')

    // 如果 token 存在，则添加到请求头中
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  error => {
    // 请求错误处理
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 从响应中获取后端返回的数据
    const res = response.data

    // 假设后端返回的统一格式为 { code, message, data }
    // code 为 200 表示成功，其他表示失败（具体根据后端定义调整）
    if (res.code === 200) {
      // 请求成功，直接返回 data 部分
      return res.data
    } else {
      // 请求失败，使用 Element Plus 弹出错误提示
      ElMessage({
        message: res.message || '请求失败',
        type: 'error',
        duration: 3000
      })

      // 返回一个 reject 的 Promise，让调用方可以 catch 错误
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  error => {
    // 网络错误或服务器错误处理
    let message = '网络错误，请检查网络连接'

    if (error.response) {
      // 服务器返回了错误状态码
      switch (error.response.status) {
        case 401:
          message = '未授权，请重新登录'
          // 清除本地 token，触发退出登录逻辑
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          // 跳转到登录页
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
          }
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = `请求失败: ${error.response.status}`
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      message = '网络连接超时，请检查网络'
    }

    ElMessage({
      message,
      type: 'error',
      duration: 3000
    })

    return Promise.reject(error)
  }
)

export default request