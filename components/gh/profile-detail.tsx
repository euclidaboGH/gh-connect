"use client"

import { useState, useCallback } from "react"
import { MapPin, Ban, Flag, X, Briefcase } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import type { Profile } from "@/lib/types"
import { VerifiedBadge } from "./verified-badge"
import { ReportDialog } from "./report-dialog"
import { SocialButtons } from "./social-buttons"
import { useStore } from "@/lib/store"
import { useT } from "@/lib/use-t"
import { sharedInterests } from "@/lib/matching"
import { createDebouncedAction } from "@/lib/button-utils"
import { cn } from "@/lib/utils"

export function ProfileDetail({
  profile,
  onClose,
}: {
  profile: Profile | null
  onClose: () => void
}) {
  const { state, blockUser } = useStore()
  const { t } = useT()
  const [reportOpen, setReportOpen] = useState(false)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [blockLoading, setBlockLoading] = useState(false)

  const handleBlock = useCallback(
    createDebouncedAction(
      (profileId: string) => {
        blockUser(profileId)
        onClose()
      },
      {
        minDuration: 300,
        onError: (err) => {
          console.error("[Block User] Failed:", err)
          setBlockLoading(false)
        },
      },
    ),
    [blockUser, onClose],
  )

  if (!profile) return null
  const shared = sharedInterests(state.me, profile)
  const photos = profile.photos.length ? profile.photos : []

  return (
    <Sheet open={!!profile} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-3xl p-0">
        <div className="relative">
          <div className="relative aspect-3/4 w-full overflow-hidden bg-secondary">
            {photos.length ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photos[photoIdx] || "/placeholder.svg"}
                alt={profile.name}
                className="h-full w-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl font-bold text-muted-foreground">
                {profile.name[0]}
              </div>
            )}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            {photos.length > 1 && (
              <div className="absolute left-4 right-4 top-3 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIdx(i)}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i === photoIdx ? "bg-white" : "bg-white/40",
                    )}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 p-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">
                  {profile.name}, {profile.age}
                </h2>
                {profile.verified && <VerifiedBadge size={20} />}
                {profile.online && <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />}
              </div>
              {(profile.city || profile.country) && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {[profile.city, profile.country].filter(Boolean).join(", ")}
                </p>
              )}
              {profile.industry && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  {profile.industry}
                </p>
              )}
            </div>

            {profile.bio && <p className="text-sm leading-relaxed">{profile.bio}</p>}

            <div>
              <p className="mb-2 text-sm font-semibold">{t("interests")}</p>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "rounded-full px-3 py-1 text-sm capitalize",
                      shared.includes(i)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <SocialButtons profile={profile} variant="full" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 bg-transparent text-destructive"
                onClick={() => setReportOpen(true)}
              >
                <Flag className="mr-1 h-4 w-4" /> {t("report")}
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-transparent text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  setBlockLoading(true)
                  handleBlock(profile.id)
                }}
                disabled={blockLoading}
              >
                {blockLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent mr-1" />
                ) : (
                  <Ban className="mr-1 h-4 w-4" />
                )}
                {t("block")}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        name={profile.name}
        onSubmit={() => {
          setReportOpen(false)
          onClose()
        }}
      />
    </Sheet>
  )
}
