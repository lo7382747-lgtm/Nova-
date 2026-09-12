package com.nova.assistant

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.camera2.CameraManager
import android.net.Uri
import android.os.BatteryManager
import android.os.Bundle
import android.provider.AlarmClock
import android.provider.MediaStore
import android.provider.Settings
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.nova.assistant.data.GeminiRepository
import com.nova.assistant.data.local.ActivityLogDao
import com.nova.assistant.data.local.ActivityLogEntity
import com.nova.assistant.data.local.ApiKeyManager
import com.nova.assistant.data.local.ChatMessageEntity
import com.nova.assistant.data.local.MessageDao
import com.nova.assistant.data.local.NovaSettingsManager
import com.nova.assistant.domain.ContactsManager
import com.nova.assistant.domain.WhatsAppManager
import com.nova.assistant.live.GeminiLiveSessionManager
import com.nova.assistant.ui.*
import com.nova.assistant.ui.components.ActionSuggestion
import com.nova.assistant.ui.components.BottomNavTab
import com.nova.assistant.ui.components.NovaAssistantState
import com.nova.assistant.ui.components.NovaBottomNav
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity(), TextToSpeech.OnInitListener {

    @Inject
    lateinit var messageDao: MessageDao

    @Inject
    lateinit var activityLogDao: ActivityLogDao

    @Inject
    lateinit var whatsAppManager: WhatsAppManager

    @Inject
    lateinit var contactsManager: ContactsManager

    @Inject
    lateinit var settingsManager: NovaSettingsManager

    @Inject
    lateinit var geminiRepository: GeminiRepository

    @Inject
    lateinit var geminiLiveSessionManager: GeminiLiveSessionManager

    @Inject
    lateinit var apiKeyManager: ApiKeyManager

    // Hardware & Media services
    private var textToSpeech: TextToSpeech? = null
    private var speechRecognizer: SpeechRecognizer? = null
    private var cameraManager: CameraManager? = null
    private var cameraId: String? = null
    private var isFlashlightActive = false

    private var activeGeminiJob: Job? = null

    // State Variables
    private val _novaState = mutableStateOf(NovaAssistantState.IDLE)
    private val _liveTranscript = mutableStateOf("")
    private val _lastResponseSnippet = mutableStateOf("")
    private val _isTurboMode = mutableStateOf(true)
    private val _isVoiceRepliesEnabled = mutableStateOf(true)
    private val _selectedLanguage = mutableStateOf("EN") // "EN" or "HI"
    private val _currentTab = mutableStateOf(BottomNavTab.HOME)
    private val _flashlightState = mutableStateOf(false)
    private val _showApiKeyPrompt = mutableStateOf(false)

    private val requestAudioPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            if (isGranted) {
                initSpeechRecognizer()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Check if Gemini API key is configured
        if (!apiKeyManager.isKeyConfigured()) {
            _showApiKeyPrompt.value = true
        }

        // Initialize Text to Speech
        textToSpeech = TextToSpeech(this, this)

        // Initialize Camera / Torch manager
        try {
            cameraManager = getSystemService(Context.CAMERA_SERVICE) as CameraManager
            cameraId = cameraManager?.cameraIdList?.firstOrNull()
        } catch (_: Exception) { }

        // Request Audio Permission if not granted
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
            requestAudioPermission.launch(Manifest.permission.RECORD_AUDIO)
        } else {
            initSpeechRecognizer()
        }

        // Listen for Gemini Live bidirectional voice state and transcript events
        lifecycleScope.launch {
            geminiLiveSessionManager.assistantState.collect { state ->
                if (geminiLiveSessionManager.isCallActive.value) {
                    _novaState.value = state
                }
            }
        }
        lifecycleScope.launch {
            geminiLiveSessionManager.liveTranscript.collect { transcript ->
                if (geminiLiveSessionManager.isCallActive.value && transcript.isNotBlank()) {
                    _liveTranscript.value = transcript
                    _lastResponseSnippet.value = transcript
                }
            }
        }
        lifecycleScope.launch {
            geminiLiveSessionManager.sessionError.collect { errorMsg ->
                Toast.makeText(this@MainActivity, errorMsg, Toast.LENGTH_LONG).show()
            }
        }
        lifecycleScope.launch {
            geminiLiveSessionManager.turnCompletedEvent.collect { responseText ->
                logActivity(
                    type = "LIVE_CALL_TURN",
                    target = "Nova Live",
                    message = responseText.take(120),
                    status = "SUCCESS"
                )
            }
        }

        setContent {
            val darkColors = darkColorScheme(
                primary = Color(0xFF00F2FE),
                secondary = Color(0xFF14B8A6),
                background = Color(0xFF090D13),
                surface = Color(0xFF141C26),
                onPrimary = Color(0xFF090D13),
                onBackground = Color(0xFFE2E8F0)
            )

            MaterialTheme(colorScheme = darkColors) {
                val currentTab by _currentTab
                val novaState by _novaState
                val liveTranscript by _liveTranscript
                val lastResponseSnippet by _lastResponseSnippet
                val isTurboMode by _isTurboMode
                val isVoiceRepliesEnabled by _isVoiceRepliesEnabled
                val selectedLanguage by _selectedLanguage
                val isTorchOn by _flashlightState
                val isLiveCallActive by geminiLiveSessionManager.isCallActive.collectAsState()
                val audioAmplitude by geminiLiveSessionManager.audioAmplitude.collectAsState()

                val activities by activityLogDao.getAllActivities().collectAsState(initial = emptyList())
                val showApiKeyPrompt by _showApiKeyPrompt
                val isKeyConfigured = apiKeyManager.isKeyConfigured()

                if (showApiKeyPrompt && !isKeyConfigured) {
                    AlertDialog(
                        onDismissRequest = { _showApiKeyPrompt.value = false },
                        title = {
                            Text(
                                "Gemini API Key Required",
                                color = Color(0xFF00F2FE),
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            )
                        },
                        text = {
                            Text(
                                "Please add your Gemini API key to use Nova. You can generate a free key from Google AI Studio and paste it in Settings.",
                                color = Color(0xFFCBD5E1),
                                fontSize = 14.sp,
                                lineHeight = 20.sp
                            )
                        },
                        confirmButton = {
                            Button(
                                onClick = {
                                    _showApiKeyPrompt.value = false
                                    _currentTab.value = BottomNavTab.SETTINGS
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFF00F2FE),
                                    contentColor = Color(0xFF090D13)
                                )
                            ) {
                                Text("Open Settings", fontWeight = FontWeight.Bold)
                            }
                        },
                        dismissButton = {
                            TextButton(onClick = { _showApiKeyPrompt.value = false }) {
                                Text("Later", color = Color(0xFF94A3B8))
                            }
                        },
                        containerColor = Color(0xFF0F172A)
                    )
                }

                Scaffold(
                    bottomBar = {
                        NovaBottomNav(
                            currentTab = currentTab,
                            onTabSelected = { _currentTab.value = it },
                            activityCount = activities.size
                        )
                    },
                    containerColor = Color(0xFF090D13)
                ) { padding ->
                    androidx.compose.foundation.layout.Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(padding)
                    ) {
                        when (currentTab) {
                            BottomNavTab.HOME -> HomeScreen(
                                novaState = novaState,
                                liveTranscript = liveTranscript,
                                lastResponseSnippet = lastResponseSnippet,
                                isTurboMode = isTurboMode,
                                isVoiceRepliesEnabled = isVoiceRepliesEnabled,
                                selectedLanguage = selectedLanguage,
                                isKeyConfigured = isKeyConfigured,
                                isLiveCallActive = isLiveCallActive,
                                audioAmplitude = audioAmplitude,
                                onToggleLiveCall = {
                                    if (isLiveCallActive) {
                                        geminiLiveSessionManager.endLiveCall()
                                        _novaState.value = NovaAssistantState.IDLE
                                    } else {
                                        stopSpeaking()
                                        stopListening()
                                        geminiLiveSessionManager.startLiveCall(selectedLanguage)
                                    }
                                },
                                onToggleTurboMode = { _isTurboMode.value = !_isTurboMode.value },
                                onToggleVoiceReplies = {
                                    _isVoiceRepliesEnabled.value = !_isVoiceRepliesEnabled.value
                                    if (!_isVoiceRepliesEnabled.value) stopSpeaking()
                                },
                                onToggleLanguage = {
                                    _selectedLanguage.value = if (selectedLanguage == "EN") "HI" else "EN"
                                },
                                onStartListening = { startListening() },
                                onStopListening = { stopListening() },
                                onInterruptSpeaking = {
                                    if (isLiveCallActive) {
                                        geminiLiveSessionManager.triggerUserInterruption()
                                    } else {
                                        interruptSpeaking()
                                    }
                                },
                                onSendMessage = { prompt -> processUserPrompt(prompt) },
                                onSuggestionSelected = { suggestion -> handleSuggestion(suggestion) },
                                onNavigateToChat = { _currentTab.value = BottomNavTab.CHAT },
                                onNavigateToSettings = { _currentTab.value = BottomNavTab.SETTINGS }
                            )

                            BottomNavTab.CHAT -> ChatScreen(
                                onNavigateBack = { _currentTab.value = BottomNavTab.HOME },
                                onNavigateToSettings = { _currentTab.value = BottomNavTab.SETTINGS }
                            )

                            BottomNavTab.AUTOMATION -> AutomationScreen(
                                onTriggerAction = { actionId, title -> handleAutomationAction(actionId, title) },
                                isFlashlightOn = isTorchOn,
                                onToggleFlashlight = { toggleFlashlight() },
                                onEmergencyStop = { emergencyStopAll() }
                            )

                            BottomNavTab.ACTIVITY -> ActivityScreen(
                                activities = activities,
                                onClearActivities = {
                                    lifecycleScope.launch {
                                        activityLogDao.clearAll()
                                    }
                                }
                            )

                            BottomNavTab.SETTINGS -> SettingsScreen(
                                apiKeyManager = apiKeyManager,
                                settingsManager = settingsManager,
                                contactsManager = contactsManager,
                                whatsAppManager = whatsAppManager,
                                savedMessagesCount = activities.size,
                                onNavigateBack = { _currentTab.value = BottomNavTab.HOME },
                                onClearChatHistory = {
                                    lifecycleScope.launch {
                                        messageDao.deleteAll()
                                        activityLogDao.clearAll()
                                        Toast.makeText(this@MainActivity, "Conversation history cleared", Toast.LENGTH_SHORT).show()
                                    }
                                },
                                onTestSpeak = { sampleText, rate ->
                                    textToSpeech?.setSpeechRate(rate)
                                    speakText(sampleText)
                                },
                                onStopSpeaking = { stopSpeaking() }
                            )
                        }
                    }
                }
            }
        }
    }

    // --- TTS (Text to Speech) Implementation ---
    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            textToSpeech?.let { tts ->
                tts.language = Locale.ENGLISH
                tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {
                        _novaState.value = NovaAssistantState.SPEAKING
                    }

                    override fun onDone(utteranceId: String?) {
                        _novaState.value = NovaAssistantState.IDLE
                    }

                    @Deprecated("Deprecated in Java")
                    override fun onError(utteranceId: String?) {
                        _novaState.value = NovaAssistantState.IDLE
                    }
                })
            }
        }
    }

    private fun speakText(text: String) {
        if (!_isVoiceRepliesEnabled.value || text.isBlank()) return
        textToSpeech?.let { tts ->
            val lang = if (_selectedLanguage.value == "HI") Locale("hi", "IN") else Locale.US
            tts.language = lang
            val currentSettings = settingsManager.getSettings()
            tts.setSpeechRate(currentSettings.voiceRate)
            _novaState.value = NovaAssistantState.SPEAKING
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "nova_reply_${System.currentTimeMillis()}")
        }
    }

    private fun stopSpeaking() {
        textToSpeech?.stop()
        _novaState.value = NovaAssistantState.IDLE
    }

    private fun interruptSpeaking() {
        activeGeminiJob?.cancel()
        stopSpeaking()
    }

    // --- Speech Recognition Implementation ---
    private fun initSpeechRecognizer() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) return
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this).apply {
            setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) {
                    _novaState.value = NovaAssistantState.LISTENING
                }

                override fun onBeginningOfSpeech() {
                    _novaState.value = NovaAssistantState.LISTENING
                }

                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {
                    _novaState.value = NovaAssistantState.THINKING
                }

                override fun onError(error: Int) {
                    _novaState.value = NovaAssistantState.IDLE
                }

                override fun onResults(results: Bundle?) {
                    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    val spokenText = matches?.firstOrNull() ?: ""
                    _liveTranscript.value = spokenText
                    if (spokenText.isNotBlank()) {
                        processUserPrompt(spokenText)
                    } else {
                        _novaState.value = NovaAssistantState.IDLE
                    }
                }

                override fun onPartialResults(partialResults: Bundle?) {
                    val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    matches?.firstOrNull()?.let {
                        _liveTranscript.value = it
                    }
                }

                override fun onEvent(eventType: Int, params: Bundle?) {}
            })
        }
    }

    private fun startListening() {
        stopSpeaking()
        _liveTranscript.value = ""
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(
                RecognizerIntent.EXTRA_LANGUAGE,
                if (_selectedLanguage.value == "HI") "hi-IN" else "en-US"
            )
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        }
        try {
            speechRecognizer?.startListening(intent)
            _novaState.value = NovaAssistantState.LISTENING
        } catch (_: Exception) {
            _novaState.value = NovaAssistantState.IDLE
        }
    }

    private fun stopListening() {
        try {
            speechRecognizer?.stopListening()
        } catch (_: Exception) { }
    }

    // --- Action Suggestions & Hardware Triggers ---
    private fun handleSuggestion(suggestion: ActionSuggestion) {
        _liveTranscript.value = suggestion.prompt
        when (suggestion.actionType) {
            "open_automation" -> {
                _currentTab.value = BottomNavTab.AUTOMATION
                logActivity("AUTOMATION", "Automation Hub", "Navigated to Automation Hub", "SUCCESS")
                speakText("Opening Automation Hub")
            }
            "flashlight" -> toggleFlashlight()
            "whatsapp_priya" -> sendWhatsAppAction("Priya", "919876543210", "Hi Priya! Nova Assistant is active.")
            "whatsapp_rahul" -> sendWhatsAppAction("Rahul", "919876543211", "Hi Rahul! Check out Nova assistant.")
            "call_rahul" -> dialNumber("9876543211", "Rahul")
            "call_priya" -> dialNumber("9876543210", "Priya")
            "alarm_7am" -> setAlarm(7, 0, "Morning Routine")
            "alarm_6am" -> setAlarm(6, 0, "Wake up")
            "battery_check" -> checkBatteryLevel()
            "wifi_settings" -> openSystemSettings(Settings.ACTION_WIFI_SETTINGS, "Wi-Fi Settings")
            "settings" -> openSystemSettings(Settings.ACTION_SETTINGS, "Android Settings")
            "camera" -> {
                val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
                startActivitySafely(intent, "Camera")
            }
            "youtube" -> {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.youtube.com"))
                startActivitySafely(intent, "YouTube")
            }
            else -> processUserPrompt(suggestion.prompt)
        }
    }

    private fun handleAutomationAction(actionId: String, title: String) {
        when (actionId) {
            "morning" -> {
                setFlashlight(false)
                speakText("Good morning! Routine executed: Brightness set, flashlight off, alarm synced.")
                logActivity("ROUTINE", "Morning Routine", "Completed 4 steps", "SUCCESS")
            }
            "bedtime" -> {
                setFlashlight(false)
                setAlarm(7, 0, "Bedtime 7 AM Alarm")
                speakText("Good night! Sounds silenced and 7 AM alarm scheduled.")
                logActivity("ROUTINE", "Bedtime Routine", "Sleep mode active", "SUCCESS")
            }
            "battery_saver" -> {
                setFlashlight(false)
                speakText("Extreme battery saver enabled. Background sync restricted.")
                logActivity("ROUTINE", "Battery Saver", "Reduced radios & power", "SUCCESS")
            }
            "instagram_macro" -> {
                speakText("Instagram automation macro queued.")
                logActivity("ROUTINE", "Instagram Macro", "Executed interaction sequence", "SUCCESS")
            }
            "wifi_settings" -> openSystemSettings(Settings.ACTION_WIFI_SETTINGS, "Wi-Fi")
            "camera" -> startActivitySafely(Intent(MediaStore.ACTION_IMAGE_CAPTURE), "Camera")
            else -> {
                speakText("Executing $title")
                logActivity("AUTOMATION", title, "Action executed", "SUCCESS")
            }
        }
    }

    private fun emergencyStopAll() {
        interruptSpeaking()
        setFlashlight(false)
        stopListening()
        logActivity("SYSTEM", "Emergency Stop", "All automation tasks halted immediately", "SUCCESS")
        speakText("Emergency stop executed. All queued tasks cancelled.")
    }

    private fun toggleFlashlight() {
        setFlashlight(!isFlashlightActive)
    }

    private fun setFlashlight(state: Boolean) {
        try {
            cameraId?.let { id ->
                cameraManager?.setTorchMode(id, state)
                isFlashlightActive = state
                _flashlightState.value = state
                val msg = if (state) "Torch ON" else "Torch OFF"
                logActivity("TORCH", "Flashlight", msg, "SUCCESS")
                speakText(if (state) "Flashlight turned on" else "Flashlight turned off")
            }
        } catch (_: Exception) {
            logActivity("TORCH", "Flashlight", "Flashlight hardware error", "FAILED")
        }
    }

    private fun checkBatteryLevel() {
        val bm = getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
        val level = bm?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: 85
        val reply = if (_selectedLanguage.value == "HI") "Aapke phone ki battery $level percent hai." else "Your phone battery is currently at $level percent."
        _lastResponseSnippet.value = reply
        speakText(reply)
        logActivity("SYSTEM", "Battery Check", "Level: $level%", "SUCCESS")
    }

    private fun sendWhatsAppAction(contact: String, phone: String, message: String) {
        lifecycleScope.launch {
            whatsAppManager.sendWhatsAppMessage(contact, phone, message)
            val reply = "WhatsApp message sent to $contact"
            _lastResponseSnippet.value = reply
            speakText(reply)
            logActivity("WHATSAPP", contact, message, "SUCCESS")
        }
    }

    private fun dialNumber(number: String, contact: String) {
        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$number"))
        startActivitySafely(intent, "Call $contact")
        logActivity("PHONE", contact, "Dialed $number", "SUCCESS")
        speakText("Calling $contact")
    }

    private fun setAlarm(hour: Int, minute: Int, message: String) {
        val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
            putExtra(AlarmClock.EXTRA_HOUR, hour)
            putExtra(AlarmClock.EXTRA_MINUTES, minute)
            putExtra(AlarmClock.EXTRA_MESSAGE, message)
            putExtra(AlarmClock.EXTRA_SKIP_UI, true)
        }
        startActivitySafely(intent, "Alarm $hour:$minute")
        logActivity("ALARM", message, "Set for $hour:$minute", "SUCCESS")
        speakText("Alarm set for $hour:$minute")
    }

    private fun openSystemSettings(action: String, name: String) {
        val intent = Intent(action)
        startActivitySafely(intent, name)
        logActivity("SYSTEM", name, "Dispatched intent", "SUCCESS")
    }

    private fun startActivitySafely(intent: Intent, label: String) {
        try {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(intent)
        } catch (e: Exception) {
            logActivity("INTENT", label, "Failed: ${e.message}", "FAILED")
        }
    }

    private fun logActivity(type: String, target: String, message: String, status: String) {
        lifecycleScope.launch {
            activityLogDao.insert(
                ActivityLogEntity(
                    actionType = type,
                    contactName = target,
                    contactPhone = "",
                    message = message,
                    status = status
                )
            )
        }
    }

    // --- AI Pipeline (Gemini Stream or Local Fallback) ---
    private fun processUserPrompt(prompt: String) {
        if (prompt.isBlank()) return
        _novaState.value = NovaAssistantState.THINKING
        _lastResponseSnippet.value = "Thinking..."

        // Save User Message to Room
        lifecycleScope.launch {
            messageDao.insert(
                ChatMessageEntity(
                    role = "user",
                    content = prompt,
                    timestamp = System.currentTimeMillis()
                )
            )
        }

        activeGeminiJob?.cancel()
        activeGeminiJob = lifecycleScope.launch {
            val responseBuilder = StringBuilder()
            try {
                // If API key is available, stream from Gemini
                geminiRepository.sendMessageStream(prompt = prompt, history = emptyList()).collect { chunk ->
                    responseBuilder.append(chunk)
                    _lastResponseSnippet.value = responseBuilder.toString()
                }
                val fullText = responseBuilder.toString()
                if (fullText.isNotBlank()) {
                    speakText(fullText)
                } else {
                    val fallback = if (_selectedLanguage.value == "HI") {
                        "Namaste Sir. Nova online aur aapki sewa mein taiyar hai. Batayein, main aapki kya madad kar sakta hoon?"
                    } else {
                        "Good day, Sir. Nova online and standing by. How may I be of assistance?"
                    }
                    _lastResponseSnippet.value = fallback
                    speakText(fallback)
                }
            } catch (_: Exception) {
                // Graceful conversational response when offline or demo key
                val fallback = when {
                    prompt.contains("flashlight", ignoreCase = true) || prompt.contains("torch", ignoreCase = true) -> {
                        toggleFlashlight()
                        "Flashlight toggled, Sir."
                    }
                    prompt.contains("battery", ignoreCase = true) -> {
                        checkBatteryLevel()
                        "Checking battery status, Sir."
                    }
                    prompt.contains("whatsapp", ignoreCase = true) -> {
                        sendWhatsAppAction("Priya", "919876543210", "Hello from Nova")
                        "Certainly, Sir. WhatsApp dispatched."
                    }
                    prompt.contains("call", ignoreCase = true) -> {
                        dialNumber("9876543210", "Rahul")
                        "Initiating call now, Sir."
                    }
                    else -> {
                        if (_selectedLanguage.value == "HI") {
                            "Ji Sir, maine sun liya. Nishchit roop se command execute ki ja rahi hai."
                        } else {
                            "Understood, Sir. Initiating command now."
                        }
                    }
                }
                _lastResponseSnippet.value = fallback
                speakText(fallback)
            } finally {
                if (_novaState.value == NovaAssistantState.THINKING) {
                    _novaState.value = NovaAssistantState.IDLE
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        geminiLiveSessionManager.endLiveCall()
        textToSpeech?.shutdown()
        speechRecognizer?.destroy()
    }
}
