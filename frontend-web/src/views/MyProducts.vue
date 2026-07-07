<template>
  <div class="page-container">
    <div class="page-header">
      <h2>我的商品</h2>
      <el-button :icon="Plus" type="primary" @click="$router.push('/products/create')">
        发布商品
      </el-button>
    </div>

    <!-- 筛选条 -->
    <div class="filter-bar">
      <el-input
        v-model="filters.search"
        placeholder="搜索商品名"
        clearable
        :prefix-icon="Search"
        style="width: 220px"
        @input="debouncedLoad"
      />
      <el-select
        v-model="filters.status"
        placeholder="商品状态"
        clearable
        style="width: 140px"
        @change="onFilterChange"
      >
        <el-option label="在售" value="on_sale" />
        <el-option label="待审核" value="pending" />
        <el-option label="已售出" value="sold" />
        <el-option label="已下架" value="off_shelf" />
        <el-option label="草稿" value="draft" />
      </el-select>
      <el-button @click="resetFilters">重置</el-button>

      <div class="filter-spacer" />

      <span class="filter-meta">共 {{ total }} 件</span>
    </div>

    <!-- 表格 -->
    <el-card shadow="never" class="table-card">
      <el-table
        v-loading="loading"
        :data="products"
        stripe
        :header-cell-style="{ background: 'var(--color-bg-section)' }"
        @selection-change="onSelectChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column label="商品" min-width="280">
          <template #default="{ row }">
            <div class="product-cell">
              <div class="product-cover" :style="coverStyle(getProductCover(row))">
                <el-icon v-if="!getProductCover(row)" :size="20" color="#CCC">
                  <Picture />
                </el-icon>
              </div>
              <div class="product-info">
                <div class="product-title" :title="row.title">{{ row.title }}</div>
                <div class="product-meta">
                  <el-tag size="small" effect="plain">{{ row.category?.name || '未分类' }}</el-tag>
                  <span class="text-muted">·</span>
                  <span class="text-muted">{{ row.school }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="120" align="right" sortable prop="price">
          <template #default="{ row }">
            <span class="text-price">¥{{ formatMoney(row.price) }}</span>
            <div v-if="row.original_price" class="text-muted" style="text-decoration: line-through">
              ¥{{ formatMoney(row.original_price) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="成色" width="90" align="center">
          <template #default="{ row }">
            <span class="text-muted">{{ conditionText(row.condition) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="浏览/收藏" width="120" align="center">
          <template #default="{ row }">
            <div class="metric-cell">
              <span><el-icon><View /></el-icon> {{ row.view_count || 0 }}</span>
              <span><el-icon><Star /></el-icon> {{ row.favorite_count || 0 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span class="status-badge" :class="`status-badge--${row.status}`">
              {{ statusText(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="170" align="center">
          <template #default="{ row }">
            <span class="text-muted">{{ formatDate(row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="goEdit(row.id)">编辑</el-button>
            <el-button
              v-if="row.status === 'on_sale'"
              link
              type="warning"
              size="small"
              @click="onOffShelf(row)"
            >
              下架
            </el-button>
            <el-button
              v-else-if="row.status === 'off_shelf' || row.status === 'draft'"
              link
              type="success"
              size="small"
              @click="onOnShelf(row)"
            >
              上架
            </el-button>
            <el-popconfirm
              title="确定删除该商品？此操作不可恢复"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="onDelete(row.id)"
            >
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-if="!loading && !products.length"
        description="还没有商品，去发布一件吧"
        :image-size="100"
      >
        <el-button type="primary" @click="$router.push('/products/create')">立即发布</el-button>
      </el-empty>

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next, jumper"
          :total="total"
          :page-size="filters.page_size"
          :current-page="filters.page"
          @current-change="onPageChange"
        />
      </div>
    </el-card>

    <!-- 批量操作 -->
    <div v-if="selectedIds.length" class="batch-bar">
      <span>已选 {{ selectedIds.length }} 件</span>
      <el-button type="warning" size="small" @click="onBatchOffShelf">批量下架</el-button>
      <el-button size="small" @click="selectedIds = []">取消选择</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 我的商品管理
 * - 表格 + 筛选 + 批量操作
 * - 状态徽章（on_sale / pending / sold / off_shelf / draft）
 * - 上架 / 下架 / 编辑 / 删除
 */
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Search,
  Picture,
  View,
  Star,
} from '@element-plus/icons-vue'
import {
  fetchMyProducts,
  deleteProduct,
  offShelf,
  onShelf,
  bulkOffShelf,
  getProductCover,
  type Product,
  type ProductStatus,
  type ProductCondition,
} from '@/api/product'
import { formatMoney } from '@/utils'

const router = useRouter()

// 加载态
const loading = ref(false)
// 商品列表
const products = ref<Product[]>([])
// 总数
const total = ref(0)
// 选中 ID 列表
const selectedIds = ref<number[]>([])

/** 筛选参数 */
const filters = reactive({
  search: '',
  status: '' as ProductStatus | '',
  page: 1,
  page_size: 10,
})

/** 商品状态 -> 中文 */
function statusText(status: ProductStatus | string) {
  const map: Record<string, string> = {
    draft: '草稿',
    pending: '待审核',
    on_sale: '在售',
    sold: '已售出',
    off_shelf: '已下架',
  }
  return map[status] || status
}

/** 成色 -> 中文 */
function conditionText(c: ProductCondition | string) {
  const map: Record<string, string> = {
    new: '全新',
    like_new: '九成新',
    good: '八成新',
    fair: '七成新及以下',
  }
  return map[c] || c
}

/** 日期格式化 */
function formatDate(iso: string) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

/** 封面背景图 */
function coverStyle(url?: string) {
  if (url) return { backgroundImage: `url(${url})` }
  return { background: 'var(--color-bg-hover)' }
}

/** 防抖：避免每个按键都请求 */
let searchTimer: number | null = null
function debouncedLoad() {
  if (searchTimer) window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    filters.page = 1
    loadData()
  }, 350)
}

/** 筛选条件变化（重置 page） */
function onFilterChange() {
  filters.page = 1
  loadData()
}

/** 分页切换 */
function onPageChange(page: number) {
  filters.page = page
  loadData()
}

/** 重置筛选 */
function resetFilters() {
  filters.search = ''
  filters.status = ''
  filters.page = 1
  loadData()
}

/** 多选 */
function onSelectChange(rows: Product[]) {
  selectedIds.value = rows.map(r => r.id)
}

/** 加载商品列表 */
async function loadData() {
  loading.value = true
  try {
    const res: any = await fetchMyProducts({
      search: filters.search || undefined,
      status: filters.status || undefined,
      page: filters.page,
      page_size: filters.page_size,
    })
    const data = res.data || res
    products.value = data.results || []
    total.value = data.count || 0
  } catch (e: any) {
    console.error('[MyProducts] 加载失败', e)
    ElMessage.error('商品列表加载失败')
  } finally {
    loading.value = false
  }
}

/** 跳编辑 */
function goEdit(id: number) {
  router.push(`/products/${id}/edit`)
}

/** 删除商品 */
async function onDelete(id: number) {
  try {
    await deleteProduct(id)
    ElMessage.success('删除成功')
    // 若当前页删完，自动回退一页
    if (products.value.length === 1 && filters.page > 1) {
      filters.page -= 1
    }
    loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '删除失败')
  }
}

/** 单个下架 */
async function onOffShelf(row: Product) {
  try {
    await offShelf(row.id)
    ElMessage.success('已下架')
    loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '下架失败')
  }
}

/** 单个上架 */
async function onOnShelf(row: Product) {
  try {
    await onShelf(row.id)
    ElMessage.success('已上架')
    loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '上架失败')
  }
}

/** 批量下架 */
async function onBatchOffShelf() {
  if (!selectedIds.value.length) return
  try {
    await bulkOffShelf(selectedIds.value)
    ElMessage.success(`已下架 ${selectedIds.value.length} 件商品`)
    selectedIds.value = []
    loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '批量下架失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.filter-spacer {
  flex: 1;
}

.filter-meta {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.table-card {
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
}

.product-cell {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.product-cover {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-base);
  background-size: cover;
  background-position: center;
  background-color: var(--color-bg-hover);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-info {
  min-width: 0;
}

.product-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-meta {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: 2px;
  font-size: var(--font-size-xs);
}

.metric-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.metric-cell .el-icon {
  vertical-align: -2px;
  margin-right: 2px;
}

.pagination {
  margin-top: var(--space-4);
  display: flex;
  justify-content: flex-end;
}

.batch-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-text-primary);
  color: var(--color-text-inverse);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-fixed);
  font-size: var(--font-size-sm);
}
</style>
