package com.nova.assistant.data.local

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONArray
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

data class SensitiveAppItem(
    val id: String,
    val name: String,
    val packageName: String,
    val category: String = "Payment / Security"
)

data class NovaSettingsState(
    val voicePersona: String = "calm_relaxed", // bilingual, natural_warm, crystal_clear, calm_relaxed
    val speechClarityEnhancer: Boolean = true,
    val voiceRate: Float = 0.92f, // Calm, measured pace (J.A.R.V.I.S. cadence)
    val voiceLanguage: String = "auto", // auto, en, hi
    val voiceRepliesEnabled: Boolean = true,
    val instantVoiceEnabled: Boolean = true,
    val autoListenEnabled: Boolean = false,
    val persistentListeningEnabled: Boolean = true,
    val avatarVisualMode: String = "orb", // avatar, orb
    val fullPhoneControlEnabled: Boolean = false,
    val visionFallbackEnabled: Boolean = false,
    val floatingBubbleEnabled: Boolean = false,
    val ownerRecognitionEnabled: Boolean = true,
    val biometricThreshold: Float = 0.85f,
    val simulatedSpeaker: String = "owner", // owner, stranger
    val isOwnerEnrolled: Boolean = true,
    val sensitiveApps: List<SensitiveAppItem> = listOf(
        SensitiveAppItem("1", "Google Pay", "com.google.android.apps.nbu.paisa.user", "Finance"),
        SensitiveAppItem("2", "PhonePe", "com.phonepe.app", "Finance"),
        SensitiveAppItem("3", "Paytm", "net.one97.paytm", "Finance"),
        SensitiveAppItem("4", "WhatsApp", "com.whatsapp", "Messaging")
    ),
    val trustedVoices: List<String> = listOf("Primary Owner (You)", "Rahul (Brother)")
)

@Singleton
class NovaSettingsManager @Inject constructor(
    private val context: Context
) {
    private val prefs: SharedPreferences = context.getSharedPreferences("nova_user_settings", Context.MODE_PRIVATE)

    private val _settingsFlow = MutableStateFlow(loadSettings())
    val settingsFlow: StateFlow<NovaSettingsState> = _settingsFlow.asStateFlow()

    fun getSettings(): NovaSettingsState = _settingsFlow.value

    private fun loadSettings(): NovaSettingsState {
        val voicePersona = prefs.getString("voice_persona", "calm_relaxed") ?: "calm_relaxed"
        val speechClarity = prefs.getBoolean("speech_clarity", true)
        val voiceRate = prefs.getFloat("voice_rate", 0.92f)
        val voiceLanguage = prefs.getString("voice_language", "auto") ?: "auto"
        val voiceReplies = prefs.getBoolean("voice_replies", true)
        val instantVoice = prefs.getBoolean("instant_voice", true)
        val autoListen = prefs.getBoolean("auto_listen", false)
        val persistentListen = prefs.getBoolean("persistent_listen", true)
        val avatarMode = prefs.getString("avatar_visual_mode", "orb") ?: "orb"
        val fullControl = prefs.getBoolean("full_phone_control", false)
        val visionFallback = prefs.getBoolean("vision_fallback", false)
        val floatingBubble = prefs.getBoolean("floating_bubble", false)
        val ownerRecog = prefs.getBoolean("owner_recognition", true)
        val threshold = prefs.getFloat("biometric_threshold", 0.85f)
        val simulatedSpeaker = prefs.getString("simulated_speaker", "owner") ?: "owner"
        val isOwnerEnrolled = prefs.getBoolean("is_owner_enrolled", true)

        val rawAppsJson = prefs.getString("sensitive_apps_json", null)
        val sensitiveApps = if (rawAppsJson != null) {
            try {
                val array = JSONArray(rawAppsJson)
                val list = mutableListOf<SensitiveAppItem>()
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    list.add(
                        SensitiveAppItem(
                            id = obj.optString("id", System.currentTimeMillis().toString()),
                            name = obj.optString("name", ""),
                            packageName = obj.optString("packageName", ""),
                            category = obj.optString("category", "Finance")
                        )
                    )
                }
                list
            } catch (e: Exception) {
                defaultSensitiveApps()
            }
        } else {
            defaultSensitiveApps()
        }

        val rawTrusted = prefs.getStringSet("trusted_voices_set", setOf("Primary Owner (You)", "Rahul (Brother)"))
            ?.toList() ?: listOf("Primary Owner (You)", "Rahul (Brother)")

        return NovaSettingsState(
            voicePersona = voicePersona,
            speechClarityEnhancer = speechClarity,
            voiceRate = voiceRate,
            voiceLanguage = voiceLanguage,
            voiceRepliesEnabled = voiceReplies,
            instantVoiceEnabled = instantVoice,
            autoListenEnabled = autoListen,
            persistentListeningEnabled = persistentListen,
            avatarVisualMode = avatarMode,
            fullPhoneControlEnabled = fullControl,
            visionFallbackEnabled = visionFallback,
            floatingBubbleEnabled = floatingBubble,
            ownerRecognitionEnabled = ownerRecog,
            biometricThreshold = threshold,
            simulatedSpeaker = simulatedSpeaker,
            isOwnerEnrolled = isOwnerEnrolled,
            sensitiveApps = sensitiveApps,
            trustedVoices = rawTrusted
        )
    }

    private fun defaultSensitiveApps(): List<SensitiveAppItem> = listOf(
        SensitiveAppItem("1", "Google Pay", "com.google.android.apps.nbu.paisa.user", "Finance"),
        SensitiveAppItem("2", "PhonePe", "com.phonepe.app", "Finance"),
        SensitiveAppItem("3", "Paytm", "net.one97.paytm", "Finance"),
        SensitiveAppItem("4", "WhatsApp", "com.whatsapp", "Messaging")
    )

    fun updateSettings(transform: (NovaSettingsState) -> NovaSettingsState) {
        val updated = transform(_settingsFlow.value)
        _settingsFlow.value = updated

        prefs.edit().apply {
            putString("voice_persona", updated.voicePersona)
            putBoolean("speech_clarity", updated.speechClarityEnhancer)
            putFloat("voice_rate", updated.voiceRate)
            putString("voice_language", updated.voiceLanguage)
            putBoolean("voice_replies", updated.voiceRepliesEnabled)
            putBoolean("instant_voice", updated.instantVoiceEnabled)
            putBoolean("auto_listen", updated.autoListenEnabled)
            putBoolean("persistent_listen", updated.persistentListeningEnabled)
            putString("avatar_visual_mode", updated.avatarVisualMode)
            putBoolean("full_phone_control", updated.fullPhoneControlEnabled)
            putBoolean("vision_fallback", updated.visionFallbackEnabled)
            putBoolean("floating_bubble", updated.floatingBubbleEnabled)
            putBoolean("owner_recognition", updated.ownerRecognitionEnabled)
            putFloat("biometric_threshold", updated.biometricThreshold)
            putString("simulated_speaker", updated.simulatedSpeaker)
            putBoolean("is_owner_enrolled", updated.isOwnerEnrolled)

            val array = JSONArray()
            updated.sensitiveApps.forEach { item ->
                val obj = JSONObject().apply {
                    put("id", item.id)
                    put("name", item.name)
                    put("packageName", item.packageName)
                    put("category", item.category)
                }
                array.put(obj)
            }
            putString("sensitive_apps_json", array.toString())
            putStringSet("trusted_voices_set", updated.trustedVoices.toSet())
            apply()
        }
    }

    fun addSensitiveApp(name: String, packageName: String, category: String = "Protected") {
        updateSettings { current ->
            val newItem = SensitiveAppItem(
                id = System.currentTimeMillis().toString(),
                name = name,
                packageName = packageName,
                category = category
            )
            current.copy(sensitiveApps = current.sensitiveApps + newItem)
        }
    }

    fun removeSensitiveApp(id: String) {
        updateSettings { current ->
            current.copy(sensitiveApps = current.sensitiveApps.filter { it.id != id })
        }
    }

    fun addTrustedVoice(name: String) {
        updateSettings { current ->
            if (current.trustedVoices.contains(name)) current
            else current.copy(trustedVoices = current.trustedVoices + name)
        }
    }
}
