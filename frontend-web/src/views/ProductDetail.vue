<!--
  校园易物 H5 端 · 商品详情
  - 图片轮播
  - 商品基本信息
  - 卖家信息
  - 收藏 / 联系卖家 / 立即购买
-->
<template>
  <div v-loading="loading" class="product-detail-page">
    <el-button class="back-btn" @click="$router.back()">
      <el-icon><ArrowLeft /></el-icon>返回
    </el-button>

    <el-empty v-if="!loading && !product" description="商品不存在或已下架" />

    <template v-if="product">
      <el-row :gutter="20">
        <!-- 左：图片 -->
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="cover-card">
            <el-carousel
              v-if="product.images && product.images.length > 0"
              :interval="4000"
              height="420px"
              indicator-position="outside"
            >
              <el-carousel-item v-for="img in product.images" :key="img.id">
                <img :src="img.image_url" :alt="product.title" class="cover-img" />
              </el-carousel-item>
            </el-carousel>
            <div v-else class="cover-empty">
              <el-icon :size="48"><Picture /></el-icon>
              <p>暂无图片</p>
            </div>
          </el-card>
        </el-col>

        <!-- 右：信息 -->
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="info-card">
            <h1 class="title">{{ product.title }}</h1>

            <div class="price-row">
              <span class="price-symbol">¥</span>
              <span class="price-num">{{ product.price }}</span>
              <span v-if="product.original_price && product.original_price > product.price" class="price-origin">
                ¥{{ product.original_price }}
              </span>
            </div>

            <el-descriptions :column="2" border size="default" class="meta-desc">
              <el-descriptions-item label="成色">
                <el-tag size="small">{{ conditionLabel(product.condition) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="statusType(product.status)" size="small">
                  {{ statusLabel(product.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="学校">
                <el-icon><Location /></el-icon>
                {{ product.school }}
              </el-descriptions-item>
              <el-descriptions-item label="分类">
                {{ product.category?.name }}
              </el-descriptions-item>
              <el-descriptions-item label="浏览">{{ product.view_count || 0 }}</el-descriptions-item>
              <el-descriptions-item label="收藏">{{ product.favorite_count || 0 }}</el-descriptions-item>
            </el-descriptions>

            <div class="seller-row">
              <el-avatar :size="48" :src="product.seller?.avatar">
                {{ (product.seller?.nickname || product.seller?.username || 'U').charAt(0).toUpperCase() }}
              </el-avatar>
              <div class="seller-info">
                <div class="seller-name">
                  {{ product.seller?.nickname || product.seller?.username }}
                </div>
                <div class="seller-credit">
                  <el-icon><Medal /></el-icon>
                  信用分 {{ product.seller?.credit_score ?? 0 }}
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="actions">
              <el-button
                :type="favorited ? 'warning' : 'default'"
                size="large"
                @click="onToggleFavorite"
              >
                <el-icon><Star v-if="!favorited" /><StarFilled v-else /></el-icon>
                {{ favorited ? '已收藏' : '收藏' }}
              </el-button>
              <el-button
                v-if="product.status === 'on_sale'"
                type="primary"
                size="large"
                @click="onBuyNow"
              >
                立即购买
              </el-button>
              <el-button v-else disabled size="large">{{ statusLabel(product.status) }}</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 商品描述 -->
      <el-card shadow="never" class="desc-card">
        <template #header>
          <span class="desc-title">商品描述</span>
        </template>
        <div class="desc-content">{{ product.description }}</div>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 校园易物 H5 端 · 商品详情
 * - 展示商品完整信息
 * - 买家操作：收藏 / 立即购买
 */
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Picture,
  Location,
  Medal,
  Star,
  StarFilled,
  ArrowLeft,
} from '@element-plus/icons-vue'
import request from '@/utils/request'
import { fetchProduct, type Product } from '@/api/product'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const product = ref<Product | null>(null)
const loading = ref(false)
const favorited = ref(false)

function conditionLabel(c: Product['condition']): string {
  const map: Record<Product['condition'], string> = {
    new: '全新',
    like_new: '99新',
    good: '9成新',
    fair: '其他',
  }
  return map[c] || c
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    on_sale: '在售',
    pending: '待审核',
    sold: '已售',
    off_shelf: '已下架',
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

async function loadProduct() {
  const id = Number(route.params.id)
  if (!id) {
    ElMessage.error('商品 ID 无效')
    return
  }
  loading.value = true
  try {
    product.value = await fetchProduct(id)
    // 查询当前用户是否已收藏
    await checkFavorite(id)
  } catch (e) {
    console.error('[ProductDetail] 加载失败', e)
    product.value = null
  } finally {
    loading.value = false
  }
}

/** 校验当前用户是否已收藏该商品 */
async function checkFavorite(id: number) {
  if (!userStore.isLoggedIn) return
  try {
    const res = await request.get<any, any>('/favorites/', { params: { product: id } })
    const list: any[] = res.results || res || []
    favorited.value = list.length > 0
  } catch (e) {
    /* 静默 */
  }
}

/** 切换收藏 */
async function onToggleFavorite() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push({ name: 'Login' })
    return
  }
  const id = product.value!.id
  try {
    await request.post(`/products/${id}/favorite/`)
    favorited.value = !favorited.value
    ElMessage.success(favorited.value ? '已加入收藏' : '已取消收藏')
    if (product.value) {
      product.value.favorite_count = Math.max(0, (product.value.favorite_count || 0) + (favorited.value ? 1 : -1))
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('操作失败')
  }
}

/** 立即购买：跳转到消息中心发起"想要" */
async function onBuyNow() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push({ name: 'Login' })
    return
  }
  if (product.value?.seller?.id === userStore.user?.id) {
    ElMessage.info('不能购买自己发布的商品')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认对「${product.value?.title}」发起购买？\n系统会创建一笔"待卖家确认"订单。`,
      '发起购买',
      { type: 'info', confirmButtonText: '确认', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  try {
    const res = await request.post<any, any>('/orders/', {
      product: product.value!.id,
      shipping_method: 'pickup',
      pickup_location: '校园自取',
      pickup_time: '尽快',
      buyer_message: '对该商品感兴趣，希望尽快交易',
    })
    ElMessage.success('已创建订单，等待卖家确认')
    router.push({ path: '/buyer-orders' })
  } catch (e: any) {
    console.error(e)
    const msg = e?.response?.data?.detail || '创建订单失败'
    ElMessage.error(msg)
  }
}

onMounted(loadProduct)
</script>

<style scoped>
.product-detail-page {
  padding: var(--space-5);
  max-width: 1180px;
  margin: 0 auto;
  position: relative;
}

.back-btn {
  margin-bottom: var(--space-3);
}

/* 图片 */
.cover-card,
.info-card,
.desc-card {
  border-radius: var(--radius-lg);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.cover-empty {
  height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  background: var(--color-bg-section);
  border-radius: var(--radius-base);
}

/* 信息 */
.info-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.4;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  color: var(--color-primary);
  padding: var(--space-3) 0;
  border-bottom: 1px dashed var(--color-border-light);
}

.price-symbol {
  font-size: var(--font-size-md);
}

.price-num {
  font-size: 32px;
  font-weight: var(--font-weight-bold);
  line-height: 1;
}

.price-origin {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  text-decoration: line-through;
  margin-left: var(--space-2);
}

.meta-desc {
  margin: 0;
}

/* 卖家 */
.seller-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-section);
  border-radius: var(--radius-base);
}

.seller-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.seller-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.seller-credit {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

/* 操作 */
.actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.actions .el-button {
  flex: 1;
}

/* 描述 */
.desc-card {
  margin-top: var(--space-4);
}

.desc-title {
  font-weight: var(--font-weight-semibold);
}

.desc-content {
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-text-primary);
  line-height: 1.7;
  min-height: 100px;
}
</style>
