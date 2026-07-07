/**
 * AI 智能助手 API（校园易物 H5 端使用）
 * 对应后端：/api/ai/
 */
import request from '@/utils/request'

/**
 * AI 内容审核结果
 * 后端 ContentModerateResult 实际字段：safe / risk_level / reasons(列表) / suggestion / is_ai_fallback / message
 * 兼容旧版字段 is_compliant / reason（字符串）。
 */
export interface AiModerateResult {
  /** 是否合规（后端 safe） */
  safe: boolean
  /** 风险等级：low / medium / high / none */
  risk_level: 'low' | 'medium' | 'high' | 'none'
  /** 风险原因列表 */
  reasons: string[]
  /** 处置建议 */
  suggestion: string
  /** 是否降级 */
  is_ai_fallback: boolean
  /** 备注信息（可选） */
  message?: string
  /** 兼容旧字段 */
  is_compliant?: boolean
  reason?: string
}

/**
 * AI 价格建议结果
 * 后端 PriceSuggestResult 实际字段：low / median / high / reasoning / sample_count / is_ai_fallback / message
 * 为兼容旧前端，保留 suggested_price / price_range / reason / market_refs 作为可选字段。
 */
export interface AiPriceSuggestResult {
  /** 价格下界 */
  low: number
  /** 中位价（建议售价） */
  median: number
  /** 价格上界 */
  high: number
  /** 建议理由 */
  reasoning: string
  /** 样本数（历史成交数） */
  sample_count: number
  /** 是否降级（本地启发式） */
  is_ai_fallback: boolean
  /** 备注信息（可选） */
  message?: string
  /** 兼容旧字段 */
  suggested_price?: number
  price_range?: [number, number]
  reason?: string
  market_refs?: number
}

/**
 * AI 描述润色结果
 */
export interface AiPolishResult {
  polished_text: string
  highlights: string[]
  tags: string[]
  is_ai_fallback: boolean
}

/**
 * AI 议价建议结果
 */
export interface AiNegotiateResult {
  reply: string
  suggested_counter_price: number
  strategy: string
  is_ai_fallback: boolean
}

/**
 * AI 关键词提取结果
 */
export interface AiKeywordsResult {
  keywords: string[]
  is_ai_fallback: boolean
}

/**
 * AI 智能客服回复
 */
export interface AiCustomerServiceResult {
  reply: string
  tone: string
  next_actions: string[]
  is_ai_fallback: boolean
}

/**
 * AI 一键发布
 */
export interface AiPublishAssistResult {
  category: string
  category_sub: string
  title: string
  description: string
  suggested_price: number
  price_range: number[]
  condition: string
  tags: string[]
  confidence: number
  is_ai_fallback: boolean
  message: string
}

/**
 * AI 健康检查
 */
export interface AiHealthResult {
  enabled: boolean
  provider: string
  model: string
  base_url: string
  is_ai_fallback: boolean
}

/**
 * AI 内容审核
 * POST /api/ai/moderate/
 */
export function aiModerate(text: string): Promise<AiModerateResult> {
  return request.post('/ai/moderate/', { text })
}

/**
 * AI 价格建议
 * GET /api/ai/price-suggest/?category=&condition=&current_price=
 */
export function aiPriceSuggest(params: {
  category?: string
  condition?: string
  current_price?: number
}): Promise<AiPriceSuggestResult> {
  return request.get('/ai/price-suggest/', { params })
}

/**
 * AI 描述润色
 * POST /api/ai/polish/
 */
export function aiPolish(payload: {
  raw_text: string
  title?: string
  category?: string
  condition?: string
}): Promise<AiPolishResult> {
  return request.post('/ai/polish/', payload)
}

/**
 * AI 议价建议
 * POST /api/ai/negotiate/
 */
export function aiNegotiate(payload: {
  title: string
  current_price: number
  user_intent: string
  category?: string
}): Promise<AiNegotiateResult> {
  return request.post('/ai/negotiate/', payload)
}

/**
 * AI 关键词提取
 * POST /api/ai/extract-keywords/
 */
export function aiExtractKeywords(payload: {
  title?: string
  description?: string
  category?: string
  max_keywords?: number
}): Promise<AiKeywordsResult> {
  return request.post('/ai/extract-keywords/', payload)
}

/**
 * AI 智能客服回复建议
 * POST /api/ai/customer-service/
 */
export function aiCustomerService(payload: {
  product_info: Record<string, any>
  history: Array<{ role: 'buyer' | 'seller'; text: string }>
  incoming: string
  is_on_sale?: boolean
  can_negotiate?: boolean
  support_pickup?: boolean
  support_express?: boolean
}): Promise<AiCustomerServiceResult> {
  return request.post('/ai/customer-service/', payload)
}

/**
 * AI 一键发布（拍照识物 + 智能填充）
 * POST /api/ai/publish-assist/
 */
export function aiPublishAssist(payload: {
  image_url?: string
  draft_text?: string
  image_b64?: string
  image_mime?: string
}): Promise<AiPublishAssistResult> {
  return request.post('/ai/publish-assist/', payload)
}

/**
 * AI 健康检查
 * GET /api/ai/health/
 */
export function aiHealth(): Promise<AiHealthResult> {
  return request.get('/ai/health/')
}
