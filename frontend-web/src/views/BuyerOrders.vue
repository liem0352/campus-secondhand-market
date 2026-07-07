<!--
  校园易物 H5 端 · 我买入的订单
  - 订单卡片列表
  - 状态：待卖家确认 / 卖家已确认 / 交易中 / 已完成 / 已取消
  - 买家侧操作：取消订单、标记完成、联系卖家
-->
<template>
  <div class="buyer-orders-page">
    <div class="page-header">
      <h2 class="page-title">我买入的订单</h2>
      <span class="page-sub">共 {{ total }} 笔</span>
    </div>

    <el-tabs v-model="activeTab" class="order-tabs" @tab-change="loadData">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="待确认" name="requested" />
      <el-tab-pane label="进行中" name="shipping" />
      <el-tab-pane label="已完成" name="completed" />
      <el-tab-pane label="已取消" name="cancelled" />
    </el-tabs>

    <div v-loading="loading" class="order-list">
      <el-empty
        v-if="!loading && orders.length === 0"
        description="还没有订单，去商品大厅逛逛吧"
      />

      <el-card
        v-for="o in orders"
        :key="o.id"
        shadow="never"
        class="order-card"
        @click="openDetail(o)"
      >
        <div class="order-card-header">
          <div class="order-no">订单号 #{{ o.id }}</div>
          <span class="status-badge" :class="`status-badge--${o.status}`">
            {{ statusText(o.status) }}
          </span>
        </div>

        <div class="order-card-body">
          <div class="cover" :style="coverStyle(o.product?.image_url)">
            <el-icon v-if="!o.product?.image_url" :size="20" color="#CCC">
              <Picture />
            </el-icon>
          </div>
          <div class="info">
            <div class="title" :title="o.product?.title">
              {{ o.product?.title || '商品已下架' }}
            </div>
            <div class="meta text-muted">
              卖家：{{ o.seller?.nickname || o.seller?.username || '匿名' }}
              <span v-if="o.seller?.credit_score !== undefined" class="credit">
                信用 {{ o.seller.credit_score }}
              </span>
            </div>
            <div class="meta text-muted">
              {{ formatDate(o.created_at) }} · {{ shippingText(o.shipping_method) }}
            </div>
          </div>
          <div class="price">
            <span class="price-symbol">¥</span>
            <span class="price-num">{{ formatMoney(o.price) }}</span>
          </div>
        </div>

        <div class="order-card-footer" @click.stop>
          <el-button size="small" @click.stop="contactSeller(o)">
            <el-icon><ChatDotRound /></el-icon>联系卖家
          </el-button>
          <div class="action-group">
            <el-button
              v-if="['requested', 'confirmed', 'shipping'].includes(o.status)"
              link
              type="danger"
              size="small"
              @click.stop="onCancel(o)"
            >
              取消订单
            </el-button>
            <el-button
              v-if="['confirmed', 'shipping'].includes(o.status)"
              type="primary"
              size="small"
              @click.stop="onComplete(o)"
            >
              确认收货
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 分页 -->
      <el-pagination
        v-if="total > pageSize"
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        background
        class="pagination"
        @current-change="loadData"
      />
    </div>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="560">
      <el-descriptions v-if="currentOrder" :column="1" border>
        <el-descriptions-item label="订单号">#{{ currentOrder.id }}</el-descriptions-item>
        <el-descriptions-item label="商品">{{ currentOrder.product?.title }}</el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ formatMoney(currentOrder.price) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <span class="status-badge" :class="`status-badge--${currentOrder.status}`">
            {{ statusText(currentOrder.status) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="卖家">
          {{ currentOrder.seller?.nickname || currentOrder.seller?.username }}
        </el-descriptions-item>
        <el-descriptions-item label="配送方式">
          {{ shippingText(currentOrder.shipping_method) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentOrder.pickup_location" label="自取地点">
          {{ currentOrder.pickup_location }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentOrder.pickup_time" label="约定时间">
          {{ currentOrder.pickup_time }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentOrder.buyer_message" label="买家留言">
          {{ currentOrder.buyer_message }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentOrder.seller_note" label="卖家备注">
          {{ currentOrder.seller_note }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(currentOrder.created_at) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 校园易物 H5 端 · 我买入的订单
 * - 复用 /api/orders/ 接口，role=buyer
 * - 状态机：requested -> confirmed -> shipping -> completed / cancelled
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, ChatDotRound } from '@element-plus/icons-vue'
import { fetchOrders, completeOrder, cancelOrder, type Order } from '@/api/order'
import { PAGE_SIZE_SMALL } from '@/constants'

const router = useRouter()

const orders = ref<Order[]>([])
const total = ref(0)
const loading = ref(false)
const activeTab = ref('all')
const page = ref(1)
const pageSize = ref(PAGE_SIZE_SMALL)

/** 详情弹窗 */
const detailVisible = ref(false)
const currentOrder = ref<Order | null>(null)

/** 状态文案 */
function statusText(s: string): string {
  const map: Record<string, string> = {
    requested: '待卖家确认',
    confirmed: '卖家已确认',
    shipping: '交易中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[s] || s
}

/** 配送方式 */
function shippingText(m?: string): string {
  if (m === 'pickup') return '校园自取'
  if (m === 'express') return '快递'
  return '—'
}

function formatMoney(n: number) {
  return Number(n || 0).toFixed(2)
}

function formatDate(d?: string) {
  if (!d) return ''
  return d.replace('T', ' ').slice(0, 16)
}

function coverStyle(url?: string) {
  return url
    ? { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}
}

/** 加载列表 */
async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      role: 'buyer',
      page: page.value,
      page_size: pageSize.value,
    }
    if (activeTab.value !== 'all') params.status = activeTab.value
    const res = await fetchOrders(params)
    orders.value = res.results || []
    total.value = res.count || 0
  } catch (e) {
    console.error('[BuyerOrders] 加载失败', e)
    ElMessage.error('订单加载失败')
  } finally {
    loading.value = false
  }
}

/** 打开详情 */
function openDetail(o: Order) {
  currentOrder.value = o
  detailVisible.value = true
}

/** 联系卖家：跳到消息中心（带订单 ID） */
function contactSeller(o: Order) {
  if (!o.seller?.id) {
    ElMessage.warning('卖家信息不可用')
    return
  }
  router.push({ path: '/messages', query: { peer: String(o.seller.id) } })
}

/** 买家取消订单 */
async function onCancel(o: Order) {
  try {
    const { value } = await ElMessageBox.prompt('请输入取消原因（卖家可见）', '取消订单', {
      confirmButtonText: '确认取消',
      cancelButtonText: '再想想',
      inputPlaceholder: '例如：不想要了 / 找到更合适的',
    })
    await cancelOrder(o.id, value)
    ElMessage.success('订单已取消')
    loadData()
  } catch (e) {
    /* 用户取消或接口失败 */
  }
}

/** 买家确认收货 */
async function onComplete(o: Order) {
  try {
    await ElMessageBox.confirm('确认已收到货？此操作不可撤销', '确认收货', {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    await completeOrder(o.id)
    ElMessage.success('已完成交易')
    loadData()
  } catch (e) {
    console.error(e)
    ElMessage.error('操作失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.buyer-orders-page {
  padding: var(--space-5);
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
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

.order-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 400px;
}

.order-card {
  cursor: pointer;
  transition: box-shadow var(--duration-fast) var(--ease-out);
}

.order-card:hover {
  box-shadow: var(--shadow-md);
}

.order-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-3);
  border-bottom: 1px dashed var(--color-border-light);
  margin-bottom: var(--space-3);
}

.order-no {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.order-card-body {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.cover {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-base);
  background: var(--color-bg-section) center / cover no-repeat;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.credit {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.price {
  display: flex;
  align-items: baseline;
  color: var(--color-primary);
  flex-shrink: 0;
}

.price-symbol {
  font-size: var(--font-size-sm);
}

.price-num {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.order-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--color-border-light);
}

.action-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* 状态徽章:走全局 token,深浅色自动适配(见 style.css # 2.8) */
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: 1.6;
  background: var(--status-badge-bg, var(--color-bg-hover));
  color: var(--status-badge-fg, var(--color-text-tertiary));
}

.text-muted {
  color: var(--color-text-tertiary);
}

.pagination {
  margin-top: var(--space-5);
  justify-content: center;
}
</style>
