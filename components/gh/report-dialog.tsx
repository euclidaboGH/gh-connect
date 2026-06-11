"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/use-t"
import { cn } from "@/lib/utils"

export function ReportDialog({
  open,
  onOpenChange,
  onSubmit,
  name,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: (reason: string) => void
  name: string
}) {
  const { t } = useT()
  const [reason, setReason] = useState("")
  const reasons = [
    { id: "spam", label: t("reasonSpam") },
    { id: "inappropriate", label: t("reasonInappropriate") },
    { id: "fake", label: t("reasonFake") },
    { id: "harassment", label: t("reasonHarassment") },
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>
            {t("reportUser")}: {name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {reasons.map((r) => (
            <button
              key={r.id}
              onClick={() => setReason(r.id)}
              className={cn(
                "w-full rounded-xl border p-3 text-left text-sm",
                reason === r.id ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <Button
          disabled={!reason}
          onClick={() => {
            onSubmit(reason)
            setReason("")
          }}
          className="w-full"
        >
          {t("submit")}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
