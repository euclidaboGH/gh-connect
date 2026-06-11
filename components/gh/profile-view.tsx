"use client"

import { useMemo, useState, useCallback } from "react"
import {
  Pencil,
  Moon,
  Sun,
  Globe,
  Shield,
  Ban,
  BadgeCheck,
  Crown,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Zap,
  MapPin,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Avatar } from "./avatar"
import { VerifiedBadge } from "./verified-badge"
import { ModeSwitcher } from "./mode-switcher"
import { PhotoUploader } from "./photo-uploader"
import { InterestPicker } from "./interest-picker"
import { FriendsView } from "./friends-view"
import { FollowersView } from "./followers-view"
import { useStore } from "@/lib/store"
import { useT } from "@/lib/use-t"
import { LANGUAGES } from "@/lib/i18n"
import { getSeedProfiles } from "@/lib/seed-data"
import { createDebouncedAction } from "@/lib/button-utils"
import type { Gender, Profile } from "@/lib/types"
import { cn } from "@/lib/utils"

const PREMIUM = [
  { icon: TrendingUp, key: "profileBoost" },
  { icon: Sparkles, key: "enhancedVisibility" },
  { icon: Zap, key: "priorityMatching" },
]

export function ProfileView() {
  const { state, updateProfile, setMode, setTheme, setLanguage, togglePrivacy, unblockUser } =
    useStore()
  const { t } = useT()
  const me = state.me
  const pool = useMemo(() => getSeedProfiles(), [])

  const [editOpen, setEditOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [blockedOpen, setBlockedOpen] = useState(false)
  const [section, setSection] = useState<"profile" | "friends" | "followers">("profile")

  const blockedProfiles = state.blocked
    .map((id) => pool.find((p) => p.id === id))
    .filter(Boolean) as Profile[]

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 bg-background/95 px-4 py-4 backdrop-blur border-b border-border">
        <h1 className="text-xl font-bold">{t("profile")}</h1>

        {/* Section tabs */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setSection("profile")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              section === "profile"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {t("profile") || "Profile"}
          </button>
          <button
            onClick={() => setSection("friends")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1",
              section === "friends"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Friends ({state.friends.length})
          </button>
          <button
            onClick={() => setSection("followers")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1",
              section === "followers"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <Users className="h-4 w-4" />
            ({state.followers.length + state.following.length})
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {section === "profile" && (
          <div className="px-4 pb-6">
            {/* Profile card */}
        <section className="mt-2 rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <Avatar name={me.name || "?"} src={me.photos[0]} size={72} online />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-lg font-bold">
                {me.name || "Your name"}
                {me.age ? `, ${me.age}` : ""}
                {me.verified && <VerifiedBadge size={18} />}
              </p>
              {(me.city || me.country) && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {[me.city, me.country].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
            <Button variant="outline" size="icon" className="rounded-full bg-transparent" onClick={() => setEditOpen(true)} aria-label={t("editProfile")}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          {me.bio && <p className="mt-4 text-sm leading-relaxed">{me.bio}</p>}
          {me.interests.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {me.interests.map((i) => (
                <span key={i} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs capitalize">
                  {i}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-medium">{t("verifiedProfile")}</span>
            <Switch checked={me.verified} onCheckedChange={(c) => updateProfile({ verified: c })} />
          </div>
        </section>
          </div>
        )}

        {section === "friends" && <FriendsView onMessageClick={() => {}} />}

        {section === "followers" && <FollowersView />}
      </div>

      <EditProfileSheet open={editOpen} onOpenChange={setEditOpen} />

      {/* Language sheet */}
      <Sheet open={langOpen} onOpenChange={setLangOpen}>
        <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>{t("language")}</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 px-4 pb-6">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLanguage(l.code)
                  setLangOpen(false)
                }}
                className={cn(
                  "rounded-xl border p-3 text-sm",
                  state.language === l.code
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Blocked users sheet */}
      <Sheet open={blockedOpen} onOpenChange={setBlockedOpen}>
        <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>{t("blockedUsers")}</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 px-4 pb-6">
            {blockedProfiles.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">—</p>
            ) : (
              blockedProfiles.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                  <Avatar name={p.name} src={p.photos[0]} size={44} />
                  <span className="flex-1 font-medium">{p.name}</span>
                  <Button size="sm" variant="outline" className="bg-transparent" onClick={() => unblockUser(p.id)}>
                    {t("unblock")}
                  </Button>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon?: typeof Moon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      <span className="flex-1 text-sm font-medium">{label}</span>
      {children}
    </div>
  )
}

function EditProfileSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { state, updateProfile } = useStore()
  const { t } = useT()
  const me = state.me

  const [name, setName] = useState(me.name)
  const [age, setAge] = useState(String(me.age))
  const [gender, setGender] = useState<Gender>(me.gender)
  const [city, setCity] = useState(me.city)
  const [country, setCountry] = useState(me.country)
  const [bio, setBio] = useState(me.bio)
  const [interests, setInterests] = useState<string[]>(me.interests)
  const [photos, setPhotos] = useState<string[]>(me.photos)
  const [isSaving, setIsSaving] = useState(false)

  // reset drafts when (re)opened
  const handleOpen = (o: boolean) => {
    if (o) {
      setName(me.name)
      setAge(String(me.age))
      setGender(me.gender)
      setCity(me.city)
      setCountry(me.country)
      setBio(me.bio)
      setInterests(me.interests)
      setPhotos(me.photos)
    }
    onOpenChange(o)
  }

  const toggleInterest = (i: string) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))

  const handleSave = useCallback(
    createDebouncedAction(
      () => {
        updateProfile({
          name: name.trim(),
          age: Number(age) || me.age,
          gender,
          city: city.trim(),
          country: country.trim(),
          bio: bio.trim(),
          interests,
          photos,
        })
        onOpenChange(false)
      },
      {
        minDuration: 300,
        onError: (err) => {
          console.error("[Save Profile] Failed:", err)
        },
      },
    ),
    [name, age, gender, city, country, bio, interests, photos, me.age, updateProfile, onOpenChange],
  )

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{t("editProfile")}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-4">
          <PhotoUploader photos={photos} onChange={setPhotos} label={t("photos")} />
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t("displayName")}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("age")}</label>
              <Input type="number" min={18} value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("gender")}</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">—</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="nonbinary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">City</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Country</label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t("bio")}</label>
            <Textarea value={bio} maxLength={500} rows={3} onChange={(e) => setBio(e.target.value)} />
            <p className="mt-1 text-right text-xs text-muted-foreground">{bio.length}/500</p>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{t("interests")}</p>
            <InterestPicker selected={interests} onToggle={toggleInterest} />
          </div>
        </div>
        <SheetFooter>
          <Button onClick={() => {
            setIsSaving(true)
            handleSave()
            setIsSaving(false)
          }} className="w-full" size="lg" disabled={!name.trim() || isSaving}>
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" />
            ) : null}
            {t("save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
