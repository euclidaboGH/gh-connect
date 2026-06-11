"use client"

import { useMemo, useState, useCallback } from "react"
import { Heart, X, SlidersHorizontal, Sparkles, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeSwitcher } from "./mode-switcher"
import { SwipeCard } from "./swipe-card"
import { FiltersSheet } from "./filters-sheet"
import { MatchDialog } from "./match-dialog"
import { ProfileDetail } from "./profile-detail"
import { Avatar } from "./avatar"
import { useStore } from "@/lib/store"
import { useT } from "@/lib/use-t"
import { getSeedProfiles } from "@/lib/seed-data"
import { discoverProfiles, dailySuggestions } from "@/lib/matching"
import { createDebouncedAction } from "@/lib/button-utils"
import type { Profile } from "@/lib/types"

export function DiscoveryView({ onGoToChat }: { onGoToChat: (id: string) => void }) {
  const { state, setMode, setFilters, likeProfile, passProfile } = useStore()
  const { t } = useT()
  const pool = useMemo(() => getSeedProfiles(), [])

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [matched, setMatched] = useState<Profile | null>(null)
  const [detail, setDetail] = useState<Profile | null>(null)
  const [toast, setToast] = useState<string>("")
  const [suggestSeed, setSuggestSeed] = useState(0)
  const [animClass, setAnimClass] = useState("")
  const [likeLoading, setLikeLoading] = useState(false)
  const [passLoading, setPassLoading] = useState(false)

  const deck = useMemo(
    () => discoverProfiles(pool, state),
    [pool, state],
  )
  const suggestions = useMemo(
    () => dailySuggestions(pool, state, suggestSeed),
    [pool, state, suggestSeed],
  )

  const top = deck[0]

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 1800)
  }

  const handleLike = useCallback(
    createDebouncedAction(
      (p: Profile) => {
        setAnimClass("animate-out fade-out slide-out-to-right-32 duration-200")
        const res = likeProfile(p)
        setTimeout(() => setAnimClass(""), 220)
        if (res.limited) {
          flash(t("rateLimit"))
          return
        }
        if (res.matched) {
          setMatched(p)
          flash(`You matched with ${p.name}! 🎉`)
        } else {
          flash(t("liked") || "Liked!")
        }
      },
      {
        minDuration: 400,
        onError: () => {
          flash(t("error") || "Something went wrong")
          setAnimClass("")
        },
      },
    ),
    [likeProfile, t],
  )

  const handlePass = useCallback(
    createDebouncedAction(
      (p: Profile) => {
        setAnimClass("animate-out fade-out slide-out-to-left-32 duration-200")
        passProfile(p.id)
        setTimeout(() => setAnimClass(""), 220)
      },
      {
        minDuration: 400,
        onError: () => {
          flash(t("error") || "Something went wrong")
          setAnimClass("")
        },
      },
    ),
    [passProfile, t],
  )

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 bg-background/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">{t("appName")}</h1>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-transparent"
            onClick={() => setFiltersOpen(true)}
            aria-label={t("filters")}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
        </div>
        <ModeSwitcher mode={state.mode} onChange={setMode} />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Daily suggestions */}
        {suggestions.length > 0 && (
          <section className="py-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                {t("dailySuggestions")}
              </h2>
              <button
                onClick={() => setSuggestSeed((s) => s + 1)}
                className="flex items-center gap-1 text-xs font-medium text-primary"
              >
                <RotateCcw className="h-3.5 w-3.5" /> {t("refresh")}
              </button>
            </div>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDetail(p)}
                  className="flex w-20 shrink-0 flex-col items-center gap-1"
                >
                  <Avatar name={p.name} src={p.photos[0]} size={64} online={p.online} />
                  <span className="truncate text-xs font-medium">{p.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Swipe deck */}
        <div className="relative mx-auto aspect-3/4 w-full max-w-sm">
          {deck.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-border p-6 text-center">
              <Heart className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">{t("noMoreProfiles")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("adjustFilters")}</p>
              <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setFiltersOpen(true)}>
                {t("filters")}
              </Button>
            </div>
          ) : (
            <>
              {deck[2] && (
                <SwipeCard
                  profile={deck[2]}
                  style={{ transform: "scale(0.9) translateY(16px)", opacity: 0.5 }}
                />
              )}
              {deck[1] && (
                <SwipeCard
                  profile={deck[1]}
                  style={{ transform: "scale(0.95) translateY(8px)", opacity: 0.8 }}
                />
              )}
              {top && (
                <SwipeCard
                  profile={top}
                  className={animClass}
                  onOpen={() => setDetail(top)}
                />
              )}
            </>
          )}
        </div>

        {/* Action buttons */}
        {top && (
          <div className="mt-6 flex items-center justify-center gap-6">
            <button
              onClick={() => handlePass(top)}
              disabled={passLoading}
              className="group flex h-16 w-16 items-center justify-center rounded-full border border-destructive/50 bg-destructive/10 text-destructive shadow-md hover:shadow-lg hover:bg-destructive/20 transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t("pass")}
            >
              {passLoading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
              ) : (
                <X className="h-7 w-7 group-hover:scale-110 transition-transform" />
              )}
            </button>
            <button
              onClick={() => handleLike(top)}
              disabled={likeLoading}
              className="group flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 hover:shadow-primary/60 hover:scale-105 transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t("like")}
            >
              {likeLoading ? (
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Heart className="h-9 w-9 fill-primary-foreground group-hover:scale-110 transition-transform" />
              )}
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">
          {toast}
        </div>
      )}

      <FiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={state.filters}
        onApply={setFilters}
      />
      <MatchDialog
        profile={matched}
        onClose={() => setMatched(null)}
        onMessage={(p) => {
          setMatched(null)
          onGoToChat(p.id)
        }}
      />
      <ProfileDetail profile={detail} onClose={() => setDetail(null)} />
    </div>
  )
}
