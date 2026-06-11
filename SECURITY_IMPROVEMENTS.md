# GH Connect - Security & Logic Improvements

## Overview
Implemented comprehensive security hardening and business logic improvements to prevent abuse, ensure data integrity, and enhance user safety.

---

## Security Enhancements

### 1. **Enhanced Rate Limiting System**
**Problem**: Original rate limiting reset only on app restart, allowing unlimited activity within a session.

**Solution**:
- Implemented 24-hour sliding windows for both likes and messages
- Counters persist across sessions with automatic reset after window expires
- Configurable limits:
  - **Likes**: 60 per 24 hours
  - **Messages**: 120 per 24 hours
  - **Per-user messages**: 20 per 24 hour to prevent harassment

**Implementation** (`lib/store.tsx`):
```typescript
const LIKE_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours
const SAME_USER_MESSAGE_LIMIT = 20

// State now tracks reset times
likeResetTime: number
messageResetTime: number
```

### 2. **Input Validation & Sanitization**
**Problem**: No validation of user input, vulnerable to XSS and injection attacks.

**Solution**: Created comprehensive validation module (`lib/validation.ts`):
- **XSS Prevention**: HTML tags and dangerous characters stripped
- **Injection Prevention**: SQL injection patterns detected
- **Spam Detection**: Detects caps lock abuse, excessive punctuation, repeated characters
- **Length Enforcement**: Configurable max lengths per field
- **Character Validation**: Regex-based format checking

**Key Functions**:
```typescript
sanitizeInput(input, maxLength) // Removes dangerous chars
validateBio(text) // 10-500 chars, no tags
validateName(name) // 2-50 chars, alphanumeric + spaces
isSpamLikely(text) // Detects spam patterns
containsSuspiciousPatterns(text) // SQL/injection detection
```

### 3. **Blocking & Reporting System**
**Problem**: No way to report abusive users or prevent interaction with blocked users.

**Solution**:
- **Enhanced blocking**: Automatically removes conversations with blocked users
- **Reporting system**: Users marked as reported are:
  - Auto-blocked to prevent future interaction
  - Hidden from discovery
  - Tracked for moderation
- New state field: `reported: string[]`

**Implementation**:
```typescript
reportUser: (id, reason) => {
  // Auto-blocks and removes conversations
  // Prevents any future interaction
}
```

### 4. **Message-Level Security**
**Problem**: No validation of message content, vulnerable to spam and abuse.

**Solution**:
- Message text sanitization (trim, limit to 1000 chars)
- Per-user spam limit: prevent targeting single user
- Block verification: can't message blocked users
- Empty message prevention
- Detailed error reasons for UX clarity

### 5. **Like Action Hardening**
**Problem**: Could like same user multiple times; no check for blocked users.

**Solution**:
- Prevents duplicate likes (idempotent operation)
- Prevents liking blocked users
- Prevents liking self
- Rate limit window management

### 6. **Discovery Feed Security**
**Problem**: Reported/blocked users could still appear in suggestions.

**Solution**: Enhanced `matchScore()` and discovery functions:
- Filters reported users from discovery
- Filters blocked users from discovery
- Prevents self-recommendations
- Removed from daily suggestions as well

---

## Business Logic Improvements

### 1. **Self-Interaction Prevention**
Added check to prevent showing current user to themselves in discovery.

```typescript
.filter((p) => p.id !== me.id)
```

### 2. **Data Integrity**
- All array operations use immutable patterns
- State mutations validated before applying
- Duplicate prevention in connections and likes

### 3. **Error Messaging**
Enhanced `sendMessage()` return type to include error reasons:
```typescript
{ ok: boolean; limited: boolean; reason?: string }
```

This provides UX clarity on why operations failed.

### 4. **Spam Detection Heuristics**
Multi-layered spam detection:
- Excessive links (>2 per message)
- Repeated characters (4+ consecutive)
- ALL CAPS overuse (>50% of message)
- Excessive punctuation (!!, ??, etc.)

---

## Configuration & Limits

```typescript
// Time windows
LIKE_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours
MESSAGE_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

// Rate limits
LIKE_LIMIT = 60 per window
MESSAGE_LIMIT = 120 per window
SAME_USER_MESSAGE_LIMIT = 20 per day

// Text lengths
Bio: 10-500 characters
Name: 2-50 characters
Message: max 1000 characters
```

---

## API Changes

### `useStore()` Hook

**New Action**:
```typescript
reportUser: (id: string, reason: string) => void
```

**Enhanced Actions**:
```typescript
sendMessage: (...) => { ok: boolean; limited: boolean; reason?: string }
```

**Enhanced State**:
```typescript
reported: string[] // New field
likeResetTime: number // New field
messageResetTime: number // New field
```

---

## Data Flow Security

1. **Input → Sanitization → Validation → Storage**
   - All user inputs sanitized before state update
   - Validation ensures business rule compliance
   - State immutably updated

2. **Discovery → Filtering → Ranking → Display**
   - Blocked/reported users filtered first
   - Match scoring prevents promotion of suspicious profiles
   - UI never displays filtered users

3. **Rate Limiting → Action → Notification**
   - Check limits before allowing action
   - Track in state with reset times
   - Provide user feedback on limits

---

## Future Enhancements

- [ ] Server-side rate limiting (when backend added)
- [ ] Machine learning for spam detection
- [ ] Profile verification system
- [ ] Moderation dashboard
- [ ] Auto-ban system for repeated violations
- [ ] Two-factor authentication
- [ ] Session management with timeouts

---

## Testing Recommendations

1. Test rate limit window reset across sessions
2. Verify blocked users don't appear anywhere
3. Test spam detection with various patterns
4. Verify message sanitization edge cases
5. Test per-user message limits
6. Verify reported users auto-blocked

---

## Deployment Notes

- State schema updated: v1 → requires migration
- localStorage key unchanged for compatibility
- Backward compatible: old state loads and sanitizes
- No breaking changes to components
