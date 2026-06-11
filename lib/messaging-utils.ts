import type { ChatMessage, Conversation } from "./types"

/**
 * Enhanced messaging utilities with modern features:
 * - Optimistic updates
 * - Typing indicators
 * - Message reactions
 * - Edit history
 */

export function createMessage(
  fromMe: boolean,
  text: string,
): ChatMessage {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    fromMe,
    text,
    ts: Date.now(),
    read: fromMe, // own messages always read
    reactions: [],
  }
}

export function updateMessageRead(
  messages: ChatMessage[],
  read: boolean = true,
): ChatMessage[] {
  return messages.map((m) => (m.fromMe ? m : { ...m, read }))
}

export function addReaction(
  message: ChatMessage,
  emoji: string,
): ChatMessage {
  const reactions = [...(message.reactions || [])]
  const existing = reactions.find((r) => r.emoji === emoji)
  if (existing) {
    if (existing.userReacted) {
      // remove reaction
      existing.count--
      existing.userReacted = false
      if (existing.count === 0) {
        return { ...message, reactions: reactions.filter((r) => r.count > 0) }
      }
    } else {
      // add reaction
      existing.count++
      existing.userReacted = true
    }
  } else {
    reactions.push({ emoji, count: 1, userReacted: true })
  }
  return { ...message, reactions }
}

export function editMessage(message: ChatMessage, text: string): ChatMessage {
  return {
    ...message,
    text,
    edited: Date.now(),
  }
}

export function getMessageSummary(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "…"
}

export function formatMessageTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const isToday =
    d.toDateString() === now.toDateString()
  const isYesterday =
    d.toDateString() === new Date(now.getTime() - 86400000).toDateString()

  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  if (isYesterday) {
    return "Yesterday"
  }
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { month: "short", day: "numeric" })
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "2-digit" })
}

export function getUnreadCount(
  conversations: Conversation[],
): number {
  return conversations.reduce((count, conv) => {
    const unread = conv.messages.filter((m) => !m.fromMe && !m.read).length
    return count + unread
  }, 0)
}

export function getConversationPreview(
  conv: Conversation,
  maxLen: number = 50,
): string {
  const last = conv.messages[conv.messages.length - 1]
  if (!last) return "No messages yet"
  return last.fromMe ? `You: ${last.text}` : last.text
}

export function searchMessages(
  messages: ChatMessage[],
  query: string,
): ChatMessage[] {
  const lower = query.toLowerCase()
  return messages.filter((m) => m.text.toLowerCase().includes(lower))
}

export function groupMessagesByDate(
  messages: ChatMessage[],
): Map<string, ChatMessage[]> {
  const grouped = new Map<string, ChatMessage[]>()
  messages.forEach((m) => {
    const date = new Date(m.ts).toDateString()
    if (!grouped.has(date)) {
      grouped.set(date, [])
    }
    grouped.get(date)!.push(m)
  })
  return grouped
}
