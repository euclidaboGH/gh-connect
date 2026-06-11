"use client"

import { Heart, ThumbsDown, UserPlus, UserCheck, Users } from "lucide-react"
import { useStore } from "@/lib/store"
import { useT } from "@/lib/use-t"
import type { Profile } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useState, useCallback } from "react"

interface SocialButtonsProps {
  profile: Profile
  variant?: "compact" | "full"
}

export function SocialButtons({ profile, variant = "full" }: SocialButtonsProps) {
  const { state, likeProfile, dislikeProfile, followProfile, unfollowProfile, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend } = useStore()
  const { t } = useT()
  const [loading, setLoading] = useState<string | null>(null)

  const isLiked = state.likedIds.includes(profile.id)
  const isDisliked = state.dislikedIds.includes(profile.id)
  const isFollowing = state.following.includes(profile.id)
  const isFriend = state.friends.includes(profile.id)
  const hasFriendRequest = state.friendRequests.includes(profile.id)

  const handleLike = useCallback(async () => {
    setLoading("like")
    try {
      likeProfile(profile)
    } finally {
      setLoading(null)
    }
  }, [profile, likeProfile])

  const handleDislike = useCallback(async () => {
    setLoading("dislike")
    try {
      dislikeProfile(profile.id)
    } finally {
      setLoading(null)
    }
  }, [profile.id, dislikeProfile])

  const handleFollow = useCallback(async () => {
    setLoading("follow")
    try {
      if (isFollowing) {
        unfollowProfile(profile.id)
      } else {
        followProfile(profile.id, profile.name)
      }
    } finally {
      setLoading(null)
    }
  }, [profile, isFollowing, followProfile, unfollowProfile])

  const handleFriend = useCallback(async () => {
    setLoading("friend")
    try {
      if (isFriend) {
        removeFriend(profile.id)
      } else if (hasFriendRequest) {
        acceptFriendRequest(profile.id, profile.name)
      } else {
        sendFriendRequest(profile.id, profile.name)
      }
    } finally {
      setLoading(null)
    }
  }, [profile, isFriend, hasFriendRequest, sendFriendRequest, acceptFriendRequest, removeFriend])

  if (variant === "compact") {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleLike}
          disabled={loading !== null || isDisliked}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-90",
            isLiked
              ? "bg-red-500 text-white"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
          title={t("like") || "Like"}
        >
          {loading === "like" ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Heart className={cn("h-5 w-5", isLiked && "fill-white")} />
          )}
        </button>

        <button
          onClick={handleDislike}
          disabled={loading !== null || isLiked}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-90",
            isDisliked
              ? "bg-destructive text-white"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
          title={t("dislike") || "Dislike"}
        >
          {loading === "dislike" ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <ThumbsDown className={cn("h-5 w-5", isDisliked && "fill-white")} />
          )}
        </button>
      </div>
    )
  }

  // Full variant
  return (
    <div className="space-y-3">
      {/* Like/Dislike row */}
      <div className="flex gap-2">
        <button
          onClick={handleLike}
          disabled={loading !== null || isDisliked}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all active:scale-95",
            isLiked
              ? "bg-red-500 text-white"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
          )}
        >
          {loading === "like" ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Heart className={cn("h-5 w-5", isLiked && "fill-white")} />
          )}
          {t("like") || "Like"}
        </button>

        <button
          onClick={handleDislike}
          disabled={loading !== null || isLiked}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all active:scale-95",
            isDisliked
              ? "bg-destructive text-white"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
          )}
        >
          {loading === "dislike" ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <ThumbsDown className={cn("h-5 w-5", isDisliked && "fill-white")} />
          )}
          {t("dislike") || "Dislike"}
        </button>
      </div>

      {/* Follow button */}
      <button
        onClick={handleFollow}
        disabled={loading !== null}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all active:scale-95",
          isFollowing
            ? "bg-primary/10 text-primary border border-primary/20"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {loading === "follow" ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : isFollowing ? (
          <>
            <UserCheck className="h-5 w-5" />
            {t("following") || "Following"}
          </>
        ) : (
          <>
            <UserPlus className="h-5 w-5" />
            {t("follow") || "Follow"}
          </>
        )}
      </button>

      {/* Friend button */}
      <button
        onClick={handleFriend}
        disabled={loading !== null}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all active:scale-95",
          isFriend
            ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
            : hasFriendRequest
              ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
      >
        {loading === "friend" ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : isFriend ? (
          <>
            <Users className="h-5 w-5" />
            {t("friends") || "Friends"}
          </>
        ) : hasFriendRequest ? (
          <>
            <UserCheck className="h-5 w-5" />
            {t("acceptFriend") || "Accept"}
          </>
        ) : (
          <>
            <UserPlus className="h-5 w-5" />
            {t("addFriend") || "Add Friend"}
          </>
        )}
      </button>
    </div>
  )
}
