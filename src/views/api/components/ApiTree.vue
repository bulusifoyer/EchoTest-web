<template>
  <div class="api-tree">
    <!-- 表头：标题 + 新增 -->
    <div class="api-tree__head">
      <span class="api-tree__title">接口列表</span>
      <el-button type="primary" size="small" :icon="Plus" @click="$emit('add')">新增</el-button>
    </div>

    <!-- 搜索框 -->
    <el-input
      v-model="keyword"
      :prefix-icon="Search"
      placeholder="搜索接口名称或路径"
      clearable
      size="small"
      class="api-tree__search"
    />

    <!-- 列表区 -->
    <div class="api-tree__items">
      <el-empty
        v-if="apis.length === 0"
        description="暂无接口"
        :image-size="60"
      />

      <!-- 搜索状态：摊平展示 -->
      <template v-else-if="keyword.trim()">
        <div
          v-for="api in flatFiltered"
          :key="api.id"
          :class="['api-item', { 'api-item--active': api.id === activeId }]"
          @click="$emit('select', api)"
        >
          <span :class="['method-tag', `method-tag--${methodClass(api.method)}`]">
            {{ shortMethod(api.method) }}
          </span>
          <span class="api-item__name">{{ api.name }}</span>
        </div>
        <div v-if="flatFiltered.length === 0" class="api-tree__empty-tip">
          没有匹配的接口
        </div>
      </template>

      <!-- 默认：按 method 分组折叠 -->
      <template v-else>
        <div
          v-for="group in groups"
          :key="group.method"
          class="method-group"
        >
          <div
            class="method-group__head"
            @click="toggleGroup(group.method)"
          >
            <el-icon class="method-group__arrow">
              <component :is="collapsed[group.method] ? CaretRight : CaretBottom" />
            </el-icon>
            <span :class="['method-tag', `method-tag--${methodClass(group.method)}`]">
              {{ shortMethod(group.method) }}
            </span>
            <span class="method-group__count">({{ group.items.length }})</span>
          </div>
          <div v-if="!collapsed[group.method]" class="method-group__body">
            <div
              v-for="api in group.items"
              :key="api.id"
              :class="['api-item', { 'api-item--active': api.id === activeId }]"
              @click="$emit('select', api)"
            >
              <span class="api-item__name">{{ api.name }}</span>
              <span class="api-item__path et-mono">{{ api.path }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
/**
 * 接口列表（左侧 280px）
 * - 默认按 method 分组折叠（GET/POST/PUT/DELETE/PATCH，5 组中只显示有数据的）
 * - 搜索时摊平展示，匹配 name 或 path
 * - 选中条目浅蓝高亮
 */
import { ref, computed, reactive } from 'vue'
import { Plus, Search, CaretBottom, CaretRight } from '@element-plus/icons-vue'

const props = defineProps({
  apis: { type: Array, default: () => [] },
  activeId: { type: [Number, String, null], default: null }
})

defineEmits(['add', 'select'])

const keyword = ref('')

// method 顺序固定，便于截图与定位
const METHOD_ORDER = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

// 折叠状态：默认全展开
const collapsed = reactive({})
function toggleGroup(method) {
  collapsed[method] = !collapsed[method]
}

// 分组（仅返回有数据的组）
const groups = computed(() => {
  const map = {}
  for (const api of props.apis) {
    const m = (api.method || 'OTHER').toUpperCase()
    if (!map[m]) map[m] = []
    map[m].push(api)
  }
  // 按固定顺序输出
  const ordered = []
  for (const m of METHOD_ORDER) {
    if (map[m]) ordered.push({ method: m, items: map[m] })
  }
  // 兜底：可能存在不在白名单里的 method（理论上后端已限制）
  for (const m of Object.keys(map)) {
    if (!METHOD_ORDER.includes(m)) {
      ordered.push({ method: m, items: map[m] })
    }
  }
  return ordered
})

// 搜索摊平
const flatFiltered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return props.apis
  return props.apis.filter((a) => {
    return (
      (a.name || '').toLowerCase().includes(kw) ||
      (a.path || '').toLowerCase().includes(kw)
    )
  })
})

// method 短标签 + 配色 class
function methodClass(m) {
  const u = (m || '').toUpperCase()
  if (u === 'GET') return 'get'
  if (u === 'POST') return 'post'
  if (u === 'PUT') return 'put'
  if (u === 'DELETE') return 'del'
  if (u === 'PATCH') return 'patch'
  return 'other'
}
function shortMethod(m) {
  const u = (m || '').toUpperCase()
  if (u === 'DELETE') return 'DEL'
  return u
}
</script>

<style scoped>
.api-tree {
  background: var(--et-bg-card);
  border: 1px solid var(--et-border-card);
  border-radius: var(--et-radius-card);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* 表头 */
.api-tree__head {
  padding: 12px 14px;
  border-bottom: 1px solid var(--et-border-card);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.api-tree__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--et-text-1);
}

/* 搜索框 */
.api-tree__search {
  margin: 10px 12px 4px;
  width: calc(100% - 24px);
}

/* 列表区 */
.api-tree__items {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.api-tree__empty-tip {
  text-align: center;
  font-size: 12px;
  color: var(--et-text-4);
  padding: 24px 0;
}

/* 分组 */
.method-group {
  margin-bottom: 6px;
}
.method-group__head {
  padding: 6px 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--et-text-2);
  cursor: pointer;
  border-radius: 4px;
  font-weight: 500;
}
.method-group__head:hover {
  background: var(--et-bg-hover);
}
.method-group__arrow {
  font-size: 12px;
  color: var(--et-text-4);
}
.method-group__count {
  color: var(--et-text-4);
  font-size: 12px;
  font-weight: normal;
}
.method-group__body {
  padding-left: 12px;
}

/* 单个条目 */
.api-item {
  padding: 6px 10px;
  margin: 2px 0;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: background 0.12s, border-color 0.12s;
}
.api-item:hover {
  background: var(--et-bg-hover);
}
.api-item--active {
  background: var(--et-bg-active);
  border-color: var(--et-border-active);
}
.api-item__name {
  font-size: 13px;
  color: var(--et-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}
.api-item--active .api-item__name {
  color: var(--et-primary);
}
.api-item__path {
  font-size: 11px;
  color: var(--et-text-4);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 搜索摊平态：method tag 与 name 同行 */
.api-tree__items > .api-item {
  flex-direction: row;
  align-items: center;
}

/* method tag */
.method-tag {
  display: inline-block;
  height: 18px;
  line-height: 16px;
  padding: 0 6px;
  border-radius: 3px;
  font-size: 10px;
  border: 1px solid;
  font-weight: 600;
  flex-shrink: 0;
}
.method-tag--get   { color: #409eff; background: #ecf5ff; border-color: #b3d8ff; }
.method-tag--post  { color: #67c23a; background: #f0f9eb; border-color: #c2e7b0; }
.method-tag--put   { color: #e6a23c; background: #fdf6ec; border-color: #f5dab1; }
.method-tag--del   { color: #f56c6c; background: #fef0f0; border-color: #fbc4c4; }
.method-tag--patch { color: #8b5cf6; background: #f3e5f5; border-color: #d1c4e9; }
.method-tag--other { color: #909399; background: #f4f4f5; border-color: #d3d4d6; }
</style>
