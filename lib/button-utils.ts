/**
 * Button action utilities for robust, indestructible action handling.
 * Prevents double-clicks, handles errors, and provides feedback.
 */

type ActionCallback<T = void> = () => Promise<T> | T

interface ActionOptions {
  minDuration?: number
  maxDuration?: number
  onError?: (error: Error) => void
  onSuccess?: () => void
}

/**
 * Debounces button clicks to prevent double-submission and race conditions.
 * Returns a handler that can only be triggered once per minDuration.
 */
export function createDebouncedAction<T = void>(
  callback: ActionCallback<T>,
  options: ActionOptions = {},
) {
  const { minDuration = 300, maxDuration = 30000, onError, onSuccess } = options

  let isRunning = false
  let lastRunTime = 0

  return async (e?: React.MouseEvent | React.KeyboardEvent) => {
    // Prevent default browser behavior
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Prevent double-click within minDuration
    const now = Date.now()
    if (isRunning || now - lastRunTime < minDuration) {
      return
    }

    isRunning = true
    lastRunTime = now

    const startTime = Date.now()

    try {
      // Enforce max duration to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Action timeout")),
          maxDuration,
        )
      })

      const resultPromise = Promise.resolve(callback())
      await Promise.race([resultPromise, timeoutPromise])

      onSuccess?.()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error("[ButtonUtils] Action failed:", err)
      onError?.(err)
    } finally {
      // Ensure minimum duration has passed before allowing next action
      const elapsed = Date.now() - startTime
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed))
      }
      isRunning = false
    }
  }
}

/**
 * Wraps a callback with try-catch and optional error handling.
 */
export function safeAction<T = void>(
  callback: ActionCallback<T>,
  onError?: (error: Error) => void,
) {
  return async () => {
    try {
      return await Promise.resolve(callback())
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error("[SafeAction] Error:", err)
      onError?.(err)
      throw err
    }
  }
}

/**
 * Validates that a button action is safe to execute.
 * Returns true if action should proceed, false otherwise.
 */
export function validateButtonAction(conditions: {
  isDisabled?: boolean
  isLoading?: boolean
  requiresAuth?: boolean
  isAuthenticated?: boolean
  customCheck?: () => boolean
}): boolean {
  const {
    isDisabled = false,
    isLoading = false,
    requiresAuth = false,
    isAuthenticated = true,
    customCheck = () => true,
  } = conditions

  return (
    !isDisabled &&
    !isLoading &&
    (!requiresAuth || isAuthenticated) &&
    customCheck()
  )
}

/**
 * Handles keyboard events for buttons (Enter and Space keys).
 */
export function handleButtonKeyDown(
  e: React.KeyboardEvent,
  callback: () => void,
) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    callback()
  }
}
