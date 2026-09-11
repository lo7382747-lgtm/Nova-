package com.nova.assistant.automation

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import androidx.core.content.ContextCompat

data class PermissionItem(
    val key: String,
    val title: String,
    val description: String,
    val isGranted: Boolean,
    val isAccessibility: Boolean = false
)

/**
 * AutomationPermissionManager
 * Validates and guides user through official Android permission screens.
 */
class AutomationPermissionManager(private val context: Context) {

    fun isAccessibilityServiceEnabled(): Boolean {
        val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager ?: return false
        val enabledServices = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_GENERIC)
        val expectedPackage = context.packageName
        return enabledServices.any { it.resolveInfo.serviceInfo.packageName == expectedPackage }
    }

    fun isPermissionGranted(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
    }

    fun openAccessibilitySettingsIntent(): Intent {
        return Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
    }

    fun getAutomationPermissionsStatus(): List<PermissionItem> {
        return listOf(
            PermissionItem(
                key = "accessibility",
                title = "Accessibility Service",
                description = "Enables UI tree inspection, clicking, scrolling, and entering text.",
                isGranted = isAccessibilityServiceEnabled(),
                isAccessibility = true
            ),
            PermissionItem(
                key = android.Manifest.permission.POST_NOTIFICATIONS,
                title = "Notifications",
                description = "Alerts you when automation routines finish or require confirmation.",
                isGranted = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                    isPermissionGranted(android.Manifest.permission.POST_NOTIFICATIONS)
                } else true
            ),
            PermissionItem(
                key = android.Manifest.permission.CALL_PHONE,
                title = "Phone Calls",
                description = "Permits automated phone calls to confirmed contacts.",
                isGranted = isPermissionGranted(android.Manifest.permission.CALL_PHONE)
            ),
            PermissionItem(
                key = android.Manifest.permission.SEND_SMS,
                title = "SMS Messages",
                description = "Permits sending messages upon user confirmation.",
                isGranted = isPermissionGranted(android.Manifest.permission.SEND_SMS)
            )
        )
    }
}
