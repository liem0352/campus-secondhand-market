/**
 * API 封装：校园二手交易平台 v3
 *
 * 路由严格对齐后端 market.urls.py：
 *   /products/                          商品列表/详情/发布/搜索
 *   /products/{id}/favorite/            收藏切换（POST）
 *   /products/{id}/view/                浏览 +1（POST）
 *   /products/{id}/off-shelf/           下架（POST）
 *   /products/{id}/on-shelf/            上架（POST）
 *   /products/{id}/reviews/             商品评价列表（GET）
 *   /products/{id}/similar/             相似商品推荐（GET）
 *   /products/suggest/?q=xxx            搜索建议（GET）
 *   /products/upload-image/             商品图片上传（POST multipart）
 *   /favorites/                         我的收藏列表（GET）
 *   /categories/                        分类树
 *   /orders/                            订单状态机
 *   /reviews/                           评价
 *   /conversations/                     会话列表/创建
 *   /conversations/{id}/messages/       消息历史
 *   /conversations/{id}/read/           标记已读
 *   /messages/send/                     发送消息
 *   /reports/                           举报
 *   /ai/publish-assist/                 AI 一键发布
 *   /ai/price-suggest/                  AI 议价参考
 *   /ai/moderate/                       AI 内容审核
 *   /ai/chat/                           AI 智能客服
 *   /stats/me/overview/                 个人中心汇总
 *   /stats/seller/overview/             卖家工作台汇总
 *   /stats/seller/trend/?days=7         销售趋势
 *   /stats/seller/category-distribution/ 分类分布
 *   /home-feed/                         首页聚合数据
 *   /banners/, /notices/, /hot-keywords/, /site-stats/
 *
 * 沿用 utils/request.js 的鉴权 + code 0/200 兼容 + 401 兜底跳登录
 */
const { request } = require('./request')

/**
 * 公共 query 序列化（兼容 list 类接口）
 * @param {Object} params
 */
function qs(params) {
  if (!params) return ''
  const pairs = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
  return pairs.length ? '?' + pairs.join('&') : ''
}

/**
 * 通用文件上传辅助（POST multipart），自动附带 JWT。
 * @param {string} filePath 本地文件路径
 * @param {string} url 后端 URL（不包含 base）
 * @param {string} fieldName 表单字段名
 * @param {Object} extraFormData 额外表单字段
 * @returns {Promise<Object>} 后端 envelope 响应
 */
function uploadFile(filePath, url, fieldName = 'file', extraFormData = {}) {
  return new Promise((resolve, reject) => {
    const app = getApp()
    wx.uploadFile({
      url: app.globalData.apiBase + url,
      filePath,
      name: fieldName,
      formData: extraFormData,
      header: {
        Authorization: 'Bearer ' + (wx.getStorageSync('token') || ''),
      },
      success(res) {
        try {
          const body = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
          if (body.code === 0 || body.code === 200) {
            resolve(body)
          } else {
            reject(body)
          }
        } catch (e) {
          reject({ message: '解析响应失败' })
        }
      },
      fail: (err) => reject({ message: err.errMsg || '上传失败' }),
    })
  })
}

module.exports = {
  // ==================== 健康检查 & 认证 ====================
  /** 后端健康检查（公开） */
  health: () => request({ url: '/health/', auth: false }),

  /** 登录（公开） */
  login: (data) => request({ url: '/auth/login/', method: 'POST', data, auth: false }),

  /** 注册（公开） */
  register: (data) => request({ url: '/auth/register/', method: 'POST', data, auth: false }),

  /** 退出登录 */
  logout: () => request({ url: '/auth/logout/', method: 'POST' }),

  /** 刷新 Token */
  refreshToken: (refresh) =>
    request({ url: '/auth/refresh/', method: 'POST', data: { refresh }, auth: false }),

  // ==================== 用户 ====================
  /** 当前用户信息 */
  me: () => request({ url: '/users/me/' }),

  /** 更新用户资料 */
  updateProfile: (data) => request({ url: '/users/me/', method: 'PATCH', data }),

  /** 上传头像（小程序走 wx.uploadFile，路径与后端一致） */
  uploadAvatar: (filePath) => uploadFile(filePath, '/users/me/avatar/', 'avatar'),

  /** 指定用户公开信息 */
  userDetail: (id) => request({ url: `/users/${id}/` }),

  // ==================== 分类 ====================
  /** 全部分类（树形） */
  categories: () => request({ url: '/categories/' }),

  /** 指定分类详情 */
  categoryDetail: (id) => request({ url: `/categories/${id}/` }),

  // ==================== 商品 ====================
  /** 商品列表（带筛选） */
  products: (params) => request({ url: '/products/' + qs(params) }),

  /** 商品详情 */
  productDetail: (id) => request({ url: `/products/${id}/` }),

  /** 发布商品 */
  createProduct: (data) => request({ url: '/products/', method: 'POST', data }),

  /** 更新商品 */
  updateProduct: (id, data) => request({ url: `/products/${id}/`, method: 'PATCH', data }),

  /** 下架 / 重新上架 */
  toggleProduct: (id, status) =>
    request({ url: `/products/${id}/`, method: 'PATCH', data: { status } }),

  /** 删除商品 */
  deleteProduct: (id) => request({ url: `/products/${id}/`, method: 'DELETE' }),

  /** 上传商品图片（多图）—— 对齐后端 /products/upload-image/ */
  uploadProductImage: (filePath) => uploadFile(filePath, '/products/upload-image/', 'image'),

  /** 搜索建议（首页搜索框下拉） */
  searchSuggest: (keyword) =>
    request({ url: '/products/suggest/?q=' + encodeURIComponent(keyword || '') }),

  /** 浏览 +1（静默） */
  bumpProductView: (id) =>
    request({ url: `/products/${id}/view/`, method: 'POST', data: {} }),

  /** 同分类相似推荐 */
  similarProducts: (id) => request({ url: `/products/${id}/similar/` }),

  // ==================== 收藏 ====================
  /** 我的收藏列表 */
  favorites: (params) => request({ url: '/favorites/' + qs(params) }),

  /** 切换收藏（对齐后端 /products/{id}/favorite/） */
  toggleFavorite: (productId) =>
    request({ url: `/products/${productId}/favorite/`, method: 'POST' }),

  // ==================== 订单 ====================
  /** 订单列表（带筛选 role/status） */
  orders: (params) => request({ url: '/orders/' + qs(params) }),

  /** 订单详情 */
  orderDetail: (id) => request({ url: `/orders/${id}/` }),

  /** 创建订单（提交"我想要"） */
  createOrder: (data) => request({ url: '/orders/', method: 'POST', data }),

  /** 卖家确认订单 */
  confirmOrder: (id, data) =>
    request({ url: `/orders/${id}/confirm/`, method: 'POST', data }),

  /** 取消订单 */
  cancelOrder: (id, reason) =>
    request({ url: `/orders/${id}/cancel/`, method: 'POST', data: { reason } }),

  /** 标记完成 */
  completeOrder: (id) =>
    request({ url: `/orders/${id}/complete/`, method: 'POST' }),

  // ==================== 评价 ====================
  /** 某商品的评价列表 */
  productReviews: (productId, params) =>
    request({ url: `/products/${productId}/reviews/` + qs(params) }),

  /** 提交评价 */
  createReview: (data) => request({ url: '/reviews/', method: 'POST', data }),

  // ==================== 私聊 ====================
  /** 会话列表（对齐后端 /conversations/） */
  conversations: () => request({ url: '/conversations/' }),

  /** 某会话的消息历史 */
  messages: (conversationId, params) =>
    request({ url: `/conversations/${conversationId}/messages/` + qs(params) }),

  /** 发送消息（对齐后端 /messages/send/） */
  sendMessage: (conversationId, data) =>
    request({ url: '/messages/send/', method: 'POST', data: { conversation_id: conversationId, ...data } }),

  /** 创建或获取会话 */
  getOrCreateConversation: (peerId, productId) =>
    request({
      url: '/conversations/',
      method: 'POST',
      data: { product_id: productId, peer_id: peerId || undefined },
    }),

  /** 标记会话已读 */
  markRead: (conversationId) =>
    request({ url: `/conversations/${conversationId}/read/`, method: 'POST' }),

  // ==================== 举报 ====================
  /** 提交举报 */
  report: (data) => request({ url: '/reports/', method: 'POST', data }),

  // ==================== AI ====================
  /**
   * AI 一键发布：支持 image_url + draft_text 两种入参
   * 后端 AiPublishAssistView 接收 JSON：{image_url?, draft_text?, image_b64?, image_mime?}
   * @param {Object} payload {image_url?: string, draft_text?: string, image_b64?: string, image_mime?: string}
   */
  aiPublishAssist: (payload) => {
    const data = {
      image_url:   (payload && payload.image_url)   || '',
      draft_text:  (payload && payload.draft_text)  || '',
      image_b64:   (payload && payload.image_b64)   || '',
      image_mime:  (payload && payload.image_mime)  || 'image/jpeg',
    }
    return request({ url: '/ai/publish-assist/', method: 'POST', data })
  },

  /** AI 议价参考（同款历史成交价） */
  aiPriceSuggest: (params) => {
    if (typeof params === 'object' && params !== null) {
      return request({ url: '/ai/price-suggest/' + qs(params) })
    }
    // 兼容旧的 productId 调用
    return request({ url: `/ai/price-suggest/?product_id=${params}` })
  },

  /** AI 内容审核 */
  aiModerate: (text) =>
    request({ url: '/ai/moderate/', method: 'POST', data: { text } }),

  /**
   * AI 通用问答（小程序 AI 助手页用） — 对齐后端 AiGeneralChatView
   * @param {string} question 用户问题
   * @param {Array}  history  对话历史 [{role, text}]
   */
  aiAsk: (question, history = []) =>
    request({ url: '/ai/chat/', method: 'POST', data: { question, history } }),

  /**
   * AI 智能客服（兼容旧调用：传字符串；新调用：传 payload）
   * 与后端 AiCustomerServiceView 对齐：{product_info, history, incoming, ...}
   * @param {string|Object} questionOrPayload 字符串：仅作 incoming；对象：完整 payload
   */
  aiChat: (questionOrPayload) => {
    let data
    if (typeof questionOrPayload === 'string') {
      data = { incoming: questionOrPayload }
    } else {
      const p = questionOrPayload || {}
      data = {
        product_info:  p.product_info  || {},
        history:       p.history       || [],
        incoming:      p.incoming      || '',
        is_on_sale:    p.is_on_sale    !== undefined ? p.is_on_sale    : true,
        can_negotiate: p.can_negotiate !== undefined ? p.can_negotiate : true,
        support_pickup:  p.support_pickup  !== undefined ? p.support_pickup  : true,
        support_express: p.support_express !== undefined ? p.support_express : false,
      }
    }
    return request({ url: '/ai/customer-service/', method: 'POST', data })
  },

  /** AI 描述润色 */
  aiPolish: (rawText, extras = {}) =>
    request({ url: '/ai/polish/', method: 'POST', data: { raw_text: rawText, ...extras } }),

  /** AI 议价辅助 */
  aiNegotiate: (payload) =>
    request({ url: '/ai/negotiate/', method: 'POST', data: payload || {} }),

  /** AI 提取关键词 */
  aiExtractKeywords: (payload) =>
    request({ url: '/ai/extract-keywords/', method: 'POST', data: payload || {} }),

  /** AI 健康检查（公开） */
  aiHealth: () => request({ url: '/ai/health/', auth: false }),

  /** AI 历史 */
  aiHistory: (page = 1, pageSize = 20) =>
    request({ url: `/ai/history/?page=${page}&page_size=${pageSize}` }),

  /** AI 一键消费建议 */
  aiAdvice: () => request({ url: '/ai/advice/' }),

  // ==================== 统计 ====================
  /** 个人中心数据汇总（个人视角：发布/已售/收藏/信用分） */
  myOverview: () => request({ url: '/stats/me/overview/' }),

  /** 我的销售趋势 */
  mySalesTrend: (days = 30) =>
    request({ url: `/stats/seller/trend/?days=${days}` }),

  /** 卖家工作台概览 */
  sellerOverview: () => request({ url: '/stats/seller/overview/' }),

  /** 分类收入分布 */
  sellerCategoryDist: () => request({ url: '/stats/seller/category-distribution/' }),

  // ==================== 系统级 ====================
  /** 首页一站式聚合数据 */
  homeFeed: () => request({ url: '/home-feed/' }),

  /** 轮播图列表 */
  banners: () => request({ url: '/banners/' }),

  /** 公告列表 */
  notices: () => request({ url: '/notices/' }),

  /** 热门搜索词 */
  hotKeywords: () => request({ url: '/hot-keywords/' }),

  /** 站点统计 */
  siteStats: () => request({ url: '/site-stats/' }),

  // ==================== 通用工具 ====================
  /**
   * 上传通用文件
   * @param {string} filePath 本地路径
   * @param {string} url 后端 URL
   */
  uploadFile: (filePath, url) => uploadFile(filePath, url, 'file'),
}
