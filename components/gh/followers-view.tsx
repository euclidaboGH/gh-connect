"use client"

import { useMemo, useState } from "react"
import { Users, UserPlus, UserCheck } from "lucide-react"
import { Avatar } from "./avatar"
import { VerifiedBadge } from "./verified-badge"
import { useStore } from "@/lib/store"
import { useT } from "@/lib/use-t"
import { getSeedProfiles } from "@/lib/seed-data"
import type { Profile } from "@/lib/types"
import { cn } from "@/lib/utils"

export function FollowersView() {
  const { state, unfollowProfile, followProfile } = useStore()
  const { t } = useT()
  const pool = useMemo(() => getSeedProfiles(), [])
  const [tab, setTab] = useState<"followers" | "following">("followers")

  const followers = useMemo(() => {
    return state.followers
      .map((id) => pool.find((p) => p.id === id))
      .filter(Boolean) as Profile[]
  }, [state.followers, pool])

  const following = useMemo(() => {
    return state.following
      .map((id) => pool.find((p) => p.id === id))
      .filter(Boolean) as Profile[]
  }, [state.following, pool])

  const data = tab === "followers" ? followers : following
  const totalFollowers = followers.length
  const totalFollowing = following.length

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 bg-background/95 px-4 py-4 backdrop-blur border-b border-border">
        <h1 className="text-xl font-bold mb-4">{t("social") || "Social"}</h1>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("followers")}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
              tab === "followers"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Followers ({totalFollowers})
          </button>
          <button
            onClick={() => setTab("following")}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
              tab === "following"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Following ({totalFollowing})
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Users className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="font-semibold">
              {tab === "followers" ? t("noFollowers") || "No followers yet" : t("notFollowing") || "Not following anyone"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === "followers"
                ? "When people follow you, they'll appear here"
                : "Start following people to see them here"}
            </p>
          </div>
        ) : (
          <ul className="space-y-2 pt-2">
            {data.map((profile) => {
              const isFollowing = state.following.includes(profile.id)
              return (
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
                    <button
                      onClick={() => {
                        if (isFollowing) {
                          unfollowProfile(profile.id)
                        } else {
                          followProfile(profile.id, profile.name)
                        }
                      }}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90",
                        isFollowing
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                      title={isFollowing ? "Unfollow" : "Follow"}
                    >
                      {isFollowing ? (
                        <UserCheck className="h-4 w-4" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
