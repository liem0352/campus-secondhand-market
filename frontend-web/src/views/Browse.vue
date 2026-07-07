<!--
  校园易物 H5 端 · 商品浏览大厅
  - 顶部搜索栏 + 分类筛选
  - 商品瀑布流卡片（图片 + 标题 + 价格 + 卖家信息）
  - 加载更多 / 骨架屏
-->
<template>
  <div class="browse-page">
    <!-- 顶部搜索区 -->
    <div class="search-bar">
      <el-input
        v-model="keyword"
        size="large"
        :placeholder="BROWSE_TEXT.SEARCH_PLACEHOLDER"
        :prefix-icon="Search"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button type="primary" @click="handleSearch">{{ BROWSE_TEXT.SEARCH_BTN }}</el-button>
        </template>
      </el-input>
    </div>

    <!-- 分类筛选 -->
    <div class="category-bar">
      <el-radio-group v-model="categoryId" size="default" @change="handleSearch">
        <el-radio-button :value="''">{{ BROWSE_TEXT.CATEGORY_ALL }}</el-radio-button>
        <el-radio-button
          v-for="c in categories"
          :key="c.id"
          :value="c.id"
        >
          {{ c.name }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 商品网格 -->
    <div v-loading="loading" class="product-grid">
      <el-empty v-if="!loading && products.length === 0" :description="BROWSE_TEXT.EMPTY_DESC" />

      <div
        v-for="p in products"
        :key="p.id"
        class="product-card"
        @click="goDetail(p.id)"
      >
        <div class="card-cover">
          <img
            v-if="getProductCover(p)"
            :src="getProductCover(p)"
            :alt="p.title"
            loading="lazy"
            @error="onImgError($event)"
          />
          <div v-else class="cover-placeholder">
            <el-icon :size="32"><Picture /></el-icon>
          </div>
          <el-tag
            v-if="p.original_price && p.original_price > p.price"
            class="discount-tag"
            type="danger"
            size="small"
          >
            {{ discountText(p) }}
          </el-tag>
        </div>
        <div class="card-body">
          <div class="card-title">{{ p.title }}</div>
          <div class="card-price">
            <span class="price-symbol">¥</span>
            <span class="price-num">{{ p.price }}</span>
            <span v-if="p.original_price && p.original_price > p.price" class="price-origin">
              ¥{{ p.original_price }}
            </span>
          </div>
          <div class="card-meta">
            <span class="seller">
              <el-icon><User /></el-icon>
              {{ p.seller?.nickname || p.seller?.username }}
            </span>
            <span class="condition">
              <el-tag size="small" type="info" effect="plain">{{ conditionLabel(p.condition) }}</el-tag>
            </span>
          </div>
          <div class="card-footer">
            <span class="school">
              <el-icon><Location /></el-icon>
              {{ p.school }}
            </span>
            <span class="fav">
              <el-icon><Star /></el-icon>
              {{ p.favorite_count }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore && products.length > 0" class="load-more">
      <el-button :loading="loading" @click="loadMore">{{ BROWSE_TEXT.LOAD_MORE }}</el-button>
    </div>
    <div v-else-if="products.length > 0" class="load-end">{{ BROWSE_TEXT.LOAD_END }}</div>
  </div>
</template>

<script setup lang="ts">
/**
 * 校园易物 H5 端 · 商品浏览大厅
 * - 公开页面（仅查看），无需鉴权即可浏览
 * - 支持关键词搜索 + 分类筛选 + 翻页
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Picture, User, Location, Star } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getProductCover, type Product, type Paginated, type Category } from '@/api/product'
import { PAGE_SIZE_DEFAULT, BROWSE_TEXT, ROUTE_PATHS, PRODUCT_STATUS } from '@/constants'

const router = useRouter()

/** 搜索关键词 */
const keyword = ref('')
/** 当前选中分类 id，空字符串表示全部 */
const categoryId = ref<number | ''>('')
/** 商品列表 */
const products = ref<Product[]>([])
/** 分类列表 */
const categories = ref<Category[]>([])
/** 加载态 */
const loading = ref(false)
/** 分页 */
const page = ref(1)
const pageSize = PAGE_SIZE_DEFAULT
const total = ref(0)

/** 是否还有更多 */
const hasMore = ref(false)

/** 商品成色文案映射 */
function conditionLabel(c: Product['condition']): string {
  return BROWSE_TEXT.CONDITION[c] || c
}

/** 加载分类（一级分类） */
async function loadCategories() {
  try {
    const res = await request.get<any, any>('/categories/', { params: { parent__isnull: true } })
    categories.value = res.results || res || []
  } catch (e) {
    console.error('[Browse] 加载分类失败', e)
  }
}

/** 加载商品列表 */
async function loadProducts(reset = false) {
  loading.value = true
  try {
    if (reset) {
      page.value = 1
      products.value = []
    }
    const params: Record<string, any> = {
      page: page.value,
      page_size: pageSize,
      status: PRODUCT_STATUS.ON_SALE,
    }
    if (keyword.value.trim()) params.search = keyword.value.trim()
    if (categoryId.value !== '') params.category = categoryId.value

    const res = await request.get<any, Paginated<Product>>('/products/', { params })
    const results = res.results || []
    products.value = reset ? results : [...products.value, ...results]
    total.value = res.count || 0
    hasMore.value = !!res.next
  } catch (e) {
    console.error('[Browse] 加载商品失败', e)
    ElMessage.error(BROWSE_TEXT.LOAD_FAIL)
  } finally {
    loading.value = false
  }
}

/** 触发搜索（重置列表） */
function handleSearch() {
  loadProducts(true)
}

/** 加载更多 */
function loadMore() {
  page.value += 1
  loadProducts(false)
}

/** 跳转商品详情 */
function goDetail(id: number) {
  router.push(ROUTE_PATHS.BROWSE_DETAIL(id))
}

/** 图片加载失败时回退到 1x1 透明 GIF，避免显示浏览器默认的"裂图"图标 */
function onImgError(e: Event) {
  const el = e.target as HTMLImageElement
  if (el.src !== FALLBACK_IMG) {
    el.src = FALLBACK_IMG
  }
}

/**
 * 计算折扣角标文案（中文）
 *   - 立减 X%     ：节省的百分比，醒目直观
 *   - X 折         ：中文电商惯用说法，"X 折" 即实付 (X/10) × 原价
 *   - 同时显示两种写法，避免用户看不懂"折"
 *
 * 例：
 *   原价 299  现价 120  -> 立减 60% · 4 折
 *   原价 79   现价 35   -> 立减 56% · 4.4 折
 *   原价 39   现价 35   -> 立减 10% · 9 折
 */
function discountText(p: { price: number; original_price?: number | null }): string {
  if (!p.original_price || p.original_price <= p.price) return ''
  const savePct = Math.round((1 - p.price / p.original_price) * 100)
  // 计算"X 折"：实付 / 原价 × 10
  const zheNum = (p.price / p.original_price) * 10
  // 整数折直接显示，否则保留 1 位小数
  const zhe = Math.abs(zheNum - Math.round(zheNum)) < 0.05
    ? Math.round(zheNum).toString()
    : zheNum.toFixed(1)
  return BROWSE_TEXT.DISCOUNT(savePct, zhe)
}

/** 1x1 透明 PNG，避免 onerror 反复触发 */
const FALLBACK_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII='

onMounted(() => {
  loadCategories()
  loadProducts(true)
})
</script>

<style scoped>
.browse-page {
  padding: var(--space-5);
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
}

/* 搜索栏 */
.search-bar {
  margin-bottom: var(--space-4);
}

.search-bar :deep(.el-input-group__append) {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

/* 分类筛选 */
.category-bar {
  margin-bottom: var(--space-5);
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: var(--space-2);
}

.category-bar :deep(.el-radio-button__inner) {
  border-radius: var(--radius-base) !important;
  margin-right: var(--space-2);
}

/* 商品网格 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-4);
  min-height: 400px;
}

/* 商品卡片 */
.product-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.card-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: var(--color-bg-section);
  overflow: hidden;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
}

.discount-tag {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
}

.card-body {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}

.card-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 2.8em;
}

.card-price {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  color: var(--color-primary);
}

.price-symbol {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.price-num {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.price-origin {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  text-decoration: line-through;
  margin-left: var(--space-1);
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.seller {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-top: auto;
  padding-top: var(--space-2);
  border-top: 1px dashed var(--color-border-light);
}

.school,
.fav {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

/* 加载更多 */
.load-more,
.load-end {
  text-align: center;
  margin: var(--space-6) 0;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}
</style>
