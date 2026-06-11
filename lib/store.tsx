"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type {
  AppNotification,
  AppState,
  ChatMessage,
  Filters,
  Mode,
  Profile,
} from "./types"
import { detectLanguage, isRtl } from "./i18n"

const STORAGE_KEY = "gh-connect-state-v1"

// Rate limiting per 24 hours
const LIKE_LIMIT = 60
const MESSAGE_LIMIT = 120
const LIKE_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours
const MESSAGE_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

// Anti-spam thresholds
const SAME_USER_MESSAGE_LIMIT = 20 // Max messages per unique user per day
const BLOCK_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days auto-unblock

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

const defaultFilters: Filters = {
  scope: "global",
  ageMin: 18,
  ageMax: 60,
  interests: [],
  onlineOnly: false,
  verifiedOnly: false,
  gender: "",
}

function defaultState(): AppState {
  const now = Date.now()
  return {
    onboarded: false,
    me: {
      id: "me",
      name: "",
      age: 25,
      gender: "",
      city: "",
      country: "",
      bio: "",
      interests: [],
      mode: "dating",
      photos: [],
      verified: false,
      online: true,
    },
    theme: "light",
    language: "en",
    mode: "dating",
    filters: defaultFilters,
    likedIds: [],
    dislikedIds: [],
    passedIds: [],
    likesMe: [],
    followers: [],
    following: [],
    friends: [],
    friendRequests: [],
    connections: [],
    conversations: [],
    notifications: [],
    blocked: [],
    reported: [],
    privacy: { hideOnline: false, hideLocation: false, invisible: false },
    likeCount: 0,
    messageCount: 0,
    likeResetTime: now,
    messageResetTime: now,
  }
}

interface StoreContextType {
  state: AppState
  ready: boolean
  setState: (updater: (s: AppState) => AppState) => void
  // actions
  completeOnboarding: (me: Profile) => void
  updateProfile: (patch: Partial<Profile>) => void
  setMode: (mode: Mode) => void
  setFilters: (filters: Filters) => void
  setTheme: (theme: "light" | "dark") => void
  setLanguage: (lang: string) => void
  likeProfile: (p: Profile) => { matched: boolean; limited: boolean }
  dislikeProfile: (id: string) => void
  passProfile: (id: string) => void
  followProfile: (id: string, name: string) => void
  unfollowProfile: (id: string) => void
  sendFriendRequest: (id: string, name: string) => void
  acceptFriendRequest: (id: string, name: string) => void
  declineFriendRequest: (id: string) => void
  removeFriend: (id: string) => void
  acceptRequest: (profileId: string) => void
  declineRequest: (profileId: string) => void
  sendMessage: (profileId: string, text: string) => { ok: boolean; limited: boolean; reason?: string }
  markConversationRead: (profileId: string) => void
  markNotificationsRead: () => void
  blockUser: (id: string) => void
  unblockUser: (id: string) => void
  reportUser: (id: string, reason: string) => void
  togglePrivacy: (key: keyof AppState["privacy"]) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setRawState] = useState<AppState>(defaultState)
  const [ready, setReady] = useState(false)
  const hydrated = useRef(false)

  // hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as AppState
        const now = Date.now()
        // reset per-session anti-spam counters if window has passed
        const shouldResetLike = now - (parsed.likeResetTime ?? now) >= LIKE_WINDOW_MS
        const shouldResetMessage = now - (parsed.messageResetTime ?? now) >= MESSAGE_WINDOW_MS
        parsed.likeCount = shouldResetLike ? 0 : parsed.likeCount
        parsed.messageCount = shouldResetMessage ? 0 : parsed.messageCount
        parsed.likeResetTime = shouldResetLike ? now : parsed.likeResetTime
        parsed.messageResetTime = shouldResetMessage ? now : parsed.messageResetTime
        setRawState({ ...defaultState(), ...parsed })
      } else {
        setRawState((s) => ({ ...s, language: detectLanguage() }))
      }
    } catch {
      // ignore
    }
    hydrated.current = true
    setReady(true)
  }, [])

  // persist
  useEffect(() => {
    if (!hydrated.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state])

  // apply theme + dir
  useEffect(() => {
    const root = document.documentElement
    if (state.theme === "dark") root.classList.add("dark")
    else root.classList.remove("dark")
  }, [state.theme])

  // apply language direction
  useEffect(() => {
    const root = document.documentElement
    root.dir = isRtl(state.language) ? "rtl" : "ltr"
    root.lang = state.language
  }, [state.language])

  const setState = (updater: (s: AppState) => AppState) => setRawState(updater)

  const addNotification = (
    s: AppState,
    n: Omit<AppNotification, "id" | "ts" | "read">,
  ): AppState => {
    const notif: AppNotification = { ...n, id: uid(), ts: Date.now(), read: false }
    return { ...s, notifications: [notif, ...s.notifications] }
  }

  const shouldResetLikeCounter = (state: AppState): boolean => {
    return Date.now() - state.likeResetTime >= LIKE_WINDOW_MS
  }

  const shouldResetMessageCounter = (state: AppState): boolean => {
    return Date.now() - state.messageResetTime >= MESSAGE_WINDOW_MS
  }

  const countMessagesToProfile = (state: AppState, profileId: string): number => {
    const conversation = state.conversations.find((c) => c.profileId === profileId)
    if (!conversation) return 0
    return conversation.messages.filter((m) => m.fromMe).length
  }

  const value: StoreContextType = useMemo(() => {
    return {
      state,
      ready,
      setState,
      completeOnboarding: (me) =>
        setRawState((s) => ({ ...s, me: { ...me, id: "me" }, mode: me.mode, onboarded: true })),
      updateProfile: (patch) =>
        setRawState((s) => ({ ...s, me: { ...s.me, ...patch } })),
      setMode: (mode) => setRawState((s) => ({ ...s, mode })),
      setFilters: (filters) => setRawState((s) => ({ ...s, filters })),
      setTheme: (theme) => setRawState((s) => ({ ...s, theme })),
      setLanguage: (language) => setRawState((s) => ({ ...s, language })),
      likeProfile: (p) => {
        let result = { matched: false, limited: false }
        setRawState((s) => {
          // Check if rate limit window has passed and reset if needed
          const resetLike = shouldResetLikeCounter(s)
          const likeCount = resetLike ? 0 : s.likeCount
          const likeResetTime = resetLike ? Date.now() : s.likeResetTime

          if (likeCount >= LIKE_LIMIT) {
            result = { matched: false, limited: true }
            return s
          }

          // Prevent liking blocked or already liked users
          if (s.blocked.includes(p.id) || s.likedIds.includes(p.id)) {
            result = { matched: false, limited: false }
            return s
          }

          let next: AppState = {
            ...s,
            likedIds: [...s.likedIds, p.id],
            likeCount: likeCount + 1,
            likeResetTime,
          }
          
          // Simulated mutual like: profiles already in likesMe match instantly,
          // otherwise ~45% chance to like back.
          const likesBack = s.likesMe.includes(p.id) || Math.random() < 0.45
          if (likesBack) {
            const reqState =
              p.mode === "networking"
                ? "connection_invite"
                : p.mode === "friendships"
                  ? "friend_request"
                  : "match"
            if (!next.connections.some((c) => c.profileId === p.id)) {
              next = {
                ...next,
                connections: [
                  ...next.connections,
                  {
                    profileId: p.id,
                    state: p.mode === "dating" ? "connected" : reqState,
                    mode: p.mode,
                    initiatedByMe: true,
                    createdAt: Date.now(),
                  },
                ],
              }
            }
            next = addNotification(next, {
              type: "match",
              profileId: p.id,
              text: `You matched with ${p.name}!`,
            })
            result = { matched: true, limited: false }
          }
          return next
        })
        return result
      },
      dislikeProfile: (id) =>
        setRawState((s) => ({
          ...s,
          dislikedIds: s.dislikedIds.includes(id) ? s.dislikedIds : [...s.dislikedIds, id],
        })),
      followProfile: (id, name) =>
        setRawState((s) => {
          if (s.following.includes(id)) return s
          return {
            ...s,
            following: [...s.following, id],
            notifications: [
              ...s.notifications,
              {
                id: uid(),
                type: "request",
                profileId: id,
                text: `You started following ${name}`,
                ts: Date.now(),
                read: false,
              },
            ],
          }
        }),
      unfollowProfile: (id) =>
        setRawState((s) => ({
          ...s,
          following: s.following.filter((fid) => fid !== id),
        })),
      sendFriendRequest: (id, name) =>
        setRawState((s) => {
          if (s.friendRequests.includes(id) || s.friends.includes(id)) return s
          return {
            ...s,
            friendRequests: [...s.friendRequests, id],
            notifications: [
              ...s.notifications,
              {
                id: uid(),
                type: "request",
                profileId: id,
                text: `Friend request sent to ${name}`,
                ts: Date.now(),
                read: false,
              },
            ],
          }
        }),
      acceptFriendRequest: (id, name) =>
        setRawState((s) => ({
          ...s,
          friends: s.friends.includes(id) ? s.friends : [...s.friends, id],
          friendRequests: s.friendRequests.filter((rid) => rid !== id),
          notifications: [
            ...s.notifications,
            {
              id: uid(),
              type: "request",
              profileId: id,
              text: `You are now friends with ${name}!`,
              ts: Date.now(),
              read: false,
            },
          ],
        })),
      declineFriendRequest: (id) =>
        setRawState((s) => ({
          ...s,
          friendRequests: s.friendRequests.filter((rid) => rid !== id),
        })),
      removeFriend: (id) =>
        setRawState((s) => ({
          ...s,
          friends: s.friends.filter((fid) => fid !== id),
        })),
      acceptRequest: (profileId) =>
        setRawState((s) => ({
          ...s,
          connections: s.connections.map((c) =>
            c.profileId === profileId ? { ...c, state: "connected" } : c,
          ),
        })),
      declineRequest: (profileId) =>
        setRawState((s) => ({
          ...s,
          connections: s.connections.filter((c) => c.profileId !== profileId),
        })),
      sendMessage: (profileId, text) => {
        let result = { ok: false, limited: false, reason: undefined }
        setRawState((s) => {
          // Prevent messaging blocked users
          if (s.blocked.includes(profileId)) {
            result = { ok: false, limited: true, reason: "User is blocked" }
            return s
          }

          // Check if rate limit window has passed and reset if needed
          const resetMessage = shouldResetMessageCounter(s)
          const messageCount = resetMessage ? 0 : s.messageCount
          const messageResetTime = resetMessage ? Date.now() : s.messageResetTime

          // Check global message limit
          if (messageCount >= MESSAGE_LIMIT) {
            result = { ok: false, limited: true, reason: "Daily message limit reached" }
            return s
          }

          // Check per-user message limit to prevent spam targeting
          const messagesTo = countMessagesToProfile(s, profileId)
          if (messagesTo >= SAME_USER_MESSAGE_LIMIT) {
            result = { ok: false, limited: true, reason: "Message limit with this user reached" }
            return s
          }

          // Sanitize message text: trim and limit length
          const sanitizedText = text.trim().slice(0, 1000)
          if (!sanitizedText) {
            result = { ok: false, limited: false, reason: "Message cannot be empty" }
            return s
          }

          const msg: ChatMessage = {
            id: uid(),
            fromMe: true,
            text: sanitizedText,
            ts: Date.now(),
            read: true,
            reactions: [],
          }
          const existing = s.conversations.find((c) => c.profileId === profileId)
          let conversations
          if (existing) {
            conversations = s.conversations.map((c) =>
              c.profileId === profileId 
                ? {
                    ...c,
                    messages: [...c.messages, msg],
                    metadata: { ...c.metadata, isTyping: false },
                  }
                : c,
            )
          } else {
            conversations = [
              ...s.conversations,
              {
                profileId,
                messages: [msg],
                metadata: {
                  lastRead: Date.now(),
                  isTyping: false,
                  mutedUntil: 0,
                },
              },
            ]
          }
          result = { ok: true, limited: false }
          return { ...s, conversations, messageCount: messageCount + 1, messageResetTime }
        })
        return result
      },
      markConversationRead: (profileId) =>
        setRawState((s) => ({
          ...s,
          conversations: s.conversations.map((c) =>
            c.profileId === profileId
              ? {
                  ...c,
                  messages: c.messages.map((m) => ({ ...m, read: true })),
                  metadata: { ...c.metadata, lastRead: Date.now() },
                }
              : c,
          ),
        })),
      markNotificationsRead: () =>
        setRawState((s) => ({
          ...s,
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
      blockUser: (id) =>
        setRawState((s) => ({
          ...s,
          blocked: s.blocked.includes(id) ? s.blocked : [...s.blocked, id],
          connections: s.connections.filter((c) => c.profileId !== id),
          conversations: s.conversations.filter((c) => c.profileId !== id),
        })),
      unblockUser: (id) =>
        setRawState((s) => ({ ...s, blocked: s.blocked.filter((b) => b !== id) })),
      reportUser: (id, reason) =>
        setRawState((s) => {
          // Add to reported list and auto-block to prevent future interaction
          return {
            ...s,
            reported: s.reported.includes(id) ? s.reported : [...s.reported, id],
            blocked: s.blocked.includes(id) ? s.blocked : [...s.blocked, id],
            connections: s.connections.filter((c) => c.profileId !== id),
            conversations: s.conversations.filter((c) => c.profileId !== id),
          }
        }),
      togglePrivacy: (key) =>
        setRawState((s) => ({
          ...s,
          privacy: { ...s.privacy, [key]: !s.privacy[key] },
        })),
      // Social actions (follow, like/dislike, friends)
      dislikeProfile: (id) =>
        setRawState((s) => ({
          ...s,
          dislikedIds: s.dislikedIds.includes(id) ? s.dislikedIds : [...s.dislikedIds, id],
        })),
      followProfile: (id, name) =>
        setRawState((s) => {
          if (s.following.includes(id)) return s
          return {
            ...s,
            following: [...s.following, id],
            notifications: [
              ...s.notifications,
              {
                id: uid(),
                type: "request",
                profileId: id,
                text: `You started following ${name}`,
                ts: Date.now(),
                read: false,
              },
            ],
          }
        }),
      unfollowProfile: (id) =>
        setRawState((s) => ({
          ...s,
          following: s.following.filter((fid) => fid !== id),
        })),
      sendFriendRequest: (id, name) =>
        setRawState((s) => {
          if (s.friendRequests.includes(id) || s.friends.includes(id)) return s
          return {
            ...s,
            friendRequests: [...s.friendRequests, id],
            notifications: [
              ...s.notifications,
              {
                id: uid(),
                type: "request",
                profileId: id,
                text: `Friend request sent to ${name}`,
                ts: Date.now(),
                read: false,
              },
            ],
          }
        }),
      acceptFriendRequest: (id, name) =>
        setRawState((s) => ({
          ...s,
          friends: s.friends.includes(id) ? s.friends : [...s.friends, id],
          friendRequests: s.friendRequests.filter((rid) => rid !== id),
          notifications: [
            ...s.notifications,
            {
              id: uid(),
              type: "request",
              profileId: id,
              text: `You are now friends with ${name}!`,
              ts: Date.now(),
              read: false,
            },
          ],
        })),
      declineFriendRequest: (id) =>
        setRawState((s) => ({
          ...s,
          friendRequests: s.friendRequests.filter((rid) => rid !== id),
        })),
      removeFriend: (id) =>
        setRawState((s) => ({
          ...s,
          friends: s.friends.filter((fid) => fid !== id),
        })),
    }
  }, [state, ready])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
