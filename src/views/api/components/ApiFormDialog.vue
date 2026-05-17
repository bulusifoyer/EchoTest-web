<template>
  <el-dialog
    :model-value="modelValue"
    title="新建接口"
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
      <el-form-item label="接口名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="如：用户登录、获取用户信息"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="请求方法" prop="method">
        <el-select v-model="form.method" style="width: 100%">
          <el-option v-for="m in METHODS" :key="m" :label="m" :value="m" />
        </el-select>
      </el-form-item>
      <el-form-item label="接口路径" prop="path">
        <el-input
          v-model="form.path"
          placeholder="必须以 / 开头，如 /api/v1/users"
          maxlength="255"
          show-word-limit
        />
      </el-form-item>

      <div class="dialog-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>请求头与请求体可在保存后于右侧编辑器中补充。</span>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="loading" @click="onSubmit">创建</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
/**
 * 新建接口对话框
 * - 仅收集 name / method / path（最少必填字段）
 * - 提交成功后 emit('submitted', newId)，由父组件刷新列表并自动选中
 */
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { addApiDefinitionAPI } from '@/api/apiDefinition'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: [Number, String], required: true }
})

const emit = defineEmits(['update:modelValue', 'submitted'])

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  name: '',
  method: 'GET',
  path: ''
})

const rules = {
  name: [
    { required: true, message: '请输入接口名称', trigger: 'blur' },
    { min: 1, max: 100, message: '接口名称 1-100 位', trigger: 'blur' }
  ],
  method: [
    { required: true, message: '请选择请求方法', trigger: 'change' }
  ],
  path: [
    { required: true, message: '请输入接口路径', trigger: 'blur' },
    { max: 255, message: '路径不能超过 255 位', trigger: 'blur' },
    { pattern: /^\//, message: '接口路径必须以 / 开头', trigger: 'blur' }
  ]
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      form.name = ''
      form.method = 'GET'
      form.path = ''
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
    const newId = await addApiDefinitionAPI({
      projectId: Number(props.projectId),
      name: form.name.trim(),
      method: form.method,
      path: form.path.trim()
    })
    ElMessage.success('接口已创建')
    emit('submitted', newId)
    emit('update:modelValue', false)
  } catch (e) {
    console.error('创建接口失败:', e)
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
