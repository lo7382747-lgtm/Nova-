package com.nova.assistant.automation

import android.graphics.Rect

/**
 * Advanced Android Automation Module — Part 1
 * Core Action Models & State Machine
 */

enum class ActionType {
    APP_ACTION,
    UI_ACTION,
    GESTURE_ACTION,
    TEXT_ACTION,
    MEDIA_ACTION,
    SYSTEM_ACTION,
    DELAY_ACTION,
    CONDITION_ACTION,
    AUTOMATION_CHAIN
}

enum class ExecutionState {
    IDLE,
    PLANNING,
    VALIDATING,
    WAITING_PERMISSION,
    WAITING_CONFIRMATION,
    EXECUTING,
    VERIFYING,
    RETRYING,
    COMPLETED,
    FAILED,
    CANCELLED,
    TIMEOUT
}

data class ActionResult(
    val success: Boolean,
    val message: String,
    val data: Map<String, Any?>? = null,
    val executionTimeMs: Long = 0
)

data class VerificationResult(
    val verified: Boolean,
    val observedState: String,
    val failureReason: String? = null
)

data class UIElementQuery(
    val resourceId: String? = null,
    val contentDescription: String? = null,
    val text: String? = null,
    val isClickable: Boolean? = null,
    val isEditable: Boolean? = null,
    val structuralIndex: Int? = null
)

data class Action(
    val actionId: String,
    val actionType: ActionType,
    val parameters: Map<String, Any?> = emptyMap(),
    val timeout: Long = 10000L,
    val retryCount: Int = 2,
    val requiredPermissions: List<String> = emptyList(),
    var executionState: ExecutionState = ExecutionState.IDLE,
    var result: ActionResult? = null,
    var error: String? = null,
    var verificationResult: VerificationResult? = null,
    val priority: Int = 1
)

data class ValidationResult(
    val valid: Boolean,
    val errors: List<String>,
    val sanitizedAction: Action? = null
)
