<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="480px"
    :close-on-click-modal="false"
    :close-on-press-escape="!running"
    :show-close="!running"
    @update:model-value="onClose"
  >
    <!-- 1) 加载环境列表中 -->
    <div v-if="loading" v-loading="true" class="exec-loading">
      正在加载环境...
    </div>

    <!-- 2) 项目无环境 → 引导去环境管理 -->
    <el-empty
      v-else-if="environments.length === 0"
      description="当前项目暂无环境，请先创建环境"
    >
      <el-button type="primary" @click="goToEnv">前往环境管理</el-button>
    </el-empty>

    <!-- 3) 正常态：选环境 + 超时 -->
    <el-form v-else label-width="88px">
      <el-form-item label="用例">
        <span class="exec-case-name">{{ caseName || `#${caseId}` }}</span>
      </el-form-item>
      <el-form-item label="执行环境" required>
        <el-select v-model="selectedEnvId" style="width: 100%" :disabled="running">
          <el-option
            v-for="e in environments"
            :key="e.id"
            :label="`${e.envName}  (${e.baseUrl})`"
            :value="e.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="单步超时">
        <el-input-number
          v-model="timeoutMs"
          :min="100"
          :max="60000"
          :step="1000"
          controls-position="right"
          :disabled="running"
        />
        <span class="exec-help">毫秒；范围 100 ~ 60000</span>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="running" @click="onCancel">取消</el-button>
      <el-button
        type="primary"
        :loading="running"
        :disabled="loading || environments.length === 0 || !selectedEnvId"
        @click="onConfirm"
      >
        ▶ 立即执行
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
/**
 * 选择环境执行用例的共用对话框（阶段 7）
 *
 * 由三处入口共用：
 *   - /execution 任务执行中心的「▶ 执行」
 *   - /case 用例列表的「执行」
 *   - /case/edit 用例编辑器的「调试运行」
 *
 * 内部封装：
 *   1. 拉取项目环境列表（按 v-model 打开时触发）
 *   2. 同步执行 runExecutionAPI（loading 锁定到 emit('success', reportId) 为止）
 *   3. 异常路径：项目无环境 / 用户取消 / 接口报错
 *
 * 父组件只需关心 v-model 与 success 事件中拿到的 reportId 跳转。
 */
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getEnvironmentListAPI } from '@/api/environment'
import { runExecutionAPI } from '@/api/execution'

const props = defineProps({
  /** 对话框可见性（v-model） */
  modelValue: { type: Boolean, default: false },
  /** 用例 ID（必填） */
  caseId: { type: [Number, String], required: true },
  /** 用例名（用于回显） */
  caseName: { type: String, default: '' },
  /** 项目 ID（用于查环境） */
  projectId: { type: [Number, String], required: true },
  /** 优先选中的环境 ID（例如重新执行时用原 envId） */
  preferEnvId: { type: [Number, String], default: null }
})

const emit = defineEmits([
  'update:modelValue',
  /** 执行成功，参数为新建报告 ID */
  'success'
])

const title = '执行用例'

const loading = ref(false)
const running = ref(false)
const environments = ref([])
const selectedEnvId = ref(null)
const timeoutMs = ref(15000)

const router = useRouter()

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    // 每次打开重置
    loading.value = true
    running.value = false
    environments.value = []
    selectedEnvId.value = null
    timeoutMs.value = 15000
    try {
      const list = await getEnvironmentListAPI(props.projectId)
      environments.value = Array.isArray(list) ? list : []
      if (environments.value.length > 0) {
        // 如果父组件指定了原 envId 且还存在，优先选中；否则取第一个
        const prefer = Number(props.preferEnvId)
        const hit = environments.value.find((e) => e.id === prefer)
        selectedEnvId.value = hit ? hit.id : environments.value[0].id
      }
    } catch (e) {
      environments.value = []
    } finally {
      loading.value = false
    }
  }
)

function onClose(val) {
  if (running.value) return
  emit('update:modelValue', val)
}

function onCancel() {
  if (running.value) return
  emit('update:modelValue', false)
}

function goToEnv() {
  emit('update:modelValue', false)
  router.push({ path: '/environment', query: { projectId: props.projectId } })
}

async function onConfirm() {
  if (!selectedEnvId.value) {
    ElMessage.warning('请选择执行环境')
    return
  }
  running.value = true
  try {
    const reportId = await runExecutionAPI({
      caseId: Number(props.caseId),
      envId: Number(selectedEnvId.value),
      timeoutMs: Number(timeoutMs.value)
    })
    if (reportId == null) {
      // 后端返回失败时 request.js 已弹了提示；此处仅兜底
      return
    }
    ElMessage.success('执行完成，正在跳转报告详情')
    emit('update:modelValue', false)
    emit('success', reportId)
  } catch (e) {
    // 已被 request.js 拦截器统一处理
  } finally {
    running.value = false
  }
}
</script>

<style scoped>
.exec-loading {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--et-text-3);
}
.exec-case-name {
  color: var(--et-text-1);
  font-weight: 500;
}
.exec-help {
  margin-left: 12px;
  color: var(--et-text-3);
  font-size: 12px;
}
</style>
