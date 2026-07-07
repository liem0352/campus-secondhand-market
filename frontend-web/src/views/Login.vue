<!--
  校园易物 H5 端 · 登录页
  - 左侧：品牌口号 + 数据看板 + 价值点
  - 右侧：登录表单 + 演示账号 + 快速登录
-->
<template>
  <div class="login-page">
    <div class="login-vignette" />

    <div class="login-container">
      <!-- 左侧：品牌区 -->
      <div class="brand-section">
        <div class="brand-section__top">
          <BrandLogo
            :size="52"
            variant="horizontal"
            theme="color"
            :title="APP_TEXT.NAME"
            :subtitle="APP_TEXT.SHORT_NAME"
            text-color="#FFFFFF"
          />
          <p class="brand-tagline">{{ APP_TEXT.TAGLINE }}</p>
        </div>

        <ul class="brand-features">
          <li v-for="(feat, idx) in APP_TEXT.FEATURES" :key="idx">
            <el-icon><component :is="featureIcons[idx]" /></el-icon>
            <span>{{ feat }}</span>
          </li>
        </ul>

        <div class="brand-footer">
          <span>{{ APP_TEXT.FOOTER_AUTHOR }}</span>
        </div>
      </div>

      <!-- 右侧：登录表单 -->
      <el-card class="login-card" shadow="never">
        <h2 class="form-title">{{ APP_TEXT.LOGIN_TITLE }}</h2>
        <p class="form-subtitle">{{ APP_TEXT.LOGIN_SUBTITLE }}</p>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          size="large"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              :placeholder="APP_TEXT.USERNAME_PLACEHOLDER"
              :prefix-icon="User"
              clearable
              autocomplete="username"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              :placeholder="APP_TEXT.PASSWORD_PLACEHOLDER"
              :prefix-icon="Lock"
              show-password
              autocomplete="current-password"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="login-btn"
              :loading="loginLoading"
              @click="handleLogin"
            >
              {{ APP_TEXT.LOGIN_BTN }}
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 快速登录 -->
        <div class="quick-login">
          <div class="quick-title">{{ APP_TEXT.DEMO_TITLE }}</div>
          <div class="quick-list">
            <button
              v-for="acc in demoAccounts"
              :key="acc.username"
              type="button"
              class="quick-btn"
              @click="fillAccount(acc)"
            >
              <span
                class="quick-role"
                :class="{ 'quick-role--dot': !acc.role }"
                :style="{ background: `var(${acc.colorVar})` }"
              >{{ acc.role }}</span>
              <span class="quick-name">{{ acc.username }}</span>
            </button>
          </div>
        </div>

        <!-- 演示账号提示 -->
        <div class="demo-tip">
          <div class="tip-title">
            <el-icon><InfoFilled /></el-icon>
            <span>{{ DEMO_PASSWORD_HINT.TITLE }}</span>
          </div>
          <p>{{ DEMO_PASSWORD_HINT.NORMAL }} <code>{{ DEMO_PASSWORD_HINT.CODES.NORMAL }}</code>({{ DEMO_PASSWORD_HINT.ADMIN_HINT }}:<code>{{ DEMO_PASSWORD_HINT.CODES.ADMIN }}</code>)</p>
        </div>

        <!-- 底部版权 -->
        <div class="login-footer">
          <span>{{ APP_TEXT.AGREEMENT_TEXT }}</span>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 校园易物 H5 端 · 登录页
 * - 双栏布局：左品牌 + 右表单
 * - 支持用户名 / 学号 + 密码登录
 * - 演示账号一键填充
 */
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  User,
  Lock,
  Goods,
  ChatDotRound,
  TrendCharts,
  Search,
  InfoFilled,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { APP_TEXT, VALIDATE_TEXT, ERROR_TEXT, DEMO_ACCOUNTS, DEMO_PASSWORD_HINT } from '@/constants'
import BrandLogo from '@/components/BrandLogo.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

/** 特性图标(按 APP_TEXT.FEATURES 顺序对应) */
const featureIcons = [Search, ChatDotRound, Goods, TrendCharts]

// 表单引用
const loginFormRef = ref<FormInstance>()
// 加载态
const loginLoading = ref(false)

// 登录表单
const loginForm = reactive({
  username: '',
  password: '',
})

// 表单校验规则
const loginRules: FormRules = {
  username: [
    { required: true, message: VALIDATE_TEXT.USERNAME_REQUIRED, trigger: 'blur' },
    { min: 3, max: 30, message: VALIDATE_TEXT.USERNAME_LENGTH, trigger: 'blur' },
  ],
  password: [
    { required: true, message: VALIDATE_TEXT.PASSWORD_REQUIRED, trigger: 'blur' },
    { min: 6, message: VALIDATE_TEXT.PASSWORD_LENGTH, trigger: 'blur' },
  ],
}

/** 演示账号列表(从常量读取) */
const demoAccounts = DEMO_ACCOUNTS

/**
 * 一键填充演示账号
 * @param acc 演示账号对象
 */
function fillAccount(acc: { username: string; password: string }) {
  loginForm.username = acc.username
  loginForm.password = acc.password
  ElMessage.info(ERROR_TEXT.EXTRACT_DEMO.replace('{username}', acc.username))
}

/**
 * 提交登录
 * 成功后跳转至 redirect 参数或工作台
 */
async function handleLogin() {
  const valid = await loginFormRef.value?.validate().catch(() => false)
  if (!valid) return
  loginLoading.value = true
  try {
    await userStore.login(loginForm.username, loginForm.password)
    ElMessage.success(APP_TEXT.LOGIN_SUCCESS)
    const redirect = (route.query.redirect as string) || APP_TEXT.DEFAULT_ROUTE
    router.push(redirect)
  } catch (e: any) {
    console.error('[Login] 登录失败', e)
  } finally {
    loginLoading.value = false
  }
}
</script>

<style scoped>
/* ========================================
   登录页整体（Apple Music 风格：单色场 + 2 颗超软呼吸光）
   设计哲学：减法。看不到光斑，只能感受到"色彩在呼吸"
   ======================================== */
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 底层：主色渐变(随主题自适应) */
  background: var(--brand-bg-page);
  padding: var(--space-4);
  overflow: hidden;
  isolation: isolate;
}

/* 呼吸光 1：暖白 · 右上 · 超大 · 超软 */
.login-page::before {
  content: '';
  position: absolute;
  width: 1600px;          /* 极大，覆盖 1.5x 视口 */
  height: 1600px;
  top: -30%;
  right: -20%;
  background: radial-gradient(
    circle,
    rgba(255, 245, 225, 0.55) 0%,    /* 中心：暖白 */
    rgba(255, 220, 180, 0.3) 30%,
    rgba(255, 200, 150, 0.15) 55%,
    transparent 75%
  );
  filter: blur(120px);     /* 巨模糊，看不出圆形 */
  animation: breathe-warm 38s ease-in-out infinite alternate;
  pointer-events: none;
  will-change: transform, filter;
}

/* 呼吸光 2：深珊瑚 · 左下 · 超大 · 超软 */
.login-page::after {
  content: '';
  position: absolute;
  width: 1400px;
  height: 1400px;
  bottom: -35%;
  left: -25%;
  background: radial-gradient(
    circle,
    rgba(232, 75, 37, 0.6) 0%,        /* 中心：深橙红 */
    rgba(255, 107, 69, 0.35) 35%,
    rgba(242, 92, 42, 0.18) 60%,
    transparent 80%
  );
  filter: blur(130px);
  animation: breathe-coral 46s ease-in-out infinite alternate;
  pointer-events: none;
  will-change: transform, filter;
}

/* 极慢呼吸动画：位移极小、缩放极小、纯色温律动 */
@keyframes breathe-warm {
  0%   { transform: translate(0, 0)        scale(1)    rotate(0deg);  }
  100% { transform: translate(-80px, 50px) scale(1.08) rotate(4deg);  }
}

@keyframes breathe-coral {
  0%   { transform: translate(0, 0)        scale(1)    rotate(0deg);  }
  100% { transform: translate(70px, -60px) scale(0.95) rotate(-3deg); }
}

/* Vignette 层：4 边柔暗（让视觉聚焦中央） */
.login-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background:
    /* 顶：模拟 iOS 状态栏暗角 */
    linear-gradient(180deg, rgba(60, 20, 0, 0.18) 0%, transparent 18%),
    /* 底：模拟 home indicator 暗角 */
    linear-gradient(0deg, rgba(60, 20, 0, 0.22) 0%, transparent 20%),
    /* 四角：径向暗角（聚焦中心） */
    radial-gradient(ellipse 110% 100% at 50% 50%, transparent 55%, rgba(60, 20, 0, 0.28) 100%);
}

/* 容器：透明（让背景的光斑能透到所有玻璃面） */
.login-container {
  position: relative;
  z-index: var(--z-base);
  display: flex;
  align-items: stretch;
  max-width: 920px;
  width: 100%;
  /* ★ 关键：容器本身几乎透明，让背景色斑能透到所有玻璃层 */
  background: transparent;
  border-radius: var(--glass-r-xl);
  box-shadow:
    0 32px 64px rgba(0, 0, 0, 0.22),
    0 8px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 540px;
  border: 1.5px solid rgba(255, 255, 255, 0.4);
}

/* ========================================
   左侧：品牌区（深色玻璃）
   ======================================== */
.brand-section {
  flex: 1;
  background: linear-gradient(160deg, rgba(28, 28, 30, 0.78) 0%, rgba(44, 44, 46, 0.72) 100%);
  backdrop-filter: var(--glass-blur-2);
  -webkit-backdrop-filter: var(--glass-blur-2);
  color: var(--warm-50);
  padding: var(--space-12) var(--space-8);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  /* 内部高光：左边一条微妙的玻璃折光 */
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.12);
}

/* 右侧高光球（橙色主光源） */
.brand-section::before {
  content: '';
  position: absolute;
  top: -100px;
  right: -80px;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(255, 138, 92, 0.32) 0%, transparent 70%);
  pointer-events: none;
  filter: blur(20px);
}

/* 底部辅光（冷色调对比） */
.brand-section::after {
  content: '';
  position: absolute;
  bottom: -60px;
  left: -40px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(96, 130, 234, 0.12) 0%, transparent 70%);
  pointer-events: none;
  filter: blur(16px);
}

/* 品牌区顶部（logo + 一句话定位） */
.brand-section__top {
  position: relative;
  z-index: 1;
  margin-bottom: var(--space-6);
}

.brand-section__top .brand-logo {
  align-items: center;
}

/* 一句话定位语（与 logo 拉开距离） */
.brand-section .brand-tagline {
  margin: var(--space-3) 0 0;
  color: rgba(255, 255, 255, 0.85);
  font-size: var(--font-size-sm);
  letter-spacing: 1px;
  line-height: var(--line-height-loose);
}

.brand-features {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  position: relative;
  z-index: 1;
}

.brand-features li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.85);
}

.brand-features li .el-icon {
  color: var(--orange-500);
  font-size: 18px;
  flex-shrink: 0;
}

.brand-footer {
  margin-top: var(--space-8);
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.4);
  position: relative;
  z-index: 1;
}

/* ========================================
   右侧：登录表单（湿玻璃：渐变 + 多层高光 + 角落亮点）
   背景跟随主题:浅色用白玻璃 / 深色用深色玻璃,让文字色自动可读
   ======================================== */
.login-card {
  flex: 1;
  border: none !important;
  border-radius: 0 !important;
  padding: var(--space-10) var(--space-8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  /* 玻璃背景:浅色 = 88% 白玻璃;深色 = 55% 暗玻璃 */
  background: var(--glass-light-2);
  backdrop-filter: var(--glass-blur-2) saturate(180%);
  -webkit-backdrop-filter: var(--glass-blur-2) saturate(180%);
  border-left: 1px solid var(--color-border-light);
  box-shadow:
    inset 1px 0 0 var(--glass-hl-color),
    inset 0 1px 0 var(--glass-hl-color);
  overflow: hidden;
  color: var(--color-text-primary);
}

/* 玻璃顶部高光带(让光"压在"玻璃上面) - 主题感知 */
.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 35%;
  background: linear-gradient(
    180deg,
    var(--glass-hl-color) 0%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 0;
}

/* 玻璃底部主色反射(环境色 tint) */
.login-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 25%;
  background: linear-gradient(
    0deg,
    var(--glass-primary-tint) 0%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 0;
}

/* 内容层：z-index 提到 1，避免被 ::before/::after 覆盖 */
.login-card > * {
  position: relative;
  z-index: 1;
}

/* ========================================
   表单输入框：液态玻璃输入（完整版）
   ======================================== */

/* form-item 间距紧凑 */
.login-card :deep(.el-form-item) {
  margin-bottom: var(--space-5);
}

/* 主输入容器：玻璃面板(主题感知) */
.login-card :deep(.el-input__wrapper) {
  position: relative;
  background: var(--glass-input-bg) !important;
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-radius: 14px !important;
  padding: 4px 14px;
  /* 1.5px 玻璃边框(主题感知) */
  box-shadow:
    inset 0 0 0 1.5px var(--glass-hl-color),
    inset 0 1px 0 var(--glass-hl-color),
    0 2px 8px rgba(0, 0, 0, 0.04) !important;
  transition: all 220ms cubic-bezier(0.2, 0, 0, 1);
  min-height: 46px;
}

/* hover：玻璃变厚、抬升 */
.login-card :deep(.el-input__wrapper:hover) {
  background: var(--glass-input-bg-hover) !important;
  box-shadow:
    inset 0 0 0 1.5px var(--glass-hl-color),
    inset 0 1px 0 var(--glass-hl-color),
    0 4px 14px rgba(0, 0, 0, 0.08) !important;
  transform: translateY(-1px);
}

/* focus：暖橙光晕 + 玻璃更厚 */
.login-card :deep(.el-input__wrapper.is-focus) {
  background: var(--glass-input-bg-focus) !important;
  box-shadow:
    inset 0 0 0 1.5px rgba(var(--color-primary-rgb), 0.5),
    inset 0 1px 0 var(--glass-hl-color),
    0 0 0 4px rgba(var(--color-primary-rgb), 0.15),
    0 6px 18px rgba(var(--color-primary-rgb), 0.18) !important;
  transform: translateY(-1px);
}

/* 输入框内部：透出 + 16px 文字 + 暖色 placeholder */
.login-card :deep(.el-input__inner) {
  background: transparent !important;
  color: var(--warm-700) !important;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.2px;
  height: 38px;
  line-height: 38px;
}
.login-card :deep(.el-input__inner::placeholder) {
  color: var(--warm-400);
  opacity: 0.7;
  font-weight: 400;
}

/* 前置图标：暖色，半透明玻璃图标 */
.login-card :deep(.el-input__prefix-inner) {
  color: var(--orange-500) !important;
  filter: drop-shadow(0 1px 2px rgba(242, 92, 42, 0.2));
}

/* 密码显示切换图标 */
.login-card :deep(.el-input__suffix) {
  color: var(--warm-400) !important;
}
.login-card :deep(.el-input__suffix:hover) {
  color: var(--orange-500) !important;
}

/* clearable 清除按钮 */
.login-card :deep(.el-input__clear) {
  color: var(--warm-400) !important;
}
.login-card :deep(.el-input__clear:hover) {
  color: var(--orange-500) !important;
}

/* 输入框错误状态：暖红玻璃 */
.login-card :deep(.el-input__wrapper.is-focus.is-danger) {
  box-shadow:
    inset 0 0 0 1.5px rgba(220, 53, 69, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 0 0 4px rgba(220, 53, 69, 0.15) !important;
}

.form-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2);
  letter-spacing: -0.5px;
}

.form-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-6);
  font-weight: 500;
}

/* 登录按钮：暖橙渐变 + 阴影 */
.login-btn {
  width: 100%;
  height: 44px;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 4px;
  /* 暖橙渐变背景 */
  background: var(--brand-gradient-warm) !important;
  border: none !important;
  color: #fff !important;
  box-shadow:
    0 6px 20px rgba(242, 92, 42, 0.35),
    0 2px 6px rgba(242, 92, 42, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
  transition: all 240ms cubic-bezier(0.2, 0, 0, 1) !important;
}
.login-btn:hover {
  background: linear-gradient(135deg, #FF8A5C 0%, #F25C2A 50%, #D44417 100%) !important;
  box-shadow:
    0 10px 28px rgba(242, 92, 42, 0.45),
    0 4px 10px rgba(242, 92, 42, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.35) !important;
  transform: translateY(-1px);
}
.login-btn:active {
  background: linear-gradient(135deg, #D44417 0%, #A8330F 100%) !important;
  transform: translateY(0);
  box-shadow:
    0 2px 8px rgba(242, 92, 42, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
}

/* Element Plus 主色覆盖:全部从主色阶变量取,跟随主题切换 */
.login-card {
  --el-color-primary: var(--color-primary-500);
  --el-color-primary-light-3: var(--color-primary-300);
  --el-color-primary-light-5: var(--color-primary-200);
  --el-color-primary-light-7: var(--color-primary-100);
  --el-color-primary-light-8: var(--color-primary-50);
  --el-color-primary-light-9: var(--color-primary-50);
  --el-color-primary-dark-2: var(--color-primary-700);
  --el-text-color-primary: var(--color-text-primary);
  --el-text-color-regular: var(--color-text-secondary);
  --el-text-color-secondary: var(--color-text-tertiary);
  --el-text-color-placeholder: var(--color-text-tertiary);
  --el-border-color: rgba(var(--color-primary-rgb), 0.15);
  --el-border-color-light: rgba(var(--color-primary-rgb), 0.1);
  --el-border-color-lighter: rgba(var(--color-primary-rgb), 0.06);
}

/* 表单链接（"立即注册"等）变主色 */
.login-card :deep(.el-link.el-link--primary) {
  --el-link-text-color: var(--color-primary-500);
  --el-link-hover-text-color: var(--color-primary-600);
}
.login-card :deep(.form-link) {
  color: var(--color-primary-600) !important;
  font-weight: 600;
}
.login-card :deep(.form-link:hover) {
  color: var(--color-primary-700) !important;
}

/* checkbox / radio 主色 */
.login-card :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--color-primary-500) !important;
  border-color: var(--color-primary-500) !important;
}
.login-card :deep(.el-checkbox__label) {
  color: var(--color-text-secondary) !important;
}

/* 表单错误提示（element 默认红色） */
.login-card :deep(.el-form-item__error) {
  color: var(--danger-600) !important;
  font-weight: 500;
}

/* ========================================
   快速登录（一键填充）—— 玻璃子卡(主题感知)
   ======================================== */
.quick-login {
  margin-top: var(--space-4);
  padding: var(--space-3);
  background: var(--glass-quick-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-hl-color);
  box-shadow:
    inset 0 1px 0 var(--glass-hl-color),
    0 2px 8px rgba(0, 0, 0, 0.04);
  border-radius: var(--radius-base);
}

.quick-title {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
  font-weight: var(--font-weight-medium);
}

.quick-list {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  /* 关键:显式覆盖,防止 overflow-x 隐式把 overflow-y 改成 auto,导致焦点环被上下裁剪 */
  overflow-y: visible;
  scrollbar-width: none;
  min-width: 0;
  /* 四向 padding,给焦点环(2px 实心 + 3px 外发光 = 5px)预留完整空间 */
  padding: 6px;
  margin: -6px;
}
.quick-list::-webkit-scrollbar {
  display: none;
}

.quick-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  background: var(--glass-quick-btn-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--glass-hl-color);
  box-shadow:
    inset 0 1px 0 var(--glass-hl-color),
    0 1px 3px rgba(0, 0, 0, 0.04);
  border-radius: var(--radius-full);
  font-size: 11px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  min-height: 28px;
  white-space: nowrap;
  flex: 0 0 auto;
  outline: none;
  position: relative;
}

.quick-btn:focus-visible {
  border-color: var(--color-primary-500);
  background: var(--glass-quick-btn-bg-focus);
  /* 焦点环:1.5px 实心 + 2px 软外发光,总计 2.5px,更轻盈 */
  box-shadow:
    inset 0 1px 0 var(--glass-hl-color),
    0 0 0 1.5px var(--color-primary-500),
    0 0 0 3.5px rgba(var(--color-primary-rgb), 0.16);
}

.quick-btn:hover {
  border-color: var(--color-primary-500);
  background: var(--glass-quick-btn-bg-hover);
  /* hover 也用更细的环,避免视觉冲击 */
  box-shadow:
    inset 0 1px 0 var(--glass-hl-color),
    0 0 0 1.5px var(--color-primary-500),
    0 2px 6px rgba(var(--color-primary-rgb), 0.18);
}

.quick-btn:active {
  transform: scale(0.98);
}

.quick-role {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 5px;
  border-radius: var(--radius-sm);
  color: var(--warm-50);
  font-size: 9px;
  font-weight: var(--font-weight-semibold);
  line-height: 1.2;
  min-width: 12px;
  min-height: 12px;
  flex-shrink: 0;
}

/* C 端用户(无 role 文案):渲染为小色点 */
.quick-role--dot {
  padding: 0;
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  min-width: 6px;
  min-height: 6px;
  box-shadow: 0 0 0 1.5px rgba(255, 255, 255, 0.7);
}

.quick-name {
  color: var(--color-text-primary);
  font-family: var(--font-family-mono);
  font-weight: var(--font-weight-medium);
  font-size: 11px;
}

/* ========================================
   演示账号提示（玻璃提示块 - 主题感知）
   ======================================== */
.demo-tip {
  margin-top: var(--space-4);
  padding: var(--space-3);
  background: linear-gradient(135deg, var(--demo-tip-bg-start) 0%, var(--demo-tip-bg-end) 100%);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  color: var(--orange-700);
  border: 1px solid rgba(var(--color-primary-rgb), 0.3);
  box-shadow:
    inset 0 1px 0 var(--glass-hl-color),
    0 2px 8px rgba(var(--color-primary-rgb), 0.1);
  border-radius: var(--radius-base);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-loose);
  font-weight: 500;
}

.demo-tip .tip-title {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--orange-600);
}

.demo-tip code {
  background: var(--demo-tip-code-bg);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono);
  font-size: 12px;
  color: var(--orange-700);
  font-weight: 600;
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
}

.login-footer {
  text-align: center;
  margin-top: var(--space-6);
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

/* ========================================
   响应式
   ======================================== */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    max-width: 420px;
    min-height: auto;
  }

  .brand-section {
    padding: var(--space-6);
    align-items: center;
    text-align: center;
  }

  .brand-section__top {
    align-items: center;
    text-align: center;
  }

  .brand-tagline {
    margin-top: var(--space-2);
  }

  .brand-features {
    display: none;
  }

  .login-card {
    padding: var(--space-6);
  }
}
</style>
