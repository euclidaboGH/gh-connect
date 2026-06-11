import { cn } from "@/lib/utils"

export function Avatar({
  src,
  name,
  size = 48,
  online,
  className,
}: {
  src?: string
  name: string
  size?: number
  online?: boolean
  className?: string
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src || "/placeholder.svg"}
          alt={name}
          className="h-full w-full rounded-full object-cover"
          crossOrigin="anonymous"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full bg-primary/15 font-semibold text-primary"
          style={{ fontSize: size * 0.4 }}
        >
          {initials || "?"}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full border-2 border-card",
            online ? "bg-emerald-500" : "bg-muted-foreground/40",
          )}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  )
}
