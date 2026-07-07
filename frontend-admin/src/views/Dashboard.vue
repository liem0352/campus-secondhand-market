<!--
  平台管理后台 · 仪表盘
  - 6 个关键指标卡（用户/商品/在售/订单/待审核/待处理举报）
  - 用户增长折线图（30 天）
  - 商品发布柱状图（按分类）
  - 待办列表：待审核商品 + 待处理举报
-->
<template>
  <div class="page-container dashboard" v-loading="loading">
    <!-- 页头 -->
    <div class="page-header">
      <div>
        <h2>仪表盘</h2>
        <p class="subtitle">{{ greeting }}，{{ userStore.displayName }} · 今日 {{ today }} </p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="loadAll">刷新数据</el-button>
      </div>
    </div>

    <!-- ========== 横幅：平台运营数据高亮 ========== -->
    <div class="hero-banner">
      <div class="hero-banner__bg hero-banner__bg--1"></div>
      <div class="hero-banner__bg hero-banner__bg--2"></div>
      <div class="hero-banner__content">
        <div class="hero-banner__text">
          <h3 class="hero-banner__title">平台数据实时洞察</h3>
          <p class="hero-banner__desc">订单 / 用户 / 商品三大维度，全方位掌握平台运营状态</p>
          <div class="hero-banner__chips">
            <span class="hero-chip hero-chip--primary">活跃 {{ stats.user_count ?? 0 }} 用户</span>
            <span class="hero-chip hero-chip--success">在售 {{ stats.on_sale_count ?? 0 }} 商品</span>
            <span class="hero-chip hero-chip--warning">待审 {{ stats.pending_audit_count ?? 0 }}</span>
          </div>
        </div>
        <div class="hero-banner__ring">
          <el-icon :size="56"><DataAnalysis /></el-icon>
        </div>
      </div>
    </div>

    <!-- 关键指标卡（6 个） -->
    <div class="stat-cards">
      <div class="stat-card primary">
        <div class="stat-icon">
          <el-icon :size="24"><User /></el-icon>
        </div>
        <div class="stat-body">
          <div class="label">用户总数</div>
          <div class="value">{{ stats.user_count ?? '--' }}</div>
          <div class="sub">今日新增 +{{ stats.today_user_count ?? 0 }}</div>
        </div>
      </div>

      <div class="stat-card income">
        <div class="stat-icon">
          <el-icon :size="24"><Goods /></el-icon>
        </div>
        <div class="stat-body">
          <div class="label">商品总数</div>
          <div class="value">{{ stats.product_count ?? '--' }}</div>
          <div class="sub">今日发布 +{{ stats.today_product_count ?? 0 }}</div>
        </div>
      </div>

      <div class="stat-card info">
        <div class="stat-icon">
          <el-icon :size="24"><Sell /></el-icon>
        </div>
        <div class="stat-body">
          <div class="label">在售商品</div>
          <div class="value">{{ stats.on_sale_count ?? '--' }}</div>
          <div class="sub">占比 {{ onSaleRatio }}</div>
        </div>
      </div>

      <div class="stat-card credit">
        <div class="stat-icon">
          <el-icon :size="24"><List /></el-icon>
        </div>
        <div class="stat-body">
          <div class="label">订单总数</div>
          <div class="value">{{ stats.order_count ?? '--' }}</div>
          <div class="sub">已完成 {{ stats.completed_order_count ?? 0 }} 单</div>
        </div>
      </div>

      <div class="stat-card warning" @click="$router.push('/audit-products')">
        <div class="stat-icon">
          <el-icon :size="24"><Bell /></el-icon>
        </div>
        <div class="stat-body">
          <div class="label">待审核商品</div>
          <div class="value text-warning">{{ stats.pending_audit_count ?? '--' }}</div>
          <div class="sub action-hint">点击进入审核 <el-icon :size="12"><ArrowRight /></el-icon></div>
        </div>
      </div>

      <div class="stat-card error" @click="$router.push('/reports')">
        <div class="stat-icon">
          <el-icon :size="24"><Warning /></el-icon>
        </div>
        <div class="stat-body">
          <div class="label">待处理举报</div>
          <div class="value text-error">{{ stats.pending_report_count ?? '--' }}</div>
          <div class="sub action-hint">点击处理 <el-icon :size="12"><ArrowRight /></el-icon></div>
        </div>
      </div>
    </div>

    <!-- ========== 快捷入口栏 ========== -->
    <div class="quick-grid">
      <div class="quick-card" v-for="(item, idx) in quickEntries" :key="idx" @click="onQuickEntry(item)">
        <div class="quick-card__icon" :style="{ background: item.color + '14', color: item.color }">
          <el-icon :size="20"><component :is="item.icon" /></el-icon>
        </div>
        <div class="quick-card__body">
          <div class="quick-card__label">{{ item.label }}</div>
          <div class="quick-card__sub">{{ item.sub }}</div>
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="14">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>用户增长趋势（最近 30 天）</span>
              <el-tag size="small" type="info">日活</el-tag>
            </div>
          </template>
          <div v-loading="trendLoading" class="chart-box">
            <v-chart v-if="trendData.length" :option="trendOption" autoresize />
            <EmptyState
              v-else
              title="暂无增长数据"
              description="最近 30 天还没有用户增长记录"
              :compact="true"
              :size="72"
            />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>商品发布（按分类）</span>
            </div>
          </template>
          <div v-loading="categoryLoading" class="chart-box">
            <v-chart v-if="categoryData.length" :option="categoryOption" autoresize />
            <EmptyState
              v-else
              title="暂无分类数据"
              description="商品发布后将在此显示分类分布"
              :compact="true"
              :size="72"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 待办区 -->
    <el-row :gutter="16" class="todo-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="todo-card">
          <template #header>
            <div class="card-header">
              <span>待审核商品（最新 5 条）</span>
              <el-link type="primary" :underline="false" @click="$router.push('/audit-products')">
                查看全部
              </el-link>
            </div>
          </template>
          <div v-loading="pendingProductLoading" class="todo-list">
            <el-empty v-if="!pendingProducts.length" description="暂无待审核商品" :image-size="60" />
            <div
              v-for="p in pendingProducts"
              :key="p.id"
              class="todo-item"
              @click="$router.push('/audit-products')"
            >
              <div class="todo-cover" :style="coverStyle(p.cover)">
                <el-icon v-if="!p.cover" :size="24" color="#CCC"><Picture /></el-icon>
              </div>
              <div class="todo-content">
                <div class="todo-title">{{ p.title || `商品 #${p.id}` }}</div>
                <div class="todo-meta">
                  <span class="meta-item">¥{{ formatMoney(p.price) }}</span>
                  <span class="meta-item">{{ p.seller?.username || '匿名' }}</span>
                  <span class="time">{{ formatRelativeTime(p.created_at) }}</span>
                </div>
              </div>
              <el-button link type="primary" size="small">审核</el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="todo-card">
          <template #header>
            <div class="card-header">
              <span>待处理举报（最新 5 条）</span>
              <el-link type="primary" underline="never" @click="$router.push('/reports')">
                查看全部
              </el-link>
            </div>
          </template>
          <div v-loading="pendingReportLoading" class="todo-list">
            <el-empty v-if="!pendingReports.length" description="暂无待处理举报" :image-size="60" />
            <div
              v-for="r in pendingReports"
              :key="r.id"
              class="todo-item"
              @click="$router.push('/reports')"
            >
              <el-avatar :size="40" :src="r.reporter?.avatar">
                {{ (r.reporter?.username || 'R').charAt(0).toUpperCase() }}
              </el-avatar>
              <div class="todo-content">
                <div class="todo-title">{{ r.reason || '违规举报' }}</div>
                <div class="todo-meta">
                  <span class="meta-item">举报人：{{ r.reporter?.username || '匿名' }}</span>
                  <span class="time">{{ formatRelativeTime(r.created_at) }}</span>
                </div>
              </div>
              <el-button link type="danger" size="small">处理</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
/**
 * 平台管理后台 · 仪表盘
 * 关键功能：
 * - 拉取 /admin/dashboard/ 聚合指标
 * - 拉取 /admin/products/audit/?status=pending&page_size=5
 * - 拉取 /admin/reports/?status=pending&page_size=5
 * - 拉取用户增长 + 分类分布（如后端暂未提供，降级为本地 mock）
 * - ECharts 折线图 + 柱状图
 */
import { ref, computed, onMounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User,
  Goods,
  Sell,
  List,
  Bell,
  Warning,
  Picture,
  Refresh,
  ArrowRight,
  DataAnalysis,
  Tickets,
  ChatLineRound,
  Position,
  Histogram,
  SetUp,
} from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use as echartsUse } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'
import {
  fetchAdminDashboard,
  fetchAuditProducts,
  fetchReports,
  fetchUserTrend,
  fetchCategoryDistribution,
} from '@/api'
import { useUserStore } from '@/stores/user'
import EmptyState from '@/components/EmptyState.vue'

// 注册 ECharts 组件
echartsUse([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
])

const userStore = useUserStore()
const router = useRouter()

/* 加载态 */
const loading = ref(true)
const trendLoading = ref(true)
const categoryLoading = ref(true)
const pendingProductLoading = ref(true)
const pendingReportLoading = ref(true)

/* 数据 */
const stats = ref({})
const trendData = ref([])
const categoryData = ref([])
const pendingProducts = ref([])
const pendingReports = ref([])

/* 衍生数据：在售商品占比 */
const onSaleRatio = computed(() => {
  const total = Number(stats.value.product_count) || 0
  const onSale = Number(stats.value.on_sale_count) || 0
  if (!total) return '--'
  return ((onSale / total) * 100).toFixed(1) + '%'
})

/* 问候语 */
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

/* 今日日期 YYYY-MM-DD */
const today = computed(() => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})

/* ========== 快捷入口配置 ========== */
const quickEntries = [
  { key: 'audit',    label: '商品审核', sub: '审核待发布',         icon: markRaw(Tickets),       color: '#FF6B35', to: '/audit-products' },
  { key: 'users',    label: '用户管理', sub: '封禁/调分',           icon: markRaw(User),          color: '#1989FA', to: '/users' },
  { key: 'reports',  label: '举报处理', sub: '查看违规',           icon: markRaw(Warning),       color: '#F56C6C', to: '/reports' },
  { key: 'cats',     label: '分类管理', sub: '维护目录',           icon: markRaw(Position),      color: '#07C160', to: '/categories' },
  { key: 'logs',     label: '审计日志', sub: '操作回溯',           icon: markRaw(Histogram),     color: '#9B59B6', to: '/audit-logs' },
  { key: 'ai',       label: 'AI 配置',  sub: '模型参数',           icon: markRaw(ChatLineRound), color: '#7C3AED', to: '/ai-config' },
]

/**
 * 触发快捷入口跳转
 * @param {Object} item 入口对象（含 to 字段）
 */
function onQuickEntry(item) {
  if (item.to) router.push(item.to)
}

/* 折线图配置（用户增长） */
const trendOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' },
  },
  legend: { data: ['新增用户', '活跃用户'], right: 10, top: 0, icon: 'roundRect' },
  grid: { left: 50, right: 30, top: 36, bottom: 30 },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: trendData.value.map((d) => d.date),
    axisLine: { lineStyle: { color: 'var(--color-border-light)' } },
    axisLabel: { color: 'var(--color-text-secondary)', fontSize: 11 },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: 'var(--color-text-secondary)', fontSize: 11 },
    splitLine: { lineStyle: { type: 'dashed', color: 'var(--color-border-light)' } },
  },
  series: [
    {
      name: '新增用户',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: trendData.value.map((d) => Number(d.new_count) || 0),
      itemStyle: { color: 'var(--color-primary)' },
      lineStyle: { width: 3 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(255, 107, 53, 0.35)' },
            { offset: 1, color: 'rgba(255, 107, 53, 0.02)' },
          ],
        },
      },
    },
    {
      name: '活跃用户',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: trendData.value.map((d) => Number(d.active_count) || 0),
      itemStyle: { color: 'var(--color-success)' },
      lineStyle: { width: 2, type: 'dashed' },
    },
  ],
}))

/* 柱状图配置（分类分布） */
const categoryOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    valueFormatter: (v) => v + ' 件',
  },
  legend: { show: false },
  grid: { left: 70, right: 30, top: 16, bottom: 30 },
  xAxis: {
    type: 'value',
    axisLabel: { color: 'var(--color-text-secondary)', fontSize: 11 },
    splitLine: { lineStyle: { type: 'dashed', color: 'var(--color-border-light)' } },
  },
  yAxis: {
    type: 'category',
    data: categoryData.value.map((d) => d.name),
    axisLine: { lineStyle: { color: 'var(--color-border-light)' } },
    axisLabel: { color: 'var(--color-text-secondary)', fontSize: 12 },
  },
  series: [
    {
      name: '商品数',
      type: 'bar',
      barWidth: 18,
      data: categoryData.value.map((d) => d.value),
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: 'var(--color-primary-soft)' },
            { offset: 1, color: 'var(--color-primary)' },
          ],
        },
        borderRadius: [0, 4, 4, 0],
      },
    },
  ],
}))

/**
 * 格式化金额（保留 2 位小数）
 */
function formatMoney(n) {
  return Number(n || 0).toFixed(2)
}

/**
 * 相对时间
 */
function formatRelativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} 天前`
  return iso.slice(0, 10)
}

/**
 * 封面背景图
 */
function coverStyle(url) {
  if (url) return { backgroundImage: `url(${url})` }
  return { background: 'var(--color-bg-hover)' }
}

/**
 * 生成最近 30 天日期数组（用于降级 mock）
 */
function genLast30Days() {
  const arr = []
  const d = new Date()
  for (let i = 29; i >= 0; i--) {
    const x = new Date(d)
    x.setDate(d.getDate() - i)
    const m = String(x.getMonth() + 1).padStart(2, '0')
    const day = String(x.getDate()).padStart(2, '0')
    arr.push({ date: `${m}-${day}`, new_count: 0, active_count: 0 })
  }
  return arr
}

/**
 * 加载仪表盘聚合指标
 */
async function loadStats() {
  try {
    const res = await fetchAdminDashboard()
    const data = res?.data || res || {}
    stats.value = {
      user_count: data.user_count ?? 0,
      product_count: data.product_count ?? 0,
      on_sale_count: data.on_sale_count ?? 0,
      order_count: data.order_count ?? 0,
      completed_order_count: data.completed_order_count ?? 0,
      pending_audit_count: data.pending_audit_count ?? 0,
      pending_report_count: data.pending_report_count ?? 0,
      today_user_count: data.today_user_count ?? 0,
      today_product_count: data.today_product_count ?? 0,
    }
  } catch (e) {
    console.warn('[Dashboard] 指标加载失败', e)
  } finally {
    loading.value = false
  }
}

/**
 * 加载用户增长趋势
 */
async function loadTrend() {
  trendLoading.value = true
  try {
    const res = await fetchUserTrend({ days: 30 }).catch(() => null)
    const data = res?.data?.trend || res?.trend || []
    if (data.length) {
      trendData.value = data
    } else {
      // 降级 mock
      const arr = genLast30Days()
      arr.forEach((d) => {
        d.new_count = Math.floor(Math.random() * 30) + 5
        d.active_count = Math.floor(Math.random() * 80) + 20
      })
      trendData.value = arr
    }
  } catch (e) {
    trendData.value = genLast30Days()
  } finally {
    trendLoading.value = false
  }
}

/**
 * 加载分类分布
 */
async function loadCategory() {
  categoryLoading.value = true
  try {
    const res = await fetchCategoryDistribution().catch(() => null)
    const data = res?.data?.distribution || res?.distribution || []
    if (data.length) {
      categoryData.value = data
    } else {
      // 降级 mock
      categoryData.value = [
        { name: '教材书籍', value: 128 },
        { name: '数码电子', value: 86 },
        { name: '生活用品', value: 64 },
        { name: '服饰鞋帽', value: 42 },
        { name: '美妆护肤', value: 30 },
        { name: '运动户外', value: 22 },
      ]
    }
  } catch (e) {
    categoryData.value = []
  } finally {
    categoryLoading.value = false
  }
}

/**
 * 加载待审核商品
 */
async function loadPendingProducts() {
  pendingProductLoading.value = true
  try {
    const res = await fetchAuditProducts({ status: 'pending', page_size: 5 })
    const list = res?.results || res?.data?.results || res || []
    pendingProducts.value = Array.isArray(list) ? list : []
  } catch (e) {
    pendingProducts.value = []
  } finally {
    pendingProductLoading.value = false
  }
}

/**
 * 加载待处理举报
 */
async function loadPendingReports() {
  pendingReportLoading.value = true
  try {
    const res = await fetchReports({ status: 'pending', page_size: 5 })
    const list = res?.results || res?.data?.results || res || []
    pendingReports.value = Array.isArray(list) ? list : []
  } catch (e) {
    pendingReports.value = []
  } finally {
    pendingReportLoading.value = false
  }
}

/**
 * 一键刷新所有数据
 */
async function loadAll() {
  loading.value = true
  await Promise.all([loadStats(), loadTrend(), loadCategory(), loadPendingProducts(), loadPendingReports()])
  ElMessage.success('数据已刷新')
}

onMounted(() => {
  loadAll()
})

// 暴露给模板使用（避免 lint 报未使用）
const _icons = markRaw({ Refresh })
void _icons
</script>

<style scoped>
.dashboard {
  /* 页面整体 */
}

.subtitle {
  margin: 4px 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* ========== Hero 横幅 ========== */
.hero-banner {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
  padding: var(--space-5) var(--space-5);
  margin-bottom: var(--space-4);
  background: linear-gradient(135deg, #FF6B35 0%, #FF8A5B 50%, #7C3AED 100%);
  color: #fff;
  box-shadow: 0 4px 18px rgba(255, 107, 53, 0.18);
}

.hero-banner__bg {
  position: absolute;
  border-radius: 50%;
  filter: blur(36px);
  opacity: 0.55;
}

.hero-banner__bg--1 {
  width: 200px;
  height: 200px;
  top: -60px;
  right: -40px;
  background: rgba(255, 255, 255, 0.4);
}

.hero-banner__bg--2 {
  width: 160px;
  height: 160px;
  bottom: -50px;
  right: 240px;
  background: rgba(124, 58, 237, 0.5);
}

.hero-banner__content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-5);
  z-index: 1;
}

.hero-banner__title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: var(--font-weight-bold);
}

.hero-banner__desc {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-sm);
  opacity: 0.92;
}

.hero-banner__chips {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.hero-chip {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: var(--font-size-xs);
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
}

.hero-banner__ring {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

/* ========== 快捷入口 ========== */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.quick-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  border: 1px solid var(--color-border-light);
}

.quick-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  border-color: var(--color-primary-soft);
}

.quick-card__icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-card__body {
  min-width: 0;
}

.quick-card__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.quick-card__sub {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.header-actions {
  display: flex;
  gap: var(--space-2);
}

.stat-body {
  flex: 1;
  min-width: 0;
}

.stat-card {
  cursor: default;
}

.stat-card.warning,
.stat-card.error {
  cursor: pointer;
}

.text-warning {
  color: var(--color-warning);
}

.text-error {
  color: var(--color-error);
}

.action-hint {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.chart-row,
.todo-row {
  margin-bottom: var(--space-5);
}

.chart-card,
.todo-card {
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.chart-box {
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 待办列表 */
.todo-list {
  min-height: 240px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-divider);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out);
}

.todo-item:hover {
  background: var(--color-bg-hover);
  margin: 0 -16px;
  padding-left: 16px;
  padding-right: 16px;
  border-radius: var(--radius-base);
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-cover {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-base);
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-hover);
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.todo-meta .meta-item {
  padding: 0 4px;
}

.todo-meta .time {
  margin-left: auto;
}
</style>
