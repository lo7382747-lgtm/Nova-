package com.nova.assistant.automation

import java.util.UUID

/**
 * Production Action Validator
 * Safeguards system from malformed AI output and security violations.
 */
object ActionValidator {

    private const val MIN_TIMEOUT_MS = 100L
    private const val MAX_TIMEOUT_MS = 60000L
    private const val MAX_RETRY_COUNT = 5

    private val RESTRICTED_PACKAGES = setOf(
        "com.google.android.apps.nfc",
        "com.android.settings.security",
        "com.google.android.apps.walletnfcrel",
        "com.phonepe.app",
        "net.one97.paytm",
        "com.google.android.apps.authenticator2"
    )

    fun validate(rawAction: Action, sensitiveDenylist: List<String> = emptyList()): ValidationResult {
        val errors = mutableListOf<String>()

        // 1. Validate ID
        val actionId = if (rawAction.actionId.isNotBlank()) {
            rawAction.actionId
        } else {
            "act-${UUID.randomUUID()}"
        }

        // 2. Validate Parameters based on ActionType
        val params = rawAction.parameters
        when (rawAction.actionType) {
            ActionType.APP_ACTION -> {
                val appOrPkg = params["appName"] as? String ?: params["packageName"] as? String
                if (appOrPkg.isNullOrBlank()) {
                    errors.add("APP_ACTION requires 'appName' or 'packageName'")
                } else {
                    val lower = appOrPkg.lowercase()
                    if (RESTRICTED_PACKAGES.contains(lower) || sensitiveDenylist.any { lower.contains(it.lowercase()) }) {
                        errors.add("Package '$appOrPkg' is restricted by security policy")
                    }
                }
            }
            ActionType.UI_ACTION -> {
                val op = params["operation"] as? String
                val validOps = setOf("click", "long_click", "focus", "select", "scroll", "back", "find", "wait")
                if (op == null || !validOps.contains(op)) {
                    errors.add("UI_ACTION requires valid 'operation' (click, long_click, focus, scroll, back, find, wait)")
                }
            }
            ActionType.GESTURE_ACTION -> {
                val gesture = params["gesture"] as? String
                val validGestures = setOf("tap", "long_press", "double_tap", "swipe_up", "swipe_down", "swipe_left", "swipe_right", "drag", "scroll")
                if (gesture == null || !validGestures.contains(gesture)) {
                    errors.add("GESTURE_ACTION requires valid 'gesture' name")
                }
            }
            ActionType.TEXT_ACTION -> {
                val op = params["operation"] as? String
                val validOps = setOf("enter", "replace", "append", "clear", "submit", "focus")
                if (op == null || !validOps.contains(op)) {
                    errors.add("TEXT_ACTION requires valid 'operation' (enter, replace, append, clear, submit, focus)")
                }
                if (setOf("enter", "replace", "append").contains(op) && params["text"] !is String) {
                    errors.add("TEXT_ACTION operation '$op' requires a string 'text' parameter")
                }
            }
            ActionType.DELAY_ACTION -> {
                val duration = (params["durationMs"] as? Number)?.toLong()
                if (duration == null || duration < 0 || duration > 30000L) {
                    errors.add("DELAY_ACTION requires 'durationMs' between 0 and 30000")
                }
            }
            else -> {
                // Other action types permitted with default safety limits
            }
        }

        // 3. Validate Timeout
        val sanitizedTimeout = rawAction.timeout.coerceIn(MIN_TIMEOUT_MS, MAX_TIMEOUT_MS)

        // 4. Validate Retry Count
        val sanitizedRetry = rawAction.retryCount.coerceIn(0, MAX_RETRY_COUNT)

        val sanitized = rawAction.copy(
            actionId = actionId,
            timeout = sanitizedTimeout,
            retryCount = sanitizedRetry
        )

        return ValidationResult(
            valid = errors.isEmpty(),
            errors = errors,
            sanitizedAction = if (errors.isEmpty()) sanitized else null
        )
    }
}
