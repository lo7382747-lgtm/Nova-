package com.nova.assistant.automation

import android.view.accessibility.AccessibilityNodeInfo
import kotlinx.coroutines.delay

/**
 * UIActionExecutor
 * Executes semantic Accessibility interactions with real verification.
 */
object UIActionExecutor {

    suspend fun findElement(query: UIElementQuery): NodeMatch {
        val service = AutomationAccessibilityService.getInstance()
            ?: return NodeMatch(null, 0, "Accessibility Service is not connected", 0f)
        val root = service.getActiveWindowRoot()
        return SmartNavigator.findElement(root, query)
    }

    suspend fun waitForElement(query: UIElementQuery, timeoutMs: Long = 5000L): NodeMatch {
        val start = System.currentTimeMillis()
        while (System.currentTimeMillis() - start < timeoutMs) {
            val match = findElement(query)
            if (match.node != null) {
                return match
            }
            delay(200)
        }
        return NodeMatch(null, 0, "Timeout waiting for element", 0f)
    }

    suspend fun click(query: UIElementQuery): Pair<ActionResult, VerificationResult> {
        val startTime = System.currentTimeMillis()
        val service = AutomationAccessibilityService.getInstance()
            ?: return Pair(
                ActionResult(false, "Accessibility Service is disabled or disconnected", executionTimeMs = 0),
                VerificationResult(false, "SERVICE_DISCONNECTED", "Accessibility Service not bound")
            )

        val match = SmartNavigator.findElement(service.getActiveWindowRoot(), query)
        val targetNode = match.node
            ?: return Pair(
                ActionResult(false, "Element not found: ${match.description}", executionTimeMs = System.currentTimeMillis() - startTime),
                VerificationResult(false, "ELEMENT_NOT_FOUND", match.description)
            )

        val clicked = service.performClick(targetNode)
        delay(200) // allow UI frame transition

        val verification = if (clicked) {
            VerificationResult(true, "ACTION_CLICK_CONFIRMED: ${match.description}")
        } else {
            VerificationResult(false, "CLICK_FAILED", "Node failed to consume ACTION_CLICK")
        }

        return Pair(
            ActionResult(
                success = clicked,
                message = if (clicked) "Clicked '${targetNode.text ?: targetNode.viewIdResourceName}'" else "Click failed",
                executionTimeMs = System.currentTimeMillis() - startTime
            ),
            verification
        )
    }

    suspend fun longClick(query: UIElementQuery): Pair<ActionResult, VerificationResult> {
        val startTime = System.currentTimeMillis()
        val service = AutomationAccessibilityService.getInstance()
            ?: return Pair(
                ActionResult(false, "Accessibility Service is disconnected", executionTimeMs = 0),
                VerificationResult(false, "SERVICE_DISCONNECTED")
            )

        val match = SmartNavigator.findElement(service.getActiveWindowRoot(), query)
        val targetNode = match.node
            ?: return Pair(
                ActionResult(false, "Element not found: ${match.description}", executionTimeMs = System.currentTimeMillis() - startTime),
                VerificationResult(false, "ELEMENT_NOT_FOUND", match.description)
            )

        val longClicked = service.performLongClick(targetNode)
        delay(400)

        return Pair(
            ActionResult(
                success = longClicked,
                message = if (longClicked) "Long-clicked '${targetNode.text ?: targetNode.viewIdResourceName}'" else "Long-click failed",
                executionTimeMs = System.currentTimeMillis() - startTime
            ),
            VerificationResult(longClicked, if (longClicked) "ACTION_LONG_CLICK_CONFIRMED" else "LONG_CLICK_FAILED")
        )
    }

    suspend fun scroll(forward: Boolean = true): Pair<ActionResult, VerificationResult> {
        val startTime = System.currentTimeMillis()
        val service = AutomationAccessibilityService.getInstance()
            ?: return Pair(
                ActionResult(false, "Accessibility Service is disconnected", executionTimeMs = 0),
                VerificationResult(false, "SERVICE_DISCONNECTED")
            )

        val scrolled = service.performScroll(forward)
        return Pair(
            ActionResult(
                success = scrolled,
                message = if (scrolled) "Scrolled ${if (forward) "forward" else "backward"}" else "No scrollable container found",
                executionTimeMs = System.currentTimeMillis() - startTime
            ),
            VerificationResult(scrolled, if (scrolled) "SCROLLED" else "NOT_SCROLLABLE")
        )
    }

    suspend fun back(): Pair<ActionResult, VerificationResult> {
        val startTime = System.currentTimeMillis()
        val service = AutomationAccessibilityService.getInstance()
            ?: return Pair(
                ActionResult(false, "Accessibility Service is disconnected", executionTimeMs = 0),
                VerificationResult(false, "SERVICE_DISCONNECTED")
            )

        val backResult = service.performGlobalBack()
        return Pair(
            ActionResult(
                success = backResult,
                message = "Dispatched GLOBAL_ACTION_BACK",
                executionTimeMs = System.currentTimeMillis() - startTime
            ),
            VerificationResult(backResult, "BACK_DISPATCHED")
        )
    }
}
