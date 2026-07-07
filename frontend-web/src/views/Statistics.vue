<template>
  <div class="page-container">
    <div class="page-header">
      <h2>数据看板</h2>
      <el-radio-group v-model="days" @change="loadAll">
        <el-radio-button :value="7">近 7 天</el-radio-button>
        <el-radio-button :value="30">近 30 天</el-radio-button>
        <el-radio-button :value="90">近 90 天</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 销售指标卡 -->
    <div v-loading="trendLoading" class="stat-cards">
      <div class="stat-card primary">
        <div class="stat-icon"><el-icon :size="22"><Wallet /></el-icon></div>
        <div>
          <div class="label">总销售额</div>
          <div class="value">¥{{ formatMoney(totalAmount) }}</div>
          <div class="sub">近 {{ days }} 天累计</div>
        </div>
      </div>
      <div class="stat-card income">
        <div class="stat-icon"><el-icon :size="22"><Document /></el-icon></div>
        <div>
          <div class="label">成交笔数</div>
          <div class="value">{{ totalCount }}</div>
          <div class="sub">日均 {{ avgPerDay }} 笔</div>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon"><el-icon :size="22"><Coin /></el-icon></div>
        <div>
          <div class="label">客单价</div>
          <div class="value">¥{{ formatMoney(avgPrice) }}</div>
          <div class="sub">销售额 / 笔数</div>
        </div>
      </div>
      <div class="stat-card credit">
        <div class="stat-icon"><el-icon :size="22"><DataLine /></el-icon></div>
        <div>
          <div class="label">日均销售</div>
          <div class="value">¥{{ formatMoney(totalAmount / days) }}</div>
          <div class="sub">销售速率</div>
        </div>
      </div>
    </div>

    <!-- 趋势图 + 分类饼图 -->
    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>销售趋势</span>
              <span class="card-meta">单位：元</span>
            </div>
          </template>
          <div v-loading="trendLoading" class="chart-box">
            <v-chart v-if="trendData.length" :option="trendOption" autoresize />
            <el-empty v-else description="暂无销售数据" />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>分类收入分布</span>
          </template>
          <div v-loading="categoryLoading" class="chart-box">
            <v-chart v-if="categoryData.length" :option="categoryOption" autoresize />
            <el-empty v-else description="暂无数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 价格区间柱状图 -->
    <el-card shadow="hover" class="chart-card">
      <template #header>
        <div class="card-header">
          <span>价格区间分布</span>
          <span class="card-meta">统计在售商品价格分布</span>
        </div>
      </template>
      <div v-loading="priceLoading" class="chart-box">
        <v-chart v-if="priceData.length" :option="priceOption" autoresize />
        <el-empty v-else description="暂无数据" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 校园易物 H5 端 · 数据看板
 * - 总销售额 / 成交笔数 / 客单价 / 日均
 * - 销售趋势折线图（按所选时间窗口）
 * - 分类收入饼图
 * - 价格区间柱状图
 */
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import VChart from 'vue-echarts'
import { use as echartsUse } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'
import {
  fetchSalesTrend,
  fetchCategoryDistribution,
  fetchPriceRange,
  type SalesTrendPoint,
  type CategoryDistribution,
  type PriceRangeBucket,
} from '@/api/stats'
import { Wallet, Document, Coin, DataLine } from '@element-plus/icons-vue'
import { formatMoney } from '@/utils'
import { useChartColors } from '@/utils/chartTheme'

// 注册 ECharts 组件
echartsUse([
  CanvasRenderer,
  LineChart,
  PieChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
])

// 加载态
const trendLoading = ref(false)
const categoryLoading = ref(false)
const priceLoading = ref(false)

// 时间窗口
const days = ref(30)

// 数据
const trendData = ref<SalesTrendPoint[]>([])
const categoryData = ref<CategoryDistribution[]>([])
const priceData = ref<PriceRangeBucket[]>([])

// 主题色板(随 isDark 自动重算)
const chartColors = useChartColors()

/** 衍生指标 */
const totalAmount = computed(() =>
  trendData.value.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
)
const totalCount = computed(() =>
  trendData.value.reduce((sum, p) => sum + (Number(p.count) || 0), 0)
)
const avgPerDay = computed(() => Math.round((totalCount.value / Math.max(days.value, 1)) * 10) / 10)
const avgPrice = computed(() =>
  totalCount.value > 0 ? totalAmount.value / totalCount.value : 0
)

/** 销售趋势 ECharts 配置 */
const trendOption = computed(() => {
  const c = chartColors.value
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: c.cardBg,
      borderColor: c.borderLight,
      textStyle: { color: c.textSecondary },
      valueFormatter: (v: any) => '¥' + formatMoney(Number(v) || 0),
    },
    legend: { data: ['销售额', '成交笔数'], right: 10, top: 0, icon: 'roundRect', textStyle: { color: c.textSecondary } },
    grid: { left: 56, right: 56, top: 36, bottom: 30 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.value.map(d => dayjs(d.date).format('MM-DD')),
      axisLine: { lineStyle: { color: c.borderLight } },
      axisLabel: { color: c.textSecondary },
    },
    yAxis: [
      {
        type: 'value',
        name: '销售额',
        position: 'left',
        nameTextStyle: { color: c.textTertiary },
        axisLabel: {
          formatter: (v: number) => (v >= 1000 ? v / 1000 + 'k' : String(v)),
          color: c.textSecondary,
        },
        splitLine: { lineStyle: { type: 'dashed', color: c.borderLight } },
      },
      {
        type: 'value',
        name: '笔数',
        position: 'right',
        nameTextStyle: { color: c.textTertiary },
        axisLabel: { color: c.textSecondary },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: trendData.value.map(d => Number(d.amount) || 0),
        itemStyle: { color: c.primary },
        lineStyle: { width: 3, color: c.primary },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: c.primaryAreaStart },
              { offset: 1, color: c.primaryAreaEnd },
            ],
          },
        },
      },
      {
        name: '成交笔数',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        symbol: 'circle',
        symbolSize: 5,
        data: trendData.value.map(d => Number(d.count) || 0),
        itemStyle: { color: c.success },
        lineStyle: { width: 2, type: 'dashed', color: c.success },
      },
    ],
  }
})

/** 分类饼图配置 */
const categoryOption = computed(() => {
  const c = chartColors.value
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: c.cardBg,
      borderColor: c.borderLight,
      textStyle: { color: c.textSecondary },
      formatter: (p: any) => `${p.marker}${p.name}<br/>金额: ¥${formatMoney(p.value)}<br/>占比: ${p.percent}%`,
    },
    legend: {
      orient: 'vertical', right: 10, top: 'center',
      itemWidth: 10, itemHeight: 10,
      textStyle: { fontSize: 12, color: c.textSecondary },
      width: 60,
      overflow: 'break',
    },
    color: c.palette,
    series: [
      {
        type: 'pie',
        radius: ['35%', '60%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: c.pieBorder, borderWidth: 2 },
        label: { show: true, color: c.textSecondary, formatter: '{b}\n{d}%', fontSize: 11 },
        labelLine: { length: 6, length2: 6, lineStyle: { color: c.borderLight } },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 'bold' },
        },
        data: categoryData.value.map(d => ({ name: d.name, value: d.value ?? d.count })),
      },
    ],
  }
})

/** 价格区间柱状图配置 */
const priceOption = computed(() => {
  const c = chartColors.value
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: c.cardBg,
      borderColor: c.borderLight,
      textStyle: { color: c.textSecondary },
      valueFormatter: (v: any) => v + ' 件',
    },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: priceData.value.map(d => d.range ?? d.label),
      axisLine: { lineStyle: { color: c.borderLight } },
      axisLabel: { color: c.textSecondary },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: c.textSecondary },
      splitLine: { lineStyle: { type: 'dashed', color: c.borderLight } },
    },
    series: [
      {
        name: '商品数',
        type: 'bar',
        barMaxWidth: 36,
        data: priceData.value.map(d => d.count),
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: c.primaryBarStart },
              { offset: 1, color: c.primaryBarEnd },
            ],
          },
          borderRadius: [6, 6, 0, 0],
        },
        label: { show: true, position: 'top', color: c.textSecondary },
      },
    ],
  }
})

/** 加载趋势 */
async function loadTrend() {
  trendLoading.value = true
  try {
    const res: any = await fetchSalesTrend({ days: days.value })
    trendData.value = res.data?.trend || res.trend || []
  } catch (e) {
    console.error('[Statistics] 趋势加载失败', e)
  } finally {
    trendLoading.value = false
  }
}

/** 加载分类 */
async function loadCategory() {
  categoryLoading.value = true
  try {
    const res: any = await fetchCategoryDistribution()
    categoryData.value = res.data?.distribution || res.distribution || []
  } catch (e) {
    console.error('[Statistics] 分类加载失败', e)
  } finally {
    categoryLoading.value = false
  }
}

/** 加载价格区间 */
async function loadPrice() {
  priceLoading.value = true
  try {
    const res: any = await fetchPriceRange()
    priceData.value = res.data?.buckets || res.buckets || []
  } catch (e) {
    console.error('[Statistics] 价格区间加载失败', e)
  } finally {
    priceLoading.value = false
  }
}

/** 切换时间窗口 */
async function loadAll() {
  await loadTrend()
}

onMounted(() => {
  loadAll()
  loadCategory()
  loadPrice()
})
</script>

<style scoped>
.chart-card,
.stat-card {
  border-radius: var(--radius-md);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  flex-shrink: 0;
}

.stat-card.income .stat-icon {
  background: rgba(7, 193, 96, 0.12);
  color: var(--color-success);
}

.stat-card.warning .stat-icon {
  background: rgba(255, 165, 0, 0.12);
  color: var(--color-warning);
}

.stat-card.credit .stat-icon {
  background: rgba(25, 137, 250, 0.12);
  color: var(--color-info);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.card-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.chart-box {
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
