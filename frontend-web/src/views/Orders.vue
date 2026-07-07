<template>
  <div class="page-container">
    <div class="page-header">
      <h2>订单管理</h2>
      <div class="header-meta">
        <el-radio-group v-model="filters.role" size="default" @change="loadData">
          <el-radio-button value="seller">我卖出的</el-radio-button>
          <el-radio-button value="buyer">我买入的</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="order-tabs" @tab-change="onTabChange">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="待处理" name="pending" />
      <el-tab-pane label="进行中" name="shipping" />
      <el-tab-pane label="已完成" name="completed" />
      <el-tab-pane label="已取消" name="cancelled" />
    </el-tabs>

    <el-card shadow="never" class="table-card">
      <el-table
        v-loading="loading"
        :data="orders"
        stripe
        :header-cell-style="{ background: 'var(--color-bg-section)' }"
      >
        <el-table-column label="订单" min-width="280">
          <template #default="{ row }">
            <div class="order-cell">
              <div class="order-cover" :style="coverStyle(row.product?.image_url)">
                <el-icon v-if="!row.product?.image_url" :size="20" color="#CCC">
                  <Picture />
                </el-icon>
              </div>
              <div class="order-info">
                <div class="order-title" :title="row.product?.title">
                  {{ row.product?.title || '商品已下架' }}
                </div>
                <div class="order-meta text-muted">
                  订单号 #{{ row.id }} · {{ formatDate(row.created_at) }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="filters.role === 'seller' ? '买家' : '卖家'" width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="28" :src="(filters.role === 'seller' ? row.buyer : row.seller)?.avatar">
                {{ ((filters.role === 'seller' ? row.buyer : row.seller)?.username || 'U').charAt(0).toUpperCase() }}
              </el-avatar>
              <span>{{ (filters.role === 'seller' ? row.buyer : row.seller)?.username || '匿名' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span class="text-price">¥{{ formatMoney(row.price) }}</span>
            <div class="text-muted" style="font-size: 12px">
              {{ shippingText(row.shipping_method) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <span class="status-badge" :class="`status-badge--${row.status}`">
              {{ statusText(row.status) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
            <!-- 卖家端操作 -->
            <template v-if="filters.role === 'seller'">
              <el-button
                v-if="row.status === 'requested'"
                link
                type="success"
                size="small"
                @click="onConfirm(row)"
              >
                确认
              </el-button>
              <el-button
                v-if="row.status === 'requested'"
                link
                type="danger"
                size="small"
                @click="onCancel(row)"
              >
                拒绝
              </el-button>
              <el-button
                v-if="row.status === 'confirmed' || row.status === 'shipping'"
                link
                type="primary"
                size="small"
                @click="onComplete(row)"
              >
                标记完成
              </el-button>
            </template>
            <!-- 买家端操作 -->
            <template v-else>
              <el-button
                v-if="row.status === 'requested'"
                link
                type="danger"
                size="small"
                @click="onCancel(row)"
              >
                取消
              </el-button>
              <el-button
                v-if="row.status === 'confirmed' || row.status === 'shipping'"
                link
                type="primary"
                size="small"
                @click="onComplete(row)"
              >
                确认收货
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-if="!loading && !orders.length"
        description="暂无订单"
        :image-size="100"
      />

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

    <!-- 订单详情 / 操作弹窗 -->
    <el-dialog
      v-model="detailVisible"
      :title="`订单详情 #${currentOrder?.id || ''}`"
      width="560px"
      destroy-on-close
    >
      <div v-if="currentOrder" class="detail-body">
        <!-- 状态机步骤条 -->
        <el-steps :active="stepIndex" finish-status="success" align-center class="state-machine">
          <el-step title="提交" />
          <el-step title="确认" />
          <el-step title="交易中" />
          <el-step title="完成" />
        </el-steps>

        <el-descriptions :column="1" border style="margin-top: 16px">
          <el-descriptions-item label="商品">{{ currentOrder.product?.title }}</el-descriptions-item>
          <el-descriptions-item label="买家">{{ currentOrder.buyer?.username }}</el-descriptions-item>
          <el-descriptions-item label="卖家">{{ currentOrder.seller?.username }}</el-descriptions-item>
          <el-descriptions-item label="金额">¥{{ formatMoney(currentOrder.price) }}</el-descriptions-item>
          <el-descriptions-item label="配送方式">{{ shippingText(currentOrder.shipping_method) }}</el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.pickup_location" label="自取地点">
            {{ currentOrder.pickup_location }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.pickup_time" label="约定时间">
            {{ currentOrder.pickup_time }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <span class="status-badge" :class="`status-badge--${currentOrder.status}`">
              {{ statusText(currentOrder.status) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.buyer_message" label="买家留言">
            {{ currentOrder.buyer_message }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 确认订单弹窗（卖家端） -->
    <el-dialog
      v-model="confirmVisible"
      title="确认订单"
      width="480px"
      destroy-on-close
    >
      <el-form :model="confirmForm" label-width="100px">
        <el-form-item label="配送方式">
          <el-radio-group v-model="confirmForm.shipping_method">
            <el-radio value="pickup">校园自取</el-radio>
            <el-radio value="express">快递</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="confirmForm.shipping_method === 'pickup' ? '自取地点' : '快递地址'">
          <el-input v-model="confirmForm.pickup_location" placeholder="如：东门快递站 / 宿舍楼号" />
        </el-form-item>
        <el-form-item v-if="confirmForm.shipping_method === 'pickup'" label="约定时间">
          <el-input v-model="confirmForm.pickup_time" placeholder="如：本周六下午 3 点" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="primary" :loading="confirming" @click="submitConfirm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 订单管理
 * - Tab：全部 / 待处理 / 进行中 / 已完成 / 已取消
 * - 状态机可视化
 * - 角色切换：我卖出的 / 我买入的
 * - 操作：确认 / 拒绝 / 标记完成
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import {
  fetchOrders,
  confirmOrder,
  completeOrder,
  cancelOrder,
  type Order,
  type OrderStatus,
  type ShippingMethod,
} from '@/api/order'
import { formatMoney } from '@/utils'

// 加载态
const loading = ref(false)
// 订单列表
const orders = ref<Order[]>([])
// 总数
const total = ref(0)

/** Tab + 筛选 */
const activeTab = ref('all')
const filters = reactive({
  role: 'seller' as 'buyer' | 'seller',
  status: '' as OrderStatus | '',
  page: 1,
  page_size: 10,
})

/** 当前查看的订单 */
const currentOrder = ref<Order | null>(null)
const detailVisible = ref(false)

/** 确认订单弹窗 */
const confirmVisible = ref(false)
const confirming = ref(false)
const confirmForm = reactive({
  shipping_method: 'pickup' as ShippingMethod,
  pickup_location: '',
  pickup_time: '',
})
let pendingConfirmId: number | null = null

/** 状态 -> 步骤索引（用于步骤条） */
const stepIndex = computed(() => {
  if (!currentOrder.value) return 0
  const map: Record<string, number> = {
    requested: 1,
    confirmed: 2,
    shipping: 3,
    completed: 4,
    cancelled: 0,
  }
  return map[currentOrder.value.status] ?? 0
})

/** 状态 -> 中文 */
function statusText(s: string) {
  const map: Record<string, string> = {
    requested: '待确认',
    confirmed: '已确认',
    shipping: '交易中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[s] || s
}

/** 配送方式 -> 中文 */
function shippingText(m: string) {
  return m === 'pickup' ? '校园自取' : m === 'express' ? '快递' : '-'
}

/** 日期 */
function formatDate(iso: string) {
  if (!iso) return ''
  return iso.slice(0, 16).replace('T', ' ')
}

/** 封面图 */
function coverStyle(url?: string) {
  if (url) return { backgroundImage: `url(${url})` }
  return { background: 'var(--color-bg-hover)' }
}

/** Tab 切换 */
function onTabChange(name: string | number) {
  filters.status = (name === 'all' ? '' : String(name)) as OrderStatus | ''
  filters.page = 1
  loadData()
}

/** 分页 */
function onPageChange(p: number) {
  filters.page = p
  loadData()
}

/** 加载列表 */
async function loadData() {
  loading.value = true
  try {
    const res: any = await fetchOrders({
      role: filters.role,
      status: filters.status || undefined,
      page: filters.page,
      page_size: filters.page_size,
    })
    const data = res.data || res
    orders.value = data.results || []
    total.value = data.count || 0
  } catch (e) {
    console.error('[Orders] 加载失败', e)
  } finally {
    loading.value = false
  }
}

/** 打开详情 */
function openDetail(row: Order) {
  currentOrder.value = row
  detailVisible.value = true
}

/**
 * 卖家确认订单
 */
function onConfirm(row: Order) {
  pendingConfirmId = row.id
  confirmForm.shipping_method = 'pickup'
  confirmForm.pickup_location = ''
  confirmForm.pickup_time = ''
  confirmVisible.value = true
}

/** 提交确认 */
async function submitConfirm() {
  if (!pendingConfirmId) return
  confirming.value = true
  try {
    await confirmOrder(pendingConfirmId, {
      shipping_method: confirmForm.shipping_method,
      pickup_location: confirmForm.pickup_location,
      pickup_time: confirmForm.pickup_time,
    })
    ElMessage.success('已确认订单')
    confirmVisible.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '确认失败')
  } finally {
    confirming.value = false
  }
}

/** 标记完成 */
async function onComplete(row: Order) {
  try {
    await ElMessageBox.confirm('确定标记订单为已完成？完成后将无法再修改', '提示', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await completeOrder(row.id)
    ElMessage.success('已完成')
    loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '操作失败')
  }
}

/** 取消订单 */
async function onCancel(row: Order) {
  let reason = ''
  try {
    const { value } = await ElMessageBox.prompt('请输入取消原因（买家/卖家可见）', '取消订单', {
      inputPlaceholder: '选填，如「暂时不方便交易」',
      confirmButtonText: '确认取消',
      cancelButtonText: '不取消',
    })
    reason = value || ''
  } catch {
    return
  }
  try {
    await cancelOrder(row.id, reason)
    ElMessage.success('已取消')
    loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '取消失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.order-tabs {
  margin-bottom: var(--space-4);
}

.table-card {
  border-radius: var(--radius-md);
}

.header-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.order-cell {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.order-cover {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-base);
  background-size: cover;
  background-position: center;
  background-color: var(--color-bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.order-info {
  min-width: 0;
}

.order-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-meta {
  font-size: var(--font-size-xs);
  margin-top: 2px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.pagination {
  margin-top: var(--space-4);
  display: flex;
  justify-content: flex-end;
}

.detail-body {
  padding: 0 var(--space-2);
}

.state-machine {
  margin-bottom: var(--space-4);
}
</style>
