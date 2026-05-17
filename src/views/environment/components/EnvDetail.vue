<template>
  <div class="env-detail">
    <!-- 头部：标题 + 操作 -->
    <div class="env-detail__head">
      <div class="env-detail__title">
        <span :class="['env-tag', `env-tag--${envType(env.envName)}`]">
          {{ envTypeLabel(env.envName) }}
        </span>
        <h3>{{ env.envName }}</h3>
      </div>

      <div class="env-detail__ops">
        <el-button :icon="Edit" @click="$emit('edit', env)">编辑基础信息</el-button>
        <el-button type="danger" :icon="Delete" plain @click="$emit('delete', env)">删除</el-button>
        <el-button type="primary" :icon="Document" :loading="saving" @click="onSaveHeaders">
          保存请求头
        </el-button>
      </div>
    </div>

    <!-- meta 行 -->
    <div class="env-detail__meta">
      <div><span class="meta-lbl">所属项目：</span>{{ projectName || '—' }}</div>
      <div><span class="meta-lbl">创建人 ID：</span>{{ env.createBy ?? '—' }}</div>
      <div><span class="meta-lbl">最后更新：</span>{{ env.updateTime || '—' }}</div>
    </div>

    <!-- 基础配置 -->
    <div class="section">
      <div class="section__title">基础配置</div>
      <div class="form-grid">
        <div class="lab">环境名称</div>
        <div class="val">{{ env.envName }}</div>
        <div class="lab">Base URL</div>
        <div class="val val--mono">{{ env.baseUrl || '—' }}</div>
      </div>
    </div>

    <!-- 全局请求头：行级表格 + JSON 异常时给 textarea 修复入口 -->
    <div class="section">
      <div class="section__title">
        <span>环境变量 / 全局请求头</span>
        <el-button v-if="!parseFailed" type="primary" link size="small" @click="addRow">
          <el-icon><Plus /></el-icon>添加请求头
        </el-button>
      </div>

      <!-- 正常态：行级表格 -->
      <div v-if="!parseFailed" class="header-table">
        <div class="header-table__head">
          <div class="col-ck"></div>
          <div class="col-key">请求头名</div>
          <div class="col-val">请求头值</div>
          <div class="col-type">类型</div>
          <div class="col-ops">操作</div>
        </div>
        <div
          v-for="(row, idx) in rows"
          :key="idx"
          class="header-table__row"
        >
          <div class="col-ck">
            <el-checkbox v-model="row.enabled" />
          </div>
          <div class="col-key">
            <el-input v-model="row.key" placeholder="如 Content-Type" size="small" />
          </div>
          <div class="col-val">
            <el-input v-model="row.value" placeholder="如 application/json" size="small" />
          </div>
          <div class="col-type">String</div>
          <div class="col-ops">
            <el-button type="danger" link size="small" @click="removeRow(idx)">删除</el-button>
          </div>
        </div>

        <div v-if="rows.length === 0" class="header-table__empty" @click="addRow">
          <el-icon><Plus /></el-icon> 点击添加新请求头...
        </div>
      </div>

      <!-- 异常态：原文修复入口 -->
      <div v-else class="header-fallback">
        <el-alert
          title="globalHeaders 字段非合法 JSON 对象，无法以表格形式编辑。"
          type="warning"
          :closable="false"
          show-icon
        />
        <el-input
          v-model="rawJson"
          type="textarea"
          :rows="6"
          placeholder='请修复成合法 JSON 对象，如 {"Content-Type":"application/json"}'
          class="header-fallback__textarea"
        />
        <div class="header-fallback__ops">
          <el-button @click="reloadFromEnv">重置</el-button>
          <el-button type="primary" @click="onFixedJsonApply">应用</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 环境详情面板（右侧）
 *
 * 全局请求头处理（仅前端转换，后端字段 globalHeaders 仍为 JSON 字符串）：
 *   1. 进入 / 切换环境时，把 env.globalHeaders 解析成 rows[]，每行 { enabled, key, value }
 *   2. 编辑时只在前端维护 rows，不立即提交
 *   3. 点击"保存请求头" → 把 enabled=true 的行序列化成 JSON 字符串 → 调 updateEnvironmentAPI
 *   4. 解析失败 → 切到 fallback 模式（textarea 修复入口）
 *
 * 不引入后端字段；连通性 / SSL / 健康检查等装饰元素不实现
 */
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Edit, Delete, Document } from '@element-plus/icons-vue'
import { updateEnvironmentAPI } from '@/api/environment'

const props = defineProps({
  env: { type: Object, required: true },
  projectName: { type: String, default: '' }
})

const emit = defineEmits(['edit', 'delete', 'updated'])

// ========== env tag 推导（与 EnvList 保持一致） ==========
function envType(name = '') {
  const n = String(name).toLowerCase()
  if (n.includes('prod') || name.includes('生产')) return 'prod'
  if (n.includes('pre') || n.includes('staging')) return 'pre'
  if (n.includes('test') || name.includes('测试')) return 'test'
  if (n.includes('dev') || name.includes('开发')) return 'dev'
  return 'other'
}
function envTypeLabel(name) {
  const map = { dev: 'DEV', test: 'TEST', pre: 'PRE', prod: 'PROD', other: 'ENV' }
  return map[envType(name)]
}

// ========== 表格行模型 ==========
const rows = ref([])         // [{ enabled, key, value }]
const parseFailed = ref(false)
const rawJson = ref('')      // fallback 用
const saving = ref(false)

function reloadFromEnv() {
  const gh = props.env?.globalHeaders
  rawJson.value = gh || ''
  parseFailed.value = false

  if (!gh) {
    rows.value = []
    return
  }

  try {
    const obj = JSON.parse(gh)
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      rows.value = Object.entries(obj).map(([k, v]) => ({
        enabled: true,
        key: String(k),
        value: v == null ? '' : String(v)
      }))
    } else {
      parseFailed.value = true
    }
  } catch (e) {
    parseFailed.value = true
  }
}

// 切换 env 时重新加载
watch(
  () => props.env?.id,
  () => reloadFromEnv(),
  { immediate: true }
)

// ========== 行操作 ==========
function addRow() {
  rows.value.push({ enabled: true, key: '', value: '' })
}
function removeRow(idx) {
  rows.value.splice(idx, 1)
}

// ========== fallback：修复后转回表格 ==========
function onFixedJsonApply() {
  const txt = rawJson.value.trim()
  if (!txt) {
    rows.value = []
    parseFailed.value = false
    return
  }
  try {
    const obj = JSON.parse(txt)
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new Error('not an object')
    }
    rows.value = Object.entries(obj).map(([k, v]) => ({
      enabled: true,
      key: String(k),
      value: v == null ? '' : String(v)
    }))
    parseFailed.value = false
    ElMessage.success('已转换为表格编辑模式')
  } catch (e) {
    ElMessage.error('JSON 格式仍不合法：必须是对象，例如 {"k":"v"}')
  }
}

// ========== 保存：行 → JSON 字符串 → updateEnvironmentAPI ==========
async function onSaveHeaders() {
  if (parseFailed.value) {
    ElMessage.warning('请先修复 JSON 格式后再保存')
    return
  }

  // 收集启用且 key 非空的行
  const obj = {}
  for (const r of rows.value) {
    if (!r.enabled) continue
    const k = (r.key || '').trim()
    if (!k) continue
    obj[k] = r.value ?? ''
  }

  const headersJson = Object.keys(obj).length > 0 ? JSON.stringify(obj) : undefined

  saving.value = true
  try {
    await updateEnvironmentAPI({
      id: props.env.id,
      projectId: props.env.projectId,
      envName: props.env.envName,
      baseUrl: props.env.baseUrl,
      globalHeaders: headersJson
    })
    ElMessage.success('请求头已保存')
    emit('updated')
  } catch (error) {
    console.error('保存请求头失败:', error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.env-detail {
  background: var(--et-bg-card);
  border: 1px solid var(--et-border-card);
  border-radius: var(--et-radius-card);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
  padding: 0;
}

/* 头部 */
.env-detail__head {
  padding: 16px 20px;
  border-bottom: 1px solid var(--et-border-card);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.env-detail__title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.env-detail__title h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--et-text-2);
  margin: 0;
}
.env-detail__ops {
  display: flex;
  gap: 8px;
}

/* meta */
.env-detail__meta {
  padding: 12px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  font-size: 12px;
  color: var(--et-text-3);
  border-bottom: 1px solid var(--et-border-card);
  background: #fafcff;
}
.meta-lbl {
  color: var(--et-text-4);
  margin-right: 4px;
}

/* section */
.section {
  padding: 20px;
  border-bottom: 1px solid var(--et-border-card);
}
.section:last-child {
  border-bottom: none;
}
.section__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--et-text-2);
  border-left: 3px solid var(--et-primary);
  padding-left: 10px;
  line-height: 16px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 基础配置 form-grid */
.form-grid {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px 18px;
  align-items: center;
  font-size: 13px;
}
.lab {
  color: var(--et-text-3);
  text-align: right;
}
.val {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--et-border-input);
  border-radius: 4px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--et-text-3);
  word-break: break-all;
}
.val--mono {
  font-family: var(--et-font-mono);
}

/* 全局请求头表格 */
.header-table {
  border: 1px solid var(--et-border-card);
  border-radius: 6px;
  overflow: hidden;
}
.header-table__head,
.header-table__row {
  display: grid;
  grid-template-columns: 50px 1.2fr 2fr 80px 80px;
  gap: 10px;
  padding: 10px 14px;
  align-items: center;
  font-size: 13px;
}
.header-table__head {
  background: var(--et-bg-table-head);
  color: var(--et-text-4);
  font-size: 12px;
  font-weight: 500;
  border-bottom: 1px solid var(--et-border-card);
}
.header-table__row {
  border-bottom: 1px solid var(--et-border-soft);
}
.header-table__row:last-child {
  border-bottom: none;
}
.col-type {
  font-size: 11px;
  color: var(--et-text-4);
}
.header-table__empty {
  padding: 12px 14px;
  color: var(--et-text-5);
  font-size: 12px;
  border-top: 1px dashed var(--et-border-card);
  background: var(--et-bg-hover);
  cursor: pointer;
  text-align: center;
}
.header-table__empty:hover {
  color: var(--et-primary);
}

/* env tag（与 list 一致） */
.env-tag {
  height: 22px;
  line-height: 20px;
  padding: 0 8px;
  border-radius: 3px;
  font-size: 12px;
  border: 1px solid;
  font-weight: 500;
}
.env-tag--dev   { color: #409eff; background: #ecf5ff; border-color: #b3d8ff; }
.env-tag--test  { color: #67c23a; background: #f0f9eb; border-color: #c2e7b0; }
.env-tag--pre   { color: #e6a23c; background: #fdf6ec; border-color: #f5dab1; }
.env-tag--prod  { color: #f56c6c; background: #fef0f0; border-color: #fbc4c4; }
.env-tag--other { color: #909399; background: #f4f4f5; border-color: #d3d4d6; }

/* fallback */
.header-fallback {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.header-fallback__textarea :deep(textarea) {
  font-family: var(--et-font-mono);
}
.header-fallback__ops {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
