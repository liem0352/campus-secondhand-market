<template>
  <div class="page-container profile-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div>
        <h2>个人资料</h2>
        <p class="text-muted">管理你的账号信息、信用凭证和密码</p>
      </div>
    </div>

    <!-- 错误态 -->
    <el-alert
      v-if="loadError"
      :title="loadError"
      type="error"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    />

    <el-row :gutter="16" v-loading="loading">
      <!-- 左：用户档案卡 -->
      <el-col :xs="24" :md="10" :lg="8">
        <el-card shadow="hover" class="profile-card">
          <div class="avatar-block">
            <el-avatar
              :size="96"
              :src="form.avatar || defaultAvatar"
              @click="triggerUpload"
              class="profile-avatar"
            >
              {{ (userStore.nickname || 'U').charAt(0).toUpperCase() }}
            </el-avatar>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleAvatarChange"
            />
            <el-button
              size="small"
              :icon="Camera"
              :loading="avatarUploading"
              class="avatar-upload-btn"
              @click="triggerUpload"
            >
              更换头像
            </el-button>
            <div class="avatar-tip">支持 JPG/PNG，2MB 以内</div>
          </div>

          <el-divider />

          <!-- 信用分可视化 -->
          <div class="credit-block">
            <div class="credit-row">
              <span class="credit-title">信用分</span>
              <el-tag v-if="userStore.user?.is_certified" type="success" size="small">
                已校园认证
              </el-tag>
            </div>
            <div class="credit-score">
              <div :class="['credit-badge', 'credit-badge--large', creditBadgeClass]">
                {{ userStore.creditScore }}
              </div>
              <div class="credit-text">
                <div class="credit-level">{{ creditLevelLabel }}</div>
                <el-progress
                  :percentage="userStore.creditScore"
                  :stroke-width="8"
                  :color="creditProgressColor"
                  :show-text="false"
                />
                <div class="credit-tip">{{ creditTip }}</div>
              </div>
            </div>
          </div>

          <el-divider />

          <!-- 基础信息只读展示 -->
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="用户名">
              {{ userStore.user?.username }}
            </el-descriptions-item>
            <el-descriptions-item label="角色">
              <el-tag :type="userStore.isAdmin ? 'danger' : 'info'" size="small">
                {{ userStore.isAdmin ? '管理员' : '校园用户' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">
              {{ formatDate(userStore.user?.created_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="账号状态">
              <el-tag :type="userStore.user?.is_certified ? 'success' : 'warning'" size="small">
                {{ userStore.user?.is_certified ? '已认证' : '未认证' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <el-button
            class="logout-btn"
            type="danger"
            plain
            :icon="SwitchButton"
            :loading="logoutLoading"
            @click="handleLogout"
          >
            退出登录
          </el-button>
        </el-card>
      </el-col>

      <!-- 右：编辑表单 + 密码 -->
      <el-col :xs="24" :md="14" :lg="16">
        <!-- 编辑资料 -->
        <el-card shadow="hover" class="form-card">
          <template #header>
            <div class="card-header">
              <span>编辑资料</span>
              <span class="text-muted">修改后将立即同步到商品/订单展示</span>
            </div>
          </template>
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="100px"
            label-position="right"
          >
            <el-form-item label="昵称" prop="nickname">
              <el-input
                v-model="form.nickname"
                placeholder="请输入昵称"
                maxlength="30"
                show-word-limit
                clearable
              />
            </el-form-item>
            <el-form-item label="学校" prop="school">
              <el-input
                v-model="form.school"
                placeholder="例如：清华大学"
                maxlength="50"
                clearable
              />
            </el-form-item>
            <el-form-item label="学号" prop="student_id">
              <el-input
                v-model="form.student_id"
                placeholder="请输入学号"
                maxlength="20"
                clearable
              />
            </el-form-item>
            <el-form-item label="个性签名" prop="bio">
              <el-input
                v-model="form.bio"
                type="textarea"
                :rows="3"
                maxlength="120"
                show-word-limit
                placeholder="一句话介绍你自己"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :icon="Check"
                :loading="saving"
                @click="handleSave"
              >
                保存修改
              </el-button>
              <el-button :icon="RefreshLeft" @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 修改密码 -->
        <el-card shadow="hover" class="form-card" style="margin-top: 16px">
          <template #header>
            <div class="card-header">
              <span>修改密码</span>
              <span class="text-muted">建议每 90 天更换一次</span>
            </div>
          </template>
          <el-form
            ref="pwdFormRef"
            :model="pwdForm"
            :rules="pwdRules"
            label-width="100px"
            label-position="right"
          >
            <el-form-item label="当前密码" prop="old_password">
              <el-input
                v-model="pwdForm.old_password"
                type="password"
                show-password
                placeholder="请输入当前密码"
                autocomplete="current-password"
              />
            </el-form-item>
            <el-form-item label="新密码" prop="new_password">
              <el-input
                v-model="pwdForm.new_password"
                type="password"
                show-password
                placeholder="6-20 个字符"
                autocomplete="new-password"
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirm_password">
              <el-input
                v-model="pwdForm.confirm_password"
                type="password"
                show-password
                placeholder="再次输入新密码"
                autocomplete="new-password"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="warning"
                :icon="Key"
                :loading="changingPwd"
                @click="handleChangePwd"
              >
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
/**
 * 个人资料页
 * - 左侧：头像/信用分/只读基础信息/退出登录
 * - 右侧：编辑昵称/学校/学号/签名 + 修改密码
 */
import { ref, reactive, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Camera,
  Check,
  Key,
  RefreshLeft,
  SwitchButton,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { updateProfile, uploadAvatar, changePassword } from '@/api/user'

const userStore = useUserStore()

// 页面状态
const loading = ref(false)
const saving = ref(false)
const changingPwd = ref(false)
const logoutLoading = ref(false)
const avatarUploading = ref(false)
const loadError = ref('')

// 表单引用
const formRef = ref<FormInstance>()
const pwdFormRef = ref<FormInstance>()
const fileInputRef = ref<HTMLInputElement>()

// 资料表单（与 userStore.user 解耦，避免输入抖动时全局刷新）
const form = reactive({
  nickname: '',
  school: '',
  student_id: '',
  bio: '',
  avatar: '',
})

// 密码表单
const pwdForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

// 默认头像（防止空值导致 404）
const defaultAvatar = ''

// 资料校验规则
const rules: FormRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 1, max: 30, message: '昵称长度 1-30 个字符', trigger: 'blur' },
  ],
  school: [{ max: 50, message: '学校名称不超过 50 个字符', trigger: 'blur' }],
  student_id: [{ max: 20, message: '学号不超过 20 个字符', trigger: 'blur' }],
  bio: [{ max: 120, message: '个性签名不超过 120 个字符', trigger: 'blur' }],
}

// 密码校验规则
const pwdRules: FormRules = {
  old_password: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度 6-20 个字符', trigger: 'blur' },
  ],
  confirm_password: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_r, v: string, cb) => {
        if (v !== pwdForm.new_password) {
          cb(new Error('两次输入的密码不一致'))
        } else {
          cb()
        }
      },
      trigger: 'blur',
    },
  ],
}

// 信用分等级颜色
const creditBadgeClass = computed(() => {
  const s = userStore.creditScore
  if (s >= 90) return 'credit-badge--high'
  if (s >= 60) return 'credit-badge--mid'
  return 'credit-badge--low'
})

// 信用分文字标签
const creditLevelLabel = computed(() => {
  const s = userStore.creditScore
  if (s >= 90) return '极好'
  if (s >= 80) return '优秀'
  if (s >= 60) return '良好'
  if (s >= 40) return '一般'
  return '较低'
})

// 信用分进度条颜色
const creditProgressColor = computed(() => {
  const s = userStore.creditScore
  if (s >= 90) return 'var(--color-credit-high)'
  if (s >= 60) return 'var(--color-credit-mid)'
  return 'var(--color-credit-low)'
})

// 信用分建议文案
const creditTip = computed(() => {
  const s = userStore.creditScore
  if (s >= 90) return '享受平台优先推荐，订单处理更顺畅'
  if (s >= 60) return '继续保持，按时发货与诚信沟通'
  return '建议及时处理订单、完成交易积累信用'
})

/**
 * 格式化日期
 * @param iso ISO 时间字符串
 */
function formatDate(iso?: string) {
  if (!iso) return '-'
  return dayjs(iso).format('YYYY-MM-DD HH:mm')
}

/**
 * 触发隐藏的文件选择器
 */
function triggerUpload() {
  fileInputRef.value?.click()
}

/**
 * 头像文件选择后处理
 * @param e input change 事件
 */
async function handleAvatarChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 前端预校验：2MB 内
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('头像大小不能超过 2MB')
    target.value = ''
    return
  }
  // 前端预校验：类型
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) {
    ElMessage.error('请上传 PNG/JPG/WEBP 格式的图片')
    target.value = ''
    return
  }

  avatarUploading.value = true
  try {
    const res: any = await uploadAvatar(file)
    const url = res.data?.url || res.url
    if (!url) throw new Error('上传成功但未返回 URL')
    // 立即更新到表单与 store
    form.avatar = url
    await userStore.updateProfile({ avatar: url })
    ElMessage.success('头像已更新')
  } catch (err: any) {
    ElMessage.error(err?.message || '头像上传失败')
  } finally {
    avatarUploading.value = false
    // 重置 input 以便下次选相同文件
    target.value = ''
  }
}

/**
 * 提交资料修改
 */
async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await userStore.updateProfile({
      nickname: form.nickname,
      school: form.school,
      student_id: form.student_id,
      bio: form.bio,
    })
    ElMessage.success('资料已保存')
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

/**
 * 重置表单为当前 store 数据
 */
function resetForm() {
  const u = userStore.user
  form.nickname = u?.nickname || ''
  form.school = u?.school || ''
  form.student_id = u?.student_id || ''
  form.bio = u?.bio || ''
  form.avatar = u?.avatar || ''
  ElMessage.info('已重置为当前资料')
}

/**
 * 修改密码
 */
async function handleChangePwd() {
  const valid = await pwdFormRef.value?.validate().catch(() => false)
  if (!valid) return
  changingPwd.value = true
  try {
    await changePassword({
      old_password: pwdForm.old_password,
      new_password: pwdForm.new_password,
      confirm_password: pwdForm.confirm_password,
    })
    ElMessage.success('密码修改成功，请使用新密码重新登录')
    // 清空密码字段
    pwdForm.old_password = ''
    pwdForm.new_password = ''
    pwdForm.confirm_password = ''
  } catch (e: any) {
    ElMessage.error(e?.message || '修改失败')
  } finally {
    changingPwd.value = false
  }
}

/**
 * 退出登录（带二次确认）
 */
async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出当前账号吗？', '退出登录', {
      type: 'warning',
      confirmButtonText: '退出',
      cancelButtonText: '取消',
    })
  } catch {
    return // 用户取消
  }
  logoutLoading.value = true
  try {
    await userStore.logout()
  } finally {
    logoutLoading.value = false
  }
}

/**
 * 拉取并回填用户信息
 */
async function loadData() {
  loading.value = true
  loadError.value = ''
  try {
    if (!userStore.user) {
      await userStore.fetchProfile()
    }
    resetForm()
  } catch (e: any) {
    loadError.value = e?.message || '资料加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.profile-page {
  padding: var(--space-5);
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
}

.profile-card,
.form-card {
  border-radius: var(--radius-md);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* 头像区 */
.avatar-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-4) 0;
  gap: var(--space-2);
}

.profile-avatar {
  cursor: pointer;
  border: 3px solid var(--color-primary-soft);
  transition: transform var(--duration-fast) var(--ease-out);
}

.profile-avatar:hover {
  transform: scale(1.04);
}

.avatar-upload-btn {
  margin-top: var(--space-1);
}

.avatar-tip {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

/* 信用分块 */
.credit-block {
  padding: 0 var(--space-2);
}

.credit-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.credit-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.credit-score {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.credit-text {
  flex: 1;
  min-width: 0;
}

.credit-level {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-2);
}

.credit-tip {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--space-2);
  line-height: var(--line-height-normal);
}

.logout-btn {
  width: 100%;
  margin-top: var(--space-5);
}

/* 响应式 */
@media (max-width: 768px) {
  .profile-card,
  .form-card {
    margin-bottom: var(--space-3);
  }
}
</style>
