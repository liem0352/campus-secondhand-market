/**
 * 全局文案集中管理(i18n-ready)
 * 集中所有面向用户的文本,便于后续接入 i18n / 修改 / 校对
 * 不包含后台报错、字段名校验等纯逻辑文案(那些保留在各自模块)
 */

import { ORDER_STATUS, PRODUCT_STATUS, type OrderStatus, type ProductStatus } from './business'

/* ============== 通用 ============== */
export const COMMON_TEXT = {
  CONFIRM: '确认',
  CANCEL: '取消',
  SUBMIT: '提交',
  SAVE: '保存',
  DELETE: '删除',
  EDIT: '编辑',
  CREATE: '创建',
  SEARCH: '搜索',
  RESET: '重置',
  LOADING: '加载中…',
  NO_MORE: '没有更多了',
  EMPTY: '暂无数据',
  BACK: '返回',
  NEXT: '下一步',
  PREV: '上一步',
  REFRESH: '刷新',
  MORE: '更多',
  DETAIL: '详情',
  SUCCESS: '操作成功',
  FAILED: '操作失败',
  YES: '是',
  NO: '否',
} as const

/* ============== 应用基础 ============== */
export const APP_TEXT = {
  /** 应用名 */
  NAME: '校园易物',
  /** 应用英文名/标识 */
  SHORT_NAME: 'C 端 H5',
  /** 品牌标语 */
  TAGLINE: '买卖家一站式校园闲置流转平台',
  /** 平台特性列表(登录页左侧) */
  FEATURES: [
    '浏览 · 搜索 · 收藏心仪好物',
    '私聊议价 · 订单状态全程追踪',
    '一键发布闲置 · AI 智能润色定价',
    '销售看板 · 信用分动态增长',
  ] as readonly string[],
  /** 登录页底部署名 */
  FOOTER_AUTHOR: '© liem',
  /** 隐私 / 用户协议文案 */
  AGREEMENT_TEXT: '登录即代表同意《用户协议》与《隐私政策》',
  /** 登录标题 */
  LOGIN_TITLE: '账号登录',
  /** 登录副标题 */
  LOGIN_SUBTITLE: '使用校园账号进入校园易物',
  /** 用户名输入占位 */
  USERNAME_PLACEHOLDER: '用户名 / 学号',
  /** 密码输入占位 */
  PASSWORD_PLACEHOLDER: '登录密码',
  /** 登录按钮 */
  LOGIN_BTN: '登 录',
  /** 演示账号标题 */
  DEMO_TITLE: '演示账号 · 一键登录',
  /** 登录成功 */
  LOGIN_SUCCESS: '登录成功',
  /** 默认跳转 */
  DEFAULT_ROUTE: '/dashboard',
} as const

/* ============== 表单校验 ============== */
export const VALIDATE_TEXT = {
  USERNAME_REQUIRED: '请输入用户名',
  USERNAME_LENGTH: '用户名 3-30 个字符',
  PASSWORD_REQUIRED: '请输入密码',
  PASSWORD_LENGTH: '密码至少 6 个字符',
  PRICE_INVALID: '请输入正确的价格',
  DESC_TOO_LONG: '描述过长',
  REQUIRED: '此项必填',
} as const

/* ============== 错误提示(业务) ============== */
export const ERROR_TEXT = {
  NETWORK: '网络连接失败,请检查后端服务是否启动',
  SERVER: '服务器开了小差,请稍后再试',
  FORBIDDEN: '没有权限执行此操作',
  NOT_FOUND: '请求的资源不存在',
  REQUEST_FAILED: '请求失败',
  LOGIN_FAILED: '登录失败',
  UPLOAD_FAILED: '上传失败',
  EXTRACT_DEMO: `已填充 {username},点击"登录"即可`,
} as const

/* ============== 商品相关 ============== */
export const PRODUCT_TEXT = {
  CREATE_TITLE: '发布闲置',
  EDIT_TITLE: '编辑商品',
  CATEGORY_REQUIRED: '请选择分类',
  TITLE_REQUIRED: '请填写商品标题',
  TITLE_TOO_LONG: `标题最多 {max} 字`,
  PRICE_REQUIRED: '请填写价格',
  PRICE_RANGE: `价格需在 {min} ~ {max} 之间`,
  DESC_REQUIRED: '请填写商品描述',
  DESC_TOO_LONG: `描述最多 {max} 字`,
  CONDITION_REQUIRED: '请选择成色',
  LOCATION_REQUIRED: '请填写交易地点',
  IMAGE_REQUIRED: '请至少上传 1 张图片',
  UPLOAD_PROGRESS: '上传中…',
  AI_PRICE_TITLE: 'AI 智能定价建议',
  AI_POLISH_TITLE: 'AI 文案润色',
  PUBLISH_SUCCESS: '发布成功',
  PUBLISH_FAILED: '发布失败',
  OFFLINE_CONFIRM: '确定下架此商品?',
  DELETE_CONFIRM: '确定删除此商品?',
} as const

/** 商品状态文案 */
export const PRODUCT_STATUS_TEXT: Record<ProductStatus, string> = {
  [PRODUCT_STATUS.ON_SALE]: '在售',
  [PRODUCT_STATUS.PENDING]: '待审核',
  [PRODUCT_STATUS.SOLD]: '已售',
  [PRODUCT_STATUS.OFF_SHELF]: '已下架',
  [PRODUCT_STATUS.DRAFT]: '草稿',
}

/* ============== 订单相关 ============== */
export const ORDER_TEXT = {
  TITLE: '我的订单',
  BUYER_TITLE: '我买到的',
  SELLER_TITLE: '我卖出的',
  EMPTY_BUYER: '还没有买过任何商品',
  EMPTY_SELLER: '还没有卖出任何商品',
  CREATE_BTN: '立即购买',
  CANCEL_BTN: '取消订单',
  CONFIRM_BTN: '确认订单',
  PAY_BTN: '立即支付',
  SHIP_BTN: '发货',
  COMPLETE_BTN: '确认收货',
  REVIEW_BTN: '立即评价',
  CONTACT_BTN: '联系卖家',
  CANCEL_CONFIRM: '确定取消该订单?',
  COMPLETE_CONFIRM: '确认已收到货?',
  STATUS_PREFIX: '订单状态',
} as const

/** 订单状态文案 */
export const ORDER_STATUS_TEXT: Record<OrderStatus, string> = {
  [ORDER_STATUS.REQUESTED]: '待确认',
  [ORDER_STATUS.CONFIRMED]: '已确认',
  [ORDER_STATUS.SHIPPING]: '运输中',
  [ORDER_STATUS.PICKING]: '待取件',
  [ORDER_STATUS.COMPLETED]: '已完成',
  [ORDER_STATUS.REVIEWED]: '已评价',
  [ORDER_STATUS.CANCELLED]: '已取消',
}

/* ============== 消息 ============== */
export const MESSAGE_TEXT = {
  TITLE: '消息中心',
  EMPTY: '暂无消息',
  PLACEHOLDER: '请输入消息…',
  SEND_BTN: '发送',
  UNREAD: '未读',
  NEW_MSG: '您有新消息',
} as const

/* ============== 个人中心 ============== */
export const PROFILE_TEXT = {
  TITLE: '我的',
  EDIT: '编辑资料',
  CHANGE_PWD: '修改密码',
  LOGOUT: '退出登录',
  LOGOUT_CONFIRM: '确定退出登录?',
  CREDIT: '信用分',
  PUBLISHED: '我发布的',
  SOLD: '我卖出的',
  BOUGHT: '我买到的',
  FAVORITE: '我的收藏',
  SETTINGS: '设置',
} as const

/* ============== 404 / 403 ============== */
export const ERROR_PAGE_TEXT = {
  NOT_FOUND_TITLE: '页面走丢了',
  NOT_FOUND_DESC: '您访问的页面不存在或已被移除',
  FORBIDDEN_TITLE: '无权访问',
  FORBIDDEN_DESC: '您没有权限访问此页面',
  GO_HOME: '返回首页',
  GO_BACK: '返回上一页',
} as const

/* ============== 路由 ============== */
export const ROUTE_PATHS = {
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  PRODUCT_CREATE: '/products/create',
  BROWSE: '/browse',
  BROWSE_DETAIL: (id: number | string) => `/browse/${id}`,
  ORDERS: '/orders',
  BUYER_ORDERS: '/buyer-orders',
  PROFILE: '/profile',
  LOGIN: '/login',
  FAVORITES: '/favorites',
  STATISTICS: '/statistics',
  MESSAGES: '/messages',
  ADMIN_INDEX: '/__admin__',
} as const

/* ============== 工作台 Dashboard ============== */
export const DASHBOARD_TEXT = {
  TITLE: '工作台',
  GREETING_DEFAULT_NICK: '同学',
  REFRESH_BTN: '刷新数据',
  PUBLISH_BTN: '发布商品',
  HERO_CHIP_ON_SALE: (n: number) => `在售 ${n} 件`,
  HERO_CHIP_SOLD: (n: number) => `已售 ${n} 件`,
  HERO_CHIP_PENDING: (n: number) => `待处理 ${n}`,
  HERO_CHIP_CREDIT: (n: number) => `信用 ${n} 分`,
  STAT_ON_SALE: '在售商品',
  STAT_ON_SALE_SUB: (n: number) => `累计发布 ${n} 件`,
  STAT_INCOME: '近 7 天销售额',
  STAT_INCOME_SUB: (n: number) => `成交 ${n} 单`,
  STAT_PENDING: '待确认订单',
  STAT_PENDING_SUB: '需及时处理',
  STAT_CREDIT: '信用分',
  CARD_TREND: '销售趋势',
  CARD_CATEGORY: '分类收入分布',
  CARD_PRICE_RANGE: '价格区间分布',
  CARD_TODO: '待办事项',
  CARD_RECENT: '最近商品',
  TODO_EMPTY: '暂无待办',
  RECENT_EMPTY: '暂无商品',
  VIEW_ALL: '查看全部',
  HANDLE: '处理',
  ANON_BUYER: '匿名买家',
  HERO_PENDING: (n: number) => `你有 ${n} 个待处理订单`,
  HERO_SOLD: '今天也是顺利出单的一天',
  HERO_DEFAULT: '欢迎回到工作台',
  HERO_DESC_SUFFIX: '今日待办与运营数据已就绪',
  GREETING_NIGHT: '夜深了',
  GREETING_MORNING: '早上好',
  GREETING_NOON: '中午好',
  GREETING_AFTERNOON: '下午好',
  GREETING_EVENING: '晚上好',
  CREDIT_HIGH: '信用极好',
  CREDIT_MID: '信用良好',
  CREDIT_LOW: '待提升',
  CREDIT_HIGH_DESC: '信用极好，放心交易',
  CREDIT_MID_DESC: '信用良好',
  CREDIT_LOW_DESC: '信用较低，建议维护',
  CREDIT_TIP_HIGH: '保持好习惯，优先处理订单、定期更新商品。',
  CREDIT_TIP_MID: '及时回复买家消息、按时发货，可继续加分。',
  CREDIT_TIP_LOW: '建议完成实名认证，提升账号信用。',
  STATUS_OFFSHELF: '已下架',
  TIPS: [
    '商品图片明亮清晰可大幅提升点击率',
    '价格建议在同款中位 ±10% 更易成交',
    '及时确认订单有助提升店铺信用',
    '使用 AI 润色可让商品描述更专业',
  ] as readonly string[],
  // AI 工具
  AI_PANEL_TITLE: 'AI 智能助手',
  AI_PANEL_SUBTITLE: '让 AI 帮你提升运营效率',
  AI_CONNECTED: '已连接',
  AI_OFFLINE: '离线降级',
  AI_FALLBACK: '降级',
  AI_FALLBACK_MODE: '降级模式',
  AI_INLINE_TITLE: '快速议价模拟',
  AI_INLINE_PLACEHOLDER: '买家说：能便宜点吗？',
  AI_INLINE_BTN: 'AI 回复',
  AI_INLINE_AGAIN: '再来一次',
  AI_INLINE_EMPTY: '暂无关键词',
  AI_COPY: '复制',
  AI_COPY_SUCCESS: '已复制到剪贴板',
  AI_COPY_FAIL: '复制失败，请手动复制',
  AI_SUGGESTED_REPLY: '建议回复',
  AI_SUGGESTED_PRICE: (n: number | string) => `建议出价：¥${n}`,
  AI_STRATEGY: '策略',
  // AI 工具列表
  AI_TOOLS: [
    { id: 'price', label: 'AI 价格建议', desc: '基于同款历史价给到推荐', icon: 'PriceTag', tone: 'primary' },
    { id: 'moderate', label: '内容合规检测', desc: '发布前自动检查违规风险', icon: 'Document', tone: 'success' },
    { id: 'polish', label: '描述一键润色', desc: '让文案更专业、更有吸引力', icon: 'MagicStick', tone: 'warning' },
    { id: 'keywords', label: '提取搜索关键词', desc: '提升商品曝光与搜索命中', icon: 'CollectionTag', tone: 'info' },
  ] as const,
  // 工具抽屉
  AI_DRAWER: {
    PRICE: { title: 'AI 价格建议', desc: '基于同款商品历史成交价，给出区间与建议售价' },
    MODERATE: { title: '内容合规检测', desc: '发布商品前先用 AI 检查文案，避免违规' },
    POLISH: { title: '描述一键润色', desc: '把草稿润色得更专业、更吸引人' },
    KEYWORDS: { title: '提取搜索关键词', desc: '从标题与描述中提取核心关键词' },
  } as const,
  TIPS_CARD_TITLE: '运营小贴士',
  POLISH_RESULT: '润色结果',
  KEYWORDS_RESULT: '推荐关键词',
  MODERATE_RESULT: '审核结果',
  PRICE_RESULT: 'AI 建议结果',
  POLISH_BTN: '开始润色',
  POLISH_SUCCESS: '润色完成',
  POLISH_FAIL: '润色失败',
  KEYWORDS_BTN: '提取关键词',
  KEYWORDS_EMPTY: '请输入标题或描述',
  MODERATE_BTN: '检测内容',
  MODERATE_EMPTY: '请输入要检测的文本',
  MODERATE_RISK: (level: string) => `风险等级：${level}`,
  POLISH_TITLE_LABEL: '标题（可选）',
  POLISH_CATEGORY_LABEL: '商品分类（可选）',
  POLISH_RAW_LABEL: '原始描述',
  POLISH_TITLE_PLACEHOLDER: '例如：iPad Pro 2021',
  POLISH_CATEGORY_PLACEHOLDER: '例如：电子产品',
  POLISH_RAW_PLACEHOLDER: '把你写的草稿粘贴过来，AI 会润色得更专业',
  KEYWORDS_TITLE_LABEL: '商品标题',
  KEYWORDS_DESC_LABEL: '商品描述',
  KEYWORDS_TITLE_PLACEHOLDER: '例如：iPad Pro 11寸 2021款',
  KEYWORDS_DESC_PLACEHOLDER: '可粘贴一段描述',
  MODERATE_LABEL: '商品描述（可粘贴整段文本）',
  MODERATE_PLACEHOLDER: '把商品描述粘贴到这里，AI 会帮你判断内容是否合规',
  PRICE_CATEGORY_LABEL: '商品分类',
  PRICE_CONDITION_LABEL: '成色',
  PRICE_EXPECTED_LABEL: '你的预期售价 (¥)',
  PRICE_CATEGORIES: [
    { label: '教材书籍', value: '教材书籍' },
    { label: '电子产品', value: '电子产品' },
    { label: '生活用品', value: '生活用品' },
    { label: '服饰鞋包', value: '服饰鞋包' },
    { label: '其他', value: '其他' },
  ] as const,
  PRICE_CONDITIONS: [
    { label: '全新', value: '全新' },
    { label: '9成新', value: '9成新' },
    { label: '8成新', value: '8成新' },
    { label: '7成新', value: '7成新' },
  ] as const,
  PRICE_BTN: '生成建议',
  PRICE_SUCCESS: '已生成价格建议',
  PRICE_FAIL: '价格建议生成失败',
  PRICE_SUGGEST_PRICE: '建议售价',
  PRICE_RANGE: (low: number | string, high: number | string) => `参考区间：¥${low} - ¥${high}`,
  PRICE_REASON_NONE: '（无具体原因）',
  PRICE_REASON_PREFIX: '参考',
  PRICE_REASON_SUFFIX: '条历史成交',
  KEYWORD_HASH: (k: string) => `#${k}`,
  GENERATE_BTN_SUFFIX: '生成建议',
  AI_BTN_LABEL: 'AI 回复',
  // 内联 AI 议价
  INLINE_DEFAULT_INTENT: '能便宜点吗？学生党预算有限',
  INLINE_DEFAULT_CATEGORY: '通用',
  INLINE_CATEGORIES: [
    { label: '通用', value: '通用' },
    { label: '教材书籍', value: '教材书籍' },
    { label: '电子产品', value: '电子产品' },
    { label: '生活用品', value: '生活用品' },
    { label: '服饰鞋包', value: '服饰鞋包' },
  ] as const,
  INLINE_NEGOTIATE_FAIL: 'AI 议价失败',
  INLINE_RETRY: '请输入买家的话',
  INLINE_TITLE: '校园二手商品',
  INLINE_PRICE: 100,
  // ECharts 系列
  CHART_LEGEND_AMOUNT: '销售额',
  CHART_LEGEND_COUNT: '成交笔数',
  EMPTY_TREND: '暂无销售数据',
  EMPTY_DEFAULT: '暂无数据',
} as const

/* ============== 发布商品 / 商品管理 ============== */
export const PRODUCT_FORM_TEXT = {
  CREATE_TITLE: '发布商品',
  EDIT_TITLE: '编辑商品',
  BACK: '返回',
  CANCEL: '取消',
  PUBLISH_NOW: '立即发布',
  SAVE_DRAFT: '保存草稿',
  TITLE_LABEL: '商品标题',
  TITLE_PLACEHOLDER: '一句话描述你的商品，如「九成新高等数学教材第七版」',
  TITLE_MAX: 60,
  DESC_LABEL: '商品描述',
  DESC_PLACEHOLDER: '详细介绍商品：使用情况、有无瑕疵、购买时间等',
  DESC_MAX: 500,
  PRICE_LABEL: '售价',
  PRICE_MIN: 0.01,
  PRICE_MAX: 99999,
  ORIGINAL_PRICE_LABEL: '原价',
  ORIGINAL_PRICE_OPTIONAL: '选填',
  CATEGORY_LABEL: '分类',
  CATEGORY_PLACEHOLDER: '请选择分类',
  CONDITION_LABEL: '成色',
  IMAGE_LABEL: '商品图片',
  UPLOAD_TEXT: '上传图片',
  UPLOAD_TIP: '最多上传 9 张，建议尺寸 1:1，单张不超过 5MB',
  UPLOAD_LIMIT: 9,
  UPLOAD_IMG_TYPE: '仅支持图片文件',
  UPLOAD_TOO_LARGE: '单张图片不能超过 5MB',
  UPLOAD_SUCCESS: '图片上传成功',
  UPLOAD_FAIL: '图片上传失败',
  UPLOAD_EXCEED: '最多上传 9 张图片',
  PREVIEW_TITLE: '实时预览',
  PREVIEW_DEFAULT_TITLE: '商品标题',
  PREVIEW_DEFAULT_DESC: '商品描述',
  TIPS_TITLE: '发布小贴士',
  TIPS_LIST: [
    '标题控制在 20 字以内，重点突出商品卖点',
    '建议上传实物图，9 张图全方位展示',
    '价格可参考同款历史成交价合理定价',
    '信用分 ≥ 60 才能正常发布商品',
  ] as readonly string[],
  // 校验
  VALIDATE_TITLE_REQUIRED: '请输入商品标题',
  VALIDATE_TITLE_LENGTH: '标题 2-60 字',
  VALIDATE_DESC_REQUIRED: '请输入商品描述',
  VALIDATE_DESC_LENGTH: '描述 5-500 字',
  VALIDATE_PRICE_REQUIRED: '请输入售价',
  VALIDATE_PRICE_POSITIVE: '售价必须大于 0',
  VALIDATE_CATEGORY_REQUIRED: '请选择分类',
  VALIDATE_CONDITION_REQUIRED: '请选择成色',
  VALIDATE_IMAGE_REQUIRED: '至少上传一张图片',
  // 成色
  CONDITION_OPTIONS: [
    { value: 'new', label: '全新' },
    { value: 'like_new', label: '九成新' },
    { value: 'good', label: '八成新' },
    { value: 'fair', label: '七成新' },
  ] as const,
  // 提交反馈
  UPDATE_SUCCESS: '修改成功',
  DRAFT_SAVED: '草稿已保存',
  PUBLISH_SUCCESS: '发布成功',
  PUBLISH_FAIL: '操作失败',
} as const

/* ============== 商品浏览 ============== */
export const BROWSE_TEXT = {
  SEARCH_PLACEHOLDER: '搜索心仪的二手好物 ...',
  SEARCH_BTN: '搜索',
  CATEGORY_ALL: '全部',
  EMPTY_DESC: '暂无相关商品，换个关键词试试',
  LOAD_MORE: '加载更多',
  LOAD_END: '— 已经到底了 —',
  LOAD_FAIL: '商品加载失败',
  CONDITION: {
    new: '全新',
    like_new: '99新',
    good: '9成新',
    fair: '其他',
  } as Record<string, string>,
  DISCOUNT: (savePct: number, zhe: string) => `立减 ${savePct}% · ${zhe} 折`,
} as const

/* ============== 主布局 ============== */
export const LAYOUT_TEXT = {
  // 菜单
  MENU_DASHBOARD: '工作台',
  MENU_BROWSE: '商品大厅',
  MENU_FAVORITES: '我的收藏',
  MENU_BUYER_ORDERS: '我买到的',
  MENU_PRODUCTS: '我的商品',
  MENU_PRODUCT_CREATE: '发布商品',
  MENU_SELLER_ORDERS: '卖出订单',
  MENU_STATISTICS: '销售看板',
  MENU_MESSAGES: '消息中心',
  MENU_PROFILE: '个人资料',
  MENU_ADMIN: '进入管理后台',
  // 顶栏
  COLLAPSE_BTN_EXPAND: '展开侧边栏',
  COLLAPSE_BTN_COLLAPSE: '折叠侧边栏',
  DEFAULT_PAGE_TITLE: '校园易物',
  USER_NICKNAME_DEFAULT: '未登录',
  USER_SCHOOL_DEFAULT: '校园用户',
  USER_AVATAR_DEFAULT: 'U',
  // 信用
  CREDIT_LABEL: '信用',
  // 下拉菜单
  DROPDOWN_PROFILE: '个人资料',
  DROPDOWN_PUBLISH: '发布商品',
  DROPDOWN_LOGOUT: '退出登录',
  // 路由
  BROWSE: '/browse',
  MESSAGES: '/messages',
  PROFILE: '/profile',
  ADMIN_INDEX: '/__admin__',
} as const

/* ============== 品牌 Logo ============== */
export const BRAND_TEXT = {
  /** 主标题(logo) */
  TITLE: '校园易物',
  /** 副标题(水平模式下显示) */
  SUBTITLE: 'C 端 H5',
  /** 无障碍标签 */
  ARIA_LABEL: '校园易物',
  /** 副标题(管理后台场景) */
  SUBTITLE_ADMIN: '平台后台',
} as const

/* ============== 主题切换器 ============== */
export const THEME_TEXT = {
  /** 触发按钮的无障碍标签 */
  TRIGGER_ARIA: '主题设置',
  /** 触发按钮 title 模板 */
  TRIGGER_TITLE: (name: string, mode: string) => `主题:${name} · ${mode}`,
  /** 触发按钮 title 中的模式名 */
  MODE_LIGHT: '浅色',
  MODE_DARK: '深色',
  /** 外观模式行 */
  ROW_MODE_LABEL: '外观模式',
  MODE_LIGHT_BTN: '浅色',
  MODE_DARK_BTN: '深色',
  MODE_AUTO_BTN: '跟随',
  /** 预设主题行 */
  ROW_PRESET_LABEL: '主题色',
  SWATCH_TITLE: (name: string, desc: string) => `${name} · ${desc}`,
  /** 自定义主色行 */
  ROW_CUSTOM_LABEL: '自定义主色',
  CUSTOM_HINT: '点击展开色板',
  CUSTOM_PICKER_TRIGGER: '打开颜色面板',
  CUSTOM_PICKER_CLEAR: '清空',
  CUSTOM_PICKER_CONFIRM: '确定',
  /** 重置 */
  RESET_BTN: '恢复默认主题',
  /** 弹层宽度 */
  POPOVER_WIDTH: 320,
} as const
