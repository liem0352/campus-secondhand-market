<!--
  平台管理后台 · 审计日志（增强版）
  - 顶部横幅：审计概览
  - 时间维度统计：今天 / 7 天 / 30 天
  - 快捷时间筛选：今天 / 7 天 / 30 天 / 自定义
  - 操作类型筛选：下拉
  - 表格：操作人 / 类型 / 目标 / IP / 备注 / 时间
  - 可视化：操作类型分布条形图
-->
<template>
  <div class="page-container audit-logs-page">
    <!-- 页头 -->
    <div class="page-header">
      <div>
        <h2>审计日志</h2>
        <p class="subtitle">管理员所有操作记录（仅可查看），用于安全审计与责任追溯</p>
      </div>
      <el-button :icon="Refresh" @click="loadData">刷新</el-button>
    </div>

    <!-- ========== 横幅 ========== -->
    <div class="hero-banner hero-banner--primary">
      <div class="hero-banner__bg hero-banner__bg--1"></div>
      <div class="hero-banner__bg hero-banner__bg--2"></div>
      <div class="hero-banner__content">
        <div class="hero-banner__text">
          <h3 class="hero-banner__title">操作审计中心</h3>
          <p class="hero-banner__desc">所有管理员操作均会留痕，确保关键行为可追溯</p>
          <div class="hero-banner__chips">
            <span class="hero-chip hero-chip--primary">
              <el-icon :size="14"><Document /></el-icon>
              <span>共 {{ total }} 条记录</span>
            </span>
            <span class="hero-chip hero-chip--warning">
              <el-icon :size="14"><Sunny /></el-icon>
              <span>今日 {{ stats.today }} 条</span>
            </span>
            <span class="hero-chip hero-chip--success">
              <el-icon :size="14"><Calendar /></el-icon>
              <span>近 7 天 {{ stats.week }} 条</span>
            </span>
            <span class="hero-chip hero-chip--danger" v-if="stats.ban > 0">
              <el-icon :size="14"><Lock /></el-icon>
              <span>封禁类 {{ stats.ban }} 条</span>
            </span>
          </div>
        </div>
        <div class="hero-banner__ring">
          <el-icon :size="56"><DocumentChecked /></el-icon>
          <div class="hero-banner__ring-label">AUDIT LOG</div>
        </div>
      </div>
    </div>

    <!-- ========== 统计卡 ========== -->
    <div v-loading="loading" class="stat-cards">
      <div class="stat-card primary">
        <div class="stat-icon">
          <el-icon :size="22"><Sunny /></el-icon>
        </div>
        <div>
          <div class="label">今日操作</div>
          <div class="value">{{ stats.today }}</div>
          <div class="sub">今日 0 时至今</div>
        </div>
      </div>
      <div class="stat-card income">
        <div class="stat-icon">
          <el-icon :size="22"><Calendar /></el-icon>
        </div>
        <div>
          <div class="label">近 7 天</div>
          <div class="value">{{ stats.week }}</div>
          <div class="sub">最近 7 天</div>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon">
          <el-icon :size="22"><DataLine /></el-icon>
        </div>
        <div>
          <div class="label">近 30 天</div>
          <div class="value">{{ stats.month }}</div>
          <div class="sub">最近 30 天</div>
        </div>
      </div>
      <div class="stat-card error">
        <div class="stat-icon">
          <el-icon :size="22"><Warning /></el-icon>
        </div>
        <div>
          <div class="label">高危操作</div>
          <div class="value">{{ stats.ban }}</div>
          <div class="sub">封禁 / 驳回 / 下架</div>
        </div>
      </div>
    </div>

    <!-- 时间快捷筛选 -->
    <div class="quick-time-bar">
      <span class="quick-time-bar__label">时间维度：</span>
      <div class="quick-time-bar__chips">
        <span
          v-for="t in timePresets"
          :key="t.value"
          :class="['time-chip', { 'time-chip--active': timePreset === t.value }]"
          @click="selectTimePreset(t.value)"
        >
          <el-icon v-if="t.icon" :size="14"><component :is="t.icon" /></el-icon>
          <span>{{ t.label }}</span>
        </span>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="query.keyword"
        placeholder="搜索操作人 / 目标 / 备注"
        clearable
        style="width: 240px"
        :prefix-icon="Search"
        @keyup.enter="loadData"
        @clear="loadData"
      />
      <el-select
        v-model="query.action_type"
        placeholder="操作类型"
        clearable
        style="width: 200px"
        @change="loadData"
      >
        <el-option v-for="t in actionTypeOptions" :key="t.value" :label="t.label" :value="t.value" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 260px"
        @change="onDateRangeChange"
      />
      <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
      <el-button :icon="RefreshLeft" @click="resetQuery">重置</el-button>
      <span class="filter-spacer" />
      <span class="text-secondary">共 {{ total }} 条</span>
    </div>

    <!-- 操作类型分布（当数据较多时显示） -->
    <div v-if="actionDistribution.length" class="distribution-card">
      <div class="distribution-card__head">
        <span class="distribution-card__title">操作类型分布（当前结果）</span>
        <span class="text-muted">前 {{ Math.min(actionDistribution.length, 6) }} 名</span>
      </div>
      <div class="distribution-list">
        <div
          v-for="item in actionDistribution.slice(0, 6)"
          :key="item.key"
          class="distribution-item"
        >
          <div class="distribution-item__label">
            <span :class="['distribution-tag', actionTagClass(item.key)]">
              <el-icon :size="12"><Operation /></el-icon>
              <span>{{ item.label }}</span>
            </span>
            <span class="distribution-item__count">{{ item.count }}</span>
          </div>
          <div class="distribution-item__bar">
            <div
              class="distribution-item__bar-fill"
              :style="{
                width: maxCount ? (item.count / maxCount) * 100 + '%' : '0%',
                background: actionBarColor(item.key),
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 表格 -->
    <el-card class="table-card" shadow="never">
      <DataShell
        :data="data"
        :loading="loading"
        :error="error"
        empty-title="暂无审计日志"
        empty-description="还没有任何管理员操作记录"
        :show-retry="true"
        retry-text="重新加载"
        :skeleton-rows="10"
        :min-height="'420px'"
        @retry="loadData"
      >
        <template #default>
          <el-table :data="data" stripe style="width: 100%">
            <el-table-column label="操作人" width="170">
              <template #default="{ row }">
                <div class="operator-cell">
                  <el-avatar :size="30" :src="row.operator?.avatar">
                    {{ (row.operator?.username || 'A').charAt(0).toUpperCase() }}
                  </el-avatar>
                  <div class="operator-cell__text">
                    <span class="name">{{ row.operator?.username || row.operator_name || '系统' }}</span>
                    <span v-if="row.operator?.role" class="role text-muted">
                      {{ row.operator.role === 'admin' ? '管理员' : row.operator.role }}
                    </span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="操作类型" width="160" align="center">
              <template #default="{ row }">
                <span :class="['action-tag', actionTagClass(row.action_type)]">
                  <el-icon :size="12"><component :is="actionIcon(row.action_type)" /></el-icon>
                  <span>{{ actionLabel(row.action_type) }}</span>
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="target" label="操作目标" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.target" class="text-mono">{{ row.target }}</span>
                <span v-else class="text-muted">--</span>
              </template>
            </el-table-column>

            <el-table-column prop="ip_address" label="IP" width="140" align="center">
              <template #default="{ row }">
                <span class="text-mono text-muted">{{ row.ip_address || '--' }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="remark" label="备注" min-width="220" show-overflow-tooltip />

            <el-table-column label="操作时间" width="170" align="center">
              <template #default="{ row }">
                <span class="text-muted">{{ formatDate(row.created_at) }}</span>
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
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
/**
 * 审计日志页面（增强版）
 * - /admin/audit-logs/?operator=&action_type=&start_date=&end_date=&page=...
 * - 仅查看，不可修改
 * - 支持按操作人、类型、时间范围筛选
 * - 时间快捷预设：今天 / 7 天 / 30 天 / 全部
 * - 操作类型分布条形图
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  RefreshLeft,
  Document,
  DocumentChecked,
  Sunny,
  Calendar,
  DataLine,
  Warning,
  Lock,
  Operation,
} from '@element-plus/icons-vue'
import { fetchAuditLogs } from '@/api'
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
} = useList(fetchAuditLogs, {
  defaultQuery: {
    keyword: '',
    action_type: '',
    start_date: '',
    end_date: '',
    page: 1,
    page_size: 50,
  },
  errorMessage: '审计日志加载失败',
})

/* 日期范围 */
const dateRange = ref([])

/* 时间预设 */
const timePreset = ref('7d')
const timePresets = [
  { label: '今天', value: 'today', icon: Sunny },
  { label: '近 7 天', value: '7d', icon: Calendar },
  { label: '近 30 天', value: '30d', icon: DataLine },
  { label: '全部', value: 'all', icon: Document },
]

/* 日期范围联动 */
watch(dateRange, (v) => {
  if (Array.isArray(v) && v.length === 2) {
    query.start_date = v[0]
    query.end_date = v[1]
    timePreset.value = 'custom'
  } else {
    query.start_date = ''
    query.end_date = ''
  }
  query.page = 1
  loadData()
})

/**
 * 格式化日期 yyyy-mm-dd
 */
function toYmd(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * 选择时间预设
 */
function selectTimePreset(preset) {
  timePreset.value = preset
  const today = new Date()
  const todayStr = toYmd(today)
  if (preset === 'today') {
    query.start_date = todayStr
    query.end_date = todayStr
    dateRange.value = [todayStr, todayStr]
  } else if (preset === '7d') {
    const start = new Date(today)
    start.setDate(today.getDate() - 6)
    query.start_date = toYmd(start)
    query.end_date = todayStr
    dateRange.value = [query.start_date, todayStr]
  } else if (preset === '30d') {
    const start = new Date(today)
    start.setDate(today.getDate() - 29)
    query.start_date = toYmd(start)
    query.end_date = todayStr
    dateRange.value = [query.start_date, todayStr]
  } else if (preset === 'all') {
    query.start_date = ''
    query.end_date = ''
    dateRange.value = []
  }
  query.page = 1
  loadData()
}

/**
 * 日期范围变化
 */
function onDateRangeChange(v) {
  // watch 已处理
}

/* 操作类型下拉 */
const actionTypeOptions = [
  { label: '用户封禁', value: 'ban_user' },
  { label: '用户解封', value: 'unban_user' },
  { label: '调整信用', value: 'adjust_credit' },
  { label: '商品审核-通过', value: 'approve_product' },
  { label: '商品审核-驳回', value: 'reject_product' },
  { label: '举报处理-警告', value: 'handle_report_warn' },
  { label: '举报处理-下架', value: 'handle_report_takedown' },
  { label: '举报处理-封禁', value: 'handle_report_ban' },
  { label: '举报处理-驳回', value: 'handle_report_dismiss' },
  { label: '创建分类', value: 'create_category' },
  { label: '更新分类', value: 'update_category' },
  { label: '删除分类', value: 'delete_category' },
  { label: '更新 AI 配置', value: 'update_ai_config' },
  { label: '管理员登录', value: 'admin_login' },
]

/* 同步全部 action_type 列表用于分布统计 */
const allActionTypes = actionTypeOptions

/**
 * 操作类型 -> 显示标签
 */
function actionLabel(t) {
  const found = actionTypeOptions.find((x) => x.value === t)
  return found ? found.label : (t || '--')
}

/**
 * 操作类型 -> Element tag type
 */
function actionTagType(t) {
  if (!t) return 'info'
  if (t.startsWith('ban') || t.startsWith('reject') || t.startsWith('delete') || t === 'handle_report_takedown' || t === 'handle_report_ban') {
    return 'danger'
  }
  if (t.startsWith('approve') || t.startsWith('unban') || t === 'create_category') return 'success'
  if (t.startsWith('adjust') || t.startsWith('update') || t === 'handle_report_warn') return 'warning'
  return 'info'
}

/**
 * 操作类型 -> 自定义 class（用于本组件内彩色标签）
 */
function actionTagClass(t) {
  if (!t) return 'action-tag--info'
  if (t.startsWith('ban') || t.startsWith('reject') || t.startsWith('delete') || t === 'handle_report_takedown' || t === 'handle_report_ban') {
    return 'action-tag--danger'
  }
  if (t.startsWith('approve') || t.startsWith('unban') || t === 'create_category') return 'action-tag--success'
  if (t.startsWith('adjust') || t.startsWith('update') || t === 'handle_report_warn') return 'action-tag--warning'
  return 'action-tag--info'
}

/**
 * 操作类型 -> icon
 */
function actionIcon(t) {
  if (!t) return Document
  if (t === 'admin_login') return Operation
  if (t.startsWith('ban')) return Lock
  if (t.startsWith('approve')) return DocumentChecked
  if (t.startsWith('reject') || t === 'handle_report_takedown' || t === 'handle_report_dismiss') return Warning
  if (t.startsWith('update') || t.startsWith('adjust')) return Operation
  if (t.startsWith('create')) return Document
  return Operation
}

/**
 * 操作类型 -> 柱状图颜色
 */
function actionBarColor(t) {
  if (!t) return 'var(--color-info)'
  if (t.startsWith('ban') || t.startsWith('reject') || t.startsWith('delete') || t === 'handle_report_takedown' || t === 'handle_report_ban') {
    return 'var(--color-error)'
  }
  if (t.startsWith('approve') || t.startsWith('unban') || t === 'create_category') return 'var(--color-success)'
  if (t.startsWith('adjust') || t.startsWith('update') || t === 'handle_report_warn') return 'var(--color-warning)'
  return 'var(--color-info)'
}

/**
 * 衍生统计 - 基于当前加载数据
 * 提示：使用本地聚合而非后端统计（避免额外接口）
 */
const stats = computed(() => {
  const now = new Date()
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const week0 = today0 - 6 * 86400000
  const month0 = today0 - 29 * 86400000
  let today = 0
  let week = 0
  let month = 0
  let ban = 0
  for (const r of data.value) {
    const t = r.created_at ? new Date(r.created_at.replace(' ', 'T')).getTime() : 0
    if (!t) continue
    if (t >= today0) today++
    if (t >= week0) week++
    if (t >= month0) month++
    if (
      r.action_type &&
      (r.action_type.startsWith('ban') ||
        r.action_type.startsWith('reject') ||
        r.action_type === 'handle_report_takedown' ||
        r.action_type === 'handle_report_ban' ||
        r.action_type === 'delete_category')
    ) {
      ban++
    }
  }
  return { today, week, month, ban }
})

/**
 * 操作类型分布（基于当前页聚合）
 */
const actionDistribution = computed(() => {
  const map = new Map()
  for (const r of data.value) {
    const k = r.action_type || 'other'
    map.set(k, (map.get(k) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([key, count]) => {
      const opt = allActionTypes.find((t) => t.value === key)
      return { key, count, label: opt ? opt.label : key }
    })
    .sort((a, b) => b.count - a.count)
})

/**
 * 分布柱状图最大值
 */
const maxCount = computed(() => {
  if (!actionDistribution.value.length) return 0
  return actionDistribution.value[0].count
})

/**
 * 格式化日期
 */
function formatDate(iso) {
  if (!iso) return '--'
  return iso.slice(0, 19).replace('T', ' ')
}

/**
 * 重置查询
 */
function resetQuery() {
  query.keyword = ''
  query.action_type = ''
  query.start_date = ''
  query.end_date = ''
  query.page = 1
  dateRange.value = []
  timePreset.value = '7d'
  selectTimePreset('7d')
}

onMounted(() => {
  selectTimePreset('7d')
})
</script>

<style scoped>
.audit-logs-page {
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

.operator-cell {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.operator-cell__text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.operator-cell__text .name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.operator-cell__text .role {
  font-size: var(--font-size-xs);
}

.text-mono {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
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
  box-shadow: 0 6px 20px rgba(255, 107, 53, 0.2);
}

.hero-banner--primary {
  background: linear-gradient(120deg, #FF8A5C 0%, #FF6B35 60%, #E55A2B 100%);
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

/* ========== 时间维度快捷栏 ========== */
.quick-time-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--color-bg-card);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-3);
}

.quick-time-bar__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.quick-time-bar__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.time-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  background: var(--color-bg-section);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  user-select: none;
  border: 1px solid transparent;
}

.time-chip:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.time-chip--active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
}

/* ========== 操作类型分布 ========== */
.distribution-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-3);
}

.distribution-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.distribution-card__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.distribution-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3) var(--space-5);
}

.distribution-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.distribution-item__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.distribution-item__count {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-mono);
  color: var(--color-text-primary);
}

.distribution-item__bar {
  height: 6px;
  background: var(--color-bg-hover);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.distribution-item__bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--duration-slow) var(--ease-out);
}

@media (max-width: 768px) {
  .distribution-list { grid-template-columns: 1fr; }
}

/* ========== 操作类型彩色标签 ========== */
.action-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
}

.action-tag--danger  { background: rgba(255, 77, 79, 0.12); color: var(--color-error); }
.action-tag--success { background: rgba(7, 193, 96, 0.12); color: var(--color-success); }
.action-tag--warning { background: rgba(255, 165, 0, 0.12); color: var(--color-warning); }
.action-tag--info    { background: rgba(25, 137, 250, 0.12); color: var(--color-info); }

.distribution-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.distribution-tag.action-tag--danger  { background: rgba(255, 77, 79, 0.12); color: var(--color-error); }
.distribution-tag.action-tag--success { background: rgba(7, 193, 96, 0.12); color: var(--color-success); }
.distribution-tag.action-tag--warning { background: rgba(255, 165, 0, 0.12); color: var(--color-warning); }
.distribution-tag.action-tag--info    { background: rgba(25, 137, 250, 0.12); color: var(--color-info); }
</style>
