"use client"

import { useState, useCallback } from "react"
import { Heart, Users, Briefcase, Globe, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/lib/store"
import { useT } from "@/lib/use-t"
import { PhotoUploader } from "./photo-uploader"
import { InterestPicker } from "./interest-picker"
import { createDebouncedAction } from "@/lib/button-utils"
import type { Gender, Mode, Profile } from "@/lib/types"
import { cn } from "@/lib/utils"

const MODE_META: { id: Mode; icon: typeof Heart; key: string; desc: string }[] = [
  { id: "friendships", icon: Users, key: "friendships", desc: "Meet new friends" },
  { id: "dating", icon: Heart, key: "dating", desc: "Find romance" },
  { id: "networking", icon: Briefcase, key: "networking", desc: "Grow professionally" },
]

export function Onboarding() {
  const { completeOnboarding } = useStore()
  const { t } = useT()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [name, setName] = useState("")
  const [age, setAge] = useState("25")
  const [gender, setGender] = useState<Gender>("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [bio, setBio] = useState("")
  const [interests, setInterests] = useState<string[]>([])
  const [mode, setMode] = useState<Mode>("dating")
  const [photos, setPhotos] = useState<string[]>([])

  const toggleInterest = (i: string) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))

  const canContinue = () => {
    if (step === 1) return name.trim().length > 0 && Number(age) >= 18
    return true
  }

  const handleFinish = useCallback(
    createDebouncedAction(
      () => {
        const me: Profile = {
          id: "me",
          name: name.trim(),
          age: Number(age) || 18,
          gender,
          city: city.trim(),
          country: country.trim(),
          bio: bio.trim(),
          interests,
          mode,
          photos,
          verified: false,
          online: true,
        }
        completeOnboarding(me)
      },
      {
        minDuration: 300,
        onError: (err) => {
          console.error("[Onboarding Finish] Failed:", err)
          setIsSubmitting(false)
        },
      },
    ),
    [name, age, gender, city, country, bio, interests, mode, photos, completeOnboarding],
  )

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
      {step === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Globe className="h-10 w-10" />
          </div>
          <h1 className="text-balance text-3xl font-bold">{t("welcome")}</h1>
          <p className="mt-3 text-pretty text-muted-foreground">{t("welcomeSub")}</p>
          <div className="mt-8 grid w-full grid-cols-3 gap-3">
            {MODE_META.map((m) => (
              <div key={m.id} className="rounded-2xl border border-border bg-card p-4">
                <m.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
                <p className="text-sm font-medium">{t(m.key)}</p>
              </div>
            ))}
          </div>
          <Button className="mt-10 w-full" size="lg" onClick={() => setStep(1)}>
            {t("getStarted")} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col">
          <h2 className="text-2xl font-bold">{t("createProfile")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("welcomeSub")}</p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("displayName")}</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t("age")}</label>
                <Input
                  type="number"
                  min={18}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
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
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Country</label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("bio")}</label>
              <Textarea
                value={bio}
                maxLength={500}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                rows={3}
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">{bio.length}/500</p>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col">
          <h2 className="text-2xl font-bold">{t("primaryMode")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("modeHint")}</p>
          <div className="mt-6 space-y-3">
            {MODE_META.map((m) => {
              const active = mode === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors",
                    active ? "border-primary bg-primary/5" : "border-border bg-card",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
                    )}
                  >
                    <m.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{t(m.key)}</p>
                    <p className="text-sm text-muted-foreground">{m.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mt-6">
            <p className="mb-3 text-sm font-medium">{t("interests")}</p>
            <InterestPicker selected={interests} onToggle={toggleInterest} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-1 flex-col">
          <h2 className="text-2xl font-bold">{t("photos")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add up to 6 photos for your profile.</p>
          <div className="mt-6">
            <PhotoUploader photos={photos} onChange={setPhotos} label={t("photos")} />
          </div>
        </div>
      )}

      {step > 0 && (
        <div className="mt-8 flex gap-3">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
          {step < 3 ? (
            <Button className="flex-1" disabled={!canContinue()} onClick={() => setStep((s) => s + 1)}>
              {t("next")}
            </Button>
          ) : (
            <Button 
              className="flex-1" 
              onClick={() => {
                setIsSubmitting(true)
                handleFinish()
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" />
              ) : null}
              {t("createProfile")}
            </Button>
          )}
        </div>
      )}

      {step > 0 && (
        <div className="mt-6 flex justify-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all",
                s === step ? "w-6 bg-primary" : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
