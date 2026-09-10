package com.nova.assistant.automation

import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.withTimeoutOrNull

/**
 * GestureExecutor
 * Dispatches swipe, tap, and drag gestures using official Accessibility APIs.
 */
object GestureExecutor {

    suspend fun executeGesture(
        gesture: String,
        startX: Float = 540f,
        startY: Float = 1200f,
        endX: Float = 540f,
        endY: Float = 400f,
        durationMs: Long = 300L
    ): Pair<ActionResult, VerificationResult> {
        val startTime = System.currentTimeMillis()
        val service = AutomationAccessibilityService.getInstance()
            ?: return Pair(
                ActionResult(false, "Accessibility Service is not connected", executionTimeMs = 0),
                VerificationResult(false, "SERVICE_DISCONNECTED")
            )

        // For standard scroll gestures, prefer semantic accessibility actions
        if (gesture == "swipe_up" || gesture == "scroll") {
            val scrolled = service.performScroll(forward = true)
            if (scrolled) {
                return Pair(
                    ActionResult(true, "Dispatched semantic scroll forward", executionTimeMs = System.currentTimeMillis() - startTime),
                    VerificationResult(true, "SEMANTIC_SCROLL_FORWARD")
                )
            }
        } else if (gesture == "swipe_down") {
            val scrolled = service.performScroll(forward = false)
            if (scrolled) {
                return Pair(
                    ActionResult(true, "Dispatched semantic scroll backward", executionTimeMs = System.currentTimeMillis() - startTime),
                    VerificationResult(true, "SEMANTIC_SCROLL_BACKWARD")
                )
            }
        }

        // Coordinate-based gesture dispatch fallback via GestureDescription
        val deferred = CompletableDeferred<Boolean>()
        service.dispatchSwipeGesture(startX, startY, endX, endY, durationMs) { success ->
            deferred.complete(success)
        }

        val completed = withTimeoutOrNull(durationMs + 1000L) {
            deferred.await()
        } ?: false

        return Pair(
            ActionResult(
                success = completed,
                message = "Executed gesture '$gesture' ($startX, $startY -> $endX, $endY)",
                executionTimeMs = System.currentTimeMillis() - startTime
            ),
            VerificationResult(completed, if (completed) "GESTURE_COMPLETED" else "GESTURE_CANCELLED_OR_FAILED")
        )
    }
}
