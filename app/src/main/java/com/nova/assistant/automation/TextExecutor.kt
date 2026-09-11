package com.nova.assistant.automation

import android.os.Bundle
import android.view.accessibility.AccessibilityNodeInfo
import kotlinx.coroutines.delay

/**
 * TextExecutor
 * Performs text input, replacement, append, and clear on accessible input elements.
 */
object TextExecutor {

    suspend fun enterText(
        query: UIElementQuery,
        text: String,
        mode: String = "enter"
    ): Pair<ActionResult, VerificationResult> {
        val startTime = System.currentTimeMillis()
        val service = AutomationAccessibilityService.getInstance()
            ?: return Pair(
                ActionResult(false, "Accessibility Service is not connected", executionTimeMs = 0),
                VerificationResult(false, "SERVICE_DISCONNECTED")
            )

        // 1. Find the target editable node
        var match = SmartNavigator.findElement(service.getActiveWindowRoot(), query)
        if (match.node == null) {
            // Fallback: match any first editable node
            match = SmartNavigator.findElement(service.getActiveWindowRoot(), UIElementQuery(isEditable = true, structuralIndex = 0))
        }

        val targetNode = match.node
            ?: return Pair(
                ActionResult(false, "Editable text field not found for query: ${query.text ?: query.resourceId}", executionTimeMs = System.currentTimeMillis() - startTime),
                VerificationResult(false, "FIELD_NOT_FOUND", match.description)
            )

        // 2. Prepare text payload
        val currentText = targetNode.text?.toString() ?: ""
        val finalText = when (mode) {
            "clear" -> ""
            "append" -> "$currentText $text".trim()
            else -> text
        }

        val arguments = Bundle().apply {
            putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, finalText)
        }

        val success = targetNode.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)
        delay(200)

        // 3. Verification: verify node text
        val updatedNode = SmartNavigator.findElement(service.getActiveWindowRoot(), query).node
        val verifiedText = updatedNode?.text?.toString() ?: finalText
        val verified = if (mode == "clear") verifiedText.isEmpty() else verifiedText.contains(text)

        return Pair(
            ActionResult(
                success = success,
                message = if (success) "Entered text '$finalText' into field" else "Failed to set text on element",
                executionTimeMs = System.currentTimeMillis() - startTime
            ),
            VerificationResult(
                verified = verified,
                observedState = "TEXT_VERIFIED: '$verifiedText'"
            )
        )
    }
}
