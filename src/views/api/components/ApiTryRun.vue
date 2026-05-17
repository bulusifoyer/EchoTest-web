<template>
  <div class="try-run">
    <div class="try-run__head">
      <span class="et-title-h2">在线试调</span>
      <span class="muted">基于已保存的接口定义 + 选定的环境真实发起请求</span>
    </div>

    <!-- 无环境提示 -->
    <el-alert
      v-if="environments.length === 0"
      type="warning"
      :closable="false"
      show-icon
      class="try-run__no-env"
    >
      <template #title>
        当前项目暂无环境，请先到
        <el-link type="primary" @click="goEnv">环境管理</el-link>
        创建环境后再试调
      </template>
    </el-alert>

    <!-- 操作行 -->
    <div class="try-run__row">
      <span class="try-run__label">环境</span>
      <el-select
        v-model="envId"
        placeholder="请选择环境"
        :disabled="environments.length === 0"
        class="try-run__env"
      >
        <el-option
          v-for="env in environments"
          :key="env.id"
          :value="env.id"
          :label="`${env.envName}  ·  ${env.baseUrl}`"
        />
      </el-select>

      <span class="try-run__label">超时(ms)</span>
      <el-input-number
        v-model="timeoutMs"
        :min="100"
        :max="60000"
        :step="500"
        controls-position="right"
        class="try-run__timeout"
      />

      <el-button
        type="primary"
        :icon="VideoPlay"
        :loading="sending"
        :disabled="!canSend"
        @click="onSend"
      >
        发送
      </el-button>
    </div>

    <!-- 覆盖区（折叠） -->
    <el-collapse v-model="overrideOpen" class="try-run__override">
      <el-collapse-item title="本次试调覆盖（可选，优先级高于接口定义与环境）" name="ov">
        <div class="override-grid">
          <div class="override-cell">
            <div class="override-label">覆盖请求头（JSON 对象，可空）</div>
            <el-input
              v-model="overrideHeaders"
              type="textarea"
              :rows="5"
              placeholder='例如 {"Authorization":"Bearer xxx"}'
              class="json-textarea"
            />
            <div v-if="overrideHeadersInvalid" class="error-tip">
              <el-icon><WarningFilled /></el-icon>
              覆盖请求头必须是合法 JSON 对象字符串
            </div>
          </div>
          <div class="override-cell">
            <div class="override-label">覆盖请求体（原始字符串，可空）</div>
            <el-input
              v-model="overrideBody"
              type="textarea"
              :rows="5"
              placeholder="留空则使用接口定义的请求体"
              class="json-textarea"
            />
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 响应区 -->
    <div v-if="result || sending" class="resp">
      <!-- 状态条 -->
      <div :class="['resp__status', `resp__status--${statusBucket}`]">
        <span v-if="sending">⏳ 请求中...</span>
        <template v-else-if="result">
          <strong>● {{ result.statusCode || '—' }}</strong>
          <span class="resp__meta">耗时: <strong>{{ formatMs(result.elapsedMs) }}</strong></span>
          <span class="resp__meta">大小: <strong>{{ formatBytes(byteSize(result.responseBody)) }}</strong></span>
          <span v-if="!result.success" class="resp__meta resp__error">
            ✗ {{ result.errorMessage || '请求失败' }}
          </span>
          <span v-else-if="result.statusCode >= 200 && result.statusCode < 300" class="resp__meta resp__ok">
            ✓ 成功
          </span>
        </template>
      </div>

      <!-- 响应 Tabs -->
      <el-tabs v-model="respTab" class="resp__tabs">
        <el-tab-pane label="响应体" name="body">
          <pre class="resp__code">{{ prettyResponseBody }}</pre>
        </el-tab-pane>
        <el-tab-pane :label="`响应头 (${respHeadersCount})`" name="headers">
          <div v-if="respHeadersCount === 0" class="muted resp__empty">无响应头</div>
          <div v-else class="resp__headers">
            <div
              v-for="(v, k) in result?.responseHeaders || {}"
              :key="k"
              class="resp__header-row"
            >
              <span class="resp__header-key">{{ k }}</span>
              <span class="resp__header-val">{{ v }}</span>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
/**
 * 试调面板（与编辑器同列堆叠）
 *
 * 严格 JSON 校验：
 *   - overrideHeaders 为空允许；非空必须是 JSON 对象，否则 ElMessage 阻止发送
 *   - 不向后端发送非法 JSON
 *
 * 无环境时：禁用发送按钮 + 顶部提示并提供"环境管理"跳转
 */
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { VideoPlay, WarningFilled } from '@element-plus/icons-vue'
import { tryRunApiAPI } from '@/api/apiDefinition'
import {
  isJsonObjectString,
  prettyJson,
  byteSize,
  formatBytes
} from '@/utils/format'

const props = defineProps({
  api: { type: Object, required: true },
  environments: { type: Array, default: () => [] },
  projectId: { type: [Number, String], required: true }
})

const router = useRouter()

const envId = ref(null)
const timeoutMs = ref(10000)
const overrideHeaders = ref('')
const overrideBody = ref('')
const overrideOpen = ref([]) // 默认折叠

const sending = ref(false)
const result = ref(null)
const respTab = ref('body')

// 切 api 时重置
watch(
  () => props.api?.id,
  () => {
    overrideHeaders.value = ''
    overrideBody.value = ''
    result.value = null
    respTab.value = 'body'
  }
)

// 默认选环境：第一个
watch(
  () => props.environments,
  (list) => {
    if (envId.value && list.find((e) => e.id === envId.value)) return
    envId.value = list[0]?.id || null
  },
  { immediate: true, deep: true }
)

const overrideHeadersInvalid = computed(() => {
  const t = (overrideHeaders.value || '').trim()
  if (!t) return false
  return !isJsonObjectString(t)
})

const canSend = computed(() => {
  return (
    !sending.value &&
    !!props.api?.id &&
    !!envId.value &&
    !overrideHeadersInvalid.value &&
    props.environments.length > 0
  )
})

const statusBucket = computed(() => {
  if (sending.value) return 'pending'
  if (!result.value) return 'idle'
  if (!result.value.success) return 'fail'
  const code = Number(result.value.statusCode) || 0
  if (code >= 200 && code < 300) return 'ok'
  if (code >= 300 && code < 400) return 'warn'
  if (code >= 400 && code < 500) return 'warn'
  if (code >= 500) return 'fail'
  return 'idle'
})

const prettyResponseBody = computed(() => {
  if (!result.value?.responseBody) return ''
  return prettyJson(result.value.responseBody) || result.value.responseBody
})

const respHeadersCount = computed(() => {
  return Object.keys(result.value?.responseHeaders || {}).length
})

function formatMs(ms) {
  if (ms == null) return '—'
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

function goEnv() {
  router.push({ path: '/environment', query: { projectId: props.projectId } })
}

async function onSend() {
  // 严格校验 overrideHeaders
  const oh = (overrideHeaders.value || '').trim()
  if (oh && !isJsonObjectString(oh)) {
    ElMessage.error('覆盖请求头必须是合法 JSON 对象字符串')
    return
  }

  if (!envId.value) {
    ElMessage.error('请先选择环境')
    return
  }

  sending.value = true
  result.value = null
  try {
    const res = await tryRunApiAPI({
      apiId: props.api.id,
      envId: envId.value,
      overrideHeaders: oh || undefined,
      overrideBody: (overrideBody.value || '').trim() || undefined,
      timeoutMs: timeoutMs.value || 10000
    })
    result.value = res
  } catch (e) {
    // request.js 已 toast；此处兜底空响应
    console.error('试调失败:', e)
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.try-run {
  background: var(--et-bg-card);
  border: 1px solid var(--et-border-card);
  border-radius: var(--et-radius-card);
  padding: 16px 20px;
}

.try-run__head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
}
.muted {
  color: var(--et-text-4);
  font-size: 12px;
}

.try-run__no-env {
  margin-bottom: 12px;
}

.try-run__row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.try-run__label {
  font-size: 13px;
  color: var(--et-text-3);
}
.try-run__env {
  flex: 1;
  min-width: 240px;
}
.try-run__timeout {
  width: 130px;
}

.try-run__override {
  margin-bottom: 16px;
}
.try-run__override :deep(.el-collapse-item__header) {
  font-size: 13px;
  font-weight: 500;
}

.override-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.override-cell {
  display: flex;
  flex-direction: column;
}
.override-label {
  font-size: 12px;
  color: var(--et-text-4);
  margin-bottom: 6px;
}
.json-textarea :deep(textarea) {
  font-family: var(--et-font-mono);
  font-size: 12px;
  line-height: 1.6;
}
.error-tip {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--et-danger);
}

/* 响应区 */
.resp {
  border-top: 1px dashed var(--et-border-card);
  padding-top: 12px;
}
.resp__status {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 10px;
}
.resp__status strong { font-weight: 600; }
.resp__status--ok      { background: #f0f9eb; color: #67c23a; border: 1px solid #c2e7b0; }
.resp__status--warn    { background: #fdf6ec; color: #e6a23c; border: 1px solid #f5dab1; }
.resp__status--fail    { background: #fef0f0; color: #f56c6c; border: 1px solid #fbc4c4; }
.resp__status--pending { background: #f4f4f5; color: #909399; border: 1px solid #d3d4d6; }
.resp__status--idle    { background: #f4f4f5; color: #909399; border: 1px solid #d3d4d6; }
.resp__meta {
  color: var(--et-text-3);
  font-weight: normal;
}
.resp__meta strong {
  color: var(--et-text-2);
}
.resp__ok { color: var(--et-success); }
.resp__error { color: var(--et-danger); }

.resp__tabs :deep(.el-tabs__content) {
  padding-top: 4px;
}
.resp__code {
  background: #fafafa;
  border: 1px solid var(--et-border-card);
  border-radius: 4px;
  padding: 12px;
  font-family: var(--et-font-mono);
  font-size: 12px;
  line-height: 1.7;
  color: var(--et-text-2);
  max-height: 360px;
  overflow: auto;
  white-space: pre;
  margin: 0;
}
.resp__empty {
  padding: 16px;
  text-align: center;
}
.resp__headers {
  background: #fafafa;
  border: 1px solid var(--et-border-card);
  border-radius: 4px;
  max-height: 240px;
  overflow: auto;
}
.resp__header-row {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  border-bottom: 1px solid var(--et-border-soft);
}
.resp__header-row:last-child { border-bottom: none; }
.resp__header-key {
  color: var(--et-text-3);
  font-weight: 500;
  font-family: var(--et-font-mono);
  word-break: break-all;
}
.resp__header-val {
  color: var(--et-text-2);
  font-family: var(--et-font-mono);
  word-break: break-all;
}
</style>
