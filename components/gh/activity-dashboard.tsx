"use client"

import { useMemo } from "react"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Heart, MessageCircle, TrendingUp, Clock } from "lucide-react"
import { useStore } from "@/lib/store"
import { useT } from "@/lib/use-t"
import {
  calculateInteractionStats,
  getMostEngagedProfiles,
  getEngagementTrend,
  calculateEngagementScore,
} from "@/lib/analytics"
import { cn } from "@/lib/utils"

export function ActivityDashboard() {
  const { state } = useStore()
  const { t } = useT()

  const stats = useMemo(() => calculateInteractionStats(state), [state])
  const score = useMemo(() => calculateEngagementScore(stats), [stats])
  const trend = useMemo(
    () =>
      getEngagementTrend(state.conversations, 7).map((count, i) => ({
        day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
        messages: count,
      })),
    [state.conversations],
  )
  const topProfiles = useMemo(
    () => getMostEngagedProfiles(state, 5),
    [state],
  )

  const periodText = {
    morning: "🌅 Morning",
    afternoon: "☀️ Afternoon",
    evening: "🌅 Evening",
    night: "🌙 Night",
  }

  return (
    <div className="space-y-6 p-4">
      {/* Engagement Score */}
      <div className="rounded-lg border border-border bg-gradient-to-br from-primary/10 to-primary/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Engagement Score</p>
            <p className="text-4xl font-bold text-primary">{score}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {score > 70
                ? "You're very active!"
                : score > 40
                  ? "Keep it up!"
                  : "Start connecting with people"}
            </p>
          </div>
          <div className="text-6xl opacity-20">📊</div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={<Heart className="h-5 w-5 text-red-500" />}
          label="Likes Sent"
          value={stats.totalLikes}
          trend={stats.totalLikes > 20 ? "+15%" : "+5%"}
        />
        <MetricCard
          icon={<Heart className="h-5 w-5 text-primary fill-primary" />}
          label="Matches"
          value={stats.totalMatches}
          trend={stats.totalMatches > 5 ? "🔥" : ""}
        />
        <MetricCard
          icon={<MessageCircle className="h-5 w-5 text-blue-500" />}
          label="Messages"
          value={stats.totalMessages}
          highlight={stats.totalMessages > 100}
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          label="Response Rate"
          value={`${stats.responseRate}%`}
          highlight={stats.responseRate > 70}
        />
      </div>

      {/* Activity Insights */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Activity Insights</h3>
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Most active: <span className="font-medium">{periodText[stats.mostActivePeriod]}</span>
          </p>
          <p>
            Avg response time:{" "}
            <span className="font-medium">
              {stats.averageResponseTime === 0
                ? "No messages yet"
                : `${stats.averageResponseTime} min`}
            </span>
          </p>
          <p>
            Profiles viewed:{" "}
            <span className="font-medium">{stats.profilesViewed}</span>
          </p>
        </div>
      </div>

      {/* 7-Day Trend Chart */}
      {trend.some((d) => d.messages > 0) && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="font-semibold text-sm">7-Day Message Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--muted-foreground)" style={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
                cursor={{ stroke: "var(--primary)", strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="messages"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ fill: "var(--primary)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Engaged Profiles */}
      {topProfiles.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="font-semibold text-sm">Most Engaged Conversations</h3>
          <div className="space-y-2">
            {topProfiles.map((profile, idx) => (
              <div
                key={profile.profileId}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground w-5">#{idx + 1}</span>
                  <span className="text-sm truncate">{profile.profileId}</span>
                </div>
                <div className="flex items-center gap-3 text-xs flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {profile.messages}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.floor(profile.timeSpent / 60)}m
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
        <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">💡 Pro Tips</p>
        <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
          <li>• Respond quickly to messages for better match conversion</li>
          <li>• Use shared interests to start conversations</li>
          <li>• Check your profile verification for more visibility</li>
          <li>• Be active during peak hours for better matches</li>
        </ul>
      </div>
    </div>
  )
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: string
  highlight?: boolean
}

function MetricCard({ icon, label, value, trend, highlight }: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 space-y-2",
        highlight
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/30"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        {icon}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold">{value}</span>
        {trend && <span className="text-xs font-medium text-green-600 dark:text-green-400">{trend}</span>}
      </div>
    </div>
  )
}
