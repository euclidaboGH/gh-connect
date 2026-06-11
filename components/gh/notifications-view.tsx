"use client"

import { useMemo, useState } from "react"
import { Bell, Heart, MessageCircle, UserPlus, X } from "lucide-react"
import { Avatar } from "./avatar"
import { VerifiedBadge } from "./verified-badge"
import { useStore } from "@/lib/store"
import { useT } from "@/lib/use-t"
import { getSeedProfiles } from "@/lib/seed-data"
import type { AppNotification } from "@/lib/types"
import { cn } from "@/lib/utils"

function formatNotificationTime(ts: number): string {
  const d = Date.now() - ts
  const m = Math.floor(d / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  return `${days}d ago`
}

export function NotificationsView({ onGoToChat, onGoToProfile }: { onGoToChat?: (id: string) => void; onGoToProfile?: (id: string) => void }) {
  const { state, markNotificationsRead } = useStore()
  const { t } = useT()
  const pool = useMemo(() => getSeedProfiles(), [])
  const [filter, setFilter] = useState<"all" | "likes" | "matches" | "messages">("all")

  const byId = (id: string) => pool.find((p) => p.id === id)

  const notifications = useMemo(() => {
    let notifs = state.notifications
      .filter((n) => !state.blocked.includes(n.profileId))
      .sort((a, b) => b.ts - a.ts)
    
    if (filter !== "all") {
      notifs = notifs.filter((n) => {
        if (filter === "likes") return n.type === "like"
        if (filter === "matches") return n.type === "match"
        if (filter === "messages") return n.type === "message"
        return true
      })
    }
    
    return notifs
  }, [state.notifications, state.blocked, filter])

  const unreadCount = state.notifications.filter((n) => !n.read).length

  const getNotificationIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />
      case "match":
        return <Heart className="h-4 w-4 text-primary fill-primary" />
      case "message":
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case "request":
        return <UserPlus className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const handleNotificationClick = (notif: AppNotification) => {
    if (notif.type === "message" && onGoToChat) {
      onGoToChat(notif.profileId)
    } else if (onGoToProfile) {
      onGoToProfile(notif.profileId)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 bg-background/95 px-4 py-4 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">{t("notifications")}</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(["all", "likes", "matches", "messages"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {t(f)}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Bell className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="font-semibold">{t("noNotifications")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === "all" ? t("noActivity") : `No ${filter} yet`}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {notifications.map((notif) => {
              const profile = byId(notif.profileId)
              const isRead = notif.read

              return (
                <li key={notif.id}>
                  <button
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg transition-colors",
                      !isRead
                        ? "bg-primary/10 hover:bg-primary/15"
                        : "bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    {profile && (
                      <Avatar name={profile.name} src={profile.photos[0]} size={44} online={profile.online} />
                    )}
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className={cn(
                            "text-sm",
                            !isRead ? "font-semibold" : "font-medium"
                          )}>
                            {profile ? `${profile.name}` : "Someone"}
                            {profile?.verified && <VerifiedBadge size={12} />}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notif.text}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getNotificationIcon(notif.type)}
                          {!isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatNotificationTime(notif.ts)}
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
