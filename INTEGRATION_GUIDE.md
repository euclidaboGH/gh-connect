# GH Connect - Quick Integration Guide

## New Components Quick Reference

### 1. Enhanced Messages View
```tsx
import { MessagesView } from '@/components/gh/messages-view'

<MessagesView
  activeId={currentChatId}
  onOpenChat={(id) => setCurrentChatId(id)}
  onCloseChat={() => setCurrentChatId(null)}
/>
```

**Features:**
- Search conversations
- Unread badges
- Emoji reactions
- Date grouping
- Muted indicators

---

### 2. Enhanced Notifications
```tsx
import { NotificationsView } from '@/components/gh/notifications-view'

<NotificationsView
  onGoToChat={(id) => navigate(`/messages/${id}`)}
  onGoToProfile={(id) => navigate(`/profile/${id}`)}
/>
```

**Features:**
- Type filtering (Likes, Matches, Messages)
- Color-coded icons
- Quick navigation
- Unread counter

---

### 3. Interactive Features
```tsx
import {
  InteractionCard,
  ConnectionRequest,
  LikeButton
} from '@/components/gh/interactive-features'

// Like button
<LikeButton profile={profile} size="lg" />

// Connection request
<ConnectionRequest
  connection={conn}
  profile={profile}
/>
```

---

### 4. Smart Suggestions
```tsx
import {
  SmartSuggestions,
  TrendingProfiles
} from '@/components/gh/smart-suggestions'

<SmartSuggestions onViewProfile={(id) => showProfile(id)} />
<TrendingProfiles onViewProfile={(id) => showProfile(id)} />
```

---

### 5. Activity Dashboard
```tsx
import { ActivityDashboard } from '@/components/gh/activity-dashboard'

<ActivityDashboard />
```

**Shows:**
- Engagement score (0-100)
- Key metrics (likes, matches, messages)
- 7-day activity chart
- Top conversations
- Pro tips

---

## Utility Functions

### Messaging Utils
```tsx
import {
  createMessage,
  addReaction,
  editMessage,
  formatMessageTime,
  getUnreadCount,
  searchMessages,
  groupMessagesByDate
} from '@/lib/messaging-utils'

// Create message
const msg = createMessage(true, 'Hello!')

// Add reaction
const updated = addReaction(message, '❤️')

// Search messages
const results = searchMessages(messages, 'hello')

// Group by date
const grouped = groupMessagesByDate(messages)
```

### Analytics Utils
```tsx
import {
  calculateInteractionStats,
  getMostEngagedProfiles,
  getEngagementTrend,
  calculateEngagementScore
} from '@/lib/analytics'

// Get engagement score
const stats = calculateInteractionStats(state)
const score = calculateEngagementScore(stats)

// Get trend data
const trend = getEngagementTrend(
  state.conversations,
  7 // last 7 days
)

// Get top profiles
const top = getMostEngagedProfiles(state, 5)
```

---

## Store Actions (Enhanced)

### Sending Messages (with validation)
```tsx
const result = sendMessage(profileId, text)

// Returns:
// {
//   ok: boolean
//   limited: boolean
//   reason?: string
// }

if (result.limited) {
  console.log(result.reason)
  // "Daily message limit reached"
  // "User is blocked"
  // "Message limit with this user reached"
  // "Message cannot be empty"
}
```

### Like Profile (with match detection)
```tsx
const result = likeProfile(profile)

// Returns:
// {
//   matched: boolean
//   limited: boolean
// }

if (result.matched) {
  // Show match celebration
}
if (result.limited) {
  // Show rate limit toast
}
```

---

## Type Definitions

### Enhanced Message
```typescript
interface ChatMessage {
  id: string
  fromMe: boolean
  text: string
  ts: number
  read: boolean
  edited?: number
  reactions?: Array<{
    emoji: string
    count: number
    userReacted: boolean
  }>
}
```

### Conversation Metadata
```typescript
interface ConversationMetadata {
  lastRead: number
  isTyping: boolean
  typingUntil?: number
  mutedUntil?: number
  pinnedMessages?: string[]
  blockedAt?: number
}
```

---

## Rate Limits (24-hour rolling)

| Action | Limit | Per |
|---|---|---|
| Messages | 120 | 24 hours |
| Likes | 60 | 24 hours |
| Per-user messages | 20 | 24 hours |

**Error Handling:**
```tsx
if (result.reason === "Daily message limit reached") {
  // Global limit
}
if (result.reason === "Message limit with this user reached") {
  // Per-user limit
}
if (result.reason === "User is blocked") {
  // Blocked user
}
```

---

## UI Patterns

### Message Search
```tsx
const [query, setQuery] = useState('')
const filtered = conversations.filter(c =>
  c.profile.name.toLowerCase().includes(query) ||
  getConversationPreview(c).toLowerCase().includes(query)
)
```

### Notification Filtering
```tsx
const filtered = notifications.filter(n => {
  if (filter === 'likes') return n.type === 'like'
  if (filter === 'matches') return n.type === 'match'
  if (filter === 'messages') return n.type === 'message'
  return true
})
```

### Date Grouping
```tsx
const grouped = groupMessagesByDate(messages)
grouped.forEach(([date, msgs]) => {
  // Render date header
  // Render messages for that date
})
```

---

## Mobile Considerations

- Button minimum size: 44x44px
- One-handed operation support
- Keyboard input optimization
- Touch-friendly spacing
- Smooth scroll performance
- Responsive font sizes

---

## Common Patterns

### Navigate to Chat from Notification
```tsx
<NotificationsView
  onGoToChat={(profileId) => {
    setCurrentChatId(profileId)
    switchToMessagesTab()
  }}
/>
```

### Show Profile from Suggestion
```tsx
<SmartSuggestions
  onViewProfile={(profileId) => {
    setDetailProfile(pool.find(p => p.id === profileId))
  }}
/>
```

### Handle Message Send with Feedback
```tsx
const handleSend = () => {
  const result = sendMessage(profileId, text)
  if (result.ok) {
    setText('')
    showToast('Message sent')
  } else if (result.limited) {
    showToast(result.reason, 'error')
  }
}
```

---

## Performance Tips

1. **Use useMemo for calculations:**
   ```tsx
   const stats = useMemo(
     () => calculateInteractionStats(state),
     [state]
   )
   ```

2. **Debounce search:**
   ```tsx
   const debouncedSearch = useMemo(
     () => debounce(setQuery, 300),
     []
   )
   ```

3. **Virtualize long lists:**
   ```tsx
   // For 1000+ messages, use react-window
   ```

---

## Troubleshooting

**Messages not appearing?**
- Check conversation metadata initialization
- Verify sendMessage returned `ok: true`
- Check if profileId is valid

**Rate limit too strict?**
- Modify `MESSAGE_LIMIT` and `LIKE_LIMIT` in store.tsx
- Check per-user `SAME_USER_MESSAGE_LIMIT`

**Notifications not filtering?**
- Verify notification type in state
- Check blocked user filtering

**Search not working?**
- Ensure query string is being lowercased
- Check conversation exists in state

---

## Best Practices

1. ✅ Always check `result.ok` before assuming success
2. ✅ Show specific error messages from `result.reason`
3. ✅ Use useMemo for expensive calculations
4. ✅ Debounce search inputs
5. ✅ Handle loading states during transitions
6. ✅ Test rate limiting logic
7. ✅ Mobile test all interactions
8. ✅ Monitor engagement metrics

---

**Version:** 2.0  
**Updated:** June 11, 2026  
**Status:** Production Ready
