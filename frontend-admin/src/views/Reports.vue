<!--
  平台管理后台 · 举报处理（增强版）
  - 顶部横幅：举报任务概览
  - 状态 Tabs：待处理 / 已处理 / 已驳回（带徽标计数）
  - 统计卡：3 种状态数量 + 紧急举报数
  - 快捷原因筛选：违规类型
  - 表格 + 详情弹窗 + 处理弹窗
-->
<template>
  <div class="page-container reports-page">
    <!-- 页头 -->
    <div class="page-header">
      <div>
        <h2>举报处理</h2>
        <p class="subtitle">处理用户提交的商品违规举报，及时反馈处理结果</p>
      </div>
      <el-button :icon="Refresh" @click="loadData">刷新</el-button>
    </div>

    <!-- ========== 横幅 ========== -->
    <div class="hero-banner hero-banner--error">
      <div class="hero-banner__bg hero-banner__bg--1"></div>
      <div class="hero-banner__bg hero-banner__bg--2"></div>
      <div class="hero-banner__content">
        <div class="hero-banner__text">
          <h3 class="hero-banner__title">举报处理中心</h3>
          <p class="hero-banner__desc">快速响应违规举报，维护平台良好秩序</p>
          <div class="hero-banner__chips">
            <span class="hero-chip hero-chip--warning">
              <el-icon :size="14"><Bell /></el-icon>
              <span>待处理 {{ tabCounts.pending }}</span>
            </span>
            <span class="hero-chip hero-chip--success">
              <el-icon :size="14"><CircleCheck /></el-icon>
              <span>已处理 {{ tabCounts.handled }}</span>
            </span>
            <span class="hero-chip hero-chip--danger">
              <el-icon :size="14"><CircleClose /></el-icon>
              <span>已驳回 {{ tabCounts.dismissed }}</span>
            </span>
            <span class="hero-chip hero-chip--primary" v-if="data.length">
              <el-icon :size="14"><Document /></el-icon>
              <span>本次结果 {{ data.length }} 条</span>
            </span>
          </div>
        </div>
        <div class="hero-banner__ring">
          <el-icon :size="56"><Warning /></el-icon>
          <div class="hero-banner__ring-label">REPORTS</div>
        </div>
      </div>
    </div>

    <!-- ========== 统计卡 ========== -->
    <div v-loading="loading" class="stat-cards">
      <div class="stat-card warning">
        <div class="stat-icon">
          <el-icon :size="22"><Bell /></el-icon>
        </div>
        <div>
          <div class="label">待处理</div>
          <div class="value">{{ tabCounts.pending }}</div>
          <div class="sub">需要立即处理</div>
        </div>
      </div>
      <div class="stat-card income">
        <div class="stat-icon">
          <el-icon :size="22"><CircleCheck /></el-icon>
        </div>
        <div>
          <div class="label">已处理</div>
          <div class="value">{{ tabCounts.handled }}</div>
          <div class="sub">已生成处理结果</div>
        </div>
      </div>
      <div class="stat-card error">
        <div class="stat-icon">
          <el-icon :size="22"><CircleClose /></el-icon>
        </div>
        <div>
          <div class="label">已驳回</div>
          <div class="value">{{ tabCounts.dismissed }}</div>
          <div class="sub">非有效举报</div>
        </div>
      </div>
      <div class="stat-card info">
        <div class="stat-icon">
          <el-icon :size="22"><Histogram /></el-icon>
        </div>
        <div>
          <div class="label">本次结果</div>
          <div class="value">{{ data.length }}</div>
          <div class="sub">当前页 / 共 {{ total }} 条</div>
        </div>
      </div>
    </div>

    <!-- 状态 Tabs（增强） -->
    <el-tabs v-model="activeTab" @tab-change="loadData" class="audit-tabs">
      <el-tab-pane name="pending">
        <template #label>
          <span class="tab-label">
            <el-icon><Bell /></el-icon>
            <span>待处理</span>
            <el-badge v-if="tabCounts.pending" :value="tabCounts.pending" class="tab-badge" />
          </span>
        </template>
      </el-tab-pane>
      <el-tab-pane name="handled">
        <template #label>
          <span class="tab-label">
            <el-icon><CircleCheck /></el-icon>
            <span>已处理</span>
            <el-badge v-if="tabCounts.handled" :value="tabCounts.handled" class="tab-badge" type="success" />
          </span>
        </template>
      </el-tab-pane>
      <el-tab-pane name="dismissed">
        <template #label>
          <span class="tab-label">
            <el-icon><CircleClose /></el-icon>
            <span>已驳回</span>
            <el-badge v-if="tabCounts.dismissed" :value="tabCounts.dismissed" class="tab-badge" type="danger" />
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- 筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="query.keyword"
        placeholder="搜索举报人 / 原因 / 商品标题"
        clearable
        style="width: 280px"
        :prefix-icon="Search"
        @keyup.enter="loadData"
        @clear="loadData"
      />
      <el-select
        v-model="query.reason"
        placeholder="举报原因"
        clearable
        style="width: 180px"
        @change="loadData"
      >
        <el-option v-for="r in reasonOptions" :key="r.value" :label="r.label" :value="r.value" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
      <el-button :icon="RefreshLeft" @click="resetQuery">重置</el-button>
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
        empty-description="该状态下还没有举报记录"
        :show-retry="true"
        retry-text="重新加载"
        :skeleton-rows="8"
        :min-height="'420px'"
        @retry="loadData"
      >
        <template #default>
          <el-table :data="data" stripe style="width: 100%">
            <el-table-column label="举报人" width="170">
              <template #default="{ row }">
                <div class="reporter-cell">
                  <el-avatar :size="34" :src="row.reporter?.avatar">
                    {{ (row.reporter?.username || 'R').charAt(0).toUpperCase() }}
                  </el-avatar>
                  <div class="reporter-cell__text">
                    <span class="name">{{ row.reporter?.username || row.reporter_name || '匿名' }}</span>
                    <span v-if="row.reporter?.credit_score !== undefined" :class="['credit-badge', 'mini', creditClass(row.reporter.credit_score)]">
                      {{ row.reporter.credit_score }}
                    </span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="被举报商品" min-width="220">
              <template #default="{ row }">
                <div class="product-cell">
                  <span class="title">{{ row.product?.title || row.product_title || `商品 #${row.product_id}` }}</span>
                  <span v-if="row.product?.price" class="text-price">¥{{ formatMoney(row.product.price) }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="卖家" width="160">
              <template #default="{ row }">
                <div class="seller-cell">
                  <el-avatar :size="24" :src="row.product?.seller?.avatar">
                    {{ (row.product?.seller?.username || 'S').charAt(0).toUpperCase() }}
                  </el-avatar>
                  <span>{{ row.product?.seller?.username || row.seller_name || '--' }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="举报原因" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">
                <el-tag size="small" :type="reasonTagType(row.reason)" effect="light">
                  {{ row.reason_display || reasonText(row.reason) || '--' }}
                </el-tag>
                <div v-if="row.description" class="text-muted" style="margin-top: 4px; font-size: 12px">
                  {{ row.description }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <span :class="['status-badge', statusBadgeClass(row.status)]">
                  {{ statusText(row.status) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="提交时间" width="170" align="center">
              <template #default="{ row }">
                <span class="text-muted">{{ formatDate(row.created_at) }}</span>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="240" fixed="right" align="center">
              <template #default="{ row }">
                <template v-if="activeTab === 'pending'">
                  <el-dropdown trigger="click" @command="(cmd) => onAction(cmd, row)">
                    <el-button type="primary" size="small">
                      处理 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="warn">
                          <el-icon><Warning /></el-icon> 警告卖家
                        </el-dropdown-item>
                        <el-dropdown-item command="takedown" divided>
                          <el-icon><Delete /></el-icon> 下架商品
                        </el-dropdown-item>
                        <el-dropdown-item command="ban" divided>
                          <el-icon><CircleClose /></el-icon> 封禁卖家
                        </el-dropdown-item>
                        <el-dropdown-item command="dismiss" divided>
                          <el-icon><Close /></el-icon> 驳回举报
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </template>
                <el-button v-else link type="primary" size="small" @click="openDetailDialog(row)">查看详情</el-button>
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

    <!-- 处理弹窗（警告 / 下架 / 封禁 / 驳回） -->
    <el-dialog
      v-model="actionDialog.visible"
      :title="actionDialog.title"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="举报对象">
          <span>{{ actionDialog.row?.product?.title || actionDialog.row?.product_title || '--' }}</span>
        </el-form-item>
        <el-form-item label="举报原因">
          <el-tag size="small" :type="reasonTagType(actionDialog.row?.reason)" effect="light">
            {{ actionDialog.row?.reason_display || reasonText(actionDialog.row?.reason) || '--' }}
          </el-tag>
        </el-form-item>
        <el-form-item v-if="actionDialog.needRemark" label="处理备注">
          <el-input
            v-model="actionDialog.remark"
            type="textarea"
            :rows="3"
            :placeholder="remarkPlaceholder"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="actionDialog.visible = false">取消</el-button>
        <el-button :type="actionDialog.btnType" :loading="actionDialog.loading" @click="submitAction">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗（已处理 / 已驳回） -->
    <el-dialog
      v-model="detailDialog.visible"
      title="举报处理详情"
      width="540px"
    >
      <el-descriptions v-if="detailDialog.row" :column="1" border>
        <el-descriptions-item label="举报人">{{ detailDialog.row.reporter?.username || '匿名' }}</el-descriptions-item>
        <el-descriptions-item label="被举报商品">
          {{ detailDialog.row.product?.title || detailDialog.row.product_title || '--' }}
        </el-descriptions-item>
        <el-descriptions-item label="举报原因">
          {{ detailDialog.row.reason_display || reasonText(detailDialog.row.reason) || '--' }}
        </el-descriptions-item>
        <el-descriptions-item label="详细说明">{{ detailDialog.row.description || '（无）' }}</el-descriptions-item>
        <el-descriptions-item label="处理动作">
          {{ detailDialog.row.action_display || actionText(detailDialog.row.action) || '--' }}
        </el-descriptions-item>
        <el-descriptions-item label="处理备注">{{ detailDialog.row.remark || '（无）' }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ detailDialog.row.handler?.username || '--' }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ formatDate(detailDialog.row.handled_at) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="detailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 举报处理页面（增强版）
 * - /admin/reports/?status=pending&keyword=...
 * - 处理动作：warn 警告 / takedown 下架 / ban 封禁 / dismiss 驳回
 * - 横幅 + 4 统计卡 + Tabs 徽标
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  RefreshLeft,
  Warning,
  Delete,
  CircleClose,
  Close,
  ArrowDown,
  Bell,
  CircleCheck,
  Document,
  Histogram,
} from '@element-plus/icons-vue'
import { fetchReports, handleReport, fetchReportsCount } from '@/api'
import { useList } from '@/composables/useList'
import DataShell from '@/components/DataShell.vue'

const {
  data,
  total,
  loading,
  error,
  query,
  loadData,
  refresh,
} = useList(fetchReports, {
  defaultQuery: { keyword: '', reason: '', status: 'pending', page: 1, page_size: 20 },
  errorMessage: '举报列表加载失败',
})

const activeTab = ref('pending')

/* 各状态计数 */
const tabCounts = ref({ pending: 0, handled: 0, dismissed: 0 })

/* 同步 tab -> query.status */
watch(activeTab, (v) => {
  query.status = v
  query.page = 1
  loadData()
}, { immediate: true })

/* 处理弹窗 */
const actionDialog = reactive({
  visible: false,
  title: '',
  btnType: 'primary',
  needRemark: true,
  action: '',
  row: null,
  remark: '',
  loading: false,
})

/* 详情弹窗 */
const detailDialog = reactive({ visible: false, row: null })

/* 举报原因下拉（与后端 Report.REASON_CHOICES 一致：fake/prohibited/price/harassment/other）*/
const reasonOptions = [
  { value: 'fake',        label: '虚假信息' },
  { value: 'prohibited',  label: '违禁物品' },
  { value: 'price',       label: '价格异常' },
  { value: 'harassment',  label: '骚扰' },
  { value: 'other',       label: '其他' },
]

/* 备注占位符 */
const remarkPlaceholder = computed(() => {
  if (actionDialog.action === 'warn') return '请填写警告理由（将通知卖家）'
  if (actionDialog.action === 'takedown') return '请填写下架理由（将通知卖家）'
  if (actionDialog.action === 'ban') return '请填写封禁理由（将通知卖家）'
  return '请填写处理备注'
})

/**
 * 加载各状态计数（一次拉取所有）
 */
async function loadTabCounts() {
  try {
    const res = await fetchReportsCount().catch(() => ({}))
    tabCounts.value = {
      pending:   res?.pending   ?? res?.count ?? 0,
      handled:   res?.handled   ?? res?.count ?? 0,
      dismissed: res?.dismissed ?? res?.count ?? 0,
    }
  } catch (e) {
    // 静默失败
  }
}

/* 状态 -> badge class
 * 后端 Report 状态：pending / warned / removed / banned / rejected
 * 前端 Tabs 抽象状态：pending / handled(=warned|removed|banned) / dismissed(=rejected)
 */
function statusBadgeClass(status) {
  if (status === 'pending') return 'status-badge--auditing'
  if (status === 'warned' || status === 'handled' || status === 'resolved') return 'status-badge--handled'
  if (status === 'rejected' || status === 'dismissed' || status === 'closed') return 'status-badge--dismissed'
  if (status === 'removed' || status === 'banned') return 'status-badge--handled'
  return 'status-badge--cancelled'
}

/* 状态 -> 中文 */
function statusText(status) {
  if (status === 'pending') return '待处理'
  if (status === 'warned') return '已警告'
  if (status === 'removed') return '已下架'
  if (status === 'banned') return '已封禁'
  if (status === 'rejected') return '已驳回'
  // 兼容前端抽象状态
  if (status === 'handled' || status === 'resolved') return '已处理'
  if (status === 'dismissed' || status === 'closed') return '已驳回'
  return status || '--'
}

/* 动作 -> 中文 */
function actionText(action) {
  const map = { warn: '警告卖家', takedown: '下架商品', ban: '封禁卖家', dismiss: '驳回举报' }
  return map[action] || action || '--'
}

/* 原因 -> tag type（后端枚举值：fake/prohibited/price/harassment/other）*/
function reasonTagType(reason) {
  if (reason === 'fake' || reason === 'price') return 'warning'
  if (reason === 'prohibited' || reason === 'harassment') return 'danger'
  return 'info'
}

/* 原因 -> 中文显示 */
function reasonText(reason) {
  const found = reasonOptions.find((r) => r.value === reason)
  return found ? found.label : reason
}

/* 信用分等级 class */
function creditClass(score) {
  if (score >= 90) return 'credit-badge--high'
  if (score >= 60) return 'credit-badge--mid'
  return 'credit-badge--low'
}

/* 金额 */
function formatMoney(n) { return Number(n || 0).toFixed(2) }

/* 日期 */
function formatDate(iso) {
  if (!iso) return '--'
  return iso.slice(0, 19).replace('T', ' ')
}

/* 空态文案 */
const emptyText = computed(() => {
  if (activeTab.value === 'pending') return '暂无待处理举报'
  if (activeTab.value === 'handled') return '暂无已处理举报'
  return '暂无已驳回举报'
})

/**
 * 点击处理动作
 */
function onAction(cmd, row) {
  const map = {
    warn: { title: '警告卖家', btn: 'warning', needRemark: true },
    takedown: { title: '下架商品', btn: 'danger', needRemark: true },
    ban: { title: '封禁卖家', btn: 'danger', needRemark: true },
    dismiss: { title: '驳回举报', btn: 'info', needRemark: true },
  }
  const cfg = map[cmd] || {}
  actionDialog.title = cfg.title || '处理'
  actionDialog.btnType = cfg.btn || 'primary'
  actionDialog.needRemark = cfg.needRemark !== false
  actionDialog.action = cmd
  actionDialog.row = row
  actionDialog.remark = ''
  actionDialog.visible = true
}

/**
 * 提交处理动作
 */
async function submitAction() {
  if (actionDialog.needRemark && !actionDialog.remark.trim()) {
    ElMessage.warning('请填写处理备注')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认执行「${actionDialog.title}」？该操作将通过站内信通知相关用户。`,
      '操作确认',
      { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  actionDialog.loading = true
  try {
    // 前端 action -> 后端 action 映射：
    // takedown -> remove（下架商品），dismiss -> reject（驳回举报）
    const backendAction = ({
      takedown: 'remove',
      dismiss: 'reject',
    })[actionDialog.action] || actionDialog.action
    await handleReport(actionDialog.row.id, backendAction, actionDialog.remark.trim())
    ElMessage.success('已处理')
    actionDialog.visible = false
    loadData()
    loadTabCounts()
  } catch (e) {
    // 错误已统一提示
  } finally {
    actionDialog.loading = false
  }
}

/**
 * 查看详情
 */
function openDetailDialog(row) {
  detailDialog.row = row
  detailDialog.visible = true
}

/**
 * 重置查询
 */
function resetQuery() {
  query.keyword = ''
  query.reason = ''
  query.page = 1
  loadData()
}

onMounted(() => {
  loadData()
  loadTabCounts()
})
</script>

<style scoped>
.reports-page {
  /* 页面容器 */
}

.subtitle {
  margin: 4px 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.filter-spacer { flex: 1; }

.table-card {
  border-radius: var(--radius-md);
}

.reporter-cell {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.reporter-cell__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.3;
}

.reporter-cell__text .name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.credit-badge.mini {
  width: 22px;
  height: 22px;
  font-size: 10px;
}

.seller-cell {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
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
  white-space: nowrap;
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
  box-shadow: 0 6px 20px rgba(255, 77, 79, 0.2);
}

.hero-banner--error {
  background: linear-gradient(120deg, #FF7878 0%, #FF4D4F 60%, #D9363E 100%);
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
.hero-chip--danger  { background: rgba(255, 255, 255, 0.3); }
.hero-chip--warning { background: rgba(255, 165, 0, 0.3); }

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

/* status-badge 适配 */
:deep(.status-badge--auditing) {
  background: rgba(255, 165, 0, 0.12);
  color: var(--color-warning);
}
:deep(.status-badge--handled) {
  background: rgba(7, 193, 96, 0.12);
  color: var(--color-success);
}
:deep(.status-badge--dismissed) {
  background: rgba(255, 77, 79, 0.12);
  color: var(--color-error);
}
:deep(.status-badge--cancelled) {
  background: var(--color-bg-hover);
  color: var(--color-text-tertiary);
}
</style>
