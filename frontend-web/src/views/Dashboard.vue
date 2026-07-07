<template>
  <div class="page-container dashboard">
    <!-- ========== 页头 ========== -->
    <div class="page-header">
      <div>
        <h2>{{ DASHBOARD_TEXT.TITLE }}</h2>
        <p class="greeting">{{ greeting }}，{{ userStore.nickname || DASHBOARD_TEXT.GREETING_DEFAULT_NICK }}</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="refreshAll">{{ DASHBOARD_TEXT.REFRESH_BTN }}</el-button>
        <el-button :icon="Plus" type="primary" @click="$router.push(ROUTE_PATHS.PRODUCT_CREATE)">
          {{ DASHBOARD_TEXT.PUBLISH_BTN }}
        </el-button>
      </div>
    </div>

    <!-- ========== 横幅：今日运营数据高亮 ========== -->
    <div class="hero-banner">
      <div class="hero-banner__bg hero-banner__bg--1"></div>
      <div class="hero-banner__bg hero-banner__bg--2"></div>
      <div class="hero-banner__content">
        <div class="hero-banner__text">
          <h3 class="hero-banner__title">{{ heroTitle }}</h3>
          <p class="hero-banner__desc">{{ heroDesc }}</p>
          <div class="hero-banner__chips">
            <span class="hero-chip hero-chip--primary">
              <el-icon :size="14"><Goods /></el-icon>
              <span>{{ DASHBOARD_TEXT.HERO_CHIP_ON_SALE(overview.on_sale_count ?? 0) }}</span>
            </span>
            <span class="hero-chip hero-chip--success">
              <el-icon :size="14"><Wallet /></el-icon>
              <span>{{ DASHBOARD_TEXT.HERO_CHIP_SOLD(overview.sold_count ?? 0) }}</span>
            </span>
            <span class="hero-chip hero-chip--warning">
              <el-icon :size="14"><Bell /></el-icon>
              <span>{{ DASHBOARD_TEXT.HERO_CHIP_PENDING(overview.pending_order_count ?? 0) }}</span>
            </span>
            <span class="hero-chip hero-chip--info" v-if="overview.credit_score">
              <el-icon :size="14"><Medal /></el-icon>
              <span>{{ DASHBOARD_TEXT.HERO_CHIP_CREDIT(overview.credit_score) }}</span>
            </span>
          </div>
        </div>
        <div class="hero-banner__ring" :class="`hero-banner__ring--${creditLevel}`">
          <el-icon :size="56"><Medal /></el-icon>
          <div class="hero-banner__ring-label">{{ creditLevelLabel }}</div>
        </div>
      </div>
    </div>

    <!-- ========== 关键指标卡 ========== -->
    <div v-loading="loading" class="stat-cards">
      <div class="stat-card primary">
        <div class="stat-icon">
          <el-icon :size="24"><Goods /></el-icon>
        </div>
        <div>
          <div class="label">{{ DASHBOARD_TEXT.STAT_ON_SALE }}</div>
          <div class="value">{{ overview.on_sale_count ?? '--' }}</div>
          <div class="sub">{{ DASHBOARD_TEXT.STAT_ON_SALE_SUB(recentProducts.length) }}</div>
        </div>
      </div>

      <div class="stat-card income">
        <div class="stat-icon">
          <el-icon :size="24"><Wallet /></el-icon>
        </div>
        <div>
          <div class="label">{{ DASHBOARD_TEXT.STAT_INCOME }}</div>
          <div class="value">¥{{ formatMoney(recent7Amount) }}</div>
          <div class="sub">{{ DASHBOARD_TEXT.STAT_INCOME_SUB(recent7Count) }}</div>
        </div>
      </div>

      <div class="stat-card warning">
        <div class="stat-icon">
          <el-icon :size="24"><Bell /></el-icon>
        </div>
        <div>
          <div class="label">{{ DASHBOARD_TEXT.STAT_PENDING }}</div>
          <div class="value">{{ overview.pending_order_count ?? '--' }}</div>
          <div class="sub">{{ DASHBOARD_TEXT.STAT_PENDING_SUB }}</div>
        </div>
      </div>

      <div class="stat-card credit" :class="`stat-card--credit-${creditLevel}`">
        <div class="stat-icon">
          <el-icon :size="24"><Medal /></el-icon>
        </div>
        <div>
          <div class="label">{{ DASHBOARD_TEXT.STAT_CREDIT }}</div>
          <div class="value">{{ overview.credit_score ?? userStore.creditScore ?? 100 }}</div>
          <div class="sub">{{ creditLabel }}</div>
        </div>
      </div>
    </div>

    <!-- ========== 主内容区：左侧图表 / 右侧 AI 助手 ========== -->
    <el-row :gutter="16">
      <!-- 左侧：图表 + 订单 + 商品 -->
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>{{ DASHBOARD_TEXT.CARD_TREND }}</span>
              <el-radio-group v-model="trendDays" size="small" @change="loadTrend">
                <el-radio-button :value="7">近 7 天</el-radio-button>
                <el-radio-button :value="30">近 30 天</el-radio-button>
                <el-radio-button :value="90">近 90 天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div v-loading="trendLoading" class="chart-box">
            <v-chart v-if="trendData.length" :option="trendOption" autoresize />
            <el-empty v-else :description="DASHBOARD_TEXT.EMPTY_TREND" />
          </div>
        </el-card>

        <el-row :gutter="16" style="margin-top: 16px">
          <el-col :xs="24" :md="12">
            <el-card shadow="hover" class="chart-card">
              <template #header>
                <span>{{ DASHBOARD_TEXT.CARD_CATEGORY }}</span>
              </template>
              <div v-loading="categoryLoading" class="chart-box">
                <v-chart v-if="categoryData.length" :option="categoryOption" autoresize />
                <el-empty v-else :description="DASHBOARD_TEXT.EMPTY_DEFAULT" />
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-card shadow="hover" class="chart-card">
              <template #header>
                <span>{{ DASHBOARD_TEXT.CARD_PRICE_RANGE }}</span>
              </template>
              <div v-loading="priceRangeLoading" class="chart-box">
                <v-chart v-if="priceRangeData.length" :option="priceRangeOption" autoresize />
                <el-empty v-else :description="DASHBOARD_TEXT.EMPTY_DEFAULT" />
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="16" style="margin-top: 16px">
          <!-- 待办订单 -->
          <el-col :xs="24" :md="12">
            <el-card shadow="hover" class="todo-card">
              <template #header>
                <div class="card-header">
                  <span>{{ DASHBOARD_TEXT.CARD_TODO }}</span>
                  <el-link type="primary" underline="never" @click="$router.push(ROUTE_PATHS.ORDERS)">
                    {{ DASHBOARD_TEXT.VIEW_ALL }}
                  </el-link>
                </div>
              </template>
              <div v-loading="todoLoading" class="todo-list">
                <el-empty v-if="!pendingOrders.length" :description="DASHBOARD_TEXT.TODO_EMPTY" :image-size="60" />
                <div
                  v-for="o in pendingOrders.slice(0, 5)"
                  :key="o.id"
                  class="todo-item"
                  @click="goOrder(o.id)"
                >
                  <el-avatar :size="36" :src="o.buyer?.avatar">
                    {{ (o.buyer?.username || 'B').charAt(0).toUpperCase() }}
                  </el-avatar>
                  <div class="todo-content">
                    <div class="todo-title">
                      <span>{{ o.buyer?.username || DASHBOARD_TEXT.ANON_BUYER }} 想要 {{ o.product?.title }}</span>
                    </div>
                    <div class="todo-meta">
                      <span class="status-badge" :class="`status-badge--${o.status}`">
                        {{ statusText(o.status) }}
                      </span>
                      <span class="time">{{ formatRelativeTime(o.created_at) }}</span>
                    </div>
                  </div>
                  <el-button link type="primary" size="small">{{ DASHBOARD_TEXT.HANDLE }}</el-button>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 最近商品 -->
          <el-col :xs="24" :md="12">
            <el-card shadow="hover" class="todo-card">
              <template #header>
                <div class="card-header">
                  <span>{{ DASHBOARD_TEXT.CARD_RECENT }}</span>
                  <el-link type="primary" underline="never" @click="$router.push(ROUTE_PATHS.PRODUCTS)">
                    {{ DASHBOARD_TEXT.VIEW_ALL }}
                  </el-link>
                </div>
              </template>
              <div v-loading="recentLoading" class="recent-grid">
                <el-empty v-if="!recentProducts.length" :description="DASHBOARD_TEXT.RECENT_EMPTY" :image-size="60" />
                <div
                  v-for="p in recentProducts.slice(0, 6)"
                  :key="p.id"
                  class="recent-card"
                  @click="goProduct(p.id)"
                >
                  <div class="recent-img" :style="coverStyle(getProductCover(p))">
                    <el-icon v-if="!getProductCover(p)" :size="32" color="var(--color-text-tertiary)"><Picture /></el-icon>
                    <span v-if="p.status === 'off_shelf'" class="recent-tag">{{ DASHBOARD_TEXT.STATUS_OFFSHELF }}</span>
                  </div>
                  <div class="recent-title">{{ p.title }}</div>
                  <div class="recent-price">¥{{ formatMoney(p.price) }}</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-col>

      <!-- 右侧：AI 助手面板 -->
      <el-col :xs="24" :lg="8">
        <div class="ai-panel">
          <div class="ai-panel__head">
            <div class="ai-panel__title-row">
              <div class="ai-panel__title-icon">
                <el-icon :size="20"><MagicStick /></el-icon>
              </div>
              <div>
                <div class="ai-panel__title">{{ DASHBOARD_TEXT.AI_PANEL_TITLE }}</div>
                <div class="ai-panel__subtitle">{{ DASHBOARD_TEXT.AI_PANEL_SUBTITLE }}</div>
              </div>
            </div>
            <el-tag v-if="aiHealth.enabled" type="success" size="small" effect="light">
              {{ DASHBOARD_TEXT.AI_CONNECTED }}
            </el-tag>
            <el-tag v-else size="small" effect="light" type="info">
              {{ DASHBOARD_TEXT.AI_OFFLINE }}
            </el-tag>
          </div>

          <!-- 快捷 AI 工具 -->
          <div class="ai-tools">
            <div
              v-for="tool in aiTools"
              :key="tool.id"
              class="ai-tool"
              :class="`ai-tool--${tool.tone}`"
              @click="openAiTool(tool)"
            >
              <div class="ai-tool__icon">
                <el-icon :size="18">
                  <component :is="tool.icon" />
                </el-icon>
              </div>
              <div class="ai-tool__body">
                <div class="ai-tool__label">{{ tool.label }}</div>
                <div class="ai-tool__desc">{{ tool.desc }}</div>
              </div>
              <el-icon :size="14" class="ai-tool__arrow"><ArrowRight /></el-icon>
            </div>
          </div>

          <!-- AI 议价助手（内联演示） -->
          <div class="ai-inline">
            <div class="ai-inline__head">
              <el-icon :size="16" color="var(--color-primary)"><ChatLineSquare /></el-icon>
              <span class="ai-inline__title">{{ DASHBOARD_TEXT.AI_INLINE_TITLE }}</span>
            </div>
            <el-input
              v-model="aiInlineForm.user_intent"
              type="textarea"
              :rows="2"
              :placeholder="DASHBOARD_TEXT.AI_INLINE_PLACEHOLDER"
              class="ai-inline__input"
              maxlength="200"
              show-word-limit
            />
            <div class="ai-inline__actions">
              <el-select v-model="aiInlineForm.category" :placeholder="DASHBOARD_TEXT.AI_INLINE_BTN" size="small" style="flex: 1">
                <el-option
                  v-for="opt in DASHBOARD_TEXT.INLINE_CATEGORIES"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <el-button
                type="primary"
                size="small"
                :loading="aiInlineLoading"
                @click="runInlineAi"
              >
                <el-icon :size="14"><Promotion /></el-icon>
                <span style="margin-left: 4px">{{ DASHBOARD_TEXT.AI_INLINE_BTN }}</span>
              </el-button>
            </div>
            <transition name="fade">
              <div v-if="aiInlineResult" class="ai-inline__result">
                <div class="ai-inline__result-head">
                  <el-icon :size="14" color="var(--color-success)"><CircleCheck /></el-icon>
                  <span>{{ DASHBOARD_TEXT.AI_SUGGESTED_REPLY }}</span>
                  <el-tag v-if="aiInlineResult.is_ai_fallback" size="small" effect="plain" type="info">
                    {{ DASHBOARD_TEXT.AI_FALLBACK }}
                  </el-tag>
                </div>
                <div class="ai-inline__result-text">{{ aiInlineResult.reply }}</div>
                <div class="ai-inline__result-meta">
                  <span>{{ DASHBOARD_TEXT.AI_SUGGESTED_PRICE(formatMoney(aiInlineResult.suggested_counter_price)) }}</span>
                  <span>{{ DASHBOARD_TEXT.AI_STRATEGY }}：{{ aiInlineResult.strategy }}</span>
                </div>
                <el-button-group class="ai-inline__result-actions">
                  <el-button size="small" @click="copyAiResult(aiInlineResult.reply)">
                    <el-icon :size="12"><CopyDocument /></el-icon>
                    <span style="margin-left: 4px">{{ DASHBOARD_TEXT.AI_COPY }}</span>
                  </el-button>
                  <el-button size="small" type="primary" @click="aiInlineResult = null">
                    {{ DASHBOARD_TEXT.AI_INLINE_AGAIN }}
                  </el-button>
                </el-button-group>
              </div>
            </transition>
          </div>
        </div>

        <!-- 健康分提示卡 -->
        <div class="tip-card" v-if="creditTip">
          <el-icon :size="16" color="var(--color-primary)"><InfoFilled /></el-icon>
          <span>{{ creditTip }}</span>
        </div>

        <!-- 学习小贴士卡 -->
        <div class="tip-card tip-card--soft">
          <div class="tip-card__head">
            <el-icon :size="16" color="var(--color-info)"><Reading /></el-icon>
            <span class="tip-card__title">{{ DASHBOARD_TEXT.TIPS_CARD_TITLE }}</span>
          </div>
          <ul class="tip-list">
            <li v-for="(tip, i) in tips" :key="i" class="tip-list__item">
              <el-icon :size="12" color="var(--color-info)"><Right /></el-icon>
              <span>{{ tip }}</span>
            </li>
          </ul>
        </div>
      </el-col>
    </el-row>

    <!-- AI 工具抽屉 -->
    <el-drawer
      v-model="aiToolDrawer.visible"
      :title="aiToolDrawer.title"
      direction="rtl"
      size="420px"
    >
      <div class="ai-drawer">
        <p class="ai-drawer__desc">{{ aiToolDrawer.desc }}</p>

        <!-- 价格建议工具 -->
        <template v-if="aiToolDrawer.id === 'price'">
          <el-form label-position="top" size="default">
            <el-form-item :label="DASHBOARD_TEXT.PRICE_CATEGORY_LABEL">
              <el-select v-model="aiToolDrawer.form.category" :placeholder="DASHBOARD_TEXT.PRICE_CATEGORY_LABEL" style="width: 100%">
                <el-option
                  v-for="opt in DASHBOARD_TEXT.PRICE_CATEGORIES"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="DASHBOARD_TEXT.PRICE_CONDITION_LABEL">
              <el-select v-model="aiToolDrawer.form.condition" style="width: 100%">
                <el-option
                  v-for="opt in DASHBOARD_TEXT.PRICE_CONDITIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="DASHBOARD_TEXT.PRICE_EXPECTED_LABEL">
              <el-input-number
                v-model="aiToolDrawer.form.current_price"
                :min="0"
                :step="10"
                style="width: 100%"
              />
            </el-form-item>
            <el-button
              type="primary"
              :loading="aiToolDrawer.loading"
              style="width: 100%"
              @click="runPriceSuggest"
            >
              <el-icon :size="14"><Promotion /></el-icon>
              <span style="margin-left: 4px">{{ DASHBOARD_TEXT.PRICE_BTN }}</span>
            </el-button>
          </el-form>

          <div v-if="aiToolDrawer.result" class="ai-drawer__result">
            <div class="ai-drawer__result-head">
              <el-icon :size="16" color="var(--color-primary)"><MagicStick /></el-icon>
              <span>{{ DASHBOARD_TEXT.PRICE_RESULT }}</span>
            </div>
            <div class="ai-drawer__price">
              <div class="ai-drawer__price-label">{{ DASHBOARD_TEXT.PRICE_SUGGEST_PRICE }}</div>
              <div class="ai-drawer__price-value">¥{{ formatMoney(aiToolDrawer.result.median ?? aiToolDrawer.result.suggested_price) }}</div>
              <div class="ai-drawer__price-range">
                {{ DASHBOARD_TEXT.PRICE_RANGE(
                  formatMoney(aiToolDrawer.result.low ?? (aiToolDrawer.result.price_range && aiToolDrawer.result.price_range[0])),
                  formatMoney(aiToolDrawer.result.high ?? (aiToolDrawer.result.price_range && aiToolDrawer.result.price_range[1]))
                ) }}
              </div>
            </div>
            <div class="ai-drawer__reason">{{ aiToolDrawer.result.reasoning ?? aiToolDrawer.result.reason }}</div>
            <div class="ai-drawer__meta">
              <el-tag v-if="aiToolDrawer.result.is_ai_fallback" size="small" effect="plain" type="info">
                {{ DASHBOARD_TEXT.AI_FALLBACK_MODE }}
              </el-tag>
              <span>{{ DASHBOARD_TEXT.PRICE_REASON_PREFIX }} {{ aiToolDrawer.result.sample_count ?? aiToolDrawer.result.market_refs }} {{ DASHBOARD_TEXT.PRICE_REASON_SUFFIX }}</span>
            </div>
          </div>
        </template>

        <!-- 内容审核工具 -->
        <template v-else-if="aiToolDrawer.id === 'moderate'">
          <el-form label-position="top">
            <el-form-item :label="DASHBOARD_TEXT.MODERATE_LABEL">
              <el-input
                v-model="aiToolDrawer.form.text"
                type="textarea"
                :rows="6"
                :placeholder="DASHBOARD_TEXT.MODERATE_PLACEHOLDER"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
            <el-button
              type="primary"
              :loading="aiToolDrawer.loading"
              style="width: 100%"
              @click="runModerate"
            >
              <el-icon :size="14"><Promotion /></el-icon>
              <span style="margin-left: 4px">{{ DASHBOARD_TEXT.MODERATE_BTN }}</span>
            </el-button>
          </el-form>

          <div v-if="aiToolDrawer.result" class="ai-drawer__result" :class="resultToneClass">
            <div class="ai-drawer__result-head">
              <el-icon :size="16" :color="resultIconColor">
                <component :is="resultIcon" />
              </el-icon>
              <span>{{ DASHBOARD_TEXT.MODERATE_RESULT }}</span>
            </div>
            <div class="ai-drawer__reason">
              <el-tag :type="resultToneType" effect="dark">
                {{ DASHBOARD_TEXT.MODERATE_RISK(aiToolDrawer.result.risk_level) }}
              </el-tag>
            </div>
            <div class="ai-drawer__reason">
              {{
                aiToolDrawer.result.reason
                  || (Array.isArray(aiToolDrawer.result.reasons) ? aiToolDrawer.result.reasons.join('；') : '')
                  || DASHBOARD_TEXT.PRICE_REASON_NONE
              }}
            </div>
            <div class="ai-drawer__suggestion" v-if="aiToolDrawer.result.suggestion">
              <span class="ai-drawer__suggestion-label">建议：</span>
              {{ aiToolDrawer.result.suggestion }}
            </div>
          </div>
        </template>

        <!-- 描述润色工具 -->
        <template v-else-if="aiToolDrawer.id === 'polish'">
          <el-form label-position="top">
            <el-form-item :label="DASHBOARD_TEXT.POLISH_TITLE_LABEL">
              <el-input v-model="aiToolDrawer.form.title" :placeholder="DASHBOARD_TEXT.POLISH_TITLE_PLACEHOLDER" />
            </el-form-item>
            <el-form-item :label="DASHBOARD_TEXT.POLISH_CATEGORY_LABEL">
              <el-input v-model="aiToolDrawer.form.category" :placeholder="DASHBOARD_TEXT.POLISH_CATEGORY_PLACEHOLDER" />
            </el-form-item>
            <el-form-item :label="DASHBOARD_TEXT.POLISH_RAW_LABEL">
              <el-input
                v-model="aiToolDrawer.form.raw_text"
                type="textarea"
                :rows="5"
                :placeholder="DASHBOARD_TEXT.POLISH_RAW_PLACEHOLDER"
              />
            </el-form-item>
            <el-button
              type="primary"
              :loading="aiToolDrawer.loading"
              style="width: 100%"
              @click="runPolish"
            >
              <el-icon :size="14"><Promotion /></el-icon>
              <span style="margin-left: 4px">{{ DASHBOARD_TEXT.POLISH_BTN }}</span>
            </el-button>
          </el-form>

          <div v-if="aiToolDrawer.result" class="ai-drawer__result">
            <div class="ai-drawer__result-head">
              <el-icon :size="16" color="var(--color-primary)"><MagicStick /></el-icon>
              <span>{{ DASHBOARD_TEXT.POLISH_RESULT }}</span>
            </div>
            <div class="ai-drawer__polished">{{ aiToolDrawer.result.polished_text }}</div>
            <div v-if="aiToolDrawer.result.highlights?.length" class="ai-drawer__chips">
              <el-tag
                v-for="(tag, i) in aiToolDrawer.result.highlights"
                :key="i"
                size="small"
                effect="light"
                type="success"
              >
                {{ tag }}
              </el-tag>
            </div>
            <div v-if="aiToolDrawer.result.tags?.length" class="ai-drawer__chips">
              <el-tag
                v-for="(tag, i) in aiToolDrawer.result.tags"
                :key="i"
                size="small"
                effect="plain"
              >
                {{ DASHBOARD_TEXT.KEYWORD_HASH(tag) }}
              </el-tag>
            </div>
            <el-button-group style="margin-top: 12px">
              <el-button size="small" @click="copyAiResult(aiToolDrawer.result.polished_text)">
                <el-icon :size="12"><CopyDocument /></el-icon>
                <span style="margin-left: 4px">{{ DASHBOARD_TEXT.AI_COPY }}</span>
              </el-button>
            </el-button-group>
          </div>
        </template>

        <!-- 关键词提取 -->
        <template v-else-if="aiToolDrawer.id === 'keywords'">
          <el-form label-position="top">
            <el-form-item :label="DASHBOARD_TEXT.KEYWORDS_TITLE_LABEL">
              <el-input v-model="aiToolDrawer.form.title" :placeholder="DASHBOARD_TEXT.KEYWORDS_TITLE_PLACEHOLDER" />
            </el-form-item>
            <el-form-item :label="DASHBOARD_TEXT.KEYWORDS_DESC_LABEL">
              <el-input
                v-model="aiToolDrawer.form.description"
                type="textarea"
                :rows="4"
                :placeholder="DASHBOARD_TEXT.KEYWORDS_DESC_PLACEHOLDER"
              />
            </el-form-item>
            <el-button
              type="primary"
              :loading="aiToolDrawer.loading"
              style="width: 100%"
              @click="runExtractKeywords"
            >
              <el-icon :size="14"><Promotion /></el-icon>
              <span style="margin-left: 4px">{{ DASHBOARD_TEXT.KEYWORDS_BTN }}</span>
            </el-button>
          </el-form>
          <div v-if="aiToolDrawer.result" class="ai-drawer__result">
            <div class="ai-drawer__result-head">
              <el-icon :size="16" color="var(--color-info)"><CollectionTag /></el-icon>
              <span>{{ DASHBOARD_TEXT.KEYWORDS_RESULT }}</span>
            </div>
            <div class="ai-drawer__chips">
              <el-tag
                v-for="(k, i) in aiToolDrawer.result.keywords"
                :key="i"
                size="default"
                effect="light"
                type="info"
              >
                {{ DASHBOARD_TEXT.KEYWORD_HASH(k) }}
              </el-tag>
              <span v-if="!aiToolDrawer.result.keywords?.length" class="text-muted">{{ DASHBOARD_TEXT.AI_INLINE_EMPTY }}</span>
            </div>
          </div>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
/**
 * 校园易物 H5 端 · 首页（个人中心 + 数据概览）
 *
 * - 顶部横幅：今日数据高亮、信用分环
 * - 关键指标卡：4 个核心数据
 * - 图表区：销售趋势、分类分布、价格区间
 * - 右侧 AI 智能助手面板（内联 + 抽屉）
 * - 运营小贴士
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Refresh,
  Goods,
  Wallet,
  Bell,
  Medal,
  Picture,
  MagicStick,
  ArrowRight,
  ChatLineSquare,
  Promotion,
  CircleCheck,
  CopyDocument,
  InfoFilled,
  Reading,
  Right,
  PriceTag,
  ChatDotRound,
  Document,
  CollectionTag,
} from '@element-plus/icons-vue'
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
  fetchSellerOverview,
  fetchSalesTrend,
  fetchCategoryDistribution,
  fetchPriceRange,
  type SellerOverview,
  type SalesTrendPoint,
  type CategoryDistribution,
  type PriceRangeBucket,
} from '@/api/stats'
import { fetchMyProducts, getProductCover, type Product } from '@/api/product'
import { fetchOrders, type Order } from '@/api/order'
import {
  aiHealth as fetchAiHealth,
  aiPriceSuggest,
  aiModerate,
  aiPolish,
  aiNegotiate,
  aiExtractKeywords,
  type AiHealthResult,
  type AiNegotiateResult,
} from '@/api/ai'
import { formatMoney } from '@/utils'
import { useChartColors } from '@/utils/chartTheme'
import { useUserStore } from '@/stores/user'
import { DASHBOARD_TEXT, ROUTE_PATHS, COMMON_TEXT, PRODUCT_STATUS, ERROR_TEXT } from '@/constants'

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

const router = useRouter()
const userStore = useUserStore()
// 主题色板(随 isDark 自动重算 → ECharts 自动重新渲染)
const chartColors = useChartColors()

// 加载态
const loading = ref(false)
const trendLoading = ref(false)
const categoryLoading = ref(false)
const priceRangeLoading = ref(false)
const todoLoading = ref(false)
const recentLoading = ref(false)

// 数据
const overview = ref<SellerOverview>({
  on_sale_count: 0,
  sold_count: 0,
  pending_order_count: 0,
  credit_score: 100,
})
const trendDays = ref<number>(7)
const trendData = ref<SalesTrendPoint[]>([])
const categoryData = ref<CategoryDistribution[]>([])
const priceRangeData = ref<PriceRangeBucket[]>([])
const pendingOrders = ref<Order[]>([])
const recentProducts = ref<Product[]>([])

// AI 相关
const aiHealth = ref<AiHealthResult>({
  enabled: false,
  provider: '',
  model: '',
  base_url: '',
  is_ai_fallback: true,
})

const aiTools = [...DASHBOARD_TEXT.AI_TOOLS]

const aiToolDrawer = ref<{
  visible: boolean
  id: '' | 'price' | 'moderate' | 'polish' | 'keywords'
  title: string
  desc: string
  loading: boolean
  form: Record<string, any>
  result: any
}>({
  visible: false,
  id: '',
  title: '',
  desc: '',
  loading: false,
  form: {},
  result: null,
})

const aiInlineForm = ref({
  user_intent: DASHBOARD_TEXT.INLINE_DEFAULT_INTENT,
  category: DASHBOARD_TEXT.INLINE_DEFAULT_CATEGORY,
})
const aiInlineLoading = ref(false)
const aiInlineResult = ref<AiNegotiateResult | null>(null)

// 衍生数据
const recent7Amount = computed(() =>
  trendData.value.reduce((s, d) => s + (Number(d.amount) || 0), 0),
)
const recent7Count = computed(() =>
  trendData.value.reduce((s, d) => s + (Number(d.count) || 0), 0),
)

/** 信用分等级 */
const creditLevel = computed(() => {
  const s = overview.value.credit_score ?? userStore.creditScore ?? 100
  if (s >= 90) return 'high'
  if (s >= 60) return 'mid'
  return 'low'
})

const creditLevelLabel = computed(() => {
  return { high: DASHBOARD_TEXT.CREDIT_HIGH, mid: DASHBOARD_TEXT.CREDIT_MID, low: DASHBOARD_TEXT.CREDIT_LOW }[creditLevel.value]
})

const creditLabel = computed(() => {
  const s = overview.value.credit_score ?? userStore.creditScore ?? 100
  if (s >= 90) return DASHBOARD_TEXT.CREDIT_HIGH_DESC
  if (s >= 60) return DASHBOARD_TEXT.CREDIT_MID_DESC
  return DASHBOARD_TEXT.CREDIT_LOW_DESC
})

const creditTip = computed(() => {
  const s = overview.value.credit_score ?? userStore.creditScore ?? 100
  if (s >= 90) return DASHBOARD_TEXT.CREDIT_TIP_HIGH
  if (s >= 60) return DASHBOARD_TEXT.CREDIT_TIP_MID
  return DASHBOARD_TEXT.CREDIT_TIP_LOW
})

/** 顶部横幅文案 */
const heroTitle = computed(() => {
  if (pendingOrders.value.length > 0) {
    return DASHBOARD_TEXT.HERO_PENDING(pendingOrders.value.length)
  }
  if (overview.value.sold_count && overview.value.sold_count > 0) {
    return DASHBOARD_TEXT.HERO_SOLD
  }
  return DASHBOARD_TEXT.HERO_DEFAULT
})

const heroDesc = computed(() => {
  const h = dayjs().hour()
  const period = h < 6
    ? DASHBOARD_TEXT.GREETING_NIGHT
    : h < 11
      ? DASHBOARD_TEXT.GREETING_MORNING
      : h < 14
        ? DASHBOARD_TEXT.GREETING_NOON
        : h < 18
          ? DASHBOARD_TEXT.GREETING_AFTERNOON
          : DASHBOARD_TEXT.GREETING_EVENING
  return `${period}，${dayjs().format('YYYY-MM-DD')} · ${DASHBOARD_TEXT.HERO_DESC_SUFFIX}`
})

/** 问候语 */
const greeting = computed(() => {
  const h = dayjs().hour()
  if (h < 6) return DASHBOARD_TEXT.GREETING_NIGHT
  if (h < 11) return DASHBOARD_TEXT.GREETING_MORNING
  if (h < 14) return DASHBOARD_TEXT.GREETING_NOON
  if (h < 18) return DASHBOARD_TEXT.GREETING_AFTERNOON
  return DASHBOARD_TEXT.GREETING_EVENING
})

/** 运营小贴士 */
const tips = [...DASHBOARD_TEXT.TIPS]

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
    legend: { data: [DASHBOARD_TEXT.CHART_LEGEND_AMOUNT, DASHBOARD_TEXT.CHART_LEGEND_COUNT], right: 10, top: 0, icon: 'roundRect', textStyle: { color: c.textSecondary } },
    grid: { left: 50, right: 50, top: 36, bottom: 30 },
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
        axisLabel: {
          formatter: (v: number) => (v >= 1000 ? v / 1000 + 'k' : String(v)),
          color: c.textSecondary,
        },
        splitLine: { lineStyle: { type: 'dashed', color: c.borderLight } },
      },
    ],
    series: [
      {
        name: DASHBOARD_TEXT.CHART_LEGEND_AMOUNT,
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
        name: DASHBOARD_TEXT.CHART_LEGEND_COUNT,
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        symbol: 'circle',
        symbolSize: 6,
        data: trendData.value.map(d => Number(d.count) || 0),
        itemStyle: { color: c.success },
        lineStyle: { width: 2, type: 'dashed', color: c.success },
      },
    ],
  }
})

/** 分类收入饼图配置 */
const categoryOption = computed(() => {
  const c = chartColors.value
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: c.cardBg,
      borderColor: c.borderLight,
      textStyle: { color: c.textSecondary },
      formatter: (p: any) => `${p.marker}${p.name}<br/>数量: ${p.value} 件<br/>占比: ${p.percent}%`,
    },
    legend: { orient: 'vertical', right: 6, top: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 12, color: c.textSecondary } },
    color: c.palette,
    series: [
      {
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: c.pieBorder, borderWidth: 2 },
        label: { show: true, color: c.textSecondary, formatter: '{b}\n{d}%', fontSize: 11 },
        labelLine: { length: 8, length2: 6, lineStyle: { color: c.borderLight } },
        data: categoryData.value.map(d => ({ name: d.name, value: d.value ?? d.count })),
      },
    ],
  }
})

/** 价格区间柱状图 */
const priceRangeOption = computed(() => {
  const c = chartColors.value
  return {
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      backgroundColor: c.cardBg,
      borderColor: c.borderLight,
      textStyle: { color: c.textSecondary },
    },
    grid: { left: 50, right: 24, top: 24, bottom: 36 },
    xAxis: {
      type: 'category',
      data: priceRangeData.value.map(d => d.range ?? d.label),
      axisLine: { lineStyle: { color: c.borderLight } },
      axisLabel: { color: c.textSecondary, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: c.textSecondary },
      splitLine: { lineStyle: { type: 'dashed', color: c.borderLight } },
    },
    series: [
      {
        type: 'bar',
        data: priceRangeData.value.map(d => d.count),
        barWidth: '55%',
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

/** 审核结果 tone */
const resultToneClass = computed(() => {
  const r = aiToolDrawer.value.result
  if (!r) return ''
  if (r.risk_level === 'high') return 'ai-drawer__result--danger'
  if (r.risk_level === 'medium') return 'ai-drawer__result--warning'
  return 'ai-drawer__result--success'
})
const resultToneType = computed<any>(() => {
  const r = aiToolDrawer.value.result
  if (!r) return 'info'
  if (r.risk_level === 'high') return 'danger'
  if (r.risk_level === 'medium') return 'warning'
  return 'success'
})
const resultIconColor = computed(() => {
  const r = aiToolDrawer.value.result
  if (!r) return 'var(--color-text-tertiary)'
  if (r.risk_level === 'high') return 'var(--color-error)'
  if (r.risk_level === 'medium') return 'var(--color-warning)'
  return 'var(--color-success)'
})
const resultIcon = computed<any>(() => {
  const r = aiToolDrawer.value.result
  if (!r) return CircleCheck
  if (r.risk_level === 'high') return 'WarningFilled' as any
  if (r.risk_level === 'medium') return 'Warning' as any
  return CircleCheck
})

/**
 * 订单状态 -> 中文
 * 优先级：常量映射 > 兜底
 */
function statusText(status: string) {
  const map: Record<string, string> = {
    requested: '待确认',
    confirmed: '已确认',
    shipping: '交易中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

/**
 * 相对时间
 */
function formatRelativeTime(iso: string) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  return dayjs(iso).format('MM-DD HH:mm')
}

/**
 * 商品封面背景图
 */
function coverStyle(url?: string) {
  if (url) return { backgroundImage: `url(${url})` }
  return { background: 'var(--color-bg-hover)' }
}

/**
 * 加载概览数据
 */
async function loadOverview() {
  loading.value = true
  try {
    const res: any = await fetchSellerOverview()
    const data = res.data || res
    overview.value = {
      on_sale_count: data.on_sale_count ?? 0,
      sold_count: data.sold_count ?? 0,
      pending_order_count: data.pending_order_count ?? 0,
      credit_score: data.credit_score ?? userStore.creditScore ?? 100,
    }
  } catch (e) {
    console.error('[Dashboard] 概览加载失败', e)
  } finally {
    loading.value = false
  }
}

/**
 * 加载销售趋势
 */
async function loadTrend() {
  trendLoading.value = true
  try {
    const res: any = await fetchSalesTrend({ days: trendDays.value })
    trendData.value = res.data?.trend || res.trend || []
  } catch (e) {
    console.error('[Dashboard] 趋势加载失败', e)
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
    const res: any = await fetchCategoryDistribution()
    categoryData.value = res.data?.distribution || res.distribution || []
  } catch (e) {
    console.error('[Dashboard] 分类分布加载失败', e)
  } finally {
    categoryLoading.value = false
  }
}

/**
 * 加载价格区间分布
 */
async function loadPriceRange() {
  priceRangeLoading.value = true
  try {
    const res: any = await fetchPriceRange()
    priceRangeData.value = res.data?.buckets || res.buckets || []
  } catch (e) {
    console.error('[Dashboard] 价格区间加载失败', e)
  } finally {
    priceRangeLoading.value = false
  }
}

/**
 * 加载待办订单
 */
async function loadTodos() {
  todoLoading.value = true
  try {
    const res: any = await fetchOrders({ role: 'seller', status: 'requested', page_size: 5 })
    pendingOrders.value = res.data?.results || res.results || []
    overview.value.pending_order_count = pendingOrders.value.length
  } catch (e) {
    console.error('[Dashboard] 待办加载失败', e)
  } finally {
    todoLoading.value = false
  }
}

/**
 * 加载最近商品
 */
async function loadRecentProducts() {
  recentLoading.value = true
  try {
    const res: any = await fetchMyProducts({ page_size: 6 })
    recentProducts.value = res.data?.results || res.results || []
  } catch (e) {
    console.error('[Dashboard] 最近商品加载失败', e)
  } finally {
    recentLoading.value = false
  }
}

/**
 * 加载 AI 健康状态
 */
async function loadAiHealth() {
  try {
    const res: any = await fetchAiHealth()
    const data = res.data || res
    aiHealth.value = {
      enabled: !!data.enabled,
      provider: data.provider || '',
      model: data.model || '',
      base_url: data.base_url || '',
      is_ai_fallback: !!data.is_ai_fallback,
    }
  } catch (e) {
    aiHealth.value.enabled = false
  }
}

/**
 * 刷新所有数据
 */
function refreshAll() {
  loadOverview()
  loadTrend()
  loadCategory()
  loadPriceRange()
  loadTodos()
  loadRecentProducts()
  loadAiHealth()
}

/**
 * 路由跳转辅助
 */
function goOrder(id: number) {
  router.push({ path: ROUTE_PATHS.ORDERS, query: { id: String(id) } })
}

function goProduct(id: number) {
  router.push({ path: ROUTE_PATHS.PRODUCTS, query: { id: String(id) } })
}

/**
 * 打开 AI 工具抽屉
 */
function openAiTool(tool: typeof aiTools[number]) {
  const drawerMap: Record<string, { title: string; desc: string; form: Record<string, any> }> = {
    price: {
      title: DASHBOARD_TEXT.AI_DRAWER.PRICE.title,
      desc: DASHBOARD_TEXT.AI_DRAWER.PRICE.desc,
      form: { category: DASHBOARD_TEXT.PRICE_CATEGORIES[1].value, condition: DASHBOARD_TEXT.PRICE_CONDITIONS[1].value, current_price: 1000 },
    },
    moderate: {
      title: DASHBOARD_TEXT.AI_DRAWER.MODERATE.title,
      desc: DASHBOARD_TEXT.AI_DRAWER.MODERATE.desc,
      form: { text: '' },
    },
    polish: {
      title: DASHBOARD_TEXT.AI_DRAWER.POLISH.title,
      desc: DASHBOARD_TEXT.AI_DRAWER.POLISH.desc,
      form: { title: '', category: '', raw_text: '' },
    },
    keywords: {
      title: DASHBOARD_TEXT.AI_DRAWER.KEYWORDS.title,
      desc: DASHBOARD_TEXT.AI_DRAWER.KEYWORDS.desc,
      form: { title: '', description: '' },
    },
  }
  const cfg = drawerMap[tool.id]
  if (!cfg) return
  aiToolDrawer.value = {
    visible: true,
    id: tool.id as any,
    title: cfg.title,
    desc: cfg.desc,
    loading: false,
    form: { ...cfg.form },
    result: null,
  }
}

/**
 * 运行价格建议
 */
async function runPriceSuggest() {
  aiToolDrawer.value.loading = true
  try {
    const res: any = await aiPriceSuggest({
      category: aiToolDrawer.value.form.category,
      condition: aiToolDrawer.value.form.condition,
      current_price: Number(aiToolDrawer.value.form.current_price) || 0,
    })
    aiToolDrawer.value.result = res.data || res
    ElMessage.success(DASHBOARD_TEXT.PRICE_SUCCESS)
  } catch (e: any) {
    ElMessage.error(DASHBOARD_TEXT.PRICE_FAIL + '：' + (e?.message || COMMON_TEXT.FAILED))
  } finally {
    aiToolDrawer.value.loading = false
  }
}

/**
 * 运行内容审核
 */
async function runModerate() {
  const text = (aiToolDrawer.value.form.text || '').trim()
  if (!text) {
    ElMessage.warning(DASHBOARD_TEXT.MODERATE_EMPTY)
    return
  }
  aiToolDrawer.value.loading = true
  try {
    const res: any = await aiModerate(text)
    aiToolDrawer.value.result = res.data || res
  } catch (e: any) {
    ElMessage.error(DASHBOARD_TEXT.MODERATE_BTN + '失败：' + (e?.message || COMMON_TEXT.FAILED))
  } finally {
    aiToolDrawer.value.loading = false
  }
}

/**
 * 运行描述润色
 */
async function runPolish() {
  const raw = (aiToolDrawer.value.form.raw_text || '').trim()
  if (!raw) {
    ElMessage.warning(DASHBOARD_TEXT.POLISH_RAW_PLACEHOLDER)
    return
  }
  aiToolDrawer.value.loading = true
  try {
    const res: any = await aiPolish({
      raw_text: raw,
      title: aiToolDrawer.value.form.title || '',
      category: aiToolDrawer.value.form.category || '',
    })
    aiToolDrawer.value.result = res.data || res
    ElMessage.success(DASHBOARD_TEXT.POLISH_SUCCESS)
  } catch (e: any) {
    ElMessage.error(DASHBOARD_TEXT.POLISH_FAIL + '：' + (e?.message || COMMON_TEXT.FAILED))
  } finally {
    aiToolDrawer.value.loading = false
  }
}

/**
 * 运行关键词提取
 */
async function runExtractKeywords() {
  const title = (aiToolDrawer.value.form.title || '').trim()
  const description = (aiToolDrawer.value.form.description || '').trim()
  if (!title && !description) {
    ElMessage.warning(DASHBOARD_TEXT.KEYWORDS_EMPTY)
    return
  }
  aiToolDrawer.value.loading = true
  try {
    const res: any = await aiExtractKeywords({ title, description })
    aiToolDrawer.value.result = res.data || res
  } catch (e: any) {
    ElMessage.error(DASHBOARD_TEXT.KEYWORDS_BTN + '失败：' + (e?.message || COMMON_TEXT.FAILED))
  } finally {
    aiToolDrawer.value.loading = false
  }
}

/**
 * 内联 AI 议价
 */
async function runInlineAi() {
  if (!aiInlineForm.value.user_intent.trim()) {
    ElMessage.warning(DASHBOARD_TEXT.INLINE_RETRY)
    return
  }
  aiInlineLoading.value = true
  try {
    const res: any = await aiNegotiate({
      title: DASHBOARD_TEXT.INLINE_TITLE,
      current_price: DASHBOARD_TEXT.INLINE_PRICE,
      user_intent: aiInlineForm.value.user_intent,
      category: aiInlineForm.value.category,
    })
    aiInlineResult.value = res.data || res
  } catch (e: any) {
    ElMessage.error(DASHBOARD_TEXT.INLINE_NEGOTIATE_FAIL + '：' + (e?.message || COMMON_TEXT.FAILED))
  } finally {
    aiInlineLoading.value = false
  }
}

/**
 * 复制 AI 结果
 */
async function copyAiResult(text: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(DASHBOARD_TEXT.AI_COPY_SUCCESS)
  } catch {
    ElMessage.warning(DASHBOARD_TEXT.AI_COPY_FAIL)
  }
}

onMounted(() => {
  refreshAll()
})
</script>

<style scoped>
.greeting {
  margin: 4px 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.header-actions {
  display: flex;
  gap: var(--space-2);
}

/* ========== 横幅 ========== */
.hero-banner {
  position: relative;
  border-radius: var(--radius-lg);
  padding: var(--space-6) var(--space-8);
  margin-bottom: var(--space-5);
  background: linear-gradient(120deg, #FF8A5C 0%, #FF6B35 60%, #FF4D1A 100%);
  color: #fff;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(255, 107, 53, 0.18);
}

.hero-banner__bg {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.hero-banner__bg--1 {
  top: -40px;
  right: 80px;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.12);
}

.hero-banner__bg--2 {
  bottom: -60px;
  right: -40px;
  width: 160px;
  height: 160px;
  background: rgba(255, 255, 255, 0.08);
}

.hero-banner__content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
}

.hero-banner__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-2);
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
.hero-chip--success { background: rgba(7, 193, 96, 0.25); }
.hero-chip--warning { background: rgba(255, 200, 100, 0.3); color: #fff; }
.hero-chip--info { background: rgba(25, 137, 250, 0.25); }

.hero-banner__ring {
  width: 120px;
  height: 120px;
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

.hero-banner__ring--high { box-shadow: inset 0 0 0 6px rgba(7, 193, 96, 0.5); }
.hero-banner__ring--mid  { box-shadow: inset 0 0 0 6px rgba(255, 165, 0, 0.5); }
.hero-banner__ring--low  { box-shadow: inset 0 0 0 6px rgba(255, 77, 79, 0.5); }

.hero-banner__ring-label {
  font-size: var(--font-size-xs);
  margin-top: 4px;
  opacity: 0.9;
}

/* ========== 统计卡 ========== */
.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.stat-card--credit-high .stat-icon { background: rgba(7, 193, 96, 0.12); color: var(--color-credit-high); }
.stat-card--credit-mid  .stat-icon { background: rgba(255, 165, 0, 0.12); color: var(--color-credit-mid); }
.stat-card--credit-low  .stat-icon { background: rgba(255, 77, 79, 0.12); color: var(--color-credit-low); }

.stat-card--credit-high .value { color: var(--color-credit-high); }
.stat-card--credit-mid  .value { color: var(--color-credit-mid); }
.stat-card--credit-low  .value { color: var(--color-credit-low); }

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

.chart-card,
.todo-card {
  border-radius: var(--radius-md);
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

/* ========== 待办列表 ========== */
.todo-list {
  min-height: 200px;
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

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: var(--font-weight-medium);
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

/* ========== 最近商品网格 ========== */
.recent-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  min-height: 200px;
}

.recent-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-base);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out);
  border: 1px solid var(--color-border-light);
}

.recent-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.recent-img {
  width: 100%;
  aspect-ratio: 1 / 1;
  background-size: cover;
  background-position: center;
  background-color: var(--color-bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.recent-tag {
  position: absolute;
  top: 4px;
  left: 4px;
  padding: 2px 6px;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: var(--radius-sm);
}

.recent-title {
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
  padding: 6px 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-price {
  font-size: var(--font-size-sm);
  color: var(--color-text-price);
  font-weight: var(--font-weight-semibold);
  padding: 0 8px 6px;
}

/* ========== AI 面板 ========== */
.ai-panel {
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  box-shadow: var(--shadow-base);
}

.ai-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-divider);
}

.ai-panel__title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.ai-panel__title-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #FF8A5C, #FF4D1A);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.ai-panel__title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.ai-panel__subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.ai-tools {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.ai-tool {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-base);
  background: var(--color-bg-section);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
  border: 1px solid transparent;
}

.ai-tool:hover {
  background: var(--color-primary-soft);
  border-color: var(--color-primary-soft);
  transform: translateX(2px);
}

.ai-tool__icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  flex-shrink: 0;
}

.ai-tool--success .ai-tool__icon { background: rgba(7, 193, 96, 0.12); color: var(--color-success); }
.ai-tool--warning .ai-tool__icon { background: rgba(255, 165, 0, 0.12); color: var(--color-warning); }
.ai-tool--info    .ai-tool__icon { background: rgba(25, 137, 250, 0.12); color: var(--color-info); }

.ai-tool__body { flex: 1; min-width: 0; }

.ai-tool__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.ai-tool__desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.ai-tool__arrow {
  color: var(--color-text-tertiary);
  transition: transform var(--duration-fast) var(--ease-out);
}

.ai-tool:hover .ai-tool__arrow {
  color: var(--color-primary);
  transform: translateX(2px);
}

/* ========== 内联 AI 议价 ========== */
.ai-inline {
  /* 主题感知:浅色 = 暖橙玻璃 / 深色 = 主色微亮玻璃 */
  background: linear-gradient(
    135deg,
    var(--ai-inline-bg-start) 0%,
    var(--ai-inline-bg-end) 100%
  );
  border: 1px solid var(--color-primary-soft);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}

.ai-inline__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.ai-inline__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
}

.ai-inline__input {
  margin-bottom: var(--space-2);
}

.ai-inline__actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.ai-inline__result {
  margin-top: var(--space-3);
  padding: var(--space-3);
  background: #fff;
  border-radius: var(--radius-base);
  border: 1px solid var(--color-border-light);
}

.ai-inline__result-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.ai-inline__result-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  line-height: var(--line-height-loose);
  margin-bottom: var(--space-2);
  white-space: pre-wrap;
}

.ai-inline__result-meta {
  display: flex;
  gap: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-2);
}

.ai-inline__result-actions {
  display: flex;
  gap: var(--space-2);
}

/* ========== 提示卡 ========== */
.tip-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  margin-top: var(--space-3);
  box-shadow: var(--shadow-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-loose);
}

.tip-card--soft {
  flex-direction: column;
  gap: var(--space-2);
  background: linear-gradient(
    135deg,
    var(--tip-card-soft-bg-start) 0%,
    var(--tip-card-soft-bg-end) 100%
  );
  border: 1px solid var(--tip-card-soft-border);
}

.tip-card__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.tip-card__title {
  font-weight: var(--font-weight-medium);
  color: var(--color-info);
}

.tip-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tip-list__item {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: var(--line-height-loose);
}

.tip-list__item .el-icon { margin-top: 4px; flex-shrink: 0; }

/* ========== AI 抽屉 ========== */
.ai-drawer__desc {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-divider);
}

.ai-drawer__result {
  margin-top: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg-section);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

/* AI 抽屉结果区：深浅色都好看的玻璃色 */
.ai-drawer__result--success {
  background: rgba(7, 193, 96, 0.08);
  border-color: rgba(7, 193, 96, 0.3);
}
.ai-drawer__result--warning {
  background: rgba(255, 165, 0, 0.08);
  border-color: rgba(255, 165, 0, 0.3);
}
.ai-drawer__result--danger {
  background: rgba(255, 77, 79, 0.08);
  border-color: rgba(255, 77, 79, 0.3);
}

.ai-drawer__result-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.ai-drawer__price {
  text-align: center;
  padding: var(--space-3) 0;
  background: var(--color-primary-soft);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
}

.ai-drawer__price-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.ai-drawer__price-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  font-family: var(--font-family-mono);
  margin: 4px 0;
}

.ai-drawer__price-range {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.ai-drawer__reason {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  line-height: var(--line-height-loose);
  margin-bottom: var(--space-2);
}

.ai-drawer__suggestion {
  font-size: var(--font-size-sm);
  background: var(--color-bg-section);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-base);
  border-left: 3px solid var(--color-info);
  color: var(--color-text-primary);
}

.ai-drawer__suggestion-label {
  color: var(--color-info);
  font-weight: var(--font-weight-medium);
}

.ai-drawer__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--space-2);
}

.ai-drawer__polished {
  background: rgba(255, 255, 255, 0.6);
  padding: var(--space-3);
  border-radius: var(--radius-base);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-loose);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
  white-space: pre-wrap;
}

.ai-drawer__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: var(--space-2);
}

/* 响应式 */
@media (max-width: 1199px) {
  .hero-banner { padding: var(--space-5) var(--space-5); }
  .hero-banner__title { font-size: var(--font-size-xl); }
  .hero-banner__ring { width: 96px; height: 96px; }
}
</style>
