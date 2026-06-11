"use client"

import { useMemo, useState } from "react"
import { Users, MessageSquare, Trash2, UserPlus, UserCheck } from "lucide-react"
import { Avatar } from "./avatar"
import { VerifiedBadge } from "./verified-badge"
import { useStore } from "@/lib/store"
import { useT } from "@/lib/use-t"
import { getSeedProfiles } from "@/lib/seed-data"
import type { Profile } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function FriendsView({ onMessageClick }: { onMessageClick?: (id: string) => void }) {
  const { state, removeFriend, declineFriendRequest, acceptFriendRequest } = useStore()
  const { t } = useT()
  const pool = useMemo(() => getSeedProfiles(), [])
  const [tab, setTab] = useState<"friends" | "requests">("friends")

  const friends = useMemo(() => {
    return state.friends
      .map((id) => pool.find((p) => p.id === id))
      .filter(Boolean) as Profile[]
  }, [state.friends, pool])

  const requests = useMemo(() => {
    return state.friendRequests
      .map((id) => pool.find((p) => p.id === id))
      .filter(Boolean) as Profile[]
  }, [state.friendRequests, pool])

  const data = tab === "friends" ? friends : requests
  const friendCount = friends.length
  const requestCount = requests.length

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 bg-background/95 px-4 py-4 backdrop-blur border-b border-border">
        <h1 className="text-xl font-bold mb-4">{t("friends") || "Friends"}</h1>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("friends")}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
              tab === "friends"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Friends ({friendCount})
          </button>
          <button
            onClick={() => setTab("requests")}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg font-medium transition-colors relative",
              tab === "requests"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Requests ({requestCount})
            {requestCount > 0 && (
              <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {requestCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Users className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="font-semibold">
              {tab === "friends" ? t("noFriends") || "No friends yet" : t("noRequests") || "No requests"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === "friends"
                ? "Add friends to get started"
                : "You don't have any pending friend requests"}
            </p>
          </div>
        ) : tab === "friends" ? (
          <ul className="space-y-2 pt-2">
            {data.map((profile) => (
              <li key={profile.id}>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <Avatar name={profile.name} src={profile.photos[0]} size={44} online={profile.online} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold">{profile.name}</p>
                      {profile.verified && <VerifiedBadge size={14} />}
                    </div>
                    {profile.interests.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {profile.interests.slice(0, 2).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onMessageClick?.(profile.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all active:scale-90"
                      title={t("message") || "Message"}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeFriend(profile.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all active:scale-90"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          // Friend requests tab
          <ul className="space-y-2 pt-2">
            {data.map((profile) => (
              <li key={profile.id}>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <Avatar name={profile.name} src={profile.photos[0]} size={44} online={profile.online} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold">{profile.name}</p>
                      {profile.verified && <VerifiedBadge size={14} />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("wantsToBeFriends") || "wants to be friends"}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => acceptFriendRequest(profile.id, profile.name)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-all active:scale-90"
                      title="Accept"
                    >
                      <UserCheck className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => declineFriendRequest(profile.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all active:scale-90"
                      title="Decline"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
