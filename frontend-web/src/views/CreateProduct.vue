<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ isEdit ? PRODUCT_FORM_TEXT.EDIT_TITLE : PRODUCT_FORM_TEXT.CREATE_TITLE }}</h2>
      <el-button @click="$router.back()">{{ PRODUCT_FORM_TEXT.BACK }}</el-button>
    </div>

    <el-row :gutter="16">
      <!-- 左侧：表单 -->
      <el-col :xs="24" :lg="16">
        <el-card shadow="never" class="form-card">
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="100px"
            label-position="right"
          >
            <el-form-item :label="PRODUCT_FORM_TEXT.TITLE_LABEL" prop="title">
              <el-input
                v-model="form.title"
                :placeholder="PRODUCT_FORM_TEXT.TITLE_PLACEHOLDER"
                :maxlength="PRODUCT_FORM_TEXT.TITLE_MAX"
                show-word-limit
              />
            </el-form-item>

            <el-form-item :label="PRODUCT_FORM_TEXT.DESC_LABEL" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="6"
                :placeholder="PRODUCT_FORM_TEXT.DESC_PLACEHOLDER"
                :maxlength="PRODUCT_FORM_TEXT.DESC_MAX"
                show-word-limit
              />
            </el-form-item>

            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item :label="PRODUCT_FORM_TEXT.PRICE_LABEL" prop="price">
                  <el-input-number
                    v-model="form.price"
                    :min="PRODUCT_FORM_TEXT.PRICE_MIN"
                    :max="PRODUCT_FORM_TEXT.PRICE_MAX"
                    :precision="2"
                    :step="1"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="PRODUCT_FORM_TEXT.ORIGINAL_PRICE_LABEL">
                  <el-input-number
                    v-model="form.original_price"
                    :min="0"
                    :max="PRODUCT_FORM_TEXT.PRICE_MAX"
                    :precision="2"
                    :step="1"
                    controls-position="right"
                    :placeholder="PRODUCT_FORM_TEXT.ORIGINAL_PRICE_OPTIONAL"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item :label="PRODUCT_FORM_TEXT.CATEGORY_LABEL" prop="category_id">
                  <el-cascader
                    v-model="categoryValue"
                    :options="categoryTree"
                    :props="{ value: 'id', label: 'name', children: 'children', emitPath: false, checkStrictly: true }"
                    :placeholder="PRODUCT_FORM_TEXT.CATEGORY_PLACEHOLDER"
                    style="width: 100%"
                    @change="onCategoryChange"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="PRODUCT_FORM_TEXT.CONDITION_LABEL" prop="condition">
                  <el-radio-group v-model="form.condition">
                    <el-radio-button
                      v-for="opt in PRODUCT_FORM_TEXT.CONDITION_OPTIONS"
                      :key="opt.value"
                      :value="opt.value"
                    >{{ opt.label }}</el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item :label="PRODUCT_FORM_TEXT.IMAGE_LABEL" prop="image_ids">
              <el-upload
                v-model:file-list="fileList"
                list-type="picture-card"
                :auto-upload="true"
                :http-request="customUpload"
                :before-upload="beforeUpload"
                :on-remove="onRemove"
                :limit="PRODUCT_FORM_TEXT.UPLOAD_LIMIT"
                :on-exceed="onExceed"
                accept="image/*"
              >
                <template #default>
                  <el-icon :size="24"><Plus /></el-icon>
                  <div class="upload-text">{{ PRODUCT_FORM_TEXT.UPLOAD_TEXT }}</div>
                </template>
                <template #tip>
                  <div class="el-upload__tip">
                    {{ PRODUCT_FORM_TEXT.UPLOAD_TIP }}
                  </div>
                </template>
              </el-upload>
            </el-form-item>

            <el-form-item>
              <el-button
                :icon="Check"
                type="primary"
                :loading="submitting"
                size="large"
                @click="onSubmit('on_sale')"
              >
                {{ PRODUCT_FORM_TEXT.PUBLISH_NOW }}
              </el-button>
              <el-button
                :loading="submitting"
                size="large"
                @click="onSubmit('draft')"
              >
                {{ PRODUCT_FORM_TEXT.SAVE_DRAFT }}
              </el-button>
              <el-button size="large" @click="$router.back()">{{ PRODUCT_FORM_TEXT.CANCEL }}</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧：预览 + 提示 -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="never" class="preview-card">
          <template #header>
            <span class="card-title">{{ PRODUCT_FORM_TEXT.PREVIEW_TITLE }}</span>
          </template>
          <div class="preview">
            <div class="preview-cover" :style="previewCoverStyle">
              <el-icon v-if="!fileList.length" :size="48" color="#CCC"><Picture /></el-icon>
            </div>
            <div class="preview-title">{{ form.title || PRODUCT_FORM_TEXT.PREVIEW_DEFAULT_TITLE }}</div>
            <div class="preview-price">¥{{ form.price ? formatMoney(form.price) : '0.00' }}</div>
            <div class="preview-meta">
              <el-tag v-if="form.condition" size="small" type="info">
                {{ conditionText(form.condition) }}
              </el-tag>
              <el-tag v-if="categoryLabel" size="small" type="success">{{ categoryLabel }}</el-tag>
            </div>
            <div class="preview-desc">{{ form.description || PRODUCT_FORM_TEXT.PREVIEW_DEFAULT_DESC }}</div>
          </div>
        </el-card>

        <el-card shadow="never" class="tips-card">
          <template #header>
            <span class="card-title">{{ PRODUCT_FORM_TEXT.TIPS_TITLE }}</span>
          </template>
          <ul class="tips">
            <li v-for="(tip, i) in PRODUCT_FORM_TEXT.TIPS_LIST" :key="i">{{ tip }}</li>
          </ul>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
/**
 * 发布/编辑商品
 * - 标题/描述/价格/分类/成色/多图
 * - 上传图片调 POST /api/upload/
 * - 实时预览（右侧）
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules, type UploadFile, type UploadRequestOptions, type UploadUserFile } from 'element-plus'
import { Check, Plus, Picture } from '@element-plus/icons-vue'
import {
  createProduct,
  updateProduct,
  fetchProduct,
  uploadProductImage,
  fetchCategoryTree,
  type Product,
  type ProductCondition,
  type ProductPayload,
  type Category,
} from '@/api/product'
import { formatMoney } from '@/utils'
import { PRODUCT_FORM_TEXT, ROUTE_PATHS } from '@/constants'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

// 表单
const formRef = ref<FormInstance>()
const submitting = ref(false)
const form = reactive({
  title: '',
  description: '',
  price: 0 as number,
  original_price: undefined as number | undefined,
  condition: 'like_new' as ProductCondition,
  category_id: undefined as number | undefined,
  image_ids: [] as number[],
  status: 'on_sale' as 'on_sale' | 'draft',
})

/** 分类树 */
const categoryTree = ref<Category[]>([])
/** 级联选择 v-model */
const categoryValue = ref<number | undefined>(undefined)
/** 选中分类名（预览用） */
const categoryLabel = computed(() => {
  const findLabel = (list: Category[]): string | null => {
    for (const c of list) {
      if (c.id === categoryValue.value) return c.name
      if (c.children?.length) {
        const r = findLabel(c.children)
        if (r) return r
      }
    }
    return null
  }
  return findLabel(categoryTree.value)
})

/** 上传文件列表（Element Plus 格式） */
const fileList = ref<UploadUserFile[]>([])
/** 已上传图片的 id -> url 映射（用于预览） */
const uploadedUrlMap = reactive<Record<number, string>>({})

/** 表单校验 */
const rules: FormRules = {
  title: [
    { required: true, message: PRODUCT_FORM_TEXT.VALIDATE_TITLE_REQUIRED, trigger: 'blur' },
    { min: 2, max: 60, message: PRODUCT_FORM_TEXT.VALIDATE_TITLE_LENGTH, trigger: 'blur' },
  ],
  description: [
    { required: true, message: PRODUCT_FORM_TEXT.VALIDATE_DESC_REQUIRED, trigger: 'blur' },
    { min: 5, max: 500, message: PRODUCT_FORM_TEXT.VALIDATE_DESC_LENGTH, trigger: 'blur' },
  ],
  price: [
    { required: true, message: PRODUCT_FORM_TEXT.VALIDATE_PRICE_REQUIRED, trigger: 'blur' },
    {
      validator: (_r, v, cb) => (Number(v) > 0 ? cb() : cb(new Error(PRODUCT_FORM_TEXT.VALIDATE_PRICE_POSITIVE))),
      trigger: 'blur',
    },
  ],
  category_id: [
    { required: true, message: PRODUCT_FORM_TEXT.VALIDATE_CATEGORY_REQUIRED, trigger: 'change' },
  ],
  condition: [
    { required: true, message: PRODUCT_FORM_TEXT.VALIDATE_CONDITION_REQUIRED, trigger: 'change' },
  ],
  image_ids: [
    {
      validator: (_r, v, cb) => ((v as number[]).length > 0 ? cb() : cb(new Error(PRODUCT_FORM_TEXT.VALIDATE_IMAGE_REQUIRED))),
      trigger: 'change',
    },
  ],
}

/** 预览封面 */
const previewCoverStyle = computed(() => {
  const first = fileList.value[0]
  if (first && first.url) return { backgroundImage: `url(${first.url})` }
  return { background: 'var(--color-bg-hover)' }
})

/** 成色文案 */
function conditionText(c: ProductCondition | string) {
  const opt = PRODUCT_FORM_TEXT.CONDITION_OPTIONS.find(o => o.value === c)
  return opt?.label || c
}

/** 分类选择变化（接收 CascaderValue；emitPath=false 时即为叶子 id） */
function onCategoryChange(val: any) {
  form.category_id = val == null || val === '' ? undefined : Number(val)
}

/**
 * 上传前的校验
 */
function beforeUpload(file: File) {
  const isImg = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImg) ElMessage.error(PRODUCT_FORM_TEXT.UPLOAD_IMG_TYPE)
  if (!isLt5M) ElMessage.error(PRODUCT_FORM_TEXT.UPLOAD_TOO_LARGE)
  return isImg && isLt5M
}

/**
 * 自定义上传：调后端 /api/upload/
 * 成功后将返回的 id 加入 form.image_ids
 */
async function customUpload(options: UploadRequestOptions) {
  const file = options.file as File
  try {
    const res: any = await uploadProductImage(file)
    const data = res.data || res
    const id = data.id
    const url = data.url
    if (id) {
      form.image_ids.push(id)
      uploadedUrlMap[id] = url
      // 同步 fileList 中对应项的 url
      const target = fileList.value.find(f => f.uid === (options.file as any).uid)
      if (target) target.url = url
    }
    ElMessage.success(PRODUCT_FORM_TEXT.UPLOAD_SUCCESS)
  } catch (e: any) {
    ElMessage.error(PRODUCT_FORM_TEXT.UPLOAD_FAIL)
    // 移除该文件
    fileList.value = fileList.value.filter(f => f.uid !== (options.file as any).uid)
  }
}

/** 移除图片 */
function onRemove(file: UploadFile) {
  // 找到对应 id 并移除
  const id = (file as any).response?.id
  if (id) {
    form.image_ids = form.image_ids.filter(i => i !== id)
  } else {
    // 通过 url 反查
    const matched = Object.entries(uploadedUrlMap).find(([, url]) => url === file.url)
    if (matched) {
      form.image_ids = form.image_ids.filter(i => i !== Number(matched[0]))
    }
  }
}

/** 超出 9 张 */
function onExceed() {
  ElMessage.warning(PRODUCT_FORM_TEXT.UPLOAD_EXCEED)
}

/**
 * 加载分类树
 */
async function loadCategories() {
  try {
    const res: any = await fetchCategoryTree()
    categoryTree.value = res.data || res || []
  } catch (e) {
    console.error('[CreateProduct] 分类加载失败', e)
    // 降级：使用平铺接口
    try {
      const res: any = await import('@/api/product').then(m => m.fetchCategories())
      const data = res.data || res
      const list: Category[] = Array.isArray(data) ? data : (data?.results || [])
      // 构造空 children 字段以适配 cascader
      categoryTree.value = list.map(c => ({ ...c, children: undefined }))
    } catch {
      // ignore
    }
  }
}

/**
 * 加载商品详情（编辑模式）
 */
async function loadProduct(id: number) {
  try {
    const res: any = await fetchProduct(id)
    const data: Product = res.data || res
    form.title = data.title
    form.description = data.description
    // 后端 DRF DecimalField 默认返回字符串；这里统一转为 number，
    // 避免 el-input-number 报 "Expected Number, got String" 类型警告。
    form.price = Number(data.price) || 0
    form.original_price = data.original_price == null ? undefined : Number(data.original_price)
    form.condition = data.condition
    form.category_id = data.category?.id
    categoryValue.value = data.category?.id
    // 恢复已上传图片
    form.image_ids = (data.images || []).map(img => img.id)
    fileList.value = (data.images || []).map(img => ({
      uid: img.id,
      name: `image-${img.id}`,
      url: img.image_url,
      status: 'success',
    }))
    ;(data.images || []).forEach(img => {
      uploadedUrlMap[img.id] = img.image_url
    })
  } catch (e) {
    console.error('[CreateProduct] 商品详情加载失败', e)
  }
}

/**
 * 提交表单
 */
async function onSubmit(status: 'on_sale' | 'draft') {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload: ProductPayload = {
      title: form.title,
      description: form.description,
      price: form.price,
      original_price: form.original_price,
      condition: form.condition,
      category_id: form.category_id!,
      image_ids: form.image_ids,
      status,
    }
    if (isEdit.value) {
      await updateProduct(Number(route.params.id), payload)
      ElMessage.success(PRODUCT_FORM_TEXT.UPDATE_SUCCESS)
    } else {
      await createProduct(payload)
      ElMessage.success(status === 'draft' ? PRODUCT_FORM_TEXT.DRAFT_SAVED : PRODUCT_FORM_TEXT.PUBLISH_SUCCESS)
    }
    router.push(ROUTE_PATHS.PRODUCTS)
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || PRODUCT_FORM_TEXT.PUBLISH_FAIL)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await loadCategories()
  if (isEdit.value) {
    await loadProduct(Number(route.params.id))
  }
})
</script>

<style scoped>
.form-card,
.preview-card,
.tips-card {
  border-radius: var(--radius-md);
}

.card-title {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.preview-cover {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-base);
  background-size: cover;
  background-position: center;
  background-color: var(--color-bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.preview-price {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-price);
  font-family: var(--font-family-mono);
}

.preview-meta {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.preview-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-loose);
  max-height: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.upload-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.tips {
  margin: 0;
  padding-left: 20px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-loose);
}

.tips li {
  margin-bottom: var(--space-2);
}

.tips li:last-child {
  margin-bottom: 0;
}
</style>
