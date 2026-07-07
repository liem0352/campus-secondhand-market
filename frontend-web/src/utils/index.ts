import dayjs from 'dayjs'

/** 格式化金额 */
export function formatMoney(amount: number | string): string {
  const num = Number(amount)
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** 获取当月第一天 */
export function getMonthStart(date?: Date): string {
  return dayjs(date).startOf('month').format('YYYY-MM-DD')
}

/** 获取当月最后一天 */
export function getMonthEnd(date?: Date): string {
  return dayjs(date).endOf('month').format('YYYY-MM-DD')
}

/** 获取当前月份 YYYY-MM */
export function getCurrentMonth(): string {
  return dayjs().format('YYYY-MM')
}

/** 获取相对日期 */
export function getRelativeDate(days: number): string {
  return dayjs().add(days, 'day').format('YYYY-MM-DD')
}

/** 表单序列化为查询参数 */
export function buildQuery(params: Record<string, any>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      search.append(key, String(val))
    }
  })
  return search.toString()
}
