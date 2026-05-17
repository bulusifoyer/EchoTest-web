<template>
  <div class="login-container">
    <!-- 背景装饰（极简风格） -->
    <div class="background-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
      <div class="decoration-circle circle-3"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- 头部 Logo 和标题 -->
      <div class="card-header">
        <div class="logo-container">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#409EFF"/>
              <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="#409EFF"/>
              <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z" fill="#409EFF"/>
            </svg>
          </div>
          <h1 class="system-title">分层自动化接口测试平台</h1>
          <p class="system-subtitle">专业、高效、可靠的接口测试解决方案</p>
        </div>
      </div>

      <!-- 登录/注册切换标签 -->
      <el-tabs v-model="activeTab" class="auth-tabs" stretch @tab-click="handleTabClick">
        <el-tab-pane label="登录" name="login">
          <!-- 登录表单 -->
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            label-width="0"
            size="large"
            @submit.prevent="handleLogin"
          >
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                prefix-icon="User"
                clearable
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                placeholder="请输入密码"
                prefix-icon="Lock"
                type="password"
                show-password
                clearable
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <!-- 记住我和验证码（验证码功能根据配置开启） -->
            <el-form-item class="form-options">
              <el-checkbox v-model="loginForm.rememberMe" label="记住我" />
              <!-- 验证码输入框，根据配置决定是否显示 -->
              <!--
              <div class="captcha-container">
                <el-input
                  v-model="loginForm.captcha"
                  placeholder="验证码"
                  style="width: 150px; margin-right: 10px;"
                  @keyup.enter="handleLogin"
                />
                <img :src="captchaImage" class="captcha-image" @click="refreshCaptcha" />
              </div>
              -->
            </el-form-item>

            <el-form-item class="form-actions">
              <el-button
                type="primary"
                size="large"
                :loading="loginLoading"
                @click="handleLogin"
                class="submit-btn"
              >
                {{ loginLoading ? '登录中...' : '登录' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="注册" name="register">
          <!-- 注册表单 -->
          <el-form
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            label-width="0"
            size="large"
            @submit.prevent="handleRegister"
          >
            <el-form-item prop="username">
              <el-input
                v-model="registerForm.username"
                placeholder="请输入用户名（3-20位字母、数字、下划线）"
                prefix-icon="User"
                clearable
                @input="checkUsernameAvailability"
                @blur="checkUsernameAvailability"
              />
              <div class="field-status" v-if="registerForm.username">
                <span v-if="usernameChecking" class="status-checking">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  检查中...
                </span>
                <span v-else-if="usernameAvailable === true" class="status-available">
                  <el-icon><CircleCheck /></el-icon>
                  用户名可用
                </span>
                <span v-else-if="usernameAvailable === false" class="status-unavailable">
                  <el-icon><CircleClose /></el-icon>
                  用户名已被使用
                </span>
                <span v-else class="status-hint">
                  请输入用户名
                </span>
              </div>
            </el-form-item>

            <el-form-item prop="nickname">
              <el-input
                v-model="registerForm.nickname"
                placeholder="请输入昵称（可选，不超过30位）"
                prefix-icon="User"
                clearable
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="registerForm.password"
                placeholder="请输入密码（至少6位，不能包含空格）"
                prefix-icon="Lock"
                type="password"
                show-password
                clearable
              />
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <el-input
                v-model="registerForm.confirmPassword"
                placeholder="请确认密码"
                prefix-icon="Lock"
                type="password"
                show-password
                clearable
              />
            </el-form-item>

            <el-form-item prop="email">
              <el-input
                v-model="registerForm.email"
                placeholder="请输入邮箱地址（可选）"
                prefix-icon="Message"
                clearable
                @input="checkEmailAvailability"
                @blur="checkEmailAvailability"
              />
              <div class="field-status" v-if="registerForm.email">
                <span v-if="emailChecking" class="status-checking">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  检查中...
                </span>
                <span v-else-if="emailAvailable === true" class="status-available">
                  <el-icon><CircleCheck /></el-icon>
                  邮箱可用
                </span>
                <span v-else-if="emailAvailable === false" class="status-unavailable">
                  <el-icon><CircleClose /></el-icon>
                  邮箱已被使用
                </span>
                <span v-else class="status-hint">
                  请输入有效的邮箱地址
                </span>
              </div>
            </el-form-item>

            <!-- 验证码输入框，根据配置决定是否显示 -->
            <!--
            <el-form-item prop="captcha">
              <el-input
                v-model="registerForm.captcha"
                placeholder="验证码（可选）"
                prefix-icon="Key"
                clearable
              />
            </el-form-item>
            -->

            <el-form-item class="form-actions">
              <el-button
                type="primary"
                size="large"
                :loading="registerLoading"
                @click="handleRegister"
                class="submit-btn"
              >
                {{ registerLoading ? '注册中...' : '注册' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <!-- 底部链接和说明 -->
      <div class="card-footer">
        <div class="footer-links">
          <el-link type="info" :underline="false" @click="handleForgotPassword">
            忘记密码？
          </el-link>
          <el-link type="info" :underline="false" @click="handleContactSupport">
            联系支持
          </el-link>
        </div>
        <p class="footer-text">
          登录即表示您同意我们的
          <el-link type="primary" :underline="false" @click="handleTerms">
            服务条款
          </el-link>
          和
          <el-link type="primary" :underline="false" @click="handlePrivacy">
            隐私政策
          </el-link>
        </p>
      </div>
    </div>

    <!-- 版权信息 -->
    <div class="copyright">
      <p>© 2023-2026 分层自动化接口测试平台 版权所有</p>
    </div>
  </div>
</template>

<script setup>
/**
 * 登录/注册页面
 * 使用 Vue 3 Composition API (<script setup>) 语法糖
 */

import { ref, reactive, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { loginAPI, registerAPI, checkUsernameAPI, checkEmailAPI } from '@/api/auth'

// ========== 路由和状态管理 ==========

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// ========== 标签页状态 ==========

// 当前激活的标签页（login 或 register）
const activeTab = ref('login')

// 标签页切换处理
const handleTabClick = (tab) => {
  // 切换标签页时重置表单验证状态
  if (tab.paneName === 'login') {
    nextTick(() => {
      loginFormRef.value?.clearValidate()
    })
  } else {
    nextTick(() => {
      registerFormRef.value?.clearValidate()
    })
  }
}

// ========== 登录表单 ==========

const loginFormRef = ref(null)
const loginLoading = ref(false)

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false,
  captcha: '',
  captchaId: ''
})

// 登录表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
    { pattern: /^\S+$/, message: '密码不能包含空格', trigger: 'blur' }
  ]
}

// 登录处理函数
const handleLogin = async () => {
  // 验证表单
  if (!loginFormRef.value) return

  const valid = await loginFormRef.value.validate()
  if (!valid) return

  // 开始登录
  loginLoading.value = true

  try {
    // 调用登录 API，参数与 API 文档保持一致
    const token = await loginAPI({
      username: loginForm.username.trim(),
      password: loginForm.password,
      rememberMe: loginForm.rememberMe,
      captcha: loginForm.captcha || undefined,
      captchaId: loginForm.captchaId || undefined
    })

    // 根据 API 文档，登录成功返回的 data 就是 token 字符串
    // 保存 token 到 Pinia store 和 localStorage
    userStore.setToken(token)

    // 显示成功消息
    ElMessage({
      message: '登录成功',
      type: 'success',
      duration: 2000
    })

    // 登录成功跳转：保留 redirect query（被守卫拦截后回填的），否则进项目管理
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    router.push(redirect || '/project')
  } catch (error) {
    // 错误已经在 request 拦截器中处理，这里可以补充特定逻辑
    console.error('登录失败:', error)
  } finally {
    loginLoading.value = false
  }
}

// ========== 注册表单 ==========

const registerFormRef = ref(null)
const registerLoading = ref(false)

// 注册表单数据
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  email: '',
  captcha: ''
})

// 用户名和邮箱检查状态
const usernameChecking = ref(false)
const emailChecking = ref(false)
const usernameAvailable = ref(null) // null: 未检查, true: 可用, false: 不可用
const emailAvailable = ref(null) // null: 未检查, true: 可用, false: 不可用

// 防抖计时器
let usernameCheckTimer = null
let emailCheckTimer = null

// 检查用户名是否可用（防抖处理）
const checkUsernameAvailability = () => {
  if (usernameCheckTimer) {
    clearTimeout(usernameCheckTimer)
  }

  // 重置状态
  usernameAvailable.value = null
  usernameChecking.value = false

  const username = registerForm.username.trim()

  // 基本格式验证
  if (!username || username.length < 3 || username.length > 20) {
    return
  }

  // 用户名格式验证（只能包含字母、数字和下划线）
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return
  }

  usernameChecking.value = true

  usernameCheckTimer = setTimeout(async () => {
    try {
      const response = await checkUsernameAPI(username)
      // 根据 API 文档，返回的 data 字段包含 available 布尔值
      usernameAvailable.value = response.available

      if (!response.available) {
        // 如果用户名不可用，触发表单验证错误
        nextTick(() => {
          registerFormRef.value?.validateField('username')
        })
      }
    } catch (error) {
      console.error('检查用户名失败:', error)
      usernameAvailable.value = null
    } finally {
      usernameChecking.value = false
    }
  }, 500) // 500ms 防抖延迟
}

// 检查邮箱是否可用（防抖处理）
const checkEmailAvailability = () => {
  if (emailCheckTimer) {
    clearTimeout(emailCheckTimer)
  }

  // 重置状态
  emailAvailable.value = null
  emailChecking.value = false

  const email = registerForm.email.trim()

  // 如果邮箱为空，不检查
  if (!email) {
    return
  }

  // 邮箱格式验证（使用统一正则，确保前后端判断一致）
  if (!EMAIL_REGEX.test(email)) {
    return
  }

  emailChecking.value = true

  emailCheckTimer = setTimeout(async () => {
    try {
      const response = await checkEmailAPI(email)
      // 根据 API 文档，返回的 data 字段包含 available 布尔值
      emailAvailable.value = response.available

      if (!response.available) {
        // 如果邮箱不可用，触发表单验证错误
        nextTick(() => {
          registerFormRef.value?.validateField('email')
        })
      }
    } catch (error) {
      console.error('检查邮箱失败:', error)
      emailAvailable.value = null
    } finally {
      emailChecking.value = false
    }
  }, 500) // 500ms 防抖延迟
}

// 统一的邮箱格式验证正则（RFC 5322 简化版，兼容绝大多数常见邮箱格式）
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// 自定义密码确认验证规则
const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 自定义邮箱格式验证规则（可选字段，有值时校验格式）
const validateEmail = (rule, value, callback) => {
  const trimmedValue = value ? value.trim() : ''
  if (trimmedValue && !EMAIL_REGEX.test(trimmedValue)) {
    callback(new Error('请输入有效的邮箱地址'))
  } else {
    callback()
  }
}

// 自定义用户名格式验证规则
const validateUsernameFormat = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入用户名'))
    return
  }

  if (value.length < 3 || value.length > 20) {
    callback(new Error('用户名长度在 3 到 20 个字符'))
    return
  }

  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    callback(new Error('用户名只能包含字母、数字和下划线'))
    return
  }

  callback()
}

// 自定义用户名可用性验证规则
const validateUsernameAvailability = (rule, value, callback) => {
  if (!value) {
    callback()
    return
  }

  // 如果正在检查，等待检查完成
  if (usernameChecking.value) {
    callback(new Error('正在检查用户名...'))
    return
  }

  // 如果检查完成且用户名不可用
  if (usernameAvailable.value === false) {
    callback(new Error('该用户名已被使用'))
    return
  }

  // 如果检查完成且用户名可用，或者未检查
  callback()
}

// 自定义邮箱可用性验证规则（blur 时触发，检查邮箱是否已被注册）
const validateEmailAvailability = (rule, value, callback) => {
  const trimmedValue = value ? value.trim() : ''
  if (!trimmedValue) {
    callback()
    return
  }

  // 邮箱格式验证（格式不正确时不进行可用性检查，由 validateEmail 负责提示格式错误）
  if (!EMAIL_REGEX.test(trimmedValue)) {
    callback()
    return
  }

  // 如果正在检查，等待检查完成
  if (emailChecking.value) {
    callback(new Error('正在检查邮箱...'))
    return
  }

  // 如果检查完成且邮箱不可用
  if (emailAvailable.value === false) {
    callback(new Error('该邮箱已被使用'))
    return
  }

  // 如果检查完成且邮箱可用，或者未检查
  callback()
}

// 注册表单验证规则
const registerRules = {
  username: [
    { required: true, validator: validateUsernameFormat, trigger: 'blur' },
    { validator: validateUsernameAvailability, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
    { pattern: /^\S+$/, message: '密码不能包含空格', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  nickname: [
    { max: 30, message: '昵称长度不能超过30位', trigger: 'blur' }
  ],
  email: [
    { validator: validateEmail, trigger: 'blur' },
    { validator: validateEmailAvailability, trigger: 'blur' }
  ]
}

// 注册处理函数
const handleRegister = async () => {
  // 验证表单
  if (!registerFormRef.value) return

  const valid = await registerFormRef.value.validate()
  if (!valid) return

  // 开始注册
  registerLoading.value = true

  try {
    // 准备注册数据，与 API 文档字段名 100% 保持一致
    const registerData = {
      username: registerForm.username.trim(),
      password: registerForm.password,
      confirmPassword: registerForm.confirmPassword,
      nickname: registerForm.nickname.trim() || undefined,
      email: registerForm.email.trim() || undefined,
      captcha: registerForm.captcha || undefined
    }

    // 调用注册 API
    await registerAPI(registerData)

    // 显示成功消息
    ElMessage({
      message: '注册成功，请登录',
      type: 'success',
      duration: 3000
    })

    // 切换到登录标签页
    activeTab.value = 'login'

    // 清空注册表单
    registerForm.username = ''
    registerForm.password = ''
    registerForm.confirmPassword = ''
    registerForm.nickname = ''
    registerForm.email = ''
    registerForm.captcha = ''

    // 重置检查状态
    usernameAvailable.value = null
    emailAvailable.value = null
    usernameChecking.value = false
    emailChecking.value = false

    // 重置表单验证状态
    nextTick(() => {
      registerFormRef.value?.resetFields()
    })
  } catch (error) {
    // 错误已经在 request 拦截器中处理，这里可以补充特定逻辑
    console.error('注册失败:', error)
  } finally {
    registerLoading.value = false
  }
}

// ========== 底部链接处理函数 ==========

const handleForgotPassword = () => {
  ElMessageBox.alert('请联系管理员重置密码', '忘记密码', {
    confirmButtonText: '确定'
  })
}

const handleContactSupport = () => {
  ElMessageBox.alert('技术支持邮箱: support@testplatform.com', '联系支持', {
    confirmButtonText: '确定'
  })
}

const handleTerms = () => {
  ElMessageBox.alert('请查看详细的服务条款文档', '服务条款', {
    confirmButtonText: '确定'
  })
}

const handlePrivacy = () => {
  ElMessageBox.alert('请查看详细的隐私政策文档', '隐私政策', {
    confirmButtonText: '确定'
  })
}
</script>

<style scoped>
/**
 * 登录页面样式
 * 设计风格：极简、克制、B2B 专业质感
 */

.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(64, 158, 255, 0.05);
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  right: -150px;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -100px;
  left: -100px;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 10%;
}

/* 登录卡片 */
.login-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  padding: 40px;
  z-index: 1;
  position: relative;
}

/* 卡片头部 */
.card-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
}

.logo-icon svg {
  width: 100%;
  height: 100%;
}

.system-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  line-height: 1.3;
}

.system-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
  line-height: 1.5;
}

/* 认证标签页 */
.auth-tabs {
  margin-bottom: 30px;
}

.auth-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #e4e7ed;
}

.auth-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
}

.auth-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 1.5px;
}

/* 表单样式 */
:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-input__prefix) {
  color: #909399;
}

.form-actions {
  margin-top: 10px;
  margin-bottom: 0;
}

.submit-btn {
  width: 100%;
  border-radius: 8px;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

/* 卡片底部 */
.card-footer {
  text-align: center;
  border-top: 1px solid #f0f0f0;
  padding-top: 20px;
  margin-top: 10px;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 16px;
}

.footer-text {
  font-size: 12px;
  color: #909399;
  margin: 0;
  line-height: 1.5;
}

/* 版权信息 */
.copyright {
  margin-top: 30px;
  text-align: center;
  font-size: 12px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }

  .system-title {
    font-size: 20px;
  }

  .system-subtitle {
    font-size: 13px;
  }

  /* 表单字段状态样式 */
  .field-status {
    font-size: 12px;
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .status-checking {
    color: #909399;
  }

  .status-available {
    color: #67c23a;
  }

  .status-unavailable {
    color: #f56c6c;
  }

  .status-hint {
    color: #909399;
  }

  .is-loading {
    animation: rotating 2s linear infinite;
  }

  @keyframes rotating {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* 表单选项样式 */
  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .captcha-container {
    display: flex;
    align-items: center;
  }

  .captcha-image {
    height: 40px;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid #dcdfe6;
  }
}
</style>