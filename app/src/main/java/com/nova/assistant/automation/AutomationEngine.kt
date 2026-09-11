package com.nova.assistant.automation

import android.content.Context
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.ConcurrentLinkedQueue

data class EngineStatus(
    val state: ExecutionState,
    val planTitle: String = "",
    val activeAction: Action? = null,
    val completedCount: Int = 0,
    val totalCount: Int = 0,
    val isEmergencyStopped: Boolean = false,
    val errorMessage: String? = null
)

/**
 * Production AutomationEngine
 * Coordinates sequential actions, queue management, timeouts, retries,
 * failure recovery, verification, and emergency stops.
 */
class AutomationEngine(private val context: Context) {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var executionJob: Job? = null

    private val actionQueue = ConcurrentLinkedQueue<Action>()
    private val actionHistory = mutableListOf<Action>()

    private val _engineStatus = MutableStateFlow(EngineStatus(ExecutionState.IDLE))
    val engineStatus: StateFlow<EngineStatus> = _engineStatus.asStateFlow()

    private val appControlExecutor = AppControlExecutor(context)
    private val permissionManager = AutomationPermissionManager(context)

    /**
     * EMERGENCY STOP: Cancels all active and queued actions immediately.
     */
    fun emergencyStop(reason: String = "User requested EMERGENCY STOP") {
        executionJob?.cancel(CancellationException(reason))
        actionQueue.clear()

        _engineStatus.value = _engineStatus.value.copy(
            state = ExecutionState.CANCELLED,
            isEmergencyStopped = true,
            errorMessage = reason
        )
    }

    /**
     * Resets the emergency stop latch.
     */
    fun resetEmergencyStop() {
        _engineStatus.value = EngineStatus(ExecutionState.IDLE)
    }

    /**
     * Executes an automation plan with validation, timeouts, retries, and verification.
     */
    fun executePlan(
        title: String,
        actions: List<Action>,
        onResult: (Boolean, String) -> Unit
    ) {
        if (_engineStatus.value.isEmergencyStopped) {
            onResult(false, "Engine is in Emergency Stop state. Reset required.")
            return
        }

        executionJob?.cancel()
        executionJob = scope.launch {
            _engineStatus.value = EngineStatus(
                state = ExecutionState.PLANNING,
                planTitle = title,
                totalCount = actions.size
            )

            // 1. Validation Phase
            _engineStatus.value = _engineStatus.value.copy(state = ExecutionState.VALIDATING)
            val validatedActions = mutableListOf<Action>()

            for (act in actions) {
                val validation = ActionValidator.validate(act)
                if (!validation.valid || validation.sanitizedAction == null) {
                    val errMsg = "Action validation failed: ${validation.errors.joinToString("; ")}"
                    _engineStatus.value = _engineStatus.value.copy(
                        state = ExecutionState.FAILED,
                        errorMessage = errMsg
                    )
                    onResult(false, errMsg)
                    return@launch
                }
                validatedActions.add(validation.sanitizedAction)
            }

            // Sort by priority descending
            validatedActions.sortByDescending { it.priority }
            actionQueue.clear()
            actionQueue.addAll(validatedActions)

            var completedCount = 0

            // 2. Execution Loop
            while (!actionQueue.isEmpty()) {
                if (!isActive || _engineStatus.value.isEmergencyStopped) {
                    _engineStatus.value = _engineStatus.value.copy(state = ExecutionState.CANCELLED)
                    onResult(false, "Automation cancelled.")
                    return@launch
                }

                val currentAction = actionQueue.poll() ?: break
                _engineStatus.value = _engineStatus.value.copy(
                    state = ExecutionState.EXECUTING,
                    activeAction = currentAction,
                    completedCount = completedCount
                )

                // Permission check
                if (currentAction.requiredPermissions.isNotEmpty()) {
                    val missing = currentAction.requiredPermissions.filter { !permissionManager.isPermissionGranted(it) }
                    if (missing.isNotEmpty()) {
                        _engineStatus.value = _engineStatus.value.copy(
                            state = ExecutionState.WAITING_PERMISSION,
                            errorMessage = "Missing permissions: ${missing.joinToString()}"
                        )
                        onResult(false, "Permission required: ${missing.joinToString()}")
                        return@launch
                    }
                }

                // Execute action with retries and timeout
                val success = executeWithRetry(currentAction)

                if (success) {
                    completedCount++
                    actionHistory.add(currentAction.copy(executionState = ExecutionState.COMPLETED))
                } else {
                    _engineStatus.value = _engineStatus.value.copy(
                        state = ExecutionState.FAILED,
                        errorMessage = currentAction.error ?: "Action execution failed"
                    )
                    onResult(false, currentAction.error ?: "Failed to execute ${currentAction.actionType}")
                    return@launch
                }
            }

            _engineStatus.value = _engineStatus.value.copy(
                state = ExecutionState.COMPLETED,
                activeAction = null,
                completedCount = completedCount
            )
            onResult(true, "Successfully executed $completedCount actions for '$title'")
        }
    }

    private suspend fun executeWithRetry(action: Action): Boolean {
        var attempts = 0
        val maxRetries = action.retryCount

        while (attempts <= maxRetries) {
            if (attempts > 0) {
                _engineStatus.value = _engineStatus.value.copy(state = ExecutionState.RETRYING)
                delay(500L) // UI reinspection backoff
            }

            _engineStatus.value = _engineStatus.value.copy(state = ExecutionState.EXECUTING)

            try {
                // Enforce timeout per action
                val resultPair = withTimeout(action.timeout) {
                    dispatchAction(action)
                }

                // 3. Verification Phase
                _engineStatus.value = _engineStatus.value.copy(state = ExecutionState.VERIFYING)
                action.result = resultPair.first
                action.verificationResult = resultPair.second

                if (resultPair.first.success && resultPair.second.verified) {
                    action.executionState = ExecutionState.COMPLETED
                    return true
                }

                attempts++
            } catch (e: TimeoutCancellationException) {
                action.executionState = ExecutionState.TIMEOUT
                action.error = "Action timed out after ${action.timeout}ms"
                return false
            } catch (e: Exception) {
                attempts++
                action.error = e.message
            }
        }

        action.executionState = ExecutionState.FAILED
        return false
    }

    private suspend fun dispatchAction(action: Action): Pair<ActionResult, VerificationResult> {
        val params = action.parameters
        return when (action.actionType) {
            ActionType.APP_ACTION -> {
                val pkg = params["packageName"] as? String ?: "com.android.settings"
                appControlExecutor.launchApp(pkg)
            }
            ActionType.UI_ACTION -> {
                val query = UIElementQuery(
                    resourceId = params["resourceId"] as? String,
                    contentDescription = params["contentDescription"] as? String,
                    text = params["text"] as? String
                )
                val op = params["operation"] as? String ?: "click"
                when (op) {
                    "long_click" -> UIActionExecutor.longClick(query)
                    "scroll" -> UIActionExecutor.scroll(forward = true)
                    "back" -> UIActionExecutor.back()
                    else -> UIActionExecutor.click(query)
                }
            }
            ActionType.GESTURE_ACTION -> {
                val gesture = params["gesture"] as? String ?: "tap"
                GestureExecutor.executeGesture(gesture)
            }
            ActionType.TEXT_ACTION -> {
                val query = UIElementQuery(
                    resourceId = params["resourceId"] as? String,
                    text = params["targetText"] as? String
                )
                val text = params["text"] as? String ?: ""
                val mode = params["operation"] as? String ?: "enter"
                TextExecutor.enterText(query, text, mode)
            }
            ActionType.DELAY_ACTION -> {
                val ms = (params["durationMs"] as? Number)?.toLong() ?: 1000L
                delay(ms)
                Pair(
                    ActionResult(true, "Delayed ${ms}ms", executionTimeMs = ms),
                    VerificationResult(true, "DELAY_COMPLETED")
                )
            }
            else -> {
                Pair(
                    ActionResult(true, "Executed ${action.actionType}"),
                    VerificationResult(true, "DEFAULT_EXECUTED")
                )
            }
        }
    }
}
