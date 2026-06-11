"use client"

import { useEffect, useMemo, useRef, useState, useCallback, useTransition } from "react"
import { ChevronLeft, Send, MessageCircle, Search, MoreVertical, Smile, Trash2 } from "lucide-react"
import { Avatar } from "./avatar"
import { VerifiedBadge } from "./verified-badge"
import { useStore } from "@/lib/store"
import { useT } from "@/lib/use-t"
import { getSeedProfiles } from "@/lib/seed-data"
import { createDebouncedAction } from "@/lib/button-utils"
import {
  getMessageSummary,
  formatMessageTime,
  getUnreadCount,
  getConversationPreview,
  groupMessagesByDate,
} from "@/lib/messaging-utils"
import type { Profile, Conversation } from "@/lib/types"
import { cn } from "@/lib/utils"

function timeAgo(ts: number) {
  const d = Date.now() - ts
  const m = Math.floor(d / 60000)
  if (m < 1) return "now"
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function MessagesView({
  activeId,
  onOpenChat,
  onCloseChat,
}: {
  activeId: string | null
  onOpenChat: (id: string) => void
  onCloseChat: () => void
}) {
  const { state, sendMessage, markConversationRead } = useStore()
  const { t } = useT()
  const pool = useMemo(() => getSeedProfiles(), [])
  const byId = (id: string) => pool.find((p) => p.id === id)
  const [searchQuery, setSearchQuery] = useState("")

  // conversations sorted by recent activity, plus connected matches with no msgs
  const connectedIds = state.connections
    .filter((c) => c.state === "connected" || c.state === "match")
    .map((c) => c.profileId)

  const threads = useMemo(() => {
    const ids = new Set<string>([
      ...connectedIds,
      ...state.conversations.map((c) => c.profileId),
    ])
    
    let list = Array.from(ids)
      .filter((id) => !state.blocked.includes(id))
      .map((id) => {
        const conv = state.conversations.find((c) => c.profileId === id)
        const last = conv?.messages[conv.messages.length - 1]
        return { id, last, profile: byId(id), conv }
      })
      .filter((x) => x.profile)
      .sort((a, b) => (b.last?.ts || 0) - (a.last?.ts || 0))

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((x) => 
        x.profile!.name.toLowerCase().includes(q) ||
        (x.last?.text || "").toLowerCase().includes(q)
      )
    }

    return list
  }, [state.conversations, state.connections, state.blocked, searchQuery, connectedIds])

  const unreadCount = useMemo(() => getUnreadCount(state.conversations), [state.conversations])

  if (activeId) {
    const profile = byId(activeId)
    if (profile) return <ChatThread profile={profile} onBack={onCloseChat} />
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 bg-background/95 px-4 py-4 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">{t("messages")}</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("searchMessages") || "Search conversations..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-input bg-background text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <MessageCircle className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="font-semibold">{searchQuery ? t("noResults") : t("noMessages")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery ? "Try a different search" : t("startSwiping")}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {threads.map(({ id, last, profile, conv }) => {
              const unread = !!(last && !last.fromMe && !last.read)
              const isMuted = conv?.metadata.mutedUntil ? conv.metadata.mutedUntil > Date.now() : false
              return (
                <li key={id}>
                  <button
                    onClick={() => onOpenChat(id)}
                    className="flex w-full items-center gap-3 py-3 text-left hover:bg-muted/50 transition-colors rounded-lg px-2 -mx-2"
                  >
                    <div className="relative">
                      <Avatar name={profile!.name} src={profile!.photos[0]} size={52} online={profile!.online} />
                      {unread && <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-background" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="flex items-center gap-1 truncate font-medium">
                          {profile!.name}
                          {profile!.verified && <VerifiedBadge size={14} />}
                        </p>
                        {isMuted && <span className="text-xs text-muted-foreground">🔇</span>}
                        {last && (
                          <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
                            {timeAgo(last.ts)}
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          "truncate text-sm",
                          unread ? "font-semibold text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {last ? getMessageSummary(last.fromMe ? `You: ${last.text}` : last.text) : t("sendMessage")}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function ChatThread({ profile, onBack }: { profile: Profile; onBack: () => void }) {
  const { state, sendMessage, markConversationRead } = useStore()
  const { t } = useT()
  const [text, setText] = useState("")
  const [toast, setToast] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showEmojiMenu, setShowEmojiMenu] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [_isPending, startTransition] = useTransition()

  const conv = state.conversations.find((c) => c.profileId === profile.id)
  const messages = conv?.messages || []
  const metadata = conv?.metadata

  useEffect(() => {
    markConversationRead(profile.id)
  }, [profile.id]) // eslint-disable-line

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const handleSendMessage = useCallback(
    createDebouncedAction(
      () => {
        const t2 = text.trim()
        if (!t2) return
        const res = sendMessage(profile.id, t2)
        if (res.limited) {
          setToast(res.reason || t("rateLimit"))
          setTimeout(() => setToast(""), 2000)
          return
        }
        if (res.ok) {
          setText("")
          inputRef.current?.focus()
        }
      },
      {
        minDuration: 300,
        onError: (err) => {
          console.error("[Send Message] Failed:", err)
          setToast(t("error") || "Failed to send message")
          setTimeout(() => setToast(""), 1800)
        },
      },
    ),
    [text, sendMessage, profile.id, t],
  )

  const addEmoji = (emoji: string) => {
    setText((prev) => prev + emoji)
    setShowEmojiMenu(false)
    inputRef.current?.focus()
  }

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages])

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors" aria-label="Back">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="min-w-0">
            <Avatar name={profile.name} src={profile.photos[0]} size={40} online={profile.online} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate font-semibold">
              {profile.name}
              {profile.verified && <VerifiedBadge size={15} />}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile.online ? t("online") : t("offline")}
            </p>
          </div>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors">
          <MoreVertical className="h-5 w-5" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="py-12 text-center">
            <Avatar name={profile.name} src={profile.photos[0]} size={64} />
            <p className="mt-3 font-semibold">{t("messageStarted")}</p>
            <p className="text-sm text-muted-foreground">{t("sayHi")}</p>
          </div>
        )}

        {/* Grouped by date */}
        {Array.from(groupedMessages.entries()).map(([date, dateMessages]) => (
          <div key={date}>
            <div className="flex justify-center my-3">
              <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {formatMessageTime(dateMessages[0]!.ts)}
              </span>
            </div>
            {dateMessages.map((m) => (
              <div key={m.id} className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}>
                <div className="max-w-xs">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm",
                      m.fromMe
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-secondary text-secondary-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    {m.edited && (
                      <p className="mt-1 text-[10px] opacity-70">(edited)</p>
                    )}
                  </div>
                  <div className={cn(
                    "flex gap-1 mt-1 text-xs",
                    m.fromMe ? "justify-end" : "justify-start"
                  )}>
                    {m.reactions && m.reactions.length > 0 && (
                      m.reactions.map((r) => (
                        <span key={r.emoji} className="px-2 py-1 rounded-full bg-muted flex items-center gap-1 text-xs">
                          {r.emoji} {r.count > 1 && <span className="text-muted-foreground">{r.count}</span>}
                        </span>
                      ))
                    )}
                  </div>
                  <p className={cn(
                    "text-[10px] mt-1",
                    m.fromMe ? "text-primary-foreground/60 text-right" : "text-muted-foreground"
                  )}>
                    {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}

        <div ref={endRef} />
      </div>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none mx-auto mb-2 w-fit rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">
          {toast}
        </div>
      )}

      {/* Input Area */}
      <div className="sticky bottom-0 border-t border-border bg-card px-4 py-3 space-y-2">
        {showEmojiMenu && (
          <div className="flex gap-2 flex-wrap pb-2 border-b border-border">
            {["❤️", "😂", "😍", "🎉", "🔥", "😢", "😡", "👍", "👎"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="text-xl hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isSending) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder={t("typeMessage")}
            disabled={isSending}
            className="h-11 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-primary disabled:opacity-50 resize-none"
          />
          <button
            onClick={() => setShowEmojiMenu(!showEmojiMenu)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-lg hover:bg-muted transition-colors"
            aria-label="Emoji"
          >
            <Smile className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setIsSending(true)
              startTransition(() => {
                handleSendMessage()
                setIsSending(false)
              })
            }}
            disabled={!text.trim() || isSending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            aria-label={t("send")}
          >
            {isSending ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
