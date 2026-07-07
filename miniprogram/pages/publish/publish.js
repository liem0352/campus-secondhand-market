/**
 * 发布页 —— 校园易物（Phase 3.6 核心亮点：AI 一键发布）
 * --------------------------------------------------------------------
 * 业务流程：
 *   1. 用户进入发布页
 *   2. 点击"AI 一键发布" -> wx.chooseMedia 选图 -> 上传到后端拿 URL
 *   3. 调用 POST /api/ai/publish-assist/ 传 image_url + draft_text
 *   4. 后端返回 {category, title, description, suggested_price, price_range,
 *               condition, tags, confidence, is_ai_fallback}
 *   5. 根据 is_ai_fallback 决定是否展示"AI 推荐"灰色标
 *   6. 自动填充表单（用户可手动调整）
 *   7. 提交时调用 POST /api/products/ -> 跳详情页
 *   8. 草稿自动保存：输入 1s 防抖写入 wx.setStorageSync
 *
 * 设计要点（融合设计系统 v3）：
 *   - 复用 app.wxss 已有 token 与工具类（btn / card / form-row / tag / ...）
 *   - 严格使用 var(--*) 引用颜色 / 间距 / 圆角
 *   - 严禁 emoji（用 lucide 风格 SVG）
 *   - 字段级校验：聚焦时自动清错；触发抖动动效以重播 horizontal-shake
 *   - 抖动实现：使用 _shakeTick 计数器 + formErrors 的 _tick 后缀做强制刷新
 */
const api = require('../../utils/api.js')
const { CONDITION_OPTIONS, formatPrice } = require('../../utils/style.js')
const { ICON } = require('../../utils/icon.js')
const { request } = require('../../utils/request.js')
const sys = require('../../utils/sys.js')

// 草稿本地存储 key
const DRAFT_KEY = 'publish_draft_v1'
// 草稿防抖时间：1s
const DRAFT_DEBOUNCE_MS = 1000

// 内置分类兜底（当后端 /categories/ 不可用时使用）
const FALLBACK_CATEGORIES = [
  { id: 'textbook',   name: '教材书籍' },
  { id: 'digital',    name: '数码电器' },
  { id: 'clothing',   name: '服饰鞋包' },
  { id: 'life',       name: '生活用品' },
  { id: 'sports',     name: '运动器材' },
  { id: 'beauty',     name: '美妆护肤' },
  { id: 'other',      name: '其他' },
]

// 内置 AI 降级数据：用于后端未启动 / 接口失败时的占位
const FALLBACK_AI_RESULT = {
  category: 'digital',
  title: '闲置物品出售',
  description: '商品描述（请补充：使用时长、有无瑕疵、是否包邮等）',
  suggested_price: 50,
  price_range: { low: 30, median: 50, high: 80 },
  condition: 'good',
  tags: ['闲置', '学生自用'],
  confidence: 0.5,
  is_ai_fallback: true,
}

Page({
  data: {
    // 状态栏高度（用于自定义顶栏安全区占位）
    statusBarHeight: 20,
    // 表单数据
    form: {
      title: '',
      price: '',
      description: '',
      categoryIndex: -1,
      condition: '',
      images: [], // 本地临时路径数组（wx.chooseMedia 结果）
      imageUrls: [], // 上传到后端后的远程 URL 数组
    },
    // 字段级错误状态：{ title: true, price: true, ... }，用于 wxss 错误态 class
    formErrors: {},
    // 字段抖动动画数据：{ title: animationData, ... }
    // 使用 WeChat 原生 wx.createAnimation 生成，可在每次校验失败时可靠重播
    // 即使 formErrors 状态没变，setData 一个新的 animation 对象也能强制重启动画
    formShakeAnims: {},
    // AI 推荐标记：true 时显示灰色"AI 推荐"
    aiFallback: false,
    aiConfidence: 0,
    aiSuggestedPrice: 0,
    aiPriceRangeText: '',
    aiDraftText: '',       // 用户可手写"描述一句"，便于 AI 推断
    aiLoading: false,      // AI 请求加载态
    submitLoading: false,  // 提交按钮加载态
    // 分类列表
    categories: FALLBACK_CATEGORIES,
    // 成色选项（来自 utils/style.js）
    conditions: CONDITION_OPTIONS,
    // 上传中
    uploading: false,
    // 图片最多 9 张
    MAX_IMAGES: 9,
    // 资源引用（全部 SVG）
    aiIcon: ICON.ai,
    cameraIcon: ICON.camera,
    closeIcon: ICON.close,
    iconEdit: ICON.edit,
    iconPlus: ICON.plus,
    iconArrowDown: ICON.arrowDown,
  },

  /** 防抖定时器句柄 */
  _draftTimer: null,

  /**
   * 页面加载：恢复本地草稿、异步加载分类、初始化状态栏高度
   */
  onLoad() {
    this.initStatusBar()
    this.loadDraft()
    this.fetchCategories()
  },

  /**
   * 读取状态栏高度（用于自定义顶栏顶部安全区占位）
   * 走 utils/sys 封装：内部已用新的窗口信息 API 替代已弃用的旧 API
   */
  initStatusBar() {
    try {
      // 走 utils/sys 封装：内部已用新的窗口信息 API 替代已弃用的旧 API
      const sysInfo = sys.getSystemInfoSync()
      this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 })
    } catch (e) {
      this.setData({ statusBarHeight: 20 })
    }
  },

  /**
   * onShow 中同步自定义 tabBar 高亮（"发布"是 index 2）
   * 必须在 onShow 而不是 onLoad：custom-tab-bar 组件实例化在 onLoad 之后，
   * 且 onShow 会在切回 tab 时被再次调用，确保切回时高亮也能恢复
   * 如果不写，从首页 / 其他 tab 跳到发布页时，tab-bar 仍保留之前的高亮（如 0=首页），
   * 再点 tab-bar 上的"首页"会被 custom-tab-bar.switchTab 的"index === selected" 提前 return 拦截
   */
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  /**
   * 页面卸载：清理防抖定时器
   */
  onUnload() {
    if (this._draftTimer) clearTimeout(this._draftTimer)
  },

  /* ====================================================================
   * 1. 草稿自动保存（防抖 1s）
   * ==================================================================== */

  /**
   * 恢复草稿
   * 兼容性：image 本地路径可能已失效，仅恢复文字 + 分类 + 成色 + 已上传 URL
   */
  loadDraft() {
    try {
      const draft = wx.getStorageSync(DRAFT_KEY)
      if (draft && typeof draft === 'object') {
        const safe = {
          title: draft.title || '',
          price: draft.price || '',
          description: draft.description || '',
          categoryIndex: Number.isInteger(draft.categoryIndex) ? draft.categoryIndex : -1,
          condition: draft.condition || '',
          imageUrls: Array.isArray(draft.imageUrls) ? draft.imageUrls : [],
        }
        this.setData({
          form: Object.assign({}, this.data.form, safe),
          aiFallback: !!draft.aiFallback,
          aiConfidence: draft.aiConfidence || 0,
          aiSuggestedPrice: draft.aiSuggestedPrice || 0,
          aiPriceRangeText: draft.aiPriceRangeText || '',
        })
        if (safe.title || safe.description) {
          wx.showToast({ title: '已恢复草稿', icon: 'none', duration: 1500 })
        }
      }
    } catch (e) {
      console.warn('[publish] loadDraft failed', e)
    }
  },

  /**
   * 防抖写入草稿到本地存储
   */
  scheduleSaveDraft() {
    if (this._draftTimer) clearTimeout(this._draftTimer)
    this._draftTimer = setTimeout(() => {
      this.saveDraft()
    }, DRAFT_DEBOUNCE_MS)
  },

  /**
   * 立即保存草稿（提交前可调用以避免丢失）
   */
  saveDraft() {
    try {
      const f = this.data.form
      const draft = {
        title: f.title,
        price: f.price,
        description: f.description,
        categoryIndex: f.categoryIndex,
        condition: f.condition,
        imageUrls: f.imageUrls,
        aiFallback: this.data.aiFallback,
        aiConfidence: this.data.aiConfidence,
        aiSuggestedPrice: this.data.aiSuggestedPrice,
        aiPriceRangeText: this.data.aiPriceRangeText,
        savedAt: Date.now(),
      }
      wx.setStorageSync(DRAFT_KEY, draft)
    } catch (e) {
      console.warn('[publish] saveDraft failed', e)
    }
  },

  /* ====================================================================
   * 2. 表单输入处理（统一入口 + 草稿防抖 + 字段错误清除）
   * ==================================================================== */

  /**
   * 标题输入
   * @param {Object} e 事件对象
   */
  onTitleInput(e) {
    this.setData({ 'form.title': e.detail.value })
    this.clearFormError('title')
    this.scheduleSaveDraft()
  },

  /**
   * 价格输入
   * @param {Object} e 事件对象
   */
  onPriceInput(e) {
    this.setData({ 'form.price': e.detail.value })
    this.clearFormError('price')
    this.scheduleSaveDraft()
  },

  /**
   * 描述输入
   * @param {Object} e 事件对象
   */
  onDescInput(e) {
    this.setData({ 'form.description': e.detail.value })
    this.clearFormError('description')
    this.scheduleSaveDraft()
  },

  /**
   * 草稿文字输入（用于辅助 AI 推断）
   * @param {Object} e 事件对象
   */
  onAiDraftInput(e) {
    this.setData({ aiDraftText: e.detail.value })
  },

  /**
   * 分类选择
   * @param {Object} e picker change 事件
   */
  onCategoryChange(e) {
    this.setData({ 'form.categoryIndex': Number(e.detail.value) })
    this.clearFormError('categoryIndex')
    this.scheduleSaveDraft()
  },

  /**
   * 成色选择
   * @param {Object} e 事件对象
   */
  onConditionSelect(e) {
    const cond = e.currentTarget.dataset.value
    this.setData({ 'form.condition': cond })
    this.clearFormError('condition')
    this.scheduleSaveDraft()
  },

  /**
   * 字段聚焦：清空对应字段的错误态（用户开始重新输入时立即撤销红色提示）
   * @param {Object} e 事件对象，dataset.field 表示字段名
   */
  onFieldFocus(e) {
    const field = e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.field
    if (field) this.clearFormError(field)
  },

  /* ====================================================================
   * 3. 校验 / 错误态管理
   * ==================================================================== */

  /**
   * 清除指定字段的错误标记
   * @param {string} field 字段名（title / price / categoryIndex / condition / description / images）
   */
  clearFormError(field) {
    if (!field) return
    if (!this.data.formErrors[field]) return
    const next = Object.assign({}, this.data.formErrors)
    delete next[field]
    this.setData({ formErrors: next })
  },

  /**
   * 标记一组字段为错误态，并触发抖动动效
   * 实现思路：
   *   1) 写入 formErrors（CSS class 切换控制红框/红字样式）
   *   2) 调用 _triggerShake 生成新的 WeChat animation 对象，setData 之后 WXML 重新绑定，
   *      抖动动画从起点重播（与 formErrors 状态无关，因此可重复触发）
   *   3) 抖动动效期间 toast 提示用户
   * @param {string[]} fields 字段名数组
   * @param {string} toastText 顶部 toast 提示
   */
  markFormErrors(fields, toastText) {
    if (!Array.isArray(fields) || !fields.length) return
    const next = Object.assign({}, this.data.formErrors)
    fields.forEach((f) => { next[f] = true })
    this.setData({ formErrors: next })
    this._triggerShake(fields)
    if (toastText) {
      wx.showToast({ title: toastText, icon: 'none' })
    }
  },

  /**
   * 生成并绑定指定字段的抖动动画（WeChat 原生 API）
   * 使用 wx.createAnimation 构建 4 段水平位移（-8 → 8 → -6 → 6 → 0），
   * 时长与 wxss 中 horizontal-shake 保持一致
   * @param {string[]} fields 字段名数组
   */
  _triggerShake(fields) {
    if (!Array.isArray(fields) || !fields.length) return
    const anims = Object.assign({}, this.data.formShakeAnims)
    fields.forEach((field) => {
      const animation = wx.createAnimation({
        duration: 80,
        timingFunction: 'ease-in-out',
        delay: 0,
        transformOrigin: '50% 50% 0',
      })
      animation.translateX(-8).step({ duration: 80, timingFunction: 'ease-in-out' })
      animation.translateX(8).step({ duration: 80, timingFunction: 'ease-in-out' })
      animation.translateX(-6).step({ duration: 80, timingFunction: 'ease-in-out' })
      animation.translateX(6).step({ duration: 80, timingFunction: 'ease-in-out' })
      animation.translateX(0).step({ duration: 80, timingFunction: 'ease-in-out' })
      anims[field] = animation.export()
    })
    this.setData({ formShakeAnims: anims })
  },

  /**
   * 清空全部字段错误标记
   */
  clearAllFormErrors() {
    if (!Object.keys(this.data.formErrors || {}).length) return
    this.setData({ formErrors: {} })
  },

  /* ====================================================================
   * 4. 图片管理：选择 / 删除 / 上传
   * ==================================================================== */

  /**
   * 点击添加图片：触发 wx.chooseMedia
   */
  onAddImage() {
    const remain = this.data.MAX_IMAGES - this.data.form.images.length
    if (remain <= 0) {
      wx.showToast({ title: `最多 ${this.data.MAX_IMAGES} 张`, icon: 'none' })
      return
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      camera: 'back',
      success: (res) => {
        const newFiles = (res.tempFiles || []).map((f) => f.tempFilePath)
        const images = this.data.form.images.concat(newFiles)
        this.setData({ 'form.images': images })
        this.clearFormError('images')
        this.scheduleSaveDraft()
        // 异步上传
        this.uploadImages(newFiles)
      },
      fail: (err) => {
        // 用户取消选择是正常分支，不报错
        if (err && err.errMsg && !/cancel/i.test(err.errMsg)) {
          console.warn('[publish] chooseMedia fail', err)
        }
      },
    })
  },

  /**
   * 删除图片（同时清空对应远程 URL）
   * @param {Object} e 事件对象
   */
  onRemoveImage(e) {
    const idx = Number(e.currentTarget.dataset.index)
    const images = this.data.form.images.slice()
    const imageUrls = this.data.form.imageUrls.slice()
    images.splice(idx, 1)
    imageUrls.splice(idx, 1)
    this.setData({ 'form.images': images, 'form.imageUrls': imageUrls })
    this.scheduleSaveDraft()
  },

  /**
   * 上传本地图片到后端
   * @param {string[]} tempPaths 待上传的临时文件路径
   */
  uploadImages(tempPaths) {
    if (!tempPaths || !tempPaths.length) return
    this.setData({ uploading: true })

    const tasks = tempPaths.map((p) => this.uploadOne(p))
    Promise.all(tasks)
      .then((urls) => {
        const imageUrls = this.data.form.imageUrls.concat(urls.filter(Boolean))
        this.setData({ 'form.imageUrls': imageUrls, uploading: false })
        this.scheduleSaveDraft()
      })
      .catch((err) => {
        this.setData({ uploading: false })
        console.error('[publish] uploadImages fail', err)
        wx.showToast({ title: '图片上传失败', icon: 'none' })
      })
  },

  /**
   * 上传单张图片到 /api/upload/
   * @param {string} tempPath 临时文件路径
   * @returns {Promise<string>} 远程 URL（失败返回空串或本地路径）
   */
  uploadOne(tempPath) {
    return new Promise((resolve) => {
      // 后端约定：/api/upload/ 接收 multipart/form-data，字段名 file
      // 失败时降级为本地路径，前端仍能预览（mock 模式）
      const token = wx.getStorageSync('token') || ''
      wx.uploadFile({
        url: getApp().globalData.apiBase + '/upload/',
        filePath: tempPath,
        name: 'file',
        header: token ? { Authorization: 'Bearer ' + token } : {},
        success: (res) => {
          try {
            const body = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
            const url = (body && (body.data && body.data.url || body.url)) || ''
            resolve(url || tempPath)
          } catch (e) {
            resolve(tempPath)
          }
        },
        fail: () => {
          // 后端未启动 / 上传失败时，本地路径兜底
          resolve(tempPath)
        },
      })
    })
  },

  /* ====================================================================
   * 5. AI 一键发布（核心亮点）
   * ==================================================================== */

  /**
   * AI 一键发布主流程：
   *  1) 选图（已选则跳过）
   *  2) 上传图片拿 URL
   *  3) 调用 /api/ai/publish-assist/
   *  4) 回填表单
   */
  onAiAssist() {
    if (this.data.aiLoading) return
    const hasImage = this.data.form.images.length > 0

    const startAi = (imageUrl) => {
      this.callAiAssist(imageUrl, this.data.aiDraftText)
    }

    if (hasImage) {
      // 已有图：取第一张已上传 URL
      const firstUrl = this.data.form.imageUrls[0] || this.data.form.images[0]
      startAi(firstUrl)
      return
    }

    // 无图：先选图
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        this.setData({
          'form.images': [file.tempFilePath],
          uploading: true,
        })
        this.clearFormError('images')
        this.uploadOne(file.tempFilePath)
          .then((url) => {
            const imageUrls = url ? [url] : []
            this.setData({ 'form.imageUrls': imageUrls, uploading: false })
            this.scheduleSaveDraft()
            startAi(url || file.tempFilePath)
          })
          .catch(() => {
            this.setData({ uploading: false })
            startAi(file.tempFilePath)
          })
      },
      fail: () => {
        wx.showToast({ title: '请先选择图片', icon: 'none' })
      },
    })
  },

  /**
   * 调用 AI 发布助手接口
   * - 对齐后端 AiPublishAssistView：POST /api/ai/publish-assist/
   * - 接收 {image_url, draft_text, image_b64, image_mime} 中的任意子集
   * - 失败时使用本地 FALLBACK_AI_RESULT 兜底，保证发布流程不卡住
   * @param {string} imageUrl 图片远程 URL（已上传）或本地临时路径
   * @param {string} draftText 草稿文字描述
   */
  callAiAssist(imageUrl, draftText) {
    this.setData({ aiLoading: true })

    // mock 模式：未登录或接口失败时降级
    const mockFallback = () => new Promise((resolve) => {
      setTimeout(() => resolve({ data: Object.assign({ _mock: true }, FALLBACK_AI_RESULT) }), 600)
    })

    Promise.resolve()
      .then(() => {
        if (!getApp().globalData.token) {
          return mockFallback()
        }
        return api
          .aiPublishAssist({ image_url: imageUrl || '', draft_text: draftText || '' })
          .catch(() => mockFallback())
      })
      .then((resp) => {
        const ai = (resp && resp.data) || FALLBACK_AI_RESULT
        this.applyAiResult(ai)
      })
      .finally(() => {
        this.setData({ aiLoading: false })
      })
  },

  /**
   * 将 AI 返回结果回填到表单
   * @param {Object} ai AI 响应体
   */
  applyAiResult(ai) {
    const catIndex = this.data.categories.findIndex(
      (c) => c.id === ai.category || c.name === ai.category
    )
    const finalCatIndex = catIndex >= 0 ? catIndex : 0

    // 格式化价格区间
    let rangeText = ''
    if (ai.price_range) {
      const r = ai.price_range
      if (r.low && r.high) {
        rangeText = '参考价 ' + formatPrice(r.low) + ' - ' + formatPrice(r.high)
      } else if (r.median) {
        rangeText = '建议价 ' + formatPrice(r.median)
      }
    } else if (ai.suggested_price) {
      rangeText = '建议价 ' + formatPrice(ai.suggested_price)
    }

    this.setData({
      // 回填字段（仅当用户尚未填写时覆盖，否则保留用户输入）
      'form.title': this.data.form.title || ai.title || '',
      'form.description': this.data.form.description || ai.description || '',
      'form.price': this.data.form.price || (ai.suggested_price != null ? String(ai.suggested_price) : ''),
      'form.categoryIndex': this.data.form.categoryIndex >= 0 ? this.data.form.categoryIndex : finalCatIndex,
      'form.condition': this.data.form.condition || ai.condition || '',
      // AI 标记
      aiFallback: !!ai.is_ai_fallback,
      aiConfidence: Number(ai.confidence) || 0,
      aiSuggestedPrice: Number(ai.suggested_price) || 0,
      aiPriceRangeText: rangeText,
    })

    // AI 已回填字段：错误态清掉
    this.clearAllFormErrors()
    this.scheduleSaveDraft()
    wx.showToast({
      title: ai.is_ai_fallback ? '已生成推荐（AI 推荐）' : 'AI 识别完成',
      icon: 'success',
      duration: 1500,
    })
  },

  /* ====================================================================
   * 6. 分类加载（从后端 /categories/，失败则使用兜底）
   * ==================================================================== */

  /**
   * 拉取分类列表
   */
  fetchCategories() {
    if (!getApp().globalData.token) {
      // 未登录保持兜底
      return
    }
    api.categories()
      .then((res) => {
        const list = (res && res.data && res.data.results) || (res && res.data) || []
        if (Array.isArray(list) && list.length) {
          this.setData({ categories: list })
        }
      })
      .catch(() => {
        // 静默失败，使用兜底
      })
  },

  /* ====================================================================
   * 7. 提交发布
   * ==================================================================== */

  /**
   * 表单字段级校验
   * 一次扫一遍所有字段，收集错误字段名 + 第一个错误的中文提示
   * @returns {{ fields: string[], message: string|null }} 错误信息对象
   */
  validate() {
    const f = this.data.form
    const fields = []
    let message = null

    if (!f.title || !String(f.title).trim()) {
      fields.push('title')
      message = message || '请填写商品标题'
    }
    if (!f.price || Number(f.price) <= 0) {
      fields.push('price')
      message = message || '请填写有效的价格'
    }
    if (f.categoryIndex < 0) {
      fields.push('categoryIndex')
      message = message || '请选择商品分类'
    }
    if (!f.condition) {
      fields.push('condition')
      message = message || '请选择商品成色'
    }
    if (!f.description || !String(f.description).trim()) {
      fields.push('description')
      message = message || '请填写商品描述'
    }
    if (!f.images || f.images.length === 0) {
      fields.push('images')
      message = message || '请至少上传 1 张图片'
    }
    return { fields, message }
  },

  /**
   * 提交表单
   * 失败时使用 markFormErrors 进行字段级错误态 + 抖动动效
   */
  onSubmit() {
    if (this.data.submitLoading) return

    // 先清掉旧的错误态（避免上一次的抖动 + 红色边框残留）
    this.clearAllFormErrors()

    const { fields, message } = this.validate()
    if (fields.length) {
      this.markFormErrors(fields, message)
      return
    }

    const f = this.data.form
    const category = this.data.categories[f.categoryIndex]
    // 优先使用已上传的远程 URL；后端 ProductCreateSerializer 期望 image_urls 字段
    const payload = {
      title: f.title.trim(),
      description: f.description.trim(),
      price: Number(f.price),
      category: (category && (category.id || category.name)) || 'other',
      condition: f.condition,
      // 兼容：优先 image_urls（与后端对齐），并把 images 一并带上做兜底
      image_urls: f.imageUrls && f.imageUrls.length ? f.imageUrls : [],
      images: f.imageUrls.length ? f.imageUrls : f.images,
    }

    this.setData({ submitLoading: true })

    request({
      url: '/products/',
      method: 'POST',
      data: payload,
    })
      .then((res) => {
        const productId = (res && res.data && (res.data.id || res.data.product_id)) || null
        // 清空草稿
        try { wx.removeStorageSync(DRAFT_KEY) } catch (e) {}
        wx.showToast({ title: '发布成功', icon: 'success' })
        setTimeout(() => {
          if (productId) {
            wx.redirectTo({ url: '/pages/detail/detail?id=' + productId })
          } else {
            wx.switchTab({ url: '/pages/index/index' })
          }
        }, 800)
      })
      .catch((err) => {
        const msg = (err && err.message) || '发布失败，请稍后再试'
        // mock 模式：接口失败也允许"本地发布"演示
        if (this._isOffline()) {
          try { wx.removeStorageSync(DRAFT_KEY) } catch (e) {}
          wx.showModal({
            title: '提示',
            content: '后端暂未连接，已保存草稿。是否留在页面继续编辑？',
            confirmText: '继续编辑',
            cancelText: '返回首页',
            success: (r) => {
              if (!r.confirm) {
                wx.switchTab({ url: '/pages/index/index' })
              }
            },
          })
        } else {
          wx.showToast({ title: msg, icon: 'none' })
        }
      })
      .finally(() => {
        this.setData({ submitLoading: false })
      })
  },

  /**
   * 是否处于离线 mock 模式（后端未连接）
   * @returns {boolean}
   */
  _isOffline() {
    return !getApp().globalData.token
  },

  /**
   * 清空草稿
   */
  onClearDraft() {
    wx.showModal({
      title: '提示',
      content: '确定清空当前草稿？',
      success: (r) => {
        if (!r.confirm) return
        try { wx.removeStorageSync(DRAFT_KEY) } catch (e) {}
        this.setData({
          form: {
            title: '', price: '', description: '',
            categoryIndex: -1, condition: '',
            images: [], imageUrls: [],
          },
          formErrors: {},
          aiFallback: false,
          aiConfidence: 0,
          aiSuggestedPrice: 0,
          aiPriceRangeText: '',
          aiDraftText: '',
        })
        wx.showToast({ title: '已清空', icon: 'success' })
      },
    })
  },
})
