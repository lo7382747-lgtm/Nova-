package com.nova.assistant.domain

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import com.nova.assistant.data.local.ActivityLogDao
import com.nova.assistant.data.local.ActivityLogEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.URLEncoder
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WhatsAppManager @Inject constructor(
    private val context: Context,
    private val activityLogDao: ActivityLogDao
) {
    companion object {
        const val WHATSAPP_PACKAGE = "com.whatsapp"
    }

    fun isWhatsAppInstalled(): Boolean {
        return try {
            context.packageManager.getPackageInfo(WHATSAPP_PACKAGE, PackageManager.GET_ACTIVITIES)
            true
        } catch (e: PackageManager.NameNotFoundException) {
            false
        }
    }

    suspend fun sendWhatsAppMessage(
        contactName: String,
        phoneNumber: String,
        message: String
    ): Result<Unit> = withContext(Dispatchers.IO) {
        val cleanPhone = phoneNumber.replace(Regex("[^0-9]"), "")
        val jid = "$cleanPhone@s.whatsapp.net"

        try {
            if (isWhatsAppInstalled()) {
                val sendIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_TEXT, message)
                    putExtra("jid", jid)
                    setPackage(WHATSAPP_PACKAGE)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(sendIntent)
            } else {
                val encodedText = URLEncoder.encode(message, "UTF-8")
                val webUri = Uri.parse("https://wa.me/$cleanPhone?text=$encodedText")
                val webIntent = Intent(Intent.ACTION_VIEW, webUri).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(webIntent)
            }

            activityLogDao.insert(
                ActivityLogEntity(
                    actionType = "whatsapp_message",
                    contactName = contactName,
                    contactPhone = phoneNumber,
                    message = message,
                    status = "sent",
                    timestamp = System.currentTimeMillis()
                )
            )
            Result.success(Unit)
        } catch (e: Exception) {
            activityLogDao.insert(
                ActivityLogEntity(
                    actionType = "whatsapp_message",
                    contactName = contactName,
                    contactPhone = phoneNumber,
                    message = message,
                    status = "failed",
                    failureReason = e.message ?: "Failed to dispatch intent",
                    timestamp = System.currentTimeMillis()
                )
            )
            Result.failure(e)
        }
    }
}
