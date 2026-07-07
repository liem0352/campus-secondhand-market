<!--
  校园易物 H5 端 · 消息中心
  - 左侧会话列表（每个会话显示对方 / 商品 / 最后一条消息 / 未读数）
  - 右侧消息详情（聊天流 + 输入框）
  - 进入即从后端拉取,点击会话自动标记已读
-->
<template>
  <div class="page-container messages-page">
    <div class="page-header">
      <div>
        <h2>消息中心</h2>
        <p class="text-muted">订单动态、买家咨询与系统通知一站式查看</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" :loading="loading" @click="loadAll">刷新</el-button>
        <el-button type="primary" :icon="Check" @click="handleMarkAllRead">全部已读</el-button>
      </div>
    </div>

    <div class="chat-layout">
      <!-- 左侧：会话列表 -->
      <aside class="chat-aside">
        <div class="aside-header">
          <span class="aside-title">会话</span>
          <span class="text-muted">{{ conversations.length }} 个</span>
        </div>
        <ul v-loading="loading" class="conv-list">
          <li v-if="!loading && conversations.length === 0" class="conv-empty">
            <el-empty description="暂无会话" :image-size="80" />
          </li>
          <li
            v-for="c in conversations"
            :key="c.id"
            class="conv-item"
            :class="{ 'conv-item--active': activeId === c.id, 'conv-item--unread': unreadOf(c) > 0 }"
            @click="selectConversation(c)"
          >
            <el-avatar :size="40" :src="peerOf(c).avatar">
              {{ (peerOf(c).nickname || peerOf(c).username || '?').charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="conv-info">
              <div class="conv-row">
                <span class="conv-name">{{ peerOf(c).nickname || peerOf(c).username }}</span>
                <span class="conv-time">{{ formatTime(c.last_message_at || c.updated_at) }}</span>
              </div>
              <div class="conv-row">
                <span class="conv-product text-muted">{{ c.product?.title }}</span>
                <el-badge v-if="unreadOf(c) > 0" :value="unreadOf(c)" :max="99" class="conv-badge" />
              </div>
              <div class="conv-preview text-muted">{{ c.last_message || '暂无消息' }}</div>
            </div>
          </li>
        </ul>
      </aside>

      <!-- 右侧：消息详情 -->
      <section v-loading="msgLoading" class="chat-main">
        <template v-if="active">
          <header class="chat-header">
            <div class="peer">
              <el-avatar :size="40" :src="peerOf(active).avatar">
                {{ (peerOf(active).nickname || peerOf(active).username || '?').charAt(0).toUpperCase() }}
              </el-avatar>
              <div>
                <div class="peer-name">{{ peerOf(active).nickname || peerOf(active).username }}</div>
                <div class="peer-product text-muted">关于「{{ active.product?.title }}」</div>
              </div>
            </div>
            <el-button size="small" :icon="View" @click="goProduct">查看商品</el-button>
          </header>

          <ul ref="messageListRef" class="message-stream">
            <li
              v-for="m in messages"
              :key="m.id"
              :class="['msg', { 'msg--mine': m.sender.id === currentUserId }]"
            >
              <el-avatar :size="32" :src="m.sender.avatar" class="msg-avatar">
                {{ (m.sender.nickname || m.sender.username || '?').charAt(0).toUpperCase() }}
              </el-avatar>
              <div class="msg-body">
                <div class="msg-bubble">{{ m.content }}</div>
                <div class="msg-time text-muted">{{ formatTimeFull(m.created_at) }}</div>
              </div>
            </li>
          </ul>

          <footer class="chat-input">
            <el-input
              v-model="draft"
              type="textarea"
              :rows="2"
              placeholder="输入消息，回车发送，Shift+回车换行"
              :maxlength="500"
              show-word-limit
              @keydown.enter.exact.prevent="onSend"
            />
            <el-button
              type="primary"
              :icon="Promotion"
              :loading="sending"
              :disabled="!draft.trim()"
              @click="onSend"
            >
              发送
            </el-button>
          </footer>
        </template>
        <el-empty v-else description="从左侧选择一个会话开始聊天" :image-size="120" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 消息中心
 * - 真实数据：调 /api/conversations/ 与 /api/conversations/{id}/messages/
 * - 点击会话自动 mark-read(仅清空对方发来的未读)
 * - 发送消息调 /api/messages/send/
 */
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { Refresh, Check, View, Promotion } from '@element-plus/icons-vue'
import {
  fetchConversations,
  fetchConversationMessages,
  markConversationRead,
  sendMessage,
  type Conversation,
  type MessageItem,
} from '@/api/message'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const currentUserId = computed(() => userStore.user?.id || 0)

const conversations = ref<Conversation[]>([])
const loading = ref(false)
const active = ref<Conversation | null>(null)
const activeId = ref<number | null>(null)
const messages = ref<MessageItem[]>([])
const msgLoading = ref(false)
const sending = ref(false)
const draft = ref('')
const messageListRef = ref<HTMLUListElement | null>(null)

/** 当前用户相对每个会话的对方 */
function peerOf(c: Conversation) {
  return c.buyer.id === currentUserId.value ? c.seller : c.buyer
}

/** 当前用户在指定会话里的未读数(取 buyer / seller 中属于"对方"的) */
function unreadOf(c: Conversation): number {
  if (c.buyer.id === currentUserId.value) return c.unread_buyer
  return c.unread_seller
}

function formatTime(iso: string) {
  if (!iso) return ''
  const d = dayjs(iso)
  if (dayjs().isSame(d, 'day')) return d.format('HH:mm')
  if (dayjs().isSame(d, 'year')) return d.format('MM-DD')
  return d.format('YYYY-MM-DD')
}

function formatTimeFull(iso: string) {
  if (!iso) return ''
  return dayjs(iso).format('YYYY-MM-DD HH:mm')
}

async function loadConversations() {
  loading.value = true
  try {
    const res = await fetchConversations()
    conversations.value = res.results || []
    // 默认选中第一个会话
    if (conversations.value.length && !activeId.value) {
      selectConversation(conversations.value[0])
    }
  } catch (e) {
    console.error('[Messages] 会话列表加载失败', e)
    ElMessage.error('会话列表加载失败')
  } finally {
    loading.value = false
  }
}

async function loadAll() {
  await loadConversations()
  if (activeId.value) {
    const c = conversations.value.find(x => x.id === activeId.value)
    if (c) await selectConversation(c)
  }
}

async function selectConversation(c: Conversation | null) {
  active.value = c
  activeId.value = c?.id ?? null
  messages.value = []
  if (!c) return
  msgLoading.value = true
  try {
    const res = await fetchConversationMessages(c.id)
    messages.value = (res.results || []).slice().sort((a, b) => a.id - b.id)
    nextTick(() => scrollToBottom())
    if (unreadOf(c) > 0) {
      try {
        await markConversationRead(c.id)
        if (c.buyer.id === currentUserId.value) c.unread_buyer = 0
        else c.unread_seller = 0
      } catch (e) {
        console.warn('[Messages] mark-read 失败', e)
      }
    }
  } catch (e) {
    console.error('[Messages] 消息加载失败', e)
    ElMessage.error('消息加载失败')
  } finally {
    msgLoading.value = false
  }
}

function scrollToBottom() {
  const el = messageListRef.value
  if (el) el.scrollTop = el.scrollHeight
}

async function onSend() {
  if (!active.value) {
    ElMessage.warning('请先选择会话')
    return
  }
  const text = draft.value.trim()
  if (!text) return
  sending.value = true
  try {
    const msg = await sendMessage({ conversation: active.value.id, content: text })
    messages.value.push(msg)
    active.value.last_message = text
    active.value.last_message_at = msg.created_at
    draft.value = ''
    nextTick(() => scrollToBottom())
  } catch (e) {
    console.error('[Messages] 发送失败', e)
    ElMessage.error('发送失败')
  } finally {
    sending.value = false
  }
}

function goProduct() {
  if (!active.value) return
  router.push(`/browse/${active.value.product.id}`)
}

function handleMarkAllRead() {
  const total = conversations.value.reduce((sum, c) => sum + unreadOf(c), 0)
  if (!total) {
    ElMessage.info('没有未读消息')
    return
  }
  conversations.value.forEach((c) => {
    if (unreadOf(c) > 0) {
      markConversationRead(c.id).catch(() => {})
      if (c.buyer.id === currentUserId.value) c.unread_buyer = 0
      else c.unread_seller = 0
    }
  })
  ElMessage.success(`已标记 ${total} 条为已读`)
}

onMounted(loadConversations)
</script>

<style scoped>
.messages-page {
  padding: var(--space-5);
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.header-actions {
  display: flex;
  gap: var(--space-2);
}

/* ========== 整体布局:左右两栏 ========== */
.chat-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--space-4);
  flex: 1;
  min-height: 600px;
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
}

/* ========== 左侧会话列表 ========== */
.chat-aside {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-divider);
  background: var(--color-bg-card);
  min-height: 0;
}
.aside-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-divider);
}
.aside-title {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.conv-list {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
.conv-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-5);
}
.conv-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  border-bottom: 1px solid var(--color-divider);
  transition: background var(--duration-fast) var(--ease-out);
}
.conv-item:hover {
  background: var(--color-bg-hover);
}
.conv-item--active {
  background: var(--color-primary-soft);
}
.conv-info {
  flex: 1;
  min-width: 0;
}
.conv-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.conv-name {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conv-item--unread .conv-name {
  font-weight: var(--font-weight-semibold);
}
.conv-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}
.conv-product {
  font-size: var(--font-size-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
}
.conv-preview {
  font-size: var(--font-size-xs);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== 右侧聊天区 ========== */
.chat-main {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--color-bg-card);
}
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-divider);
}
.peer {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.peer-name {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}
.peer-product {
  font-size: var(--font-size-xs);
}
.message-stream {
  list-style: none;
  margin: 0;
  padding: var(--space-4);
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--color-bg-page);
}
.msg {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
}
.msg--mine {
  flex-direction: row-reverse;
}
.msg-body {
  display: flex;
  flex-direction: column;
  max-width: 65%;
}
.msg--mine .msg-body {
  align-items: flex-end;
}
.msg-bubble {
  padding: 8px 12px;
  border-radius: var(--radius-base);
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  box-shadow: var(--shadow-sm);
  word-break: break-word;
  white-space: pre-wrap;
}
.msg--mine .msg-bubble {
  background: var(--color-primary);
  color: #fff;
}
.msg-time {
  font-size: var(--font-size-xs);
  margin-top: 4px;
}
.chat-input {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3);
  border-top: 1px solid var(--color-divider);
  background: var(--color-bg-card);
}
.chat-input .el-input {
  flex: 1;
}

/* ========== 响应式:窄屏改单列 ========== */
@media (max-width: 900px) {
  .chat-layout {
    grid-template-columns: 1fr;
  }
  .chat-aside {
    display: none;
  }
}
</style>
