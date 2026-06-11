import type { AppState } from "./types"

/**
 * Analytics utilities for tracking interactions and user engagement
 */

export interface InteractionStats {
  totalLikes: number
  totalMatches: number
  totalMessages: number
  profilesViewed: number
  responseRate: number
  averageResponseTime: number
  mostActivePeriod: "morning" | "afternoon" | "evening" | "night"
}

export interface ProfileEngagement {
  profileId: string
  likes: number
  messages: number
  timeSpent: number
  lastInteraction: number
}

export function calculateInteractionStats(state: AppState): InteractionStats {
  const likes = state.likedIds.length
  const matches = state.connections.filter((c) => c.state === "connected").length
  
  let totalMessages = 0
  state.conversations.forEach((conv) => {
    totalMessages += conv.messages.length
  })

  // Calculate response rate (matches where we've exchanged messages)
  const conversationsWithMessages = state.conversations.filter((c) => c.messages.length > 0).length
  const responseRate =
    matches > 0 ? Math.round((conversationsWithMessages / matches) * 100) : 0

  // Calculate average response time (simplified)
  let totalResponseTime = 0
  let responseCount = 0
  state.conversations.forEach((conv) => {
    for (let i = 0; i < conv.messages.length - 1; i++) {
      const msg = conv.messages[i]
      const nextMsg = conv.messages[i + 1]
      if (msg && nextMsg && msg.fromMe !== nextMsg.fromMe) {
        totalResponseTime += nextMsg.ts - msg.ts
        responseCount++
      }
    }
  })
  const averageResponseTime =
    responseCount > 0 ? Math.round(totalResponseTime / responseCount / 60000) : 0

  // Determine most active period (simplified based on notification times)
  const periods = { morning: 0, afternoon: 0, evening: 0, night: 0 }
  state.notifications.forEach((n) => {
    const hour = new Date(n.ts).getHours()
    if (hour < 12) periods.morning++
    else if (hour < 17) periods.afternoon++
    else if (hour < 21) periods.evening++
    else periods.night++
  })
  let mostActive: "morning" | "afternoon" | "evening" | "night" = "afternoon"
  let maxCount = 0
  Object.entries(periods).forEach(([period, count]) => {
    if (count > maxCount) {
      maxCount = count
      mostActive = period as "morning" | "afternoon" | "evening" | "night"
    }
  })

  return {
    totalLikes: likes,
    totalMatches: matches,
    totalMessages,
    profilesViewed: state.likedIds.length + state.passedIds.length,
    responseRate,
    averageResponseTime,
    mostActivePeriod: mostActive,
  }
}

export function getProfileEngagement(
  state: AppState,
  profileId: string,
): ProfileEngagement | null {
  const conv = state.conversations.find((c) => c.profileId === profileId)
  if (!conv) return null

  const isLiked = state.likedIds.includes(profileId)
  const messages = conv.messages
  const lastMsg = messages[messages.length - 1]

  return {
    profileId,
    likes: isLiked ? 1 : 0,
    messages: messages.length,
    timeSpent: messages.length > 0
      ? (messages[messages.length - 1]!.ts - messages[0]!.ts) / 1000
      : 0,
    lastInteraction: lastMsg?.ts || 0,
  }
}

export function getMostEngagedProfiles(state: AppState, limit = 5): ProfileEngagement[] {
  const engagements: ProfileEngagement[] = []

  state.conversations.forEach((conv) => {
    const engagement = getProfileEngagement(state, conv.profileId)
    if (engagement) {
      engagements.push(engagement)
    }
  })

  return engagements
    .sort((a, b) => {
      // Sort by message count, then by time spent
      if (a.messages !== b.messages) return b.messages - a.messages
      return b.timeSpent - a.timeSpent
    })
    .slice(0, limit)
}

export function getEngagementTrend(
  conversations: Array<{ profileId: string; messages: Array<{ ts: number }> }>,
  days: number = 7,
): number[] {
  const dailyCounts = new Array(days).fill(0)
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  conversations.forEach((conv) => {
    conv.messages.forEach((msg) => {
      const daysAgo = Math.floor((now - msg.ts) / dayMs)
      if (daysAgo < days) {
        dailyCounts[days - 1 - daysAgo]++
      }
    })
  })

  return dailyCounts
}

export function calculateEngagementScore(stats: InteractionStats): number {
  let score = 0

  // Likes contribute 10% to score
  score += Math.min(stats.totalLikes / 100, 10)

  // Matches contribute 20% to score
  score += Math.min((stats.totalMatches / 20) * 20, 20)

  // Messages contribute 30% to score
  score += Math.min((stats.totalMessages / 200) * 30, 30)

  // Response rate contributes 20% to score
  score += (stats.responseRate / 100) * 20

  // Response time (faster is better) contributes 20% to score
  const responseTimeScore = Math.max(20 - Math.min(stats.averageResponseTime / 10, 20), 0)
  score += responseTimeScore

  return Math.round(score)
}
