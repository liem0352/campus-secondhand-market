<!--
  平台管理后台 · 用户管理（增强版）
  - 顶部横幅：用户数据高亮
  - 统计卡：总数 / 正常 / 封禁
  - 表格：搜索 / 状态筛选 / 信用分 / 操作
  - 操作：调整信用 / 封禁 / 解封（带二次确认）
-->
<template>
  <div class="page-container users-page">
    <!-- 页头 -->
    <div class="page-header">
      <div>
        <h2>用户管理</h2>
        <p class="subtitle">查看与管理平台所有注册用户</p>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="refresh">刷新</el-button>
    </div>

    <!-- ========== 横幅 ========== -->
    <div class="hero-banner hero-banner--info">
      <div class="hero-banner__bg hero-banner__bg--1"></div>
      <div class="hero-banner__bg hero-banner__bg--2"></div>
      <div class="hero-banner__content">
        <div class="hero-banner__text">
          <h3 class="hero-banner__title">用户与信用一览</h3>
          <p class="hero-banner__desc">维护平台秩序，及时处理违规账号</p>
          <div class="hero-banner__chips">
            <span class="hero-chip hero-chip--primary">
              <el-icon :size="14"><User /></el-icon>
              <span>共 {{ total }} 位用户</span>
            </span>
            <span class="hero-chip hero-chip--success">
              <el-icon :size="14"><CircleCheck /></el-icon>
              <span>正常 {{ activeCount }} 位</span>
            </span>
            <span class="hero-chip hero-chip--danger">
              <el-icon :size="14"><Lock /></el-icon>
              <span>封禁 {{ bannedCount }} 位</span>
            </span>
            <span class="hero-chip hero-chip--warning" v-if="data.length">
              <el-icon :size="14"><Medal /></el-icon>
              <span>平均信用 {{ avgCredit }}</span>
            </span>
          </div>
        </div>
        <div class="hero-banner__ring">
          <el-icon :size="56"><User /></el-icon>
          <div class="hero-banner__ring-label">USER MGMT</div>
        </div>
      </div>
    </div>

    <!-- 统计卡 -->
    <div v-loading="loading" class="stat-cards">
      <div class="stat-card primary">
        <div class="stat-icon">
          <el-icon :size="22"><User /></el-icon>
        </div>
        <div>
          <div class="label">用户总数</div>
          <div class="value">{{ total }}</div>
          <div class="sub">筛选条件下</div>
        </div>
      </div>
      <div class="stat-card income">
        <div class="stat-icon">
          <el-icon :size="22"><CircleCheck /></el-icon>
        </div>
        <div>
          <div class="label">正常用户</div>
          <div class="value">{{ activeCount }}</div>
          <div class="sub">占总用户 {{ total ? Math.round((activeCount / total) * 100) : 0 }}%</div>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon">
          <el-icon :size="22"><Lock /></el-icon>
        </div>
        <div>
          <div class="label">封禁用户</div>
          <div class="value">{{ bannedCount }}</div>
          <div class="sub">占总用户 {{ total ? Math.round((bannedCount / total) * 100) : 0 }}%</div>
        </div>
      </div>
      <div class="stat-card credit">
        <div class="stat-icon">
          <el-icon :size="22"><Medal /></el-icon>
        </div>
        <div>
          <div class="label">平均信用分</div>
          <div class="value">{{ avgCredit }}</div>
          <div class="sub">基于所有已加载用户</div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="query.keyword"
        placeholder="搜索用户名 / 昵称 / 学校"
        clearable
        style="width: 280px"
        :prefix-icon="Search"
        @keyup.enter="loadData"
        @clear="loadData"
      />
      <el-select v-model="query.is_active" placeholder="状态" clearable style="width: 140px" @change="loadData">
        <el-option label="正常" :value="true" />
        <el-option label="已封禁" :value="false" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
      <el-button :icon="RefreshLeft" @click="reset">重置</el-button>
      <span class="filter-spacer" />
      <span class="text-secondary">共 {{ total }} 条</span>
    </div>

    <!-- 表格 -->
    <el-card class="table-card" shadow="never">
      <DataShell
        :data="data"
        :loading="loading"
        :error="error"
        empty-title="暂无用户数据"
        empty-description="还没有任何用户注册，先去推广平台吧"
        :show-retry="true"
        retry-text="重新加载"
        :skeleton-rows="8"
        :min-height="'420px'"
        @retry="loadData"
      >
        <template #default>
          <el-table :data="data" stripe style="width: 100%">
            <el-table-column label="头像" width="68" align="center">
              <template #default="{ row }">
                <el-avatar :size="40" :src="row.avatar">
                  {{ (row.username || 'U').charAt(0).toUpperCase() }}
                </el-avatar>
              </template>
            </el-table-column>

            <el-table-column label="用户名 / 昵称" min-width="160">
              <template #default="{ row }">
                <div class="user-cell">
                  <span class="username">{{ row.username }}</span>
                  <span v-if="row.nickname" class="nickname">{{ row.nickname }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="school" label="学校" min-width="140" show-overflow-tooltip />
            <el-table-column prop="student_id" label="学号" min-width="120" show-overflow-tooltip />

            <el-table-column label="信用分" width="120" align="center">
              <template #default="{ row }">
                <div :class="['credit-badge', creditClass(row.credit_score)]" :title="creditLabel(row.credit_score)">
                  {{ row.credit_score ?? 80 }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="注册时间" width="170" align="center">
              <template #default="{ row }">
                <span class="text-muted">{{ formatDate(row.date_joined || row.created_at) }}</span>
              </template>
            </el-table-column>

            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <span :class="['status-badge', row.is_active === false ? 'status-badge--banned' : 'status-badge--active']">
                  {{ row.is_active === false ? '已封禁' : '正常' }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="260" fixed="right" align="center">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openCreditDialog(row)">调整信用</el-button>
                <el-button
                  v-if="row.is_active !== false"
                  link
                  type="danger"
                  size="small"
                  @click="handleBan(row)"
                >封禁</el-button>
                <el-button
                  v-else
                  link
                  type="success"
                  size="small"
                  @click="handleUnban(row)"
                >解封</el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </DataShell>

      <!-- 分页 -->
      <div v-if="data.length" class="pagination-bar">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.page_size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 调整信用分弹窗 -->
    <el-dialog
      v-model="creditDialog.visible"
      :title="`调整信用分 - ${creditDialog.row?.username || ''}`"
      width="460px"
      :close-on-click-modal="false"
    >
      <div v-if="creditDialog.row" class="credit-dialog">
        <div class="current-credit">
          <span class="label">当前信用分</span>
          <div :class="['credit-badge', 'credit-badge--large', creditClass(creditDialog.row.credit_score)]">
            {{ creditDialog.row.credit_score ?? 80 }}
          </div>
        </div>
        <el-form label-width="80px">
          <el-form-item label="调整类型">
            <el-radio-group v-model="creditDialog.direction">
              <el-radio-button label="add">加分</el-radio-button>
              <el-radio-button label="reduce">减分</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="分值">
            <el-input-number v-model="creditDialog.delta" :min="1" :max="100" />
          </el-form-item>
          <el-form-item label="理由" required>
            <el-input
              v-model="creditDialog.reason"
              type="textarea"
              :rows="3"
              placeholder="请说明调整原因，将记入审计日志"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="creditDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="creditDialog.loading" @click="submitCredit">确认调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 用户管理页面（增强版）
 * - 拉取 /admin/users/?keyword=...&is_active=...&page=...
 * - 顶部横幅 + 4 个统计卡
 * - 操作：ban / unban / adjust-credit
 * - 二次确认 + 审计日志联动
 * - 统一使用 useList / DataShell 处理列表状态
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  RefreshLeft,
  User,
  Lock,
  CircleCheck,
  Medal,
} from '@element-plus/icons-vue'
import {
  fetchAdminUsers,
  banUser,
  unbanUser,
  adjustUserCredit,
} from '@/api'
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
  reset,
} = useList(fetchAdminUsers, {
  defaultQuery: { keyword: '', is_active: '', page: 1, page_size: 20 },
  errorMessage: '用户列表加载失败',
})

/* 衍生统计 */
const activeCount = computed(() => data.value.filter((u) => u.is_active !== false).length)
const bannedCount = computed(() => data.value.filter((u) => u.is_active === false).length)
const avgCredit = computed(() => {
  if (!data.value.length) return '--'
  const sum = data.value.reduce((s, u) => s + (Number(u.credit_score) || 0), 0)
  return Math.round(sum / data.value.length)
})

/* 调整信用分弹窗状态 */
const creditDialog = reactive({
  visible: false,
  row: null,
  direction: 'add',
  delta: 5,
  reason: '',
  loading: false,
})

/**
 * 信用分等级 class
 * @param {number} score
 */
function creditClass(score) {
  if (score >= 90) return 'credit-badge--high'
  if (score >= 60) return 'credit-badge--mid'
  return 'credit-badge--low'
}

/**
 * 信用分等级文案
 */
function creditLabel(score) {
  if (score >= 90) return '信用极好'
  if (score >= 60) return '信用良好'
  return '信用一般'
}

/**
 * 格式化日期时间
 */
function formatDate(iso) {
  if (!iso) return '--'
  return iso.slice(0, 19).replace('T', ' ')
}

/**
 * 打开调整信用分弹窗
 */
function openCreditDialog(row) {
  creditDialog.row = row
  creditDialog.direction = 'add'
  creditDialog.delta = 5
  creditDialog.reason = ''
  creditDialog.visible = true
}

/**
 * 提交信用分调整
 */
async function submitCredit() {
  if (!creditDialog.reason || !creditDialog.reason.trim()) {
    ElMessage.warning('请填写调整理由')
    return
  }
  const realDelta = creditDialog.direction === 'add' ? Number(creditDialog.delta) : -Number(creditDialog.delta)
  creditDialog.loading = true
  try {
    await adjustUserCredit(creditDialog.row.id, realDelta, creditDialog.reason.trim())
    ElMessage.success(`信用分已${realDelta > 0 ? '增加' : '减少'} ${Math.abs(realDelta)} 分`)
    creditDialog.visible = false
    loadData()
  } catch (e) {
    // 错误已由 request 拦截器统一提示
  } finally {
    creditDialog.loading = false
  }
}

/**
 * 封禁用户
 */
async function handleBan(row) {
  try {
    await ElMessageBox.confirm(
      `确认封禁用户「${row.username}」？封禁后将无法登录、发布商品、发起订单`,
      '封禁确认',
      {
        type: 'warning',
        confirmButtonText: '确认封禁',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
      }
    )
  } catch {
    return
  }
  try {
    await banUser(row.id, '管理员手动封禁')
    ElMessage.success(`已封禁 ${row.username}`)
    loadData()
  } catch (e) {
    // 错误已提示
  }
}

/**
 * 解封用户
 */
async function handleUnban(row) {
  try {
    await ElMessageBox.confirm(
      `确认解封用户「${row.username}」？`,
      '解封确认',
      { type: 'success', confirmButtonText: '解封', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  try {
    await unbanUser(row.id)
    ElMessage.success(`已解封 ${row.username}`)
    loadData()
  } catch (e) {
    // 错误已提示
  }
}

onMounted(loadData)
</script>

<style scoped>
.users-page {
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

.user-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.user-cell .username {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.user-cell .nickname {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-4);
}

/* ========== 横幅（与 Dashboard 复用） ========== */
.hero-banner {
  position: relative;
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  margin-bottom: var(--space-4);
  color: #fff;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(25, 137, 250, 0.18);
}

.hero-banner--info {
  background: linear-gradient(120deg, #4DA8FF 0%, #1989FA 60%, #0E6FD9 100%);
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
  background: rgba(255, 255, 255, 0.12);
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

/* ========== 统计卡 ========== */
.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  flex-shrink: 0;
}

.stat-card.income .stat-icon { background: rgba(7, 193, 96, 0.12); color: var(--color-success); }
.stat-card.warning .stat-icon { background: rgba(255, 165, 0, 0.12); color: var(--color-warning); }
.stat-card.credit .stat-icon { background: rgba(25, 137, 250, 0.12); color: var(--color-info); }

.stat-card.income .value { color: var(--color-success); }
.stat-card.warning .value { color: var(--color-warning); }
.stat-card.credit .value { color: var(--color-info); }

/* 信用分弹窗 */
.credit-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.current-credit {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-section);
  border-radius: var(--radius-base);
}

.current-credit .label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* status-badge 适配（admin 全局未定义） */
:deep(.status-badge--active) {
  background: rgba(7, 193, 96, 0.12);
  color: var(--color-success);
}

:deep(.status-badge--banned) {
  background: rgba(255, 77, 79, 0.12);
  color: var(--color-error);
}
</style>
