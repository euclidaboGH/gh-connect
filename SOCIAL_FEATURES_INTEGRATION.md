# Social Features Integration Guide

## Quick Start

The social features are fully integrated and ready to use. Here's what's available:

### For Users

**In Discovery:**
- View a profile → tap profile image/name
- Profile detail sheet opens with social buttons
- Like, dislike, follow, or send friend request

**In Profile Tab:**
- 3 sections: Profile | Friends | Followers
- Friends tab shows friend list and requests
- Followers tab shows your followers and who you follow

**Anywhere You See a Profile:**
- SocialButtons component appears
- Like/dislike/follow/friend actions available instantly

### For Developers

**Using SocialButtons Component:**
```tsx
import { SocialButtons } from "@/components/gh/social-buttons"

<SocialButtons profile={profile} variant="full" />
// or compact version
<SocialButtons profile={profile} variant="compact" />
```

**Using Store Actions:**
```tsx
const { 
  likeProfile, 
  dislikeProfile, 
  followProfile, 
  unfollowProfile,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend
} = useStore()

// Like a profile
likeProfile(profileObject)

// Follow a user
followProfile(userId, userName)

// Send friend request
sendFriendRequest(userId, userName)

// Accept friend request
acceptFriendRequest(userId, userName)
```

**Checking Social State:**
```tsx
const { state } = useStore()

// Check if following
state.following.includes(userId)

// Check friends
state.friends.includes(userId)

// Get pending friend requests
state.friendRequests

// Get followers
state.followers
```

## Component Locations

- **SocialButtons** - `/components/gh/social-buttons.tsx`
- **FriendsView** - `/components/gh/friends-view.tsx`
- **FollowersView** - `/components/gh/followers-view.tsx`
- **ProfileDetail** - `/components/gh/profile-detail.tsx` (integrated)
- **ProfileView** - `/components/gh/profile-view.tsx` (integrated)

## Data Flow

```
User Action (Like/Follow/Friend)
    ↓
Store Action (likeProfile/followProfile/etc)
    ↓
Update AppState (add to array)
    ↓
Create Notification
    ↓
Persist to localStorage
    ↓
Component Re-renders
    ↓
UI Updates (button state, color, count)
```

## Notification Types

Social actions trigger these notification types:
- `"like"` - Profile was liked
- `"request"` - Follow or friend action
- `"match"` - Mutual like match

## Button States

**Like Button:**
- Default: Gray outline heart
- Liked: Red filled heart
- Disabled if disliked

**Dislike Button:**
- Default: Gray outline thumb down
- Disliked: Red filled thumb down
- Disabled if liked

**Follow Button:**
- Default: "Follow" - Primary color
- Following: "Following" - Primary outline
- Shows loading spinner during action

**Friend Button:**
- Default: "Add Friend" - Secondary
- Request sent: "Request pending" - Blue outline
- Received request: "Accept" - Blue outline
- Friends: "Friends" - Green outline
- Shows loading spinner during action

## Styling

All buttons use:
- Tailwind CSS utilities
- Semantic color tokens (primary, secondary, destructive, etc.)
- 44x44px minimum for touch targets
- Smooth transitions and active states
- Dark mode support

## Performance Tips

1. **Memoize profile lists** - Use useMemo for followers/friends to prevent unnecessary filtering
2. **Lazy load** - Only render visible items in long lists
3. **Batch notifications** - Combine multiple actions if possible
4. **Avoid re-renders** - Use useCallback for action handlers

## Common Patterns

### Display friend count in header
```tsx
<span>{state.friends.length} Friends</span>
```

### Check if user is friend
```tsx
const isFriend = state.friends.includes(userId)
```

### Get mutual friends
```tsx
const mutualFriends = state.friends.filter(fid => 
  otherUser.friends.includes(fid)
)
```

### Display follower info
```tsx
<div>
  {state.followers.length} followers
  {state.following.length} following
</div>
```

## Troubleshooting

**Social buttons not appearing:**
- Verify profile object has required fields
- Check if SocialButtons is imported correctly
- Ensure store provider wraps app

**Actions not persisting:**
- Check localStorage isn't full
- Verify store persistence is enabled
- Check browser console for errors

**Notifications not showing:**
- Verify notification type is correct
- Check if profileId matches
- Ensure NotificationsView is connected

## Mobile Optimization

- All buttons are 44x44px minimum
- Touch-friendly spacing (gap-2 = 8px)
- Smooth scrolling with momentum
- Optimized for one-handed operation
- Loading indicators for all actions

## Accessibility

- ARIA labels on all interactive elements
- Semantic button elements (not divs)
- Color not the only indicator of state
- Keyboard navigable
- Screen reader friendly

## Future Integration Points

The social features are designed to integrate with:
1. **Backend API** - Replace localStorage with API calls
2. **Real-time updates** - WebSocket for follower notifications
3. **Analytics** - Track social engagement metrics
4. **Recommendations** - Suggest followers based on interests
5. **Moderation** - Flag/review social abuse
