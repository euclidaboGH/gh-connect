import type { AppState, Filters, Profile } from "./types"

/**
 * Calculate match score between two profiles
 * Prevents showing reported/blocked users
 */
export function matchScore(me: Profile, p: Profile): number {
  let score = 0
  // shared interests
  const shared = p.interests.filter((i) => me.interests.includes(i)).length
  score += shared * 20
  // proximity
  if (me.country && p.country === me.country) score += 25
  if (me.city && p.city === me.city) score += 15
  // mode alignment
  if (p.mode === me.mode) score += 20
  // online + verified small boosts
  if (p.online) score += 5
  if (p.verified) score += 5
  return score
}

export function sharedInterests(me: Profile, p: Profile): string[] {
  return p.interests.filter((i) => me.interests.includes(i))
}

/**
 * Get profiles visible in discovery for the current mode + filters
 * Enhanced with security filtering
 */
export function discoverProfiles(
  pool: Profile[],
  state: AppState,
  mode = state.mode,
): Profile[] {
  const { me, filters, likedIds, passedIds, blocked, connections, reported } = state
  const connectedIds = new Set(connections.map((c) => c.profileId))
  
  return pool
    .filter((p) => p.mode === mode)
    .filter((p) => p.id !== me.id) // Don't show self
    .filter((p) => !likedIds.includes(p.id))
    .filter((p) => !passedIds.includes(p.id))
    .filter((p) => !blocked.includes(p.id))
    .filter((p) => !reported.includes(p.id)) // Hide reported users
    .filter((p) => !connectedIds.has(p.id))
    .filter((p) => matchesFilters(p, filters, me))
    .sort((a, b) => matchScore(me, b) - matchScore(me, a))
}

export function matchesFilters(p: Profile, f: Filters, me: Profile): boolean {
  if (p.age < f.ageMin || p.age > f.ageMax) return false
  if (f.onlineOnly && !p.online) return false
  if (f.verifiedOnly && !p.verified) return false
  if (f.gender && p.gender !== f.gender) return false
  if (f.scope === "country" && me.country && p.country !== me.country) return false
  if (f.scope === "city" && me.city && p.city !== me.city) return false
  if (f.interests.length > 0) {
    const has = f.interests.some((i) => p.interests.includes(i))
    if (!has) return false
  }
  return true
}

/**
 * Daily suggestions: top scored across all modes, not yet liked/passed
 * Excludes reported and blocked users
 */
export function dailySuggestions(pool: Profile[], state: AppState, seed: number): Profile[] {
  const { me, likedIds, passedIds, blocked, connections, reported } = state
  const connectedIds = new Set(connections.map((c) => c.profileId))
  
  const candidates = pool
    .filter((p) => p.id !== me.id)
    .filter((p) => !likedIds.includes(p.id))
    .filter((p) => !passedIds.includes(p.id))
    .filter((p) => !blocked.includes(p.id))
    .filter((p) => !reported.includes(p.id))
    .filter((p) => !connectedIds.has(p.id))
    .map((p) => ({ p, s: matchScore(me, p) }))
    .sort((a, b) => b.s - a.s)
  
  // rotate by seed so refresh changes order a bit
  const rotated = [...candidates]
  for (let i = 0; i < seed % Math.max(1, rotated.length); i++) {
    rotated.push(rotated.shift()!)
  }
  
  return rotated.slice(0, 5).map((x) => x.p)
}
