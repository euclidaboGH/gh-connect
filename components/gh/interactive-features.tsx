"use client"

import { useState } from "react"
import { Heart, MessageCircle, Share2, Check, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { useT } from "@/lib/use-t"
import type { Profile, ConnectionRecord } from "@/lib/types"
import { cn } from "@/lib/utils"

export function InteractionCard({ profile, onMessage }: { profile: Profile; onMessage: (p: Profile) => void }) {
  const { state, likeProfile } = useStore()
  const { t } = useT()
  const [animating, setAnimating] = useState(false)

  const isLiked = state.likedIds.includes(profile.id)
  const hasMatched = state.connections.some((c) => c.profileId === profile.id && c.state === "connected")

  const handleLike = () => {
    setAnimating(true)
    const res = likeProfile(profile)
    setTimeout(() => setAnimating(false), 600)
    if (res.matched) {
      // Match feedback
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border">
        <img
          src={profile.photos[0] || "/placeholder.svg"}
          alt={profile.name}
          className="w-full aspect-square object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4 text-white">
          <div>
            <h3 className="text-lg font-semibold">
              {profile.name}, {profile.age}
            </h3>
            <p className="text-sm text-white/80">{profile.city}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleLike}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 h-12 rounded-lg font-medium transition-all",
            isLiked
              ? "bg-primary text-primary-foreground"
              : "bg-primary/20 text-primary hover:bg-primary/30",
            animating && "scale-95"
          )}
        >
          <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
          {isLiked ? t("liked") : t("like")}
        </button>

        <button
          onClick={() => onMessage(profile)}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-lg font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          {t("message")}
        </button>

        <button className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors">
          <Share2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export function ConnectionRequest({ connection, profile }: { connection: ConnectionRecord; profile?: Profile }) {
  const { state, acceptRequest, declineRequest } = useStore()
  const { t } = useT()

  const statusText = {
    match: "Matched!",
    friend_request: "Wants to be friends",
    connection_invite: "Wants to network",
    connected: "Connected",
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{profile?.name || "User"}</p>
        <p className="text-sm text-muted-foreground">{statusText[connection.state]}</p>
      </div>

      {connection.state !== "connected" && (
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => acceptRequest(connection.profileId)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            aria-label="Accept"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => declineRequest(connection.profileId)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            aria-label="Decline"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export function LikeButton({
  profile,
  size = "md",
  showText = true,
}: {
  profile: Profile
  size?: "sm" | "md" | "lg"
  showText?: boolean
}) {
  const { state, likeProfile } = useStore()
  const { t } = useT()
  const [animating, setAnimating] = useState(false)

  const isLiked = state.likedIds.includes(profile.id)

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const handleClick = () => {
    setAnimating(true)
    likeProfile(profile)
    setTimeout(() => setAnimating(false), 600)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center rounded-full transition-all gap-1.5 font-medium",
        sizeClasses[size],
        isLiked
          ? "bg-primary text-primary-foreground"
          : "bg-primary/20 text-primary hover:bg-primary/30",
        animating && "scale-75",
        showText && size !== "sm" && "w-auto px-3"
      )}
      aria-label="Like"
    >
      <Heart className={cn(iconSizes[size], isLiked && "fill-current")} />
      {showText && size !== "sm" && (isLiked ? t("liked") : t("like"))}
    </button>
  )
}
