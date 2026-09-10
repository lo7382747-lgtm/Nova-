package com.nova.assistant.automation

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings

/**
 * AppControlExecutor
 * Launches apps, handles Android deep links (ACTION_VIEW), Sharesheet (ACTION_SEND),
 * and system settings panels using official Android Intents.
 */
class AppControlExecutor(private val context: Context) {

    fun launchApp(packageName: String): Pair<ActionResult, VerificationResult> {
        val startTime = System.currentTimeMillis()
        val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)
            ?: return Pair(
                ActionResult(false, "Application with package '$packageName' is not installed", executionTimeMs = System.currentTimeMillis() - startTime),
                VerificationResult(false, "APP_NOT_INSTALLED")
            )

        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
        context.startActivity(launchIntent)

        return Pair(
            ActionResult(
                success = true,
                message = "Launched application '$packageName' via Android Intent",
                executionTimeMs = System.currentTimeMillis() - startTime
            ),
            VerificationResult(true, "INTENT_LAUNCHED: $packageName")
        )
    }

    fun openDeepLink(uriString: String): Pair<ActionResult, VerificationResult> {
        val startTime = System.currentTimeMillis()
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uriString)).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        return try {
            context.startActivity(intent)
            Pair(
                ActionResult(true, "Dispatched ACTION_VIEW for '$uriString'", executionTimeMs = System.currentTimeMillis() - startTime),
                VerificationResult(true, "DEEP_LINK_OPENED")
            )
        } catch (e: Exception) {
            Pair(
                ActionResult(false, "Failed to resolve deep link: ${e.message}", executionTimeMs = System.currentTimeMillis() - startTime),
                VerificationResult(false, "INTENT_RESOLVE_FAILED", e.message)
            )
        }
    }

    fun sendShareIntent(text: String, mimeType: String = "text/plain"): Pair<ActionResult, VerificationResult> {
        val startTime = System.currentTimeMillis()
        val sendIntent = Intent(Intent.ACTION_SEND).apply {
            type = mimeType
            putExtra(Intent.EXTRA_TEXT, text)
        }
        val shareIntent = Intent.createChooser(sendIntent, "Share with Nova").apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        return try {
            context.startActivity(shareIntent)
            Pair(
                ActionResult(true, "Opened Android Sharesheet for text share", executionTimeMs = System.currentTimeMillis() - startTime),
                VerificationResult(true, "SHARESHEET_DISPATCHED")
            )
        } catch (e: Exception) {
            Pair(
                ActionResult(false, "Failed to open Sharesheet: ${e.message}", executionTimeMs = System.currentTimeMillis() - startTime),
                VerificationResult(false, "SHARESHEET_FAILED", e.message)
            )
        }
    }

    fun openSystemSettings(settingAction: String): Pair<ActionResult, VerificationResult> {
        val startTime = System.currentTimeMillis()
        val action = when (settingAction.lowercase()) {
            "bluetooth" -> Settings.ACTION_BLUETOOTH_SETTINGS
            "wifi" -> Settings.ACTION_WIFI_SETTINGS
            "display" -> Settings.ACTION_DISPLAY_SETTINGS
            "accessibility" -> Settings.ACTION_ACCESSIBILITY_SETTINGS
            "sound" -> Settings.ACTION_SOUND_SETTINGS
            else -> Settings.ACTION_SETTINGS
        }

        val intent = Intent(action).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        return try {
            context.startActivity(intent)
            Pair(
                ActionResult(true, "Opened system settings panel: $settingAction", executionTimeMs = System.currentTimeMillis() - startTime),
                VerificationResult(true, "SETTINGS_OPENED")
            )
        } catch (e: Exception) {
            Pair(
                ActionResult(false, "Failed to open settings panel: ${e.message}", executionTimeMs = System.currentTimeMillis() - startTime),
                VerificationResult(false, "SETTINGS_FAILED", e.message)
            )
        }
    }
}
