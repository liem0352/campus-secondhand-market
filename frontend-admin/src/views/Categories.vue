<!--
  平台管理后台 · 分类管理
  - 左侧：一级分类列表（增 / 删 / 改）
  - 右侧：选中一级后的二级分类（增 / 删 / 改）
  - 树形展示
-->
<template>
  <div class="page-container categories-page">
    <!-- 页头 -->
    <div class="page-header">
      <div>
        <h2>分类管理</h2>
        <p class="subtitle">维护商品分类树（最多两级）</p>
      </div>
      <el-button :icon="Refresh" @click="loadData">刷新</el-button>
    </div>

    <!-- ========== 横幅 ========== -->
    <div class="hero-banner hero-banner--success">
      <div class="hero-banner__bg hero-banner__bg--1"></div>
      <div class="hero-banner__bg hero-banner__bg--2"></div>
      <div class="hero-banner__content">
        <div class="hero-banner__text">
          <h3 class="hero-banner__title">分类目录管理</h3>
          <p class="hero-banner__desc">清晰的分类有助于买家更快找到商品</p>
          <div class="hero-banner__chips">
            <span class="hero-chip hero-chip--primary">
              <el-icon :size="14"><Folder /></el-icon>
              <span>一级分类 {{ topLevel.length }} 个</span>
            </span>
            <span class="hero-chip hero-chip--success">
              <el-icon :size="14"><FolderOpened /></el-icon>
              <span>二级分类 {{ subCategoryCount }} 个</span>
            </span>
            <span class="hero-chip hero-chip--warning">
              <el-icon :size="14"><Connection /></el-icon>
              <span>共 {{ tree.length }} 条</span>
            </span>
          </div>
        </div>
        <div class="hero-banner__ring">
          <el-icon :size="56"><Menu /></el-icon>
          <div class="hero-banner__ring-label">CATEGORY</div>
        </div>
      </div>
    </div>

    <el-row :gutter="16" v-loading="loading">
      <!-- 左侧：一级分类 -->
      <el-col :xs="24" :md="10">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>一级分类（{{ topLevel.length }}）</span>
              <el-button size="small" type="primary" :icon="Plus" @click="openCreateDialog('top')">新增</el-button>
            </div>
          </template>
          <el-empty v-if="!topLevel.length" description="暂无一级分类" :image-size="60" />
          <ul class="cat-list">
            <li
              v-for="c in topLevel"
              :key="c.id"
              :class="['cat-item', { active: selectedTopId === c.id }]"
              @click="selectTop(c)"
            >
              <div class="cat-item-main">
                <div class="cat-icon">
                  <el-icon><Folder /></el-icon>
                </div>
                <div class="cat-info">
                  <div class="cat-name">{{ c.name }}</div>
                  <div class="cat-meta text-muted">
                    {{ c.children?.length || 0 }} 个子分类
                  </div>
                </div>
              </div>
              <div class="cat-actions">
                <el-button link type="primary" size="small" @click.stop="openCreateDialog('sub', c)">+ 子类</el-button>
                <el-button link type="primary" size="small" @click.stop="openEditDialog(c)">编辑</el-button>
                <el-button link type="danger" size="small" @click.stop="handleDelete(c)">删除</el-button>
              </div>
            </li>
          </ul>
        </el-card>
      </el-col>

      <!-- 右侧：二级分类 -->
      <el-col :xs="24" :md="14">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>
                <template v-if="selectedTop">
                  「{{ selectedTop.name }}」的子分类（{{ subLevel.length }}）
                </template>
                <template v-else>请选择左侧一级分类</template>
              </span>
              <el-button
                v-if="selectedTop"
                size="small"
                type="primary"
                :icon="Plus"
                @click="openCreateDialog('sub', selectedTop)"
              >新增子分类</el-button>
            </div>
          </template>

          <el-empty
            v-if="!selectedTop"
            description="先选择左侧的一级分类"
            :image-size="80"
          />
          <el-empty
            v-else-if="!subLevel.length"
            description="该分类下暂无子分类，点击右上角新增"
            :image-size="60"
          />
          <ul v-else class="cat-list sub">
            <li
              v-for="c in subLevel"
              :key="c.id"
              class="cat-item sub"
            >
              <div class="cat-item-main">
                <div class="cat-icon sub">
                  <el-icon><FolderOpened /></el-icon>
                </div>
                <div class="cat-info">
                  <div class="cat-name">{{ c.name }}</div>
                  <div class="cat-meta text-muted">
                    排序：{{ c.sort_order ?? 0 }}
                  </div>
                </div>
              </div>
              <div class="cat-actions">
                <el-button link type="primary" size="small" @click="openEditDialog(c)">编辑</el-button>
                <el-button link type="danger" size="small" @click="handleDelete(c)">删除</el-button>
              </div>
            </li>
          </ul>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增 / 编辑分类弹窗 -->
    <el-dialog
      v-model="formDialog.visible"
      :title="formDialog.isEdit ? '编辑分类' : (formDialog.level === 'top' ? '新增一级分类' : `在「${formDialog.parent?.name}」下新增子分类`)"
      width="460px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formDialog.form" :rules="formRules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formDialog.form.name" placeholder="如：教材书籍" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="formDialog.form.sort_order" :min="0" :max="999" />
          <span class="text-muted" style="margin-left: 8px">数字越小越靠前</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="formDialog.loading" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 分类管理页面
 * - 拉取 /admin/categories/ 树形数据
 * - 一级 + 二级 增 / 删 / 改
 * - 删除前检查是否有子分类 / 商品引用
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Folder, FolderOpened, Connection, Menu } from '@element-plus/icons-vue'
import {
  fetchAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/api'

const loading = ref(false)
const tree = ref([]) // 树形全量分类
const selectedTopId = ref(null)

/* 衍生数据：一级分类（parent 为 null/0/undefined） */
const topLevel = computed(() => tree.value.filter((c) => !c.parent))

/* 当前选中的一级 */
const selectedTop = computed(() => tree.value.find((c) => c.id === selectedTopId.value) || null)

/* 选中一级下的二级 */
const subLevel = computed(() => {
  if (!selectedTop.value) return []
  return tree.value.filter((c) => c.parent === selectedTopId.value || c.parent?.id === selectedTopId.value)
})

/* 全站二级分类总数 */
const subCategoryCount = computed(() => tree.value.filter((c) => c.parent || c.parent?.id).length)

/* 表单弹窗 */
const formRef = ref(null)
const formDialog = reactive({
  visible: false,
  isEdit: false,
  level: 'top', // 'top' | 'sub'
  parent: null,
  row: null,
  form: { name: '', sort_order: 0 },
  loading: false,
})

const formRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
}

/**
 * 加载分类树
 */
async function loadData() {
  loading.value = true
  try {
    const res = await fetchAdminCategories()
    const list = res?.results || res?.data?.results || res?.data || res || []
    tree.value = Array.isArray(list) ? list : []
  } catch (e) {
    ElMessage.error('分类列表加载失败')
  } finally {
    loading.value = false
  }
}

/**
 * 选中一级分类
 */
function selectTop(c) {
  selectedTopId.value = c.id
}

/**
 * 打开新增弹窗
 * @param {string} level 'top' | 'sub'
 * @param {Object} [parent] 一级分类对象
 */
function openCreateDialog(level, parent) {
  formDialog.isEdit = false
  formDialog.level = level
  formDialog.parent = parent || null
  formDialog.row = null
  formDialog.form = { name: '', sort_order: 0 }
  formDialog.visible = true
}

/**
 * 打开编辑弹窗
 */
function openEditDialog(row) {
  formDialog.isEdit = true
  formDialog.level = row.parent ? 'sub' : 'top'
  formDialog.parent = row.parent || null
  formDialog.row = row
  formDialog.form = { name: row.name, sort_order: row.sort_order ?? 0 }
  formDialog.visible = true
}

/**
 * 提交表单（新增 / 编辑）
 */
async function submitForm() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  formDialog.loading = true
  try {
    const payload = { ...formDialog.form }
    if (formDialog.isEdit) {
      await updateCategory(formDialog.row.id, payload)
      ElMessage.success('已更新')
    } else {
      // 新增时根据 level 设置 parent
      if (formDialog.level === 'sub' && formDialog.parent) {
        payload.parent = formDialog.parent.id
      }
      await createCategory(payload)
      ElMessage.success('已新增')
    }
    formDialog.visible = false
    loadData()
  } catch (e) {
    // 错误已统一提示
  } finally {
    formDialog.loading = false
  }
}

/**
 * 删除分类
 */
async function handleDelete(row) {
  const hasChildren = tree.value.some((c) => c.parent === row.id || c.parent?.id === row.id)
  if (hasChildren) {
    ElMessage.warning('该分类下仍有子分类，请先删除子分类')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认删除分类「${row.name}」？删除后关联商品将失去分类归属。`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
      }
    )
  } catch {
    return
  }
  try {
    await deleteCategory(row.id)
    ElMessage.success('已删除')
    if (selectedTopId.value === row.id) selectedTopId.value = null
    loadData()
  } catch (e) {
    // 错误已统一提示
  }
}

onMounted(loadData)
</script>

<style scoped>
.categories-page {
  /* 页面容器 */
}

.subtitle {
  margin: 4px 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.panel-card {
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.cat-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.cat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-base);
  margin-bottom: var(--space-2);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.cat-item:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary-soft);
}

.cat-item.active {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
}

.cat-item-main {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
}

.cat-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-base);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cat-icon.sub {
  background: rgba(25, 137, 250, 0.12);
  color: var(--color-info);
}

.cat-info {
  min-width: 0;
}

.cat-name {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cat-meta {
  font-size: var(--font-size-xs);
  margin-top: 2px;
}

.cat-actions {
  display: flex;
  gap: var(--space-1);
  flex-shrink: 0;
}

.cat-list.sub .cat-item {
  background: var(--color-bg-section);
}

/* ========== 横幅 ========== */
.hero-banner {
  position: relative;
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  margin-bottom: var(--space-4);
  color: #fff;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(7, 193, 96, 0.2);
}

.hero-banner--success {
  background: linear-gradient(120deg, #34D88A 0%, #07C160 60%, #04A050 100%);
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
.hero-chip--success { background: rgba(255, 255, 255, 0.3); }
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
