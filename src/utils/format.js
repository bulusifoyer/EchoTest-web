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
