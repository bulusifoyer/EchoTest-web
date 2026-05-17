<template>
  <div class="api-editor">
    <!-- 顶部请求行 -->
    <div class="req-bar">
      <el-select v-model="form.method" class="req-bar__method" :class="`req-bar__method--${methodClass(form.method)}`">
        <el-option
          v-for="m in METHODS"
          :key="m"
          :label="m"
          :value="m"
        />
      </el-select>

      <el-input
        v-model="form.path"
        placeholder="/api/users/{id}"
        class="req-bar__url"
      >
        <template #prepend>
          <span class="et-mono req-bar__base" v-text="baseUrlPlaceholder"></span>
        </template>
      </el-input>

      <el-button
        type="primary"
        :icon="Document"
        :loading="saving"
        @click="onSave"
      >
        保存
      </el-button>
      <el-button
        type="danger"
        :icon="Delete"
        plain
        @click="$emit('delete', api)"
      >
        删除
      </el-button>
    </div>

    <!-- 名称 -->
    <div class="name-row">
      <span class="name-row__label">接口名称</span>
      <el-input
        v-model="form.name"
        placeholder="请输入接口名称（1-100 位）"
        maxlength="100"
        show-word-limit
        class="name-row__input"
      />
    </div>

    <!-- Tabs：Headers / Body -->
    <el-tabs v-model="activeTab" class="api-editor__tabs">
      <el-tab-pane label="Headers" name="headers">
        <div class="tab-toolbar">
          <span class="tab-toolbar__hint">
            JSON 对象格式，例如 {{ '{"Content-Type":"application/json"}' }}
          </span>
          <el-button link type="primary" size="small" @click="formatHeaders">
            格式化
          </el-button>
        </div>
        <el-input
          v-model="form.requestHeaders"
          type="textarea"
          :rows="10"
          placeholder="可留空。非空时必须是合法 JSON 对象字符串"
          class="json-textarea"
        />
        <div v-if="headersInvalid" class="error-tip">
          <el-icon><WarningFilled /></el-icon>
          requestHeaders 必须是合法 JSON 对象（如 {{ '{"k":"v"}' }}），不能是数组或基础类型
        </div>
      </el-tab-pane>

      <el-tab-pane label="Body" name="body">
        <div class="tab-toolbar">
          <span class="tab-toolbar__hint">
            原始字符串；如果是 JSON 可点格式化。GET 请求通常留空
          </span>
          <el-button link type="primary" size="small" @click="formatBody">
            格式化
          </el-button>
        </div>
        <el-input
          v-model="form.requestBody"
          type="textarea"
          :rows="10"
          placeholder="可留空"
          class="json-textarea"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
/**
 * 接口编辑器（右侧主区）
 * - 顶部请求行：method 下拉 + URL（前缀 {{base_url}}）+ 保存 / 删除
 * - 名称行
 * - Tabs：Headers（JSON）+ Body（原始字符串）
 *
 * 严格校验：
 *   - requestHeaders 为空允许保存
 *   - 非空时必须是合法 JSON 对象，否则 ElMessage 阻止
 *   - 不向后端发送非法 JSON
 */
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Delete, WarningFilled } from '@element-plus/icons-vue'
import { updateApiDefinitionAPI } from '@/api/apiDefinition'
import { isJsonObjectString, prettyJson } from '@/utils/format'

const props = defineProps({
  api: { type: Object, required: true }
})

const emit = defineEmits(['delete', 'updated'])

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

// 在模板中显示的 base_url 占位符字面量；用常量 + v-text 避免模板嵌套 {{ }}
const baseUrlPlaceholder = '{{base_url}}'

const form = reactive({
  method: 'GET',
  path: '',
  name: '',
  requestHeaders: '',
  requestBody: ''
})

const activeTab = ref('headers')
const saving = ref(false)

// 切换接口时回填
watch(
  () => props.api?.id,
  () => {
    form.method = props.api?.method || 'GET'
    form.path = props.api?.path || ''
    form.name = props.api?.name || ''
    form.requestHeaders = props.api?.requestHeaders || ''
    form.requestBody = props.api?.requestBody || ''
    activeTab.value = 'headers'
  },
  { immediate: true }
)

// 提示用红色边框：实时校验 headers
const headersInvalid = computed(() => {
  const t = (form.requestHeaders || '').trim()
  if (!t) return false
  return !isJsonObjectString(t)
})

function methodClass(m) {
  const u = (m || '').toUpperCase()
  if (u === 'GET') return 'get'
  if (u === 'POST') return 'post'
  if (u === 'PUT') return 'put'
  if (u === 'DELETE') return 'del'
  if (u === 'PATCH') return 'patch'
  return 'other'
}

function formatHeaders() {
  const t = (form.requestHeaders || '').trim()
  if (!t) return
  if (!isJsonObjectString(t)) {
    ElMessage.error('requestHeaders 不是合法 JSON 对象，无法格式化')
    return
  }
  form.requestHeaders = prettyJson(t)
}
function formatBody() {
  const t = (form.requestBody || '').trim()
  if (!t) return
  // body 可能不是 JSON，能 parse 就格式化，不行就保持原文
  try {
    const parsed = JSON.parse(t)
    form.requestBody = JSON.stringify(parsed, null, 2)
  } catch (e) {
    ElMessage.warning('当前内容不是合法 JSON，保持原文')
  }
}

async function onSave() {
  // 必填校验
  if (!form.name.trim()) {
    ElMessage.error('接口名称不能为空')
    return
  }
  if (form.name.length > 100) {
    ElMessage.error('接口名称不能超过 100 位')
    return
  }
  if (!form.path.trim()) {
    ElMessage.error('接口路径不能为空')
    return
  }
  if (!form.path.startsWith('/')) {
    ElMessage.error('接口路径必须以 / 开头')
    return
  }
  if (!METHODS.includes(form.method)) {
    ElMessage.error('请求方法非法')
    return
  }

  // headers JSON 严格校验：非空必须是 JSON 对象
  const headersText = (form.requestHeaders || '').trim()
  if (headersText && !isJsonObjectString(headersText)) {
    ElMessage.error('requestHeaders 必须是合法 JSON 对象字符串')
    return
  }

  saving.value = true
  try {
    await updateApiDefinitionAPI({
      id: props.api.id,
      projectId: props.api.projectId,
      name: form.name.trim(),
      method: form.method,
      path: form.path.trim(),
      requestHeaders: headersText || undefined,
      requestBody: (form.requestBody || '').trim() || undefined
    })
    ElMessage.success('接口已保存')
    emit('updated', props.api.id)
  } catch (e) {
    console.error('保存接口失败:', e)
  } finally {
    saving.value = false
  }
}

// 把 form 暴露给父组件，方便试调时取最新（未保存）的覆盖参数？
// MVP 简化：试调以**已保存**的接口定义为准（即 props.api），不读 form。
// 父组件不需要拿这个 form。
</script>

<style scoped>
.api-editor {
  background: var(--et-bg-card);
  border: 1px solid var(--et-border-card);
  border-radius: var(--et-radius-card);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 顶部请求行 */
.req-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.req-bar__method {
  width: 110px;
  flex-shrink: 0;
}
.req-bar__method :deep(.el-input__wrapper) {
  font-weight: 600;
}
.req-bar__method--get   :deep(.el-input__inner) { color: #409eff; }
.req-bar__method--post  :deep(.el-input__inner) { color: #67c23a; }
.req-bar__method--put   :deep(.el-input__inner) { color: #e6a23c; }
.req-bar__method--del   :deep(.el-input__inner) { color: #f56c6c; }
.req-bar__method--patch :deep(.el-input__inner) { color: #8b5cf6; }

.req-bar__url {
  flex: 1;
}
.req-bar__base {
  color: var(--et-text-4);
  font-size: 12px;
}

/* 名称行 */
.name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: #fafcff;
  border: 1px solid var(--et-border-card);
  border-radius: 4px;
}
.name-row__label {
  font-size: 13px;
  color: var(--et-text-3);
  flex-shrink: 0;
  width: 70px;
}
.name-row__input {
  flex: 1;
}

/* Tabs */
.api-editor__tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.api-editor__tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: auto;
  padding-top: 4px;
}
.tab-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.tab-toolbar__hint {
  font-size: 12px;
  color: var(--et-text-4);
}
.json-textarea :deep(textarea) {
  font-family: var(--et-font-mono);
  font-size: 12px;
  line-height: 1.6;
}

.error-tip {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--et-danger);
}
</style>
