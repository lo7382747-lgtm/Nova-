package com.nova.assistant.automation

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.os.Build
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * AutomationAccessibilityService
 * Real Android AccessibilityService for inspecting UI hierarchy, dispatching clicks,
 * gestures, and global actions.
 */
class AutomationAccessibilityService : AccessibilityService() {

    companion object {
        private var instance: AutomationAccessibilityService? = null

        fun getInstance(): AutomationAccessibilityService? = instance

        fun isConnected(): Boolean = instance != null

        private val _serviceState = MutableStateFlow(false)
        val serviceState: StateFlow<Boolean> = _serviceState.asStateFlow()
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        _serviceState.value = true
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Event-driven notification of window state and content changes
    }

    override fun onInterrupt() {
        // Handle interruption
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        _serviceState.value = false
    }

    fun getActiveWindowRoot(): AccessibilityNodeInfo? {
        return rootInActiveWindow
    }

    fun performClick(node: AccessibilityNodeInfo): Boolean {
        return if (node.isClickable) {
            node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
        } else {
            // Traverse up to nearest clickable parent
            var parent = node.parent
            var clicked = false
            while (parent != null && !clicked) {
                if (parent.isClickable) {
                    clicked = parent.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                }
                parent = parent.parent
            }
            clicked
        }
    }

    fun performLongClick(node: AccessibilityNodeInfo): Boolean {
        return if (node.isLongClickable) {
            node.performAction(AccessibilityNodeInfo.ACTION_LONG_CLICK)
        } else {
            var parent = node.parent
            var clicked = false
            while (parent != null && !clicked) {
                if (parent.isLongClickable) {
                    clicked = parent.performAction(AccessibilityNodeInfo.ACTION_LONG_CLICK)
                }
                parent = parent.parent
            }
            clicked
        }
    }

    fun performScroll(forward: Boolean): Boolean {
        val action = if (forward) {
            AccessibilityNodeInfo.ACTION_SCROLL_FORWARD
        } else {
            AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD
        }
        val root = rootInActiveWindow ?: return false
        return findScrollableNode(root)?.performAction(action) ?: false
    }

    private fun findScrollableNode(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        if (node.isScrollable) return node
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val scrollable = findScrollableNode(child)
            if (scrollable != null) return scrollable
        }
        return null
    }

    fun performGlobalBack(): Boolean {
        return performGlobalAction(GLOBAL_ACTION_BACK)
    }

    fun performGlobalHome(): Boolean {
        return performGlobalAction(GLOBAL_ACTION_HOME)
    }

    fun performGlobalRecents(): Boolean {
        return performGlobalAction(GLOBAL_ACTION_RECENTS)
    }

    fun performGlobalNotifications(): Boolean {
        return performGlobalAction(GLOBAL_ACTION_NOTIFICATIONS)
    }

    fun performGlobalQuickSettings(): Boolean {
        return performGlobalAction(GLOBAL_ACTION_QUICK_SETTINGS)
    }

    /**
     * Dispatches gesture strokes using official Android GestureDescription API.
     */
    fun dispatchSwipeGesture(
        startX: Float,
        startY: Float,
        endX: Float,
        endY: Float,
        durationMs: Long = 300L,
        onComplete: ((Boolean) -> Unit)? = null
    ) {
        val path = Path().apply {
            moveTo(startX, startY)
            lineTo(endX, endY)
        }
        val stroke = GestureDescription.StrokeDescription(path, 0, durationMs)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                onComplete?.invoke(true)
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                onComplete?.invoke(false)
            }
        }, null)
    }
}
