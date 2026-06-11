"use client"

import { useMemo, useState, useCallback } from "react"
import { Heart, Check, X, MessageCircle, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "./avatar"
import { VerifiedBadge } from "./verified-badge"
import { ProfileDetail } from "./profile-detail"
import { useStore } from "@/lib/store"
import { useT } from "@/lib/use-t"
import { getSeedProfiles } from "@/lib/seed-data"
import { createDebouncedAction } from "@/lib/button-utils"
import type { Profile } from "@/lib/types"

export function MatchesView({ onGoToChat }: { onGoToChat: (id: string) => void }) {
  const { state, acceptRequest, declineRequest } = useStore()
  const { t } = useT()
  const pool = useMemo(() => getSeedProfiles(), [])
  const byId = (id: string) => pool.find((p) => p.id === id)
  const [detail, setDetail] = useState<Profile | null>(null)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const toggleLoading = (id: string, isLoading: boolean) => {
    setLoadingIds((prev) => {
      const next = new Set(prev)
      if (isLoading) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleAccept = useCallback(
    (profileId: string) =>
      createDebouncedAction(
        () => {
          acceptRequest(profileId)
        },
        {
          minDuration: 300,
          onError: (err) => {
            console.error("[Accept Request] Failed:", err)
            toggleLoading(profileId, false)
          },
        },
      )(),
    [acceptRequest],
  )

  const handleDecline = useCallback(
    (profileId: string) =>
      createDebouncedAction(
        () => {
          declineRequest(profileId)
        },
        {
          minDuration: 300,
          onError: (err) => {
            console.error("[Decline Request] Failed:", err)
            toggleLoading(profileId, false)
          },
        },
      )(),
    [declineRequest],
  )

  // "Likes you" = profiles in state.likesMe not yet acted on
  const likesYou = state.likesMe
    .map(byId)
    .filter((p): p is Profile => !!p && !state.blocked.includes(p.id))
    .filter((p) => !state.connections.some((c) => c.profileId === p.id))

  const pendingRequests = state.connections
    .filter((c) => c.state === "friend_request" || c.state === "connection_invite")
    .map((c) => ({ c, p: byId(c.profileId) }))
    .filter((x) => x.p)

  const connected = state.connections
    .filter((c) => c.state === "connected" || c.state === "match")
    .map((c) => byId(c.profileId))
    .filter((p): p is Profile => !!p)

  const empty = likesYou.length === 0 && pendingRequests.length === 0 && connected.length === 0

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 bg-background/95 px-4 py-4 backdrop-blur">
        <h1 className="text-xl font-bold">{t("matches")}</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {empty && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Heart className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="font-semibold">{t("noMatches")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("startSwiping")}</p>
          </div>
        )}

        {/* Likes You */}
        {likesYou.length > 0 && (
          <section className="pt-4">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
              <Heart className="h-4 w-4 text-primary" /> {t("likesYou")}
              <span className="rounded-full bg-primary/15 px-2 text-xs text-primary">
                {likesYou.length}
              </span>
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {likesYou.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDetail(p)}
                  className="relative aspect-3/4 overflow-hidden rounded-2xl"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.photos[0] || "/placeholder.svg"}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left">
                    <p className="truncate text-xs font-semibold text-white">{p.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Pending requests */}
        {pendingRequests.length > 0 && (
          <section className="pt-6">
            <h2 className="mb-3 text-sm font-semibold">
              {t("friendRequest")} / {t("connectionInvite")}
            </h2>
            <div className="space-y-2">
              {pendingRequests.map(({ c, p }) => (
                <div
                  key={c.profileId}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                >
                  <Avatar name={p!.name} src={p!.photos[0]} size={48} online={p!.online} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate font-medium">
                      {p!.name}
                      {p!.verified && <VerifiedBadge size={14} />}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.state === "connection_invite" ? t("connectionInvite") : t("friendRequest")}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      toggleLoading(c.profileId, true)
                      handleDecline(c.profileId)
                    }}
                    disabled={loadingIds.has(c.profileId)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-destructive disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    aria-label={t("decline")}
                  >
                    {loadingIds.has(c.profileId) ? (
                      <div className="h-4 w-4 animate-spin rounded-full border border-destructive border-t-transparent" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      toggleLoading(c.profileId, true)
                      handleAccept(c.profileId)
                    }}
                    disabled={loadingIds.has(c.profileId)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    aria-label={t("accept")}
                  >
                    {loadingIds.has(c.profileId) ? (
                      <div className="h-4 w-4 animate-spin rounded-full border border-primary-foreground border-t-transparent" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Connected matches */}
        {connected.length > 0 && (
          <section className="pt-6">
            <h2 className="mb-3 text-sm font-semibold">{t("yourMatches")}</h2>
            <div className="space-y-2">
              {connected.map((p) => {
                const conn = state.connections.find((c) => c.profileId === p.id)
                const canChat = conn?.state === "connected" || conn?.state === "match"
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                  >
                    <button onClick={() => setDetail(p)}>
                      <Avatar name={p.name} src={p.photos[0]} size={48} online={p.online} />
                    </button>
                    <button onClick={() => setDetail(p)} className="min-w-0 flex-1 text-left">
                      <p className="flex items-center gap-1 truncate font-medium">
                        {p.name}
                        {p.verified && <VerifiedBadge size={14} />}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.city || p.country}
                      </p>
                    </button>
                    {canChat ? (
                      <Button size="sm" onClick={() => onGoToChat(p.id)}>
                        <MessageCircle className="mr-1 h-4 w-4" /> {t("startChat")}
                      </Button>
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      <ProfileDetail profile={detail} onClose={() => setDetail(null)} />
    </div>
  )
}
