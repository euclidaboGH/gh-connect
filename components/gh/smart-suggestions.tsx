"use client"

import { useMemo } from "react"
import { Sparkles, TrendingUp, Users } from "lucide-react"
import { Avatar } from "./avatar"
import { useStore } from "@/lib/store"
import { useT } from "@/lib/use-t"
import { getSeedProfiles } from "@/lib/seed-data"
import { matchScore, sharedInterests } from "@/lib/matching"
import { VerifiedBadge } from "./verified-badge"
import { cn } from "@/lib/utils"

interface SuggestionItemProps {
  profileId: string
  reason: string
  icon: React.ReactNode
  onClick: () => void
}

function SuggestionItem({ profileId, reason, icon, onClick }: SuggestionItemProps) {
  const pool = useMemo(() => getSeedProfiles(), [])
  const profile = pool.find((p) => p.id === profileId)

  if (!profile) return null

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left border border-border"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="font-medium truncate">{profile.name}, {profile.age}</p>
          {profile.verified && <VerifiedBadge size={12} />}
        </div>
        <p className="text-xs text-muted-foreground truncate">{reason}</p>
      </div>
      <Avatar name={profile.name} src={profile.photos[0]} size={36} online={profile.online} />
    </button>
  )
}

export function SmartSuggestions({ onViewProfile }: { onViewProfile: (id: string) => void }) {
  const { state } = useStore()
  const { t } = useT()
  const pool = useMemo(() => getSeedProfiles(), [])

  // Generate smart suggestions with reasons
  const suggestions = useMemo(() => {
    const candidates: Array<{
      profileId: string
      reason: string
      icon: React.ReactNode
      score: number
    }> = []

    pool.forEach((p) => {
      if (state.likedIds.includes(p.id)) return
      if (state.passedIds.includes(p.id)) return
      if (state.blocked.includes(p.id)) return

      let addedReason = false

      // High match score
      const score = matchScore(state.me, p)
      if (score > 80) {
        candidates.push({
          profileId: p.id,
          reason: "Perfect match for you",
          icon: <TrendingUp className="h-4 w-4" />,
          score,
        })
        addedReason = true
      }

      // Shared interests
      if (!addedReason) {
        const shared = sharedInterests(state.me, p)
        if (shared.length >= 3) {
          candidates.push({
            profileId: p.id,
            reason: `${shared.length} shared interests`,
            icon: <Sparkles className="h-4 w-4" />,
            score,
          })
          addedReason = true
        }
      }

      // Nearby location
      if (!addedReason && state.me.city && p.city === state.me.city) {
        candidates.push({
          profileId: p.id,
          reason: `In your area`,
          icon: <Users className="h-4 w-4" />,
          score,
        })
      }
    })

    // Sort by score and return top 3
    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }, [pool, state])

  if (suggestions.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 font-semibold text-sm">
        <Sparkles className="h-4 w-4 text-primary" />
        {t("suggestedForYou")}
      </div>
      <div className="space-y-2">
        {suggestions.map(({ profileId, reason, icon }) => (
          <SuggestionItem
            key={profileId}
            profileId={profileId}
            reason={reason}
            icon={icon}
            onClick={() => onViewProfile(profileId)}
          />
        ))}
      </div>
    </div>
  )
}

export function TrendingProfiles({ onViewProfile }: { onViewProfile: (id: string) => void }) {
  const pool = useMemo(() => getSeedProfiles(), [])
  const { t } = useT()

  // Show most verified/popular profiles
  const trending = useMemo(() => {
    return pool
      .filter((p) => p.verified)
      .sort((a, b) => {
        // Sort by online status first, then verified
        if (a.online !== b.online) return a.online ? -1 : 1
        return 0
      })
      .slice(0, 4)
  }, [pool])

  if (trending.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        {t("trendingNow")}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {trending.map((p) => (
          <button
            key={p.id}
            onClick={() => onViewProfile(p.id)}
            className="relative rounded-lg overflow-hidden aspect-square group cursor-pointer"
          >
            <img
              src={p.photos[0] || "/placeholder.svg"}
              alt={p.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
              <p className="text-sm font-semibold truncate">{p.name}</p>
              {p.verified && (
                <div className="flex items-center gap-1 text-xs">
                  <span>✓ Verified</span>
                </div>
              )}
              {p.online && (
                <div className="text-xs text-green-300">● Online</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
