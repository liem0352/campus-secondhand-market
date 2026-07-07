/**
 * 通用列表数据加载 Composable
 * - 统一管理 loading / error / data / refresh
 * - 支持分页
 *
 * @example
 * const { data, total, loading, error, query, refresh, loadData } = useList(fetchFn)
 */
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

/**
 * 构造 useList
 * @param {Function} fetchFn - 拉取函数 (params) => Promise
 * @param {Object} options
 * @param {Object} options.defaultQuery - 默认查询条件
 * @param {string} options.errorMessage - 加载失败提示
 * @param {boolean} options.silentError - 不弹错误提示
 */
export function useList(fetchFn, options = {}) {
  const {
    defaultQuery = { page: 1, page_size: 20 },
    errorMessage = '数据加载失败',
    silentError = false,
  } = options

  const data = ref([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const query = reactive({ ...defaultQuery })

  /**
   * 加载数据
   * - 过滤空字符串/null/undefined 字段
   * - 兼容返回 { results, count } 或数组
   */
  async function loadData() {
    loading.value = true
    error.value = null
    try {
      // 过滤空值
      const params = {}
      Object.keys(query).forEach((k) => {
        const v = query[k]
        if (v !== '' && v !== null && v !== undefined) {
          params[k] = v
        }
      })

      const res = await fetchFn(params)
      if (Array.isArray(res)) {
        data.value = res
        total.value = res.length
      } else if (res && Array.isArray(res.results)) {
        data.value = res.results
        total.value = res.count ?? res.results.length
      } else if (res && Array.isArray(res.data)) {
        data.value = res.data
        total.value = res.total ?? res.data.length
      } else {
        data.value = []
        total.value = 0
      }
    } catch (e) {
      error.value = e
      data.value = []
      total.value = 0
      if (!silentError) {
        ElMessage.error(e?.message || errorMessage)
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新（重置到第一页）
   */
  async function refresh() {
    query.page = 1
    await loadData()
  }

  /**
   * 重置查询条件并刷新
   */
  async function reset() {
    Object.keys(query).forEach((k) => {
      if (k === 'page' || k === 'page_size') return
      query[k] = defaultQuery[k]
    })
    query.page = 1
    await loadData()
  }

  return {
    data,
    total,
    loading,
    error,
    query,
    loadData,
    refresh,
    reset,
  }
}
