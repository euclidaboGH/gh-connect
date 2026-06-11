"use client"

import { Compass, Heart, MessageCircle, Bell, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/use-t"

export type Tab = "discovery" | "matches" | "messages" | "notifications" | "profile"

const TABS: { id: Tab; icon: typeof Compass; key: string }[] = [
  { id: "discovery", icon: Compass, key: "discovery" },
  { id: "matches", icon: Heart, key: "matches" },
  { id: "messages", icon: MessageCircle, key: "messages" },
  { id: "notifications", icon: Bell, key: "notifications" },
  { id: "profile", icon: User, key: "profile" },
]

export function BottomNav({
  active,
  onChange,
  badges,
}: {
  active: Tab
  onChange: (t: Tab) => void
  badges: Partial<Record<Tab, number>>
}) {
  const { t } = useT()
  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          const badge = badges[tab.id]
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
              aria-label={t(tab.key)}
              aria-current={isActive}
            >
              <span className="relative">
                <tab.icon className={cn("h-6 w-6", isActive && "fill-primary/15")} />
                {!!badge && badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              {t(tab.key)}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
