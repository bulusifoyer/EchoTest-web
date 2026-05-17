<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑环境' : '新建环境'"
    width="520px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="onClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="90px"
      label-position="right"
    >
      <el-form-item label="环境名称" prop="envName">
        <el-input
          v-model="form.envName"
          placeholder="如：开发环境 / 测试环境 / 生产环境"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="Base URL" prop="baseUrl">
        <el-input
          v-model="form.baseUrl"
          placeholder="如：https://test-api.echotest.com"
          maxlength="255"
          show-word-limit
        />
      </el-form-item>
      <div class="dialog-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>全局请求头请在保存后于右侧详情面板的「全局请求头」表格中维护。</span>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="loading" @click="onSubmit">
        {{ isEdit ? '保存' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
/**
 * 环境新建/编辑对话框
 * - 通过 env prop 决定模式：null = 新建；对象 = 编辑
 * - 仅维护 envName + baseUrl；globalHeaders 由右侧表格独立保存
 * - 提交后 emit('submitted', newId)
 */
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { addEnvironmentAPI, updateEnvironmentAPI } from '@/api/environment'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: [Number, String], required: true },
  env: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'submitted'])

const formRef = ref(null)
const loading = ref(false)
const isEdit = ref(false)

const form = reactive({
  envName: '',
  baseUrl: ''
})

const rules = {
  envName: [
    { required: true, message: '请输入环境名称', trigger: 'blur' },
    { min: 1, max: 50, message: '环境名称长度 1-50 位', trigger: 'blur' }
  ],
  baseUrl: [
    { required: true, message: '请输入 Base URL', trigger: 'blur' },
    { max: 255, message: 'Base URL 不能超过 255 位', trigger: 'blur' },
    {
      pattern: /^https?:\/\//,
      message: 'Base URL 需以 http:// 或 https:// 开头',
      trigger: 'blur'
    }
  ]
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      isEdit.value = !!props.env
      form.envName = props.env?.envName || ''
      form.baseUrl = props.env?.baseUrl || ''
      setTimeout(() => formRef.value?.clearValidate(), 0)
    }
  }
)

function onClose() {
  formRef.value?.resetFields()
}

async function onSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const payload = {
      projectId: Number(props.projectId),
      envName: form.envName.trim(),
      baseUrl: form.baseUrl.trim()
    }
    let newId = null

    if (isEdit.value) {
      // 编辑模式：保留原 globalHeaders 不动
      await updateEnvironmentAPI({
        id: props.env.id,
        ...payload,
        globalHeaders: props.env.globalHeaders || undefined
      })
      ElMessage.success('环境更新成功')
      newId = props.env.id
    } else {
      newId = await addEnvironmentAPI(payload)
      ElMessage.success('环境创建成功')
    }
    emit('submitted', newId)
    emit('update:modelValue', false)
  } catch (error) {
    console.error('提交环境失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.dialog-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--et-text-4);
  margin-top: -6px;
  padding-left: 90px;
}
</style>
