<!--
  平台管理后台 · 管理员登录
  - 居中卡片
  - 用户名 + 密码
  - 演示账号提示
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
            title="校园易物"
            subtitle="平台运营管理后台"
            text-color="#FFFFFF"
          />
          <p class="brand-tagline">一站式后台 · 让运营更高效</p>
        </div>

        <ul class="brand-features">
          <li>
            <el-icon><Check /></el-icon>
            <span>用户与信用分管理</span>
          </li>
          <li>
            <el-icon><Check /></el-icon>
            <span>商品审核与举报处理</span>
          </li>
          <li>
            <el-icon><Check /></el-icon>
            <span>分类树与 AI 监控</span>
          </li>
          <li>
            <el-icon><Check /></el-icon>
            <span>操作审计与日志追溯</span>
          </li>
        </ul>

        <div class="brand-footer">
          <span>© liem</span>
        </div>
      </div>

      <!-- 右侧：登录表单 -->
      <el-card class="login-card" shadow="never">
        <h2 class="form-title">管理员登录</h2>
        <p class="form-subtitle">仅限平台管理员访问</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          size="large"
          @submit.prevent="onSubmit"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="管理员账号"
              :prefix-icon="User"
              clearable
              autocomplete="username"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="登录密码"
              :prefix-icon="Lock"
              show-password
              autocomplete="current-password"
              @keyup.enter="onSubmit"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="login-btn"
              :loading="loading"
              @click="onSubmit"
            >
              登 录
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 演示账号提示 -->
        <div class="demo-tip">
          <div class="tip-title">
            <el-icon><InfoFilled /></el-icon>
            <span>演示账号</span>
          </div>
          <p>账号：<code>admin</code> · 密码：<code>admin123</code></p>
          <p class="text-muted" style="font-size: 12px; margin-top: 4px">
            （仅在演示环境有效；正式部署请禁用该账号）
          </p>
        </div>

        <!-- 底部版权 -->
        <div class="login-footer">
          <span class="text-muted">© liem</span>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
/**
 * 管理员登录页
 * - 调用 userStore.login() 完成认证
 * - 成功后跳转到 redirect 参数指定的页面（默认 /dashboard）
 * - 失败时显示错误
 */
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Check, InfoFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import BrandLogo from '@/components/BrandLogo.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入管理员账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { min: 4, message: '密码至少 4 位', trigger: 'blur' },
  ],
}

/**
 * 提交登录
 */
async function onSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    await userStore.login({ username: form.username.trim(), password: form.password })
    ElMessage.success(`欢迎回来，${userStore.displayName}`)
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (e) {
    ElMessage.error(e?.message || '登录失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 已登录则直接进首页
  if (userStore.isLoggedIn && userStore.isAdmin) {
    router.replace('/dashboard')
  }
})
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
  background: linear-gradient(135deg, #FF8C5C 0%, #F25C2A 50%, #E84B25 100%);
  padding: var(--space-4);
  overflow: hidden;
  isolation: isolate;
}

.login-page::before {
  content: '';
  position: absolute;
  width: 1600px;
  height: 1600px;
  top: -30%;
  right: -20%;
  background: radial-gradient(
    circle,
    rgba(255, 245, 225, 0.55) 0%,
    rgba(255, 220, 180, 0.3) 30%,
    rgba(255, 200, 150, 0.15) 55%,
    transparent 75%
  );
  filter: blur(120px);
  animation: breathe-warm 38s ease-in-out infinite alternate;
  pointer-events: none;
  will-change: transform, filter;
}

.login-page::after {
  content: '';
  position: absolute;
  width: 1400px;
  height: 1400px;
  bottom: -35%;
  left: -25%;
  background: radial-gradient(
    circle,
    rgba(232, 75, 37, 0.6) 0%,
    rgba(255, 107, 69, 0.35) 35%,
    rgba(242, 92, 42, 0.18) 60%,
    transparent 80%
  );
  filter: blur(130px);
  animation: breathe-coral 46s ease-in-out infinite alternate;
  pointer-events: none;
  will-change: transform, filter;
}

@keyframes breathe-warm {
  0%   { transform: translate(0, 0)        scale(1)    rotate(0deg);  }
  100% { transform: translate(-80px, 50px) scale(1.08) rotate(4deg);  }
}

@keyframes breathe-coral {
  0%   { transform: translate(0, 0)        scale(1)    rotate(0deg);  }
  100% { transform: translate(70px, -60px) scale(0.95) rotate(-3deg); }
}

.login-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background:
    linear-gradient(180deg, rgba(60, 20, 0, 0.18) 0%, transparent 18%),
    linear-gradient(0deg, rgba(60, 20, 0, 0.22) 0%, transparent 20%),
    radial-gradient(ellipse 110% 100% at 50% 50%, transparent 55%, rgba(60, 20, 0, 0.28) 100%);
}

/* 容器：透明（让背景的光斑能透到所有玻璃面） */
.login-container {
  position: relative;
  z-index: var(--z-base);
  display: flex;
  align-items: stretch;
  max-width: 880px;
  width: 100%;
  /* ★ 关键：容器本身几乎透明，让背景色斑能透到所有玻璃层 */
  background: transparent;
  border-radius: var(--glass-r-xl);
  box-shadow:
    0 32px 64px rgba(0, 0, 0, 0.24),
    0 8px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  min-height: 520px;
  border: 1.5px solid rgba(255, 255, 255, 0.4);
}

/* ========================================
   左侧：品牌区（深色玻璃）
   ======================================== */
.brand-section {
  flex: 1;
  background: linear-gradient(160deg, rgba(28, 30, 38, 0.78) 0%, rgba(44, 46, 56, 0.72) 100%);
  backdrop-filter: var(--glass-blur-2);
  -webkit-backdrop-filter: var(--glass-blur-2);
  color: var(--color-text-inverse);
  padding: var(--space-12) var(--space-8);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.12);
}

/* 右上高光球（橙色主光源） */
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

/* 左下辅光（暖橙调） */
.brand-section::after {
  content: '';
  position: absolute;
  bottom: -60px;
  left: -40px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(255, 180, 120, 0.16) 0%, transparent 70%);
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
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.85);
}

.brand-features li .el-icon {
  color: var(--color-primary);
  font-size: 16px;
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
   右侧：登录表单（湿玻璃：渐变 + 多层高光 + 暖色反射）
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
  /* 渐变玻璃：85% 透白（保可读性）+ 15% 暖色 tint（保玻璃感） */
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.88) 0%,
    rgba(255, 251, 246, 0.82) 50%,
    rgba(255, 244, 232, 0.78) 100%
  );
  backdrop-filter: var(--glass-blur-2) saturate(180%);
  -webkit-backdrop-filter: var(--glass-blur-2) saturate(180%);
  border-left: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow:
    inset 1px 0 0 rgba(255, 255, 255, 0.7),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 35%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.45) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  pointer-events: none;
  z-index: 0;
}

.login-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 25%;
  background: linear-gradient(
    0deg,
    rgba(255, 138, 92, 0.08) 0%,
    rgba(255, 138, 92, 0) 100%
  );
  pointer-events: none;
  z-index: 0;
}

.login-card > * {
  position: relative;
  z-index: 1;
}

/* 玻璃输入框（完整版） */
.login-card :deep(.el-form-item) {
  margin-bottom: var(--space-5);
}

.login-card :deep(.el-input__wrapper) {
  position: relative;
  background: rgba(255, 255, 255, 0.42) !important;
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-radius: 14px !important;
  padding: 4px 14px;
  box-shadow:
    inset 0 0 0 1.5px rgba(255, 255, 255, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 2px 8px rgba(0, 0, 0, 0.04) !important;
  transition: all 220ms cubic-bezier(0.2, 0, 0, 1);
  min-height: 46px;
}

.login-card :deep(.el-input__wrapper:hover) {
  background: rgba(255, 255, 255, 0.58) !important;
  box-shadow:
    inset 0 0 0 1.5px rgba(255, 255, 255, 0.75),
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 4px 14px rgba(0, 0, 0, 0.08) !important;
  transform: translateY(-1px);
}

.login-card :deep(.el-input__wrapper.is-focus) {
  background: rgba(255, 255, 255, 0.78) !important;
  box-shadow:
    inset 0 0 0 1.5px rgba(242, 92, 42, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 0 0 4px rgba(242, 92, 42, 0.15),
    0 6px 18px rgba(242, 92, 42, 0.18) !important;
  transform: translateY(-1px);
}

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

.login-card :deep(.el-input__prefix-inner) {
  color: var(--orange-500) !important;
  filter: drop-shadow(0 1px 2px rgba(242, 92, 42, 0.2));
}

.login-card :deep(.el-input__suffix) {
  color: var(--warm-400) !important;
}
.login-card :deep(.el-input__suffix:hover) {
  color: var(--orange-500) !important;
}

.login-card :deep(.el-input__clear) {
  color: var(--warm-400) !important;
}
.login-card :deep(.el-input__clear:hover) {
  color: var(--orange-500) !important;
}

.login-card :deep(.el-input__wrapper.is-focus.is-danger) {
  box-shadow:
    inset 0 0 0 1.5px rgba(220, 53, 69, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 0 0 4px rgba(220, 53, 69, 0.15) !important;
}

.form-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--warm-700);
  margin: 0 0 var(--space-2);
  letter-spacing: -0.5px;
}

.form-subtitle {
  font-size: var(--font-size-sm);
  color: var(--warm-600);
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

/* Element Plus 主色覆盖：登录页内所有 Element Plus 组件变暖橙 */
.login-card {
  --el-color-primary: #F25C2A;
  --el-color-primary-light-3: #FF8A5C;
  --el-color-primary-light-5: #FFAA7A;
  --el-color-primary-light-7: #FFCBAA;
  --el-color-primary-light-8: #FFE4D4;
  --el-color-primary-light-9: #FFF4EE;
  --el-color-primary-dark-2: #D44417;
  --el-text-color-primary: var(--warm-700);
  --el-text-color-regular: var(--warm-600);
  --el-text-color-secondary: var(--warm-500);
  --el-text-color-placeholder: var(--warm-400);
  --el-border-color: rgba(242, 92, 42, 0.15);
  --el-border-color-light: rgba(242, 92, 42, 0.1);
  --el-border-color-lighter: rgba(242, 92, 42, 0.06);
}

.login-card :deep(.el-link.el-link--primary) {
  --el-link-text-color: var(--orange-500);
  --el-link-hover-text-color: var(--orange-600);
}
.login-card :deep(.form-link) {
  color: var(--orange-600) !important;
  font-weight: 600;
}
.login-card :deep(.form-link:hover) {
  color: var(--orange-700) !important;
}
.login-card :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--orange-500) !important;
  border-color: var(--orange-500) !important;
}
.login-card :deep(.el-checkbox__label) {
  color: var(--warm-600) !important;
}
.login-card :deep(.el-form-item__error) {
  color: var(--danger-600) !important;
  font-weight: 500;
}

/* 演示账号提示（玻璃提示块 · 暖橙调） */
.demo-tip {
  margin-top: var(--space-4);
  padding: var(--space-3);
  background: linear-gradient(135deg, rgba(255, 220, 192, 0.5) 0%, rgba(255, 184, 138, 0.45) 100%);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  color: var(--orange-800);
  border: 1px solid rgba(242, 92, 42, 0.3);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    0 2px 8px rgba(242, 92, 42, 0.1);
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
  color: var(--orange-700);
}

.demo-tip code {
  background: rgba(255, 255, 255, 0.7);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono);
  font-size: 12px;
  color: var(--orange-800);
  font-weight: 600;
  border: 1px solid rgba(242, 92, 42, 0.2);
}

.login-footer {
  text-align: center;
  margin-top: var(--space-6);
  font-size: var(--font-size-xs);
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
