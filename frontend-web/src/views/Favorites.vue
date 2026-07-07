<!--
  校园易物 H5 端 · 我的收藏
  - 网格卡片展示已收藏的商品
  - 支持取消收藏
-->
<template>
  <div class="favorites-page">
    <div class="page-header">
      <h2 class="page-title">我的收藏</h2>
      <span class="page-sub">共 {{ total }} 件心动物品</span>
    </div>

    <div v-loading="loading" class="product-grid">
      <el-empty v-if="!loading && items.length === 0" description="还没有收藏任何商品，去大厅逛逛吧" />

      <div
        v-for="f in items"
        :key="f.id"
        class="product-card"
        @click="goDetail(f.product)"
      >
        <div class="card-cover">
          <img
            v-if="f.product_detail?.cover"
            :src="f.product_detail.cover"
            :alt="f.product_detail.title"
            loading="lazy"
            @error="onImgError($event)"
          />
          <div v-else class="cover-placeholder">
            <el-icon :size="32"><Picture /></el-icon>
          </div>
        </div>
        <div class="card-body">
          <div class="card-title">{{ f.product_detail?.title }}</div>
          <div class="card-price">
            <span class="price-symbol">¥</span>
            <span class="price-num">{{ f.product_detail?.price }}</span>
          </div>
          <div class="card-footer">
            <el-tag
              v-if="f.product_detail?.status"
              :type="statusType(f.product_detail.status)"
              size="small"
            >
              {{ statusLabel(f.product_detail.status) }}
            </el-tag>
            <el-button
              type="danger"
              link
              size="small"
              @click.stop="handleUnfavorite(f)"
            >
              <el-icon><Delete /></el-icon>取消收藏
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 校园易物 H5 端 · 我的收藏
 * - 拉取当前用户收藏的商品
 * - 支持取消收藏（调 /products/{id}/favorite/ 切换）
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, Delete } from '@element-plus/icons-vue'
import request from '@/utils/request'

interface FavoriteItem {
  id: number
  product: number
  product_detail: {
    id: number
    title: string
    /** 封面图 URL（由后端 cover SerializerMethodField 计算） */
    cover: string
    price: number
    status: string
    images: { id: number; image_url: string }[]
  }
  created_at: string
}

const router = useRouter()

const items = ref<FavoriteItem[]>([])
const total = ref(0)
const loading = ref(false)

/** 状态映射 */
function statusLabel(s: string): string {
  const map: Record<string, string> = {
    on_sale: '在售',
    sold: '已售',
    off_shelf: '已下架',
    pending: '待审核',
    draft: '草稿',
  }
  return map[s] || s
}

function statusType(s: string): 'success' | 'info' | 'warning' | 'danger' {
  const map: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
    on_sale: 'success',
    pending: 'warning',
    sold: 'info',
    off_shelf: 'info',
    draft: 'info',
  }
  return map[s] || 'info'
}

/** 加载收藏列表 */
async function loadFavorites() {
  loading.value = true
  try {
    const res = await request.get<any, any>('/favorites/')
    items.value = res.results || res || []
    total.value = res.count || items.value.length
  } catch (e) {
    console.error('[Favorites] 加载失败', e)
    ElMessage.error('收藏列表加载失败')
  } finally {
    loading.value = false
  }
}

/** 取消收藏 */
async function handleUnfavorite(f: FavoriteItem) {
  try {
    await ElMessageBox.confirm('确定要从收藏中移除该商品？', '提示', {
      type: 'warning',
      confirmButtonText: '移除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    await request.post(`/products/${f.product}/favorite/`)
    ElMessage.success('已取消收藏')
    items.value = items.value.filter((it) => it.id !== f.id)
    total.value = Math.max(0, total.value - 1)
  } catch (e) {
    console.error('[Favorites] 取消收藏失败', e)
    ElMessage.error('操作失败')
  }
}

/** 跳转商品详情 */
function goDetail(id: number) {
  router.push(`/browse/${id}`)
}

/** 图片加载失败时回退到 1x1 透明 PNG */
function onImgError(e: Event) {
  const el = e.target as HTMLImageElement
  if (el.src !== FALLBACK_IMG) {
    el.src = FALLBACK_IMG
  }
}
const FALLBACK_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII='

onMounted(loadFavorites)
</script>

<style scoped>
.favorites-page {
  padding: var(--space-5);
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.page-sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-4);
  min-height: 400px;
}

.product-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
  box-shadow: var(--shadow-sm);
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.card-cover {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: var(--color-bg-section);
  overflow: hidden;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
}

.card-body {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
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
}

.price-num {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-1);
}
</style>
