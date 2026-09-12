package com.nova.assistant.data.local

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.nova.assistant.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

/**
 * ApiKeyManager manages secure persistent storage of the Gemini API Key on device
 * using AndroidX EncryptedSharedPreferences (AES-256 GCM scheme with Android Keystore).
 *
 * Priority Order:
 * 1. User-entered key via Nova Settings (Stored encrypted on device)
 * 2. Build-time BuildConfig.GEMINI_API_KEY (from local.properties / env)
 */
@Singleton
class ApiKeyManager @Inject constructor(
    private val context: Context
) {
    companion object {
        private const val TAG = "ApiKeyManager"
        private const val PREFS_FILE = "nova_secure_keys"
        private const val KEY_GEMINI_API_KEY = "user_gemini_api_key"
    }

    private val prefs: SharedPreferences by lazy {
        initSecurePreferences()
    }

    private val _apiKeyFlow = MutableStateFlow(getEffectiveApiKey())
    val apiKeyFlow: StateFlow<String> = _apiKeyFlow.asStateFlow()

    private fun initSecurePreferences(): SharedPreferences {
        return try {
            val masterKey = MasterKey.Builder(context, MasterKey.DEFAULT_MASTER_KEY_ALIAS)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                PREFS_FILE,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize EncryptedSharedPreferences, falling back to private prefs", e)
            context.getSharedPreferences("nova_private_keys", Context.MODE_PRIVATE)
        }
    }

    /**
     * Returns the user-saved API key from secure storage, or null if none is saved.
     */
    fun getUserApiKey(): String? {
        val key = prefs.getString(KEY_GEMINI_API_KEY, null)?.trim()
        return if (!key.isNullOrBlank()) key else null
    }

    /**
     * Determines the active API key according to resolution priority:
     * 1. User-entered key from Settings
     * 2. Build-time BuildConfig.GEMINI_API_KEY (from local.properties / env)
     */
    fun getEffectiveApiKey(): String {
        val userKey = getUserApiKey()
        if (!userKey.isNullOrBlank()) {
            return userKey
        }
        val buildKey = BuildConfig.GEMINI_API_KEY.trim()
        if (buildKey.isNotBlank() && buildKey != "DEMO_KEY") {
            return buildKey
        }
        return ""
    }

    /**
     * Checks if any valid API key is available (either user or build-time).
     */
    fun isKeyConfigured(): Boolean {
        return getEffectiveApiKey().isNotBlank()
    }

    /**
     * Whether the active key is provided by the user manually.
     */
    fun isUserKeyActive(): Boolean {
        return !getUserApiKey().isNullOrBlank()
    }

    /**
     * Formats a masked string for UI display, e.g. "AIza...9xQ2"
     */
    fun getMaskedKey(): String {
        val key = getEffectiveApiKey()
        if (key.isBlank()) return "Not Configured"
        if (key.length <= 8) return "••••••••"
        val start = key.take(4)
        val end = key.takeLast(4)
        return "$start••••••••$end"
    }

    /**
     * Save user API key securely with AES-256 encryption.
     */
    fun saveApiKey(key: String) {
        val trimmed = key.trim()
        prefs.edit().putString(KEY_GEMINI_API_KEY, trimmed).apply()
        _apiKeyFlow.value = getEffectiveApiKey()
    }

    /**
     * Remove the user-entered API key from secure storage.
     */
    fun clearUserApiKey() {
        prefs.edit().remove(KEY_GEMINI_API_KEY).apply()
        _apiKeyFlow.value = getEffectiveApiKey()
    }

    /**
     * Validates an API key by issuing a lightweight test query to the Gemini REST API.
     * Consumes 0 prompt tokens and confirms whether the key is active and authorized.
     */
    suspend fun validateApiKey(keyToTest: String): Result<Boolean> = withContext(Dispatchers.IO) {
        val trimmed = keyToTest.trim()
        if (trimmed.isBlank()) {
            return@withContext Result.failure(IllegalArgumentException("API Key cannot be empty"))
        }

        val client = OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.SECONDS)
            .build()

        val url = "https://generativelanguage.googleapis.com/v1beta/models?key=$trimmed"
        val request = Request.Builder()
            .url(url)
            .get()
            .build()

        try {
            val response = client.newCall(request).execute()
            response.use { resp ->
                if (resp.isSuccessful) {
                    Result.success(true)
                } else {
                    val code = resp.code
                    val message = when (code) {
                        400 -> "Invalid API key or unauthorized (HTTP 400)"
                        403 -> "API Key permission denied or quota exceeded (HTTP 403)"
                        404 -> "Service not found (HTTP 404)"
                        else -> "API key check returned HTTP $code"
                    }
                    Result.failure(Exception(message))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Network failure validating API key", e)
            Result.failure(Exception(e.localizedMessage ?: "Network connection error while testing key"))
        }
    }

    /**
     * Validates an API key and, if valid, saves it to secure persistent storage.
     */
    suspend fun validateAndSaveKey(key: String): Result<Boolean> {
        val result = validateApiKey(key)
        if (result.isSuccess) {
            saveApiKey(key)
        }
        return result
    }
}
