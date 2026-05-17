/**
 * 通用格式化工具
 */

/**
 * 把后端时间字符串（"yyyy-MM-dd HH:mm:ss" 或 ISO 字符串 / Date 对象）
 * 转成相对时间："刚刚 / X 分钟前 / X 小时前 / 昨天 / X 天前 / yyyy-MM-dd"
 * @param {string|Date|null|undefined} value
 * @returns {string}
 */
export function relativeTime(value) {
  if (!value) return '—'

  // 后端常见格式 "2026-05-15 18:42:11" 在 Safari 上无法直接解析，先做兼容
  const normalized = typeof value === 'string'
    ? value.replace(' ', 'T')
    : value
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return '—'

  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  if (diffHour < 24) return `${diffHour} 小时前`
  if (diffDay === 1) return '昨天'
  if (diffDay < 30) return `${diffDay} 天前`

  // 超过 30 天直接展示日期
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 校验字符串是否为合法 JSON 对象字符串（非数组、非 null）
 * 空字符串 / null / undefined 视为 "未填写"，由调用方决定是否允许
 * @param {string} text
 * @returns {boolean}
 */
export function isJsonObjectString(text) {
  if (text == null) return false
  const t = String(text).trim()
  if (!t) return false
  try {
    const obj = JSON.parse(t)
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj)
  } catch (e) {
    return false
  }
}

/**
 * 美化 JSON 字符串：能 parse 则按 2 空格缩进重新序列化，否则原样返回
 * @param {string} text
 * @returns {string}
 */
export function prettyJson(text) {
  if (text == null) return ''
  const t = String(text).trim()
  if (!t) return ''
  try {
    return JSON.stringify(JSON.parse(t), null, 2)
  } catch (e) {
    return text
  }
}

/**
 * 计算字符串字节大小（UTF-8）
 * @param {string} text
 * @returns {number}
 */
export function byteSize(text) {
  if (text == null) return 0
  try {
    return new Blob([String(text)]).size
  } catch (e) {
    return String(text).length
  }
}

/**
 * 把字节数格式化为 B / KB / MB
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}
