<!--
  平台管理后台 · 商品审核（增强版）
  - 顶部横幅：审核任务概览
  - Tabs：待审核 / 已通过 / 已驳回（带徽标计数）
  - 统计卡：3 种状态数量
  - 表格 + 详情弹窗 + 驳回弹窗
-->
<template>
  <div class="page-container audit-page">
    <!-- 页头 -->
    <div class="page-header">
      <div>
        <h2>商品审核</h2>
        <p class="subtitle">审核用户发布的商品，确保信息真实合规</p>
      </div>
      <el-button :icon="Refresh" @click="loadData">刷新</el-button>
    </div>

    <!-- ========== 横幅 ========== -->
    <div class="hero-banner hero-banner--warning">
      <div class="hero-banner__bg hero-banner__bg--1"></div>
      <div class="hero-banner__bg hero-banner__bg--2"></div>
      <div class="hero-banner__content">
        <div class="hero-banner__text">
          <h3 class="hero-banner__title">商品审核中心</h3>
          <p class="hero-banner__desc">及时处理用户发布的商品，保障平台内容质量</p>
          <div class="hero-banner__chips">
            <span class="hero-chip hero-chip--warning">
              <el-icon :size="14"><Loading /></el-icon>
              <span>待审核 {{ tabCounts.pending }}</span>
            </span>
            <span class="hero-chip hero-chip--success">
              <el-icon :size="14"><CircleCheck /></el-icon>
              <span>已通过 {{ tabCounts.approved }}</span>
            </span>
            <span class="hero-chip hero-chip--danger">
              <el-icon :size="14"><CircleClose /></el-icon>
              <span>已驳回 {{ tabCounts.rejected }}</span>
            </span>
            <span class="hero-chip hero-chip--primary">
              <el-icon :size="14"><Document /></el-icon>
              <span>本次结果 {{ data.length }} 条</span>
            </span>
          </div>
        </div>
        <div class="hero-banner__ring">
          <el-icon :size="56"><DocumentChecked /></el-icon>
          <div class="hero-banner__ring-label">AUDIT</div>
        </div>
      </div>
    </div>

    <!-- 状态 Tabs（增强） -->
    <el-tabs v-model="activeTab" @tab-change="loadData" class="audit-tabs">
      <el-tab-pane name="pending">
        <template #label>
          <span class="tab-label">
            <el-icon><Loading /></el-icon>
            <span>待审核</span>
            <el-badge v-if="tabCounts.pending" :value="tabCounts.pending" class="tab-badge" />
          </span>
        </template>
      </el-tab-pane>
      <el-tab-pane name="approved">
        <template #label>
          <span class="tab-label">
            <el-icon><CircleCheck /></el-icon>
            <span>已通过</span>
            <el-badge v-if="tabCounts.approved" :value="tabCounts.approved" class="tab-badge" type="success" />
          </span>
        </template>
      </el-tab-pane>
      <el-tab-pane name="rejected">
        <template #label>
          <span class="tab-label">
            <el-icon><CircleClose /></el-icon>
            <span>已驳回</span>
            <el-badge v-if="tabCounts.rejected" :value="tabCounts.rejected" class="tab-badge" type="danger" />
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- 筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="query.keyword"
        placeholder="搜索商品标题 / 卖家"
        clearable
        style="width: 280px"
        :prefix-icon="Search"
        @keyup.enter="loadData"
        @clear="loadData"
      />
      <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
      <span class="filter-spacer" />
      <span class="text-secondary">共 {{ total }} 条</span>
    </div>

    <!-- 表格 -->
    <el-card class="table-card" shadow="never">
      <DataShell
        :data="data"
        :loading="loading"
        :error="error"
        :empty-title="emptyText"
        empty-description="该状态下还没有商品记录"
        :show-retry="true"
        retry-text="重新加载"
        :skeleton-rows="8"
        :min-height="'420px'"
        @retry="loadData"
      >
        <template #default>
          <el-table :data="data" stripe style="width: 100%">
            <el-table-column label="商品图" width="80" align="center">
              <template #default="{ row }">
                <div class="product-cover" :style="coverStyle(row.cover || row.images?.[0]?.image_url)">
                  <el-icon v-if="!row.cover && !row.images?.length" :size="24" color="#CCC"><Picture /></el-icon>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="标题" min-width="220">
              <template #default="{ row }">
                <div class="product-cell">
                  <span class="title">{{ row.title || `商品 #${row.id}` }}</span>
                  <span v-if="row.description" class="desc text-muted">{{ row.description }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="卖家" width="140">
              <template #default="{ row }">
                <div class="seller-cell">
                  <el-avatar :size="24" :src="row.seller?.avatar">
                    {{ (row.seller?.username || 'S').charAt(0).toUpperCase() }}
                  </el-avatar>
                  <span>{{ row.seller?.username || row.seller_name || '匿名' }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="价格" width="100" align="right">
              <template #default="{ row }">
                <span class="text-price">¥{{ formatMoney(row.price) }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="category_name" label="分类" width="120" show-overflow-tooltip />

            <el-table-column label="提交时间" width="170" align="center">
              <template #default="{ row }">
                <span class="text-muted">{{ formatDate(row.created_at) }}</span>
              </template>
            </el-table-column>

            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <span :class="['status-badge', statusBadgeClass(row.audit_status || row.status)]">
                  {{ statusText(row.audit_status || row.status) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="200" fixed="right" align="center">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openDetailDialog(row)">查看详情</el-button>
                <template v-if="activeTab === 'pending'">
                  <el-button link type="success" size="small" @click="handleApprove(row)">通过</el-button>
                  <el-button link type="danger" size="small" @click="openRejectDialog(row)">驳回</el-button>
                </template>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </DataShell>

      <div v-if="data.length" class="pagination-bar">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.page_size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailDialog.visible"
      :title="detailDialog.row?.title || '商品详情'"
      width="720px"
      :close-on-click-modal="false"
    >
      <div v-if="detailDialog.row" class="detail-dialog">
        <el-carousel
          v-if="detailDialog.row.images && detailDialog.row.images.length"
          :interval="4000"
          height="320px"
          class="detail-carousel"
        >
          <el-carousel-item v-for="(img, idx) in detailDialog.row.images" :key="idx">
            <img :src="img.image_url || img.url" :alt="`商品图 ${idx + 1}`" class="carousel-img" />
          </el-carousel-item>
        </el-carousel>
        <div v-else-if="detailDialog.row.cover" class="detail-cover-fallback">
          <img :src="detailDialog.row.cover" alt="cover" class="carousel-img" />
        </div>
        <div v-else class="detail-empty-cover">
          <el-icon :size="48" color="#CCC"><Picture /></el-icon>
          <span>暂无商品图</span>
        </div>

        <el-descriptions :column="2" border class="detail-desc">
          <el-descriptions-item label="商品标题">{{ detailDialog.row.title }}</el-descriptions-item>
          <el-descriptions-item label="价格">
            <span class="text-price">¥{{ formatMoney(detailDialog.row.price) }}</span>
            <span v-if="detailDialog.row.original_price" class="text-muted" style="text-decoration: line-through; margin-left: 8px">
              ¥{{ formatMoney(detailDialog.row.original_price) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="分类">{{ detailDialog.row.category_name || '--' }}</el-descriptions-item>
          <el-descriptions-item label="成色">{{ conditionText(detailDialog.row.condition) }}</el-descriptions-item>
          <el-descriptions-item label="所在学校">{{ detailDialog.row.school || '--' }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDate(detailDialog.row.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="卖家">
            <div class="seller-info">
              <el-avatar :size="28" :src="detailDialog.row.seller?.avatar">
                {{ (detailDialog.row.seller?.username || 'S').charAt(0).toUpperCase() }}
              </el-avatar>
              <span>{{ detailDialog.row.seller?.username || '匿名' }}</span>
              <span v-if="detailDialog.row.seller?.credit_score !== undefined" :class="['credit-badge', 'mini', creditClass(detailDialog.row.seller.credit_score)]">
                {{ detailDialog.row.seller.credit_score }}
              </span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ detailDialog.row.contact || '私聊议价' }}</el-descriptions-item>
          <el-descriptions-item label="商品描述" :span="2">
            <pre class="desc-text">{{ detailDialog.row.description || '（无描述）' }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
        <template v-if="detailDialog.row && activeTab === 'pending'">
          <el-button type="danger" :icon="CircleClose" @click="openRejectDialog(detailDialog.row)">驳回</el-button>
          <el-button type="success" :icon="Check" @click="handleApprove(detailDialog.row)">通过</el-button>
        </template>
      </template>
    </el-dialog>

    <!-- 驳回理由弹窗 -->
    <el-dialog
      v-model="rejectDialog.visible"
      title="驳回商品"
      width="460px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="商品">
          <span>{{ rejectDialog.row?.title || '--' }}</span>
        </el-form-item>
        <el-form-item label="驳回理由" required>
          <el-select
            v-model="rejectDialog.preset"
            placeholder="选择常见理由（可继续编辑）"
            style="width: 100%"
            @change="onPresetChange"
          >
            <el-option label="图片不清晰 / 与描述不符" value="图片不清晰 / 与描述不符" />
            <el-option label="商品信息违规" value="商品信息违规" />
            <el-option label="疑似假货 / 盗版" value="疑似假货 / 盗版" />
            <el-option label="价格异常" value="价格异常" />
            <el-option label="联系方式不合规" value="联系方式不合规" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细说明" required>
          <el-input
            v-model="rejectDialog.reason"
            type="textarea"
            :rows="4"
            placeholder="请详细说明驳回原因，将通过站内信通知卖家"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialog.visible = false">取消</el-button>
        <el-button type="danger" :loading="rejectDialog.loading" @click="submitReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 商品审核页面（增强版）
 * - Tab 切换审核状态
 * - 顶部横幅 + 状态计数
 * - /admin/products/audit/?status=pending&keyword=...
 * - 通过：直接调用 approve
 * - 驳回：弹窗填写理由（支持预设常见理由） -> reject
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Picture,
  Check,
  CircleClose,
  Loading,
  CircleCheck,
  Document,
  DocumentChecked,
} from '@element-plus/icons-vue'
import { fetchAuditProducts, approveProduct, rejectProduct, fetchAuditProductCount } from '@/api'
import { useList } from '@/composables/useList'
import DataShell from '@/components/DataShell.vue'

/* 列表数据 composable */
const {
  data,
  total,
  loading,
  error,
  query,
  loadData,
  refresh,
} = useList(fetchAuditProducts, {
  defaultQuery: { keyword: '', status: 'pending', page: 1, page_size: 20 },
  errorMessage: '商品审核列表加载失败',
})

/* 当前 Tab */
const activeTab = ref('pending')

/* 各状态计数 */
const tabCounts = ref({ pending: 0, approved: 0, rejected: 0 })

/* 详情弹窗 */
const detailDialog = reactive({ visible: false, row: null })

/* 驳回弹窗 */
const rejectDialog = reactive({
  visible: false,
  row: null,
  preset: '',
  reason: '',
  loading: false,
})

/* 同步 tab -> query.status
 * 前端抽象状态：pending / approved / rejected
 * 后端 Product 状态：pending / on_sale(已通过) / off_shelf(已驳回)
 */
const TAB_TO_BACKEND_STATUS = {
  pending:  'pending',
  approved: 'on_sale',
  rejected: 'off_shelf',
}
watch(activeTab, (v) => {
  query.status = TAB_TO_BACKEND_STATUS[v] || v
  query.page = 1
  loadData()
}, { immediate: true })

/**
 * 加载各状态计数
 */
async function loadTabCounts() {
  try {
    // 一次拉取所有状态计数（后端 /admin/products/audit/count/ 返回 {pending,approved,rejected,all}）
    const res = await fetchAuditProductCount().catch(() => ({}))
    tabCounts.value = {
      pending:  res?.pending  ?? res?.count ?? 0,
      approved: res?.approved ?? res?.count ?? 0,
      rejected: res?.rejected ?? res?.count ?? 0,
    }
  } catch (e) {
    // 静默失败
  }
}

/* 状态 -> badge class */
function statusBadgeClass(status) {
  if (status === 'pending' || status === 'auditing') return 'status-badge--auditing'
  if (status === 'approved' || status === 'on_sale') return 'status-badge--approved'
  if (status === 'rejected' || status === 'off_shelf') return 'status-badge--rejected'
  return 'status-badge--cancelled'
}

/* 状态 -> 中文 */
function statusText(status) {
  if (status === 'pending' || status === 'auditing') return '待审核'
  if (status === 'approved') return '已通过'
  if (status === 'on_sale') return '在售'
  if (status === 'rejected') return '已驳回'
  if (status === 'off_shelf') return '已下架'
  return status || '--'
}

/* 成色 -> 中文 */
function conditionText(c) {
  const map = { new: '全新', like_new: '几乎全新', good: '九成新', fair: '一般' }
  return map[c] || c || '--'
}

/* 信用分 class */
function creditClass(score) {
  if (score >= 90) return 'credit-badge--high'
  if (score >= 60) return 'credit-badge--mid'
  return 'credit-badge--low'
}

/* 格式化金额 */
function formatMoney(n) {
  return Number(n || 0).toFixed(2)
}

/* 格式化日期 */
function formatDate(iso) {
  if (!iso) return '--'
  return iso.slice(0, 19).replace('T', ' ')
}

/* 封面图背景 */
function coverStyle(url) {
  if (url) return { backgroundImage: `url(${url})` }
  return { background: 'var(--color-bg-hover)' }
}

/* 空态文案 */
const emptyText = computed(() => {
  if (activeTab.value === 'pending') return '暂无待审核商品'
  if (activeTab.value === 'approved') return '暂无已通过商品'
  return '暂无已驳回商品'
})

/**
 * 打开详情弹窗
 */
function openDetailDialog(row) {
  detailDialog.row = row
  detailDialog.visible = true
}

/**
 * 打开驳回弹窗
 */
function openRejectDialog(row) {
  rejectDialog.row = row
  rejectDialog.preset = ''
  rejectDialog.reason = ''
  rejectDialog.visible = true
  detailDialog.visible = false
}

/**
 * 预设理由选择 -> 自动填入
 */
function onPresetChange(v) {
  rejectDialog.reason = v
}

/**
 * 提交驳回
 */
async function submitReject() {
  if (!rejectDialog.reason || !rejectDialog.reason.trim()) {
    ElMessage.warning('请填写驳回理由')
    return
  }
  try {
    await ElMessageBox.confirm(`确认驳回商品「${rejectDialog.row.title}」？`, '驳回确认', {
      type: 'warning',
      confirmButtonText: '确认驳回',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
    })
  } catch {
    return
  }
  rejectDialog.loading = true
  try {
    await rejectProduct(rejectDialog.row.id, rejectDialog.reason.trim())
    ElMessage.success('已驳回')
    rejectDialog.visible = false
    loadData()
    loadTabCounts()
  } catch (e) {
    // 错误已统一提示
  } finally {
    rejectDialog.loading = false
  }
}

/**
 * 通过审核
 */
async function handleApprove(row) {
  try {
    await ElMessageBox.confirm(`确认通过商品「${row.title}」？通过后将上架到商品流。`, '通过确认', {
      type: 'success',
      confirmButtonText: '通过',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    await approveProduct(row.id, '审核通过')
    ElMessage.success('已通过')
    detailDialog.visible = false
    loadData()
    loadTabCounts()
  } catch (e) {
    // 错误已统一提示
  }
}

onMounted(() => {
  loadData()
  loadTabCounts()
})
</script>

<style scoped>
.audit-page {
  /* 页面容器 */
}

.subtitle {
  margin: 4px 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.filter-spacer {
  flex: 1;
}

.table-card {
  border-radius: var(--radius-md);
}

.product-cover {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-base);
  background-size: cover;
  background-position: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-hover);
}

.product-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 280px;
}

.product-cell .title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.product-cell .desc {
  font-size: var(--font-size-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.seller-cell {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-4);
}

/* ========== 横幅 ========== */
.hero-banner {
  position: relative;
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  margin-bottom: var(--space-4);
  color: #fff;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(255, 165, 0, 0.2);
}

.hero-banner--warning {
  background: linear-gradient(120deg, #FFC36B 0%, #FFA500 60%, #FF8800 100%);
}

.hero-banner__bg {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.hero-banner__bg--1 {
  top: -40px;
  right: 100px;
  width: 180px;
  height: 180px;
  background: rgba(255, 255, 255, 0.14);
}

.hero-banner__bg--2 {
  bottom: -50px;
  right: -30px;
  width: 140px;
  height: 140px;
  background: rgba(255, 255, 255, 0.08);
}

.hero-banner__content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.hero-banner__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: 4px;
  color: #fff;
}

.hero-banner__desc {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: var(--space-3);
}

.hero-banner__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  backdrop-filter: blur(2px);
}

.hero-chip--primary { background: rgba(255, 255, 255, 0.22); }
.hero-chip--success { background: rgba(7, 193, 96, 0.3); }
.hero-chip--danger  { background: rgba(255, 77, 79, 0.3); }
.hero-chip--warning { background: rgba(255, 255, 255, 0.3); }

.hero-banner__ring {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 6px rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(4px);
}

.hero-banner__ring-label {
  font-size: 10px;
  margin-top: 4px;
  opacity: 0.85;
  letter-spacing: 1px;
}

/* ========== Tabs 增强 ========== */
.audit-tabs {
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  padding: 0 var(--space-4);
  margin-bottom: var(--space-3);
  box-shadow: var(--shadow-sm);
}

.audit-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  padding: 0 8px;
}

.tab-badge {
  margin-left: 4px;
}

.tab-badge :deep(.el-badge__content) {
  font-size: 10px;
  height: 16px;
  line-height: 16px;
  padding: 0 4px;
}

/* ========== 详情弹窗 ========== */
.detail-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.detail-carousel {
  border-radius: var(--radius-md);
  overflow: hidden;
}

.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: var(--color-bg-section);
}

.detail-cover-fallback {
  height: 320px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-section);
}

.detail-empty-cover {
  height: 200px;
  border-radius: var(--radius-md);
  background: var(--color-bg-section);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.detail-desc {
  border-radius: var(--radius-md);
}

.seller-info {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.credit-badge.mini {
  width: 24px;
  height: 24px;
  font-size: 10px;
}

.desc-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
}

/* status-badge 适配 */
:deep(.status-badge--auditing) {
  background: rgba(255, 165, 0, 0.12);
  color: var(--color-warning);
}
:deep(.status-badge--approved) {
  background: rgba(7, 193, 96, 0.12);
  color: var(--color-success);
}
:deep(.status-badge--rejected) {
  background: rgba(255, 77, 79, 0.12);
  color: var(--color-error);
}
:deep(.status-badge--cancelled) {
  background: var(--color-bg-hover);
  color: var(--color-text-tertiary);
}
</style>
