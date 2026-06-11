/**
 * Security & Input Validation Module
 * Prevents XSS, injection attacks, and enforces business rules
 */

// Sanitize user input to prevent XSS attacks
export function sanitizeInput(input: string, maxLength = 500): string {
  if (typeof input !== "string") return ""

  return input
    .trim()
    .slice(0, maxLength)
    // Remove dangerous characters and HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, "")
    // Escape special characters for safe display
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

// Validate bio/profile text
export function validateBio(text: string): { valid: boolean; error?: string } {
  const sanitized = sanitizeInput(text, 500)
  if (!sanitized) return { valid: false, error: "Bio cannot be empty" }
  if (sanitized.length < 10) return { valid: false, error: "Bio must be at least 10 characters" }
  return { valid: true }
}

// Validate name
export function validateName(name: string): { valid: boolean; error?: string } {
  const sanitized = sanitizeInput(name, 100)
  if (!sanitized) return { valid: false, error: "Name cannot be empty" }
  if (sanitized.length < 2) return { valid: false, error: "Name must be at least 2 characters" }
  if (sanitized.length > 50) return { valid: false, error: "Name must be less than 50 characters" }
  // Basic name format check (alphanumeric + spaces)
  if (!/^[\p{L}\p{N}\s'-]{2,50}$/u.test(sanitized)) {
    return { valid: false, error: "Name contains invalid characters" }
  }
  return { valid: true }
}

// Validate age
export function validateAge(age: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(age) || age < 18 || age > 120) {
    return { valid: false, error: "Age must be between 18 and 120" }
  }
  return { valid: true }
}

// Validate location
export function validateLocation(city: string, country: string): { valid: boolean; error?: string } {
  const cityValid = sanitizeInput(city, 100)
  const countryValid = sanitizeInput(country, 100)

  if (!cityValid || !countryValid) {
    return { valid: false, error: "City and country are required" }
  }
  return { valid: true }
}

// Detect potential spam patterns
export function isSpamLikely(text: string): boolean {
  const lower = text.toLowerCase()

  // Check for excessive links
  const linkCount = (lower.match(/https?:\/\/|www\./g) || []).length
  if (linkCount > 2) return true

  // Check for repeated characters
  if (/(.)\1{4,}/.test(text)) return true

  // Check for ALL CAPS (more than 50%)
  const capsCount = (text.match(/[A-Z]/g) || []).length
  if (text.length > 20 && capsCount / text.length > 0.5) return true

  // Check for excessive punctuation
  const punctCount = (text.match(/[!?]{2,}/g) || []).length
  if (punctCount > 3) return true

  return false
}

// Check for SQL injection patterns (defense in depth)
export function containsSuspiciousPatterns(text: string): boolean {
  const suspicious = [
    /(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/i,
    /(-{2}|\/\*|\*\/|;|\\x00)/,
    /(\${.*}|`.*`|\$\(.*\))/,
  ]

  return suspicious.some((pattern) => pattern.test(text))
}

// Rate limit check helper
export function isRateLimited(
  currentCount: number,
  limit: number,
  resetTime: number,
  windowMs: number,
): boolean {
  if (Date.now() - resetTime >= windowMs) {
    return false // Window has passed, not rate limited
  }
  return currentCount >= limit
}

// Generate safe ID from user input (prevent ID collision attacks)
export function generateSafeId(userId: string): string {
  // Use only safe characters and limit length
  return `${userId.toLowerCase().replace(/[^a-z0-9-]/g, "")}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    .slice(0, 50)
}
