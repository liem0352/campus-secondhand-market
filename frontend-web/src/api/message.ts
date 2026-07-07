/**
 * 消息中心 API
 * 对应后端：/api/conversations/  /api/conversations/{id}/messages/
 *          /api/conversations/{id}/read/
 */
import request from '@/utils/request'

/** 会话条目（来自后端 ConversationSerializer） */
export interface Conversation {
  id: number
  product: {
    id: number
    title: string
    /** 封面图 */
    cover?: string
  }
  buyer: { id: number; username: string; nickname?: string; avatar?: string }
  seller: { id: number; username: string; nickname?: string; avatar?: string }
  last_message: string
  last_message_at: string | null
  unread_buyer: number
  unread_seller: number
  created_at: string
  updated_at: string
}

/** 单条消息 */
export interface MessageItem {
  id: number
  conversation: number
  sender: { id: number; username: string; nickname?: string; avatar?: string }
  content: string
  is_read: boolean
  created_at: string
}

/**
 * 获取当前用户的全部会话
 */
export function fetchConversations(): Promise<{ results: Conversation[]; count: number }> {
  return request.get('/conversations/')
}

/**
 * 获取指定会话的全部消息
 */
export function fetchConversationMessages(conversationId: number): Promise<{ results: MessageItem[]; count: number }> {
  return request.get(`/conversations/${conversationId}/messages/`)
}

/**
 * 标记会话已读(把对方发来的未读清零)
 */
export function markConversationRead(conversationId: number): Promise<{ ok: true }> {
  return request.post(`/conversations/${conversationId}/read/`)
}

/**
 * 发送消息
 */
export function sendMessage(payload: { conversation: number; content: string }): Promise<MessageItem> {
  return request.post('/messages/send/', payload)
}
