"use client"

import { useRef } from "react"
import { ImagePlus, X } from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_PHOTOS = 6

export function PhotoUploader({
  photos,
  onChange,
  label = "Photos",
}: {
  photos: string[]
  onChange: (photos: string[]) => void
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const remaining = MAX_PHOTOS - photos.length
    const toRead = Array.from(files).slice(0, remaining)
    let added: string[] = []
    let pending = toRead.length
    if (pending === 0) return
    toRead.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        added.push(reader.result as string)
        pending -= 1
        if (pending === 0) onChange([...photos, ...added])
      }
      reader.readAsDataURL(file)
    })
  }

  const remove = (idx: number) => onChange(photos.filter((_, i) => i !== idx))

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label} <span className="text-muted-foreground">({photos.length}/{MAX_PHOTOS})</span>
      </label>
      <div className="grid grid-cols-3 gap-3">
        {photos.map((p, i) => (
          <div key={i} className="relative aspect-3/4 overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p || "/placeholder.svg"} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex aspect-3/4 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary",
            )}
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">Add</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
