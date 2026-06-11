"use client"

import { INTEREST_CATEGORIES } from "@/lib/seed-data"
import { cn } from "@/lib/utils"

export function InterestPicker({
  selected,
  onToggle,
  compact = false,
}: {
  selected: string[]
  onToggle: (interest: string) => void
  compact?: boolean
}) {
  return (
    <div className="space-y-4">
      {INTEREST_CATEGORIES.map((cat) => (
        <div key={cat.label}>
          {!compact && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {cat.label}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {cat.items.map((item) => {
              const active = selected.includes(item)
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onToggle(item)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm capitalize transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/50",
                  )}
                >
                  {item}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
