export type Mode = "friendships" | "dating" | "networking"

export type Gender = "" | "male" | "female" | "nonbinary" | "other"

export interface Profile {
  id: string
  name: string
  age: number
  gender: Gender
  city: string
  country: string
  bio: string
  interests: string[]
  mode: Mode
  photos: string[]
  verified: boolean
  online: boolean
  industry?: string
}

export type RequestState = "match" | "friend_request" | "connection_invite" | "connected"

export interface ConnectionRecord {
  profileId: string
  state: RequestState
  mode: Mode
  // who initiated the request after a match
  initiatedByMe?: boolean
  createdAt: number
}

export interface ConversationMetadata {
  lastRead: number
  isTyping: boolean
  typingUntil?: number
  mutedUntil?: number // 0 = not muted
  pinnedMessages?: string[] // message IDs
  blockedAt?: number // when conversation was blocked
}

export interface ChatMessage {
  id: string
  fromMe: boolean
  text: string
  ts: number
  read: boolean
  edited?: number
  reactions?: { emoji: string; count: number; userReacted: boolean }[]
}

export interface Conversation {
  profileId: string
  messages: ChatMessage[]
  metadata: ConversationMetadata
}

export type NotificationType = "like" | "match" | "message" | "request"

export interface AppNotification {
  id: string
  type: NotificationType
  profileId: string
  text: string
  ts: number
  read: boolean
}

export interface PrivacySettings {
  hideOnline: boolean
  hideLocation: boolean
  invisible: boolean
}

export interface Filters {
  scope: "global" | "country" | "city"
  ageMin: number
  ageMax: number
  interests: string[]
  onlineOnly: boolean
  verifiedOnly: boolean
  gender: Gender
}

export interface AppState {
  onboarded: boolean
  me: Profile
  theme: "light" | "dark"
  language: string
  mode: Mode
  filters: Filters
  likedIds: string[] // profiles I liked
  dislikedIds: string[] // profiles I disliked
  passedIds: string[] // profiles I passed
  likesMe: string[] // profile ids that liked me
  followers: string[] // profiles following me
  following: string[] // profiles I follow
  friends: string[] // confirmed friends
  friendRequests: string[] // incoming friend requests
  connections: ConnectionRecord[]
  conversations: Conversation[]
  notifications: AppNotification[]
  blocked: string[]
  reported: string[] // profiles reported for abuse/spam
  privacy: PrivacySettings
  // anti-spam counters for current session
  likeCount: number
  messageCount: number
  likeResetTime: number // timestamp when like count resets
  messageResetTime: number // timestamp when message count resets
}
