<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑项目' : '新建项目'"
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
      <el-form-item label="项目名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入项目名称（1-100 位）"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="项目描述" prop="description">
        <el-input
          v-model="form.description"
          placeholder="可选，最多 255 位"
          type="textarea"
          :rows="4"
          maxlength="255"
          show-word-limit
        />
      </el-form-item>
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
 * 项目新建/编辑对话框
 * - 通过 project prop 决定模式：null = 新建；对象 = 编辑
 * - 提交后 emit('submitted')，由父组件刷新列表
 */
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { addProjectAPI, updateProjectAPI } from '@/api/project'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  project: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'submitted'])

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  name: '',
  description: ''
})

const rules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 1, max: 100, message: '项目名称长度 1-100 位', trigger: 'blur' }
  ],
  description: [
    { max: 255, message: '描述不能超过 255 位', trigger: 'blur' }
  ]
}

const isEdit = ref(false)

// 打开时回填或重置
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      isEdit.value = !!props.project
      form.name = props.project?.name || ''
      form.description = props.project?.description || ''
      // 等 dialog mounted 后清除上一次校验态
      setTimeout(() => formRef.value?.clearValidate(), 0)
    }
  }
)

const onClose = () => {
  formRef.value?.resetFields()
}

const onSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined
    }
    if (isEdit.value) {
      await updateProjectAPI({ id: props.project.id, ...payload })
      ElMessage.success('项目更新成功')
    } else {
      await addProjectAPI(payload)
      ElMessage.success('项目创建成功')
    }
    emit('submitted')
    emit('update:modelValue', false)
  } catch (error) {
    // request.js 已统一 toast
    console.error('提交项目失败:', error)
  } finally {
    loading.value = false
  }
}
</script>
