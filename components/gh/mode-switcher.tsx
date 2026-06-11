"use client"

import { Heart, Users, Briefcase } from "lucide-react"
import type { Mode } from "@/lib/types"
import { useT } from "@/lib/use-t"
import { cn } from "@/lib/utils"

const ITEMS: { id: Mode; icon: typeof Heart; key: string }[] = [
  { id: "friendships", icon: Users, key: "friendships" },
  { id: "dating", icon: Heart, key: "dating" },
  { id: "networking", icon: Briefcase, key: "networking" },
]

export function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: Mode
  onChange: (m: Mode) => void
}) {
  const { t } = useT()
  return (
    <div className="flex gap-1 rounded-full bg-secondary p-1">
      {ITEMS.map((item) => {
        const active = mode === item.id
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-xs font-medium transition-colors",
              active
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{t(item.key)}</span>
          </button>
        )
      })}
    </div>
  )
}
