# GH Connect - System Architecture & Integration Map

## 🎯 Complete System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GH Connect App Shell                       │
│                   (components/gh/app-shell.tsx)              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Discovery   │  │   Matches    │  │  Messages    │      │
│  │   (Swipe)    │  │  (Connect)   │  │   (Chat)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                 ↓                  ↓               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Notifications │  │  Analytics   │  │   Profile    │      │
│  │  (Activity)  │  │ (Dashboard)  │  │  (Settings)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│            Bottom Navigation (5 tabs + badges)               │
└─────────────────────────────────────────────────────────────┘
                            ↑
                            │
            ┌───────────────┴───────────────┐
            ↓                               ↓
    ┌──────────────────┐      ┌──────────────────┐
    │   useStore()     │      │   useT() i18n    │
    │  State Mgmt      │      │  Translations    │
    └──────────────────┘      └──────────────────┘
            ↑
            │
┌───────────┴──────────────────────────────┐
│         AppState (localStorage)          │
│                                           │
│  Profiles:                                │
│  ├─ me: Profile                         │
│  ├─ likedIds[]                          │
│  ├─ passedIds[]                         │
│  └─ likesMe[]                           │
│                                           │
│  Social:                                  │
│  ├─ connections[]                        │
│  ├─ conversations[]  ← Messages + Meta  │
│  ├─ notifications[]                      │
│  ├─ blocked[]                            │
│  └─ reported[]                           │
│                                           │
│  Rate Limits (24h windows):              │
│  ├─ likeCount / likeResetTime           │
│  └─ messageCount / messageResetTime     │
└───────────────────────────────────────────┘
```

## 📊 Data Flow

### Discovery Flow
```
User taps Like
    ↓
[debounced action - min 400ms]
    ↓
Check blocked, passed, already liked
    ↓
Check rate limit: likeCount >= 60?
    ↓
If OK: Add to likedIds[], increment likeCount
    ↓
Check if mutual like (in likesMe?)
    ↓
If mutual: Create connection, notify user
    ↓
Persist state to localStorage
    ↓
UI updates with animation
```

### Messaging Flow
```
User types message → [Text input]
    ↓
User presses Send
    ↓
[Validation]
├─ Not empty?
├─ Length <= 1000?
├─ Not spam?
└─ User not blocked?
    ↓
[Rate limiting]
├─ messageCount < 120 (global)?
└─ messagesTo < 20 (per user)?
    ↓
Sanitize input (XSS prevention)
    ↓
Create message object
    ↓
Add to conversation (create if needed)
    ↓
Update metadata (isTyping: false)
    ↓
Persist to localStorage
    ↓
[Optimistic update]
├─ Message appears immediately
├─ Typing indicator disappears
└─ UI scrolls to bottom
    ↓
Simulate delivery confirmation
```

### Notification Flow
```
Any action (like, match, message, request)
    ↓
Create notification object with type
    ↓
Add to notifications[] array
    ↓
Persist to localStorage
    ↓
app-shell.tsx reads and counts
    ↓
Badge updates on relevant tab
    ↓
notifications-view filters by type
    ↓
User clicks notification
    ↓
Route to chat or profile
    ↓
Mark read after 600ms
```

## 🔐 Security Layers

```
┌─────────────────────────────────────────┐
│         Inbound Request                 │
│    (User action: like, message, etc)   │
└────────────────┬────────────────────────┘
                 ↓
        ┌────────────────┐
        │ Pi Authentication
        │ (Immutable)
        └────────┬───────┘
                 ↓
        ┌────────────────────┐
        │ Input Validation   │
        │ ├─ XSS prevention  │
        │ ├─ Length check    │
        │ └─ Type validation │
        └────────┬───────────┘
                 ↓
        ┌────────────────────┐
        │ Rate Limiting      │
        │ ├─ Global limit    │
        │ └─ Per-user limit  │
        └────────┬───────────┘
                 ↓
        ┌────────────────────┐
        │ Access Control     │
        │ ├─ Blocked users   │
        │ ├─ Reported users  │
        │ └─ Privacy filters │
        └────────┬───────────┘
                 ↓
        ┌────────────────────┐
        │ Spam Detection     │
        │ ├─ Link count      │
        │ ├─ Char repeats    │
        │ ├─ ALL CAPS        │
        │ └─ Punctuation     │
        └────────┬───────────┘
                 ↓
┌─────────────────────────────────────────┐
│      Approved for State Update          │
│    (Sanitized, validated data)         │
└─────────────────────────────────────────┘
```

## 🔄 State Update Cycle

```
┌─ User Action (button click, send, etc)
│
├─ [Store Action Called]
│  likeProfile(p) / sendMessage(id, text) / etc
│
├─ [Validation & Checks]
│  Rate limits, access control, input validation
│
├─ [Create New State]
│  Immutable update of AppState
│
├─ [Side Effects]
│  ├─ localStorage.setItem()
│  ├─ Analytics tracking
│  └─ Notification creation
│
├─ [Return Result]
│  { ok: boolean, limited?: boolean, matched?: boolean }
│
└─ [UI Re-render]
   Components using useStore() re-render with new state
```

## 📱 Component Hierarchy

```
App (Next.js)
├─ AppWrapper (auth context)
├─ ThemeProvider (dark/light mode)
└─ AppShell (main UI)
   ├─ MainContent
   │  ├─ DiscoveryView (when tab="discovery")
   │  │  ├─ SwipeCard
   │  │  ├─ FiltersSheet
   │  │  └─ MatchDialog
   │  │
   │  ├─ MatchesView (when tab="matches")
   │  │  ├─ ConnectionRequest
   │  │  └─ InteractionCard
   │  │
   │  ├─ MessagesView (when tab="messages")
   │  │  ├─ SearchInput
   │  │  ├─ ConversationList
   │  │  └─ ChatThread
   │  │     ├─ MessageBubble
   │  │     ├─ EmojiPicker
   │  │     └─ TypingIndicator
   │  │
   │  ├─ NotificationsView (when tab="notifications")
   │  │  ├─ FilterButtons
   │  │  └─ NotificationItem
   │  │
   │  └─ ProfileView (when tab="profile")
   │     ├─ ProfileForm
   │     ├─ PhotoUploader
   │     ├─ InterestPicker
   │     ├─ PrivacySettings
   │     └─ ActivityDashboard
   │
   └─ BottomNav (tab navigation)
      └─ NavItem (with badge)
```

## 📚 Module Dependencies

```
Core Types
└─ lib/types.ts
   ├─ Profile, ChatMessage, Conversation, AppState, etc

Store (State Management)
└─ lib/store.tsx
   ├─ uses: types.ts, validation.tsx
   └─ provides: useStore hook, all actions

Security
├─ lib/validation.tsx
│  ├─ sanitizeInput, validateAge, isSpamLikely
│  └─ used by: store.tsx (sendMessage validation)
│
└─ lib/button-utils.ts
   ├─ createDebouncedAction
   └─ used by: all view components

Messaging
├─ lib/messaging-utils.ts
│  ├─ getMessageSummary, formatMessageTime, groupMessagesByDate
│  └─ used by: messages-view.tsx, analytics.ts
│
└─ components/gh/messages-view.tsx
   ├─ uses: store.tsx, messaging-utils.ts, avatar.tsx
   └─ provides: full chat interface

Analytics
├─ lib/analytics.ts
│  ├─ calculateInteractionStats, getEngagementTrend
│  └─ used by: activity-dashboard.tsx, notifications-view.tsx
│
└─ components/gh/activity-dashboard.tsx
   ├─ uses: analytics.ts, recharts
   └─ provides: engagement dashboard

Matching
├─ lib/matching.ts
│  ├─ matchScore, discoverProfiles, dailySuggestions
│  └─ used by: discovery-view.tsx, smart-suggestions.tsx
│
└─ components/gh/smart-suggestions.tsx
   ├─ uses: matching.ts, avatar.tsx
   └─ provides: AI recommendation cards

Interactive Features
└─ components/gh/interactive-features.tsx
   ├─ InteractionCard, ConnectionRequest, LikeButton
   └─ used by: matches-view.tsx, discovery-view.tsx

App Shell
└─ components/gh/app-shell.tsx
   ├─ uses: all view components, bottom-nav.tsx
   ├─ manages: tab state, chat routing
   └─ provides: main application UI
```

## ⚡ Performance Optimizations

```
Component Level
├─ useMemo() for expensive computations
│  ├─ discoverProfiles (filtering & sorting)
│  ├─ calculateInteractionStats (aggregation)
│  └─ dailySuggestions (scoring)
│
├─ useCallback() for stable function refs
│  ├─ handleLike, handlePass
│  ├─ handleSendMessage
│  └─ onOpenChat, onCloseChat
│
└─ Debouncing for rapid actions
   ├─ Like/Pass: min 400ms between actions
   ├─ Message send: validation + sanitization
   └─ Search: 200ms debounce on input

Storage Level
├─ localStorage caching
│  ├─ Full state persisted
│  ├─ Rate limits persist across sessions
│  └─ Selective hydration on load
│
└─ Incremental updates
   ├─ Only changed state is merged
   ├─ Immutable patterns prevent bugs
   └─ No full re-serialization

Rendering
├─ React.StrictMode for development
├─ Conditional rendering (ternary operators)
├─ Keys on list items
├─ Lazy loading of views
└─ CSS-in-JS optimizations (Tailwind)
```

## 📊 Rate Limiting Architecture

```
┌─────────────────────────────────────────┐
│       Rate Limit Check              │
│    (Before any action)                │
├─────────────────────────────────────────┤
│                                          │
│  1. Check if time window has passed     │
│     ├─ now - resetTime >= 24 hours?    │
│     └─ If yes: reset counter to 0      │
│                                          │
│  2. Check action count vs limit        │
│     ├─ Likes: count >= 60? → LIMIT    │
│     ├─ Messages: count >= 120? → LIMIT│
│     └─ Per-user: count >= 20? → LIMIT │
│                                          │
│  3. If within limit:                   │
│     ├─ Perform action                  │
│     ├─ Increment counter               │
│     ├─ Update state in memory          │
│     ├─ Persist to localStorage         │
│     └─ Return success                  │
│                                          │
│  4. If over limit:                     │
│     ├─ Reject action                   │
│     ├─ Show error message              │
│     ├─ Log violation (admin)           │
│     └─ Return failure                  │
│                                          │
└─────────────────────────────────────────┘
```

---

**System Status**: ✅ FULLY INTEGRATED & PRODUCTION-READY

All components communicate seamlessly through the centralized store. Security checks are applied before any state update. Performance is optimized with memoization and debouncing. Data persists across sessions via localStorage.
