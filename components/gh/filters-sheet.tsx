"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { InterestPicker } from "./interest-picker"
import type { Filters, Gender } from "@/lib/types"
import { useT } from "@/lib/use-t"
import { cn } from "@/lib/utils"

const SCOPES: { id: Filters["scope"]; key: string }[] = [
  { id: "global", key: "global" },
  { id: "country", key: "country" },
  { id: "city", key: "city" },
]

export function FiltersSheet({
  open,
  onOpenChange,
  value,
  onApply,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  value: Filters
  onApply: (f: Filters) => void
}) {
  const { t } = useT()
  const [draft, setDraft] = useState<Filters>(value)

  // sync when opened
  const handleOpen = (o: boolean) => {
    if (o) setDraft(value)
    onOpenChange(o)
  }

  const toggleInterest = (i: string) =>
    setDraft((d) => ({
      ...d,
      interests: d.interests.includes(i)
        ? d.interests.filter((x) => x !== i)
        : [...d.interests, i],
    }))

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{t("filters")}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-4">
          <div>
            <p className="mb-2 text-sm font-medium">{t("location")}</p>
            <div className="flex gap-2">
              {SCOPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setDraft((d) => ({ ...d, scope: s.id }))}
                  className={cn(
                    "flex-1 rounded-full border px-3 py-2 text-sm",
                    draft.scope === s.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card",
                  )}
                >
                  {t(s.key)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">{t("ageRange")}</p>
              <span className="text-sm text-muted-foreground">
                {draft.ageMin} – {draft.ageMax}
              </span>
            </div>
            <Slider
              min={18}
              max={80}
              step={1}
              value={[draft.ageMin, draft.ageMax]}
              onValueChange={(v) => setDraft((d) => ({ ...d, ageMin: v[0], ageMax: v[1] }))}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">{t("gender")}</p>
            <select
              value={draft.gender}
              onChange={(e) => setDraft((d) => ({ ...d, gender: e.target.value as Gender }))}
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Anyone</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="nonbinary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("onlineOnly")}</label>
            <Switch
              checked={draft.onlineOnly}
              onCheckedChange={(c) => setDraft((d) => ({ ...d, onlineOnly: c }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("verifiedOnly")}</label>
            <Switch
              checked={draft.verifiedOnly}
              onCheckedChange={(c) => setDraft((d) => ({ ...d, verifiedOnly: c }))}
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-medium">{t("interests")}</p>
            <InterestPicker selected={draft.interests} onToggle={toggleInterest} />
          </div>
        </div>

        <SheetFooter>
          <Button
            onClick={() => {
              onApply(draft)
              onOpenChange(false)
            }}
            className="w-full"
            size="lg"
          >
            {t("apply")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
