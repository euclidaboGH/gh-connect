"use client"

import { MapPin, Sparkles } from "lucide-react"
import type { Profile } from "@/lib/types"
import { VerifiedBadge } from "./verified-badge"
import { sharedInterests } from "@/lib/matching"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function SwipeCard({
  profile,
  style,
  className,
  onOpen,
}: {
  profile: Profile
  style?: React.CSSProperties
  className?: string
  onOpen?: () => void
}) {
  const { state } = useStore()
  const shared = sharedInterests(state.me, profile)
  const photo = profile.photos[0]
  const showLocation = profile.city || profile.country

  return (
    <button
      type="button"
      onClick={onOpen}
      style={style}
      className={cn(
        "absolute inset-0 overflow-hidden rounded-3xl bg-card text-left shadow-xl shadow-black/10",
        className,
      )}
    >
      <div className="relative h-full w-full">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo || "/placeholder.svg"}
            alt={profile.name}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary text-6xl font-bold text-muted-foreground">
            {profile.name[0]}
          </div>
        )}

        {/* online dot */}
        {profile.online && (
          <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Online
          </span>
        )}

        {!!shared.length && (
          <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-semibold text-primary-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {shared.length} shared
          </span>
        )}

        {/* gradient + info */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 pt-16 text-white">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold">
              {profile.name}, {profile.age}
            </h3>
            {profile.verified && <VerifiedBadge size={20} className="text-white" />}
          </div>
          {showLocation && (
            <p className="mt-1 flex items-center gap-1 text-sm text-white/90">
              <MapPin className="h-3.5 w-3.5" />
              {[profile.city, profile.country].filter(Boolean).join(", ")}
            </p>
          )}
          {profile.bio && (
            <p className="mt-2 line-clamp-2 text-sm text-white/80">{profile.bio}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.interests.slice(0, 4).map((i) => (
              <span
                key={i}
                className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs capitalize backdrop-blur"
              >
                {i}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}
