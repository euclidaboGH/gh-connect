"use client"

import { Heart, MessageCircle } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Profile } from "@/lib/types"
import { Avatar } from "./avatar"
import { useStore } from "@/lib/store"
import { useT } from "@/lib/use-t"

export function MatchDialog({
  profile,
  onClose,
  onMessage,
}: {
  profile: Profile | null
  onClose: () => void
  onMessage: (p: Profile) => void
}) {
  const { state } = useStore()
  const { t } = useT()
  return (
    <Dialog open={!!profile} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm overflow-hidden rounded-3xl border-none bg-primary p-0 text-primary-foreground">
        {profile && (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <Heart className="mb-3 h-10 w-10 fill-primary-foreground" />
            <h2 className="text-3xl font-bold">{t("itsAMatch")}</h2>
            <p className="mt-2 text-sm text-primary-foreground/80">
              You and {profile.name} liked each other.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <Avatar name={state.me.name} src={state.me.photos[0]} size={72} className="ring-2 ring-primary-foreground" />
              <Avatar name={profile.name} src={profile.photos[0]} size={72} className="ring-2 ring-primary-foreground" />
            </div>
            <div className="mt-8 flex w-full flex-col gap-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => onMessage(profile)}
              >
                <MessageCircle className="mr-1 h-4 w-4" /> {t("sendMessage")}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                onClick={onClose}
              >
                Keep swiping
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
