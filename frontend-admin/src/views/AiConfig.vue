<!--
  平台管理后台 · AI 配置
  - 显示当前 AI 配置：是否启用 / API Key 状态 / 模型 / Base URL
  - "测试连接"按钮：调 /admin/ai/health/
  - 降级状态：标识当前是否在 mock 模式
-->
<template>
  <div class="page-container ai-config-page" v-loading="loading">
    <!-- 页头 -->
    <div class="page-header">
      <div>
        <h2>AI 配置</h2>
        <p class="subtitle">管理平台 AI 识别 / 智能发布 / 议价辅助服务</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
        <el-button type="primary" :icon="Connection" :loading="testing" @click="handleTest">
          测试连接
        </el-button>
      </div>
    </div>

    <!-- ========== 横幅 ========== -->
    <div class="hero-banner hero-banner--purple">
      <div class="hero-banner__bg hero-banner__bg--1"></div>
      <div class="hero-banner__bg hero-banner__bg--2"></div>
      <div class="hero-banner__content">
        <div class="hero-banner__text">
          <h3 class="hero-banner__title">AI 服务配置</h3>
          <p class="hero-banner__desc">管理 OpenAI 兼容服务：智能发布、议价辅助、内容审核</p>
          <div class="hero-banner__chips">
            <span class="hero-chip" :class="config.enabled ? 'hero-chip--success' : 'hero-chip--warning'">
              <el-icon :size="14"><Connection /></el-icon>
              <span>{{ config.enabled ? 'AI 已启用' : 'AI 未启用' }}</span>
            </span>
            <span class="hero-chip" :class="config.has_api_key ? 'hero-chip--success' : 'hero-chip--warning'">
              <el-icon :size="14"><Key /></el-icon>
              <span>API Key {{ config.has_api_key ? '已配置' : '未配置' }}</span>
            </span>
            <span class="hero-chip" :class="config.mock_mode ? 'hero-chip--warning' : 'hero-chip--success'">
              <el-icon :size="14"><Cpu /></el-icon>
              <span>{{ config.mock_mode ? '降级 Mock' : '真实调用' }}</span>
            </span>
          </div>
        </div>
        <div class="hero-banner__ring">
          <el-icon :size="56"><ChatLineRound /></el-icon>
          <div class="hero-banner__ring-label">AI CONFIG</div>
        </div>
      </div>
    </div>

    <!-- 状态卡片 -->
    <el-row :gutter="16" class="status-row">
      <el-col :xs="12" :sm="6">
        <div class="status-card">
          <div class="status-label">启用状态</div>
          <div class="status-value">
            <el-tag :type="config.enabled ? 'success' : 'info'" effect="dark" size="large">
              {{ config.enabled ? '已启用' : '未启用' }}
            </el-tag>
          </div>
        </div>
      </el-col>

      <el-col :xs="12" :sm="6">
        <div class="status-card">
          <div class="status-label">API Key</div>
          <div class="status-value">
            <el-tag :type="config.has_api_key ? 'success' : 'warning'" effect="light">
              {{ config.has_api_key ? '已配置' : '未配置' }}
            </el-tag>
          </div>
        </div>
      </el-col>

      <el-col :xs="12" :sm="6">
        <div class="status-card">
          <div class="status-label">运行模式</div>
          <div class="status-value">
            <el-tag :type="config.mock_mode ? 'warning' : 'success'" effect="light">
              {{ config.mock_mode ? '降级 Mock' : '真实调用' }}
            </el-tag>
          </div>
        </div>
      </el-col>

      <el-col :xs="12" :sm="6">
        <div class="status-card">
          <div class="status-label">最近健康检查</div>
          <div class="status-value text-secondary" style="font-size: 13px">
            {{ config.last_check_at ? formatDate(config.last_check_at) : '尚未检查' }}
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 配置表单 -->
    <el-card shadow="never" class="form-card">
      <template #header>
        <div class="card-header">
          <span>基础配置</span>
          <el-tag v-if="config.mock_mode" type="warning" size="small" effect="plain">
            当前为 Mock 模式，编辑保存后下次调用生效
          </el-tag>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="启用 AI" prop="enabled">
          <el-switch
            v-model="form.enabled"
            active-text="启用"
            inactive-text="停用"
            inline-prompt
            style="--el-switch-on-color: var(--color-primary)"
          />
          <span class="form-tip">关闭后 AI 相关接口将返回 mock 数据</span>
        </el-form-item>

        <el-form-item label="服务地址" prop="base_url">
          <el-input
            v-model="form.base_url"
            placeholder="https://api.openai.com/v1"
            clearable
          />
          <span class="form-tip">兼容 OpenAI 格式的 base_url</span>
        </el-form-item>

        <el-form-item label="模型" prop="model">
          <el-select
            v-model="form.model"
            placeholder="选择模型"
            filterable
            allow-create
            style="width: 320px"
          >
            <el-option label="gpt-4o-mini" value="gpt-4o-mini" />
            <el-option label="gpt-4o" value="gpt-4o" />
            <el-option label="gpt-3.5-turbo" value="gpt-3.5-turbo" />
            <el-option label="qwen-vl-plus" value="qwen-vl-plus" />
            <el-option label="qwen2-vl-72b" value="qwen2-vl-72b" />
            <el-option label="claude-3-5-sonnet" value="claude-3-5-sonnet" />
            <el-option label="agnes-2.0-flash" value="agnes-2.0-flash" />
            <el-option label="deepseek-chat" value="deepseek-chat" />
          </el-select>
        </el-form-item>

        <el-form-item label="API Key" prop="api_key">
          <el-input
            v-model="form.api_key"
            type="password"
            show-password
            placeholder="留空则保留原值；未配置时会进入 mock 模式"
            clearable
          />
          <span class="form-tip">修改后点击"保存配置"生效；密钥仅管理员可见</span>
        </el-form-item>

        <el-form-item label="超时时间">
          <el-input-number v-model="form.timeout" :min="5" :max="120" :step="5" /> 秒
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
          <el-button @click="resetForm">恢复未保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 测试结果 -->
    <el-card v-if="testResult.visible" shadow="never" class="result-card">
      <template #header>
        <div class="card-header">
          <span>连接测试结果</span>
          <el-button link @click="testResult.visible = false">关闭</el-button>
        </div>
      </template>
      <el-result
        :icon="testResult.success ? 'success' : 'error'"
        :title="testResult.success ? 'AI 服务连接正常' : 'AI 服务连接失败'"
        :sub-title="testResult.message"
      >
        <template #icon>
          <el-icon v-if="testResult.success" :size="64" color="var(--color-success)"><CircleCheck /></el-icon>
          <el-icon v-else :size="64" color="var(--color-error)"><CircleClose /></el-icon>
        </template>
        <template #extra>
          <div v-if="testResult.detail" class="test-detail">
            <pre>{{ testResult.detail }}</pre>
          </div>
        </template>
      </el-result>
    </el-card>
  </div>
</template>

<script setup>
/**
 * AI 配置页面
 * - /admin/ai/config/   GET 读取 / PUT 保存
 * - /admin/ai/health/   POST 测试连接
 */
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Connection, CircleCheck, CircleClose, Key, Cpu, ChatLineRound } from '@element-plus/icons-vue'
import { fetchAiConfig, updateAiConfig, testAiConnection } from '@/api'

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)

/* 当前配置（来自后端） */
const config = reactive({
  enabled: false,
  has_api_key: false,
  mock_mode: true,
  base_url: '',
  model: '',
  timeout: 30,
  last_check_at: '',
})

/* 编辑表单 */
const form = reactive({
  enabled: false,
  base_url: '',
  model: 'agnes-2.0-flash',
  api_key: '',
  timeout: 30,
})

const formRef = ref(null)
const formRules = {
  base_url: [{ required: false, message: '请输入服务地址', trigger: 'blur' }],
  model: [{ required: true, message: '请选择模型', trigger: 'change' }],
}

/* 测试结果 */
const testResult = reactive({ visible: false, success: false, message: '', detail: '' })

/**
 * 格式化日期
 */
function formatDate(iso) {
  if (!iso) return '--'
  return iso.slice(0, 19).replace('T', ' ')
}

/**
 * 加载配置
 */
async function loadData() {
  loading.value = true
  try {
    const res = await fetchAiConfig()
    const data = res?.data || res || {}
    Object.assign(config, {
      enabled: !!data.enabled,
      has_api_key: !!data.has_api_key || !!data.api_key_set,
      mock_mode: data.mock_mode ?? !data.has_api_key,
      base_url: data.base_url || '',
      model: data.model || '',
      timeout: data.timeout ?? 30,
      last_check_at: data.last_check_at || data.last_health_check || '',
    })
    // 同步到 form
    form.enabled = config.enabled
    form.base_url = config.base_url
    form.model = config.model || 'gpt-4o-mini'
    form.timeout = config.timeout
    form.api_key = ''
  } catch (e) {
    // 错误已统一提示
  } finally {
    loading.value = false
  }
}

/**
 * 保存配置
 */
async function handleSave() {
  if (formRef.value) {
    try {
      await formRef.value.validate()
    } catch {
      return
    }
  }
  saving.value = true
  try {
    const payload = { ...form }
    // api_key 为空时不传（保留后端原值）
    if (!payload.api_key) delete payload.api_key
    await updateAiConfig(payload)
    ElMessage.success('配置已保存')
    form.api_key = ''
    loadData()
  } catch (e) {
    // 错误已统一提示
  } finally {
    saving.value = false
  }
}

/**
 * 恢复未保存
 */
function resetForm() {
  form.enabled = config.enabled
  form.base_url = config.base_url
  form.model = config.model || 'gpt-4o-mini'
  form.timeout = config.timeout
  form.api_key = ''
  ElMessage.info('已恢复')
}

/**
 * 测试连接
 */
async function handleTest() {
  testing.value = true
  testResult.visible = false
  try {
    const res = await testAiConnection()
    const data = res?.data || res || {}
    testResult.success = data.success !== false && data.ok !== false
    testResult.message = data.message || (testResult.success ? '服务可用' : '服务不可用')
    testResult.detail = data.detail || data.error || JSON.stringify(data, null, 2)
    config.last_check_at = new Date().toISOString()
    testResult.visible = true
  } catch (e) {
    testResult.success = false
    testResult.message = e?.message || '连接测试失败'
    testResult.detail = e?.response?.data ? JSON.stringify(e.response.data, null, 2) : ''
    testResult.visible = true
  } finally {
    testing.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.ai-config-page {
  /* 页面容器 */
}

.subtitle {
  margin: 4px 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.header-actions {
  display: flex;
  gap: var(--space-2);
}

.status-row {
  margin-bottom: var(--space-4);
}

.status-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  box-shadow: var(--shadow-base);
  margin-bottom: var(--space-3);
}

.status-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.status-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.form-card,
.result-card {
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.form-tip {
  margin-left: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.test-detail {
  background: var(--color-bg-section);
  border-radius: var(--radius-base);
  padding: var(--space-3);
  text-align: left;
  max-width: 600px;
  margin: 0 auto;
}

.test-detail pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* ========== 横幅 ========== */
.hero-banner {
  position: relative;
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  margin-bottom: var(--space-4);
  color: #fff;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.25);
}

.hero-banner--purple {
  background: linear-gradient(120deg, #A78BFA 0%, #7C3AED 60%, #5B21B6 100%);
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
</style>
