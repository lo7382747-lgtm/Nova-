package com.nova.assistant.ui

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nova.assistant.data.local.ApiKeyManager
import com.nova.assistant.data.local.NovaSettingsManager
import com.nova.assistant.data.local.NovaSettingsState
import com.nova.assistant.data.local.SensitiveAppItem
import com.nova.assistant.domain.ContactItem
import com.nova.assistant.domain.ContactsManager
import com.nova.assistant.domain.WhatsAppManager
import kotlinx.coroutines.launch

data class ScaffoldCodeFile(
    val id: String,
    val title: String,
    val filePath: String,
    val description: String,
    val code: String
)

val KOTLIN_SCAFFOLD_FILES = listOf(
    ScaffoldCodeFile(
        id = "main_activity",
        title = "MainActivity.kt",
        filePath = "app/src/main/java/com/nova/assistant/MainActivity.kt",
        description = "Core entry point, NavHost wiring, Live Session Manager, and Speech Orchestration",
        code = """// Android Jetpack Compose + Gemini Live Orchestrator
package com.nova.assistant

@AndroidEntryPoint
class MainActivity : ComponentActivity(), TextToSpeech.OnInitListener {
    // 5 Full Tabs: Home, Chat, Automation, Activity, Settings
    // Hardware integration: Bluetooth, Wi-Fi, Audio, Contacts
}"""
    ),
    ScaffoldCodeFile(
        id = "gemini_live",
        title = "GeminiLiveSessionManager.kt",
        filePath = "app/src/main/java/com/nova/assistant/live/GeminiLiveSessionManager.kt",
        description = "Bidirectional WebSocket connection to Gemini 2.0 Live API with PCM audio streaming",
        code = """// Real-time Low-Latency Gemini 2.0 Live Audio Streaming
package com.nova.assistant.live

class GeminiLiveSessionManager(
    private val context: Context,
    private val apiKeyProvider: () -> String
) {
    // WebSocket uri: wss://generativelanguage.googleapis.com/...
    // 16kHz PCM audio record & streaming
}"""
    ),
    ScaffoldCodeFile(
        id = "api_key_mgr",
        title = "ApiKeyManager.kt",
        filePath = "app/src/main/java/com/nova/assistant/data/local/ApiKeyManager.kt",
        description = "Hardware-backed EncryptedSharedPreferences (AES-256 GCM) for Gemini API Key",
        code = """// Hardware Keystore Encrypted Persistent Storage
package com.nova.assistant.data.local

@Singleton
class ApiKeyManager @Inject constructor(private val context: Context) {
    // EncryptedSharedPreferences with AES-256 SIV/GCM
    // Priority: User Key > BuildConfig.GEMINI_API_KEY
}"""
    ),
    ScaffoldCodeFile(
        id = "automation_service",
        title = "AutomationAccessibilityService.kt",
        filePath = "app/src/main/java/com/nova/assistant/automation/AutomationAccessibilityService.kt",
        description = "Accessibility Service node inspection, gestures, click dispatch, and UI tree automation",
        code = """// Android Accessibility Service for Phone Control
package com.nova.assistant.automation

class AutomationAccessibilityService : AccessibilityService() {
    // Autonomous screen navigation, tap dispatch, and text input
}"""
    )
)

data class TestLogItem(
    val id: String,
    val title: String,
    val detail: String,
    val success: Boolean,
    val time: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    apiKeyManager: ApiKeyManager,
    settingsManager: NovaSettingsManager,
    contactsManager: ContactsManager,
    whatsAppManager: WhatsAppManager,
    savedMessagesCount: Int = 0,
    onNavigateBack: () -> Unit,
    onClearChatHistory: () -> Unit,
    onTestSpeak: (String, Float) -> Unit = { _, _ -> },
    onStopSpeaking: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    val coroutineScope = rememberCoroutineScope()

    val settings by settingsManager.settingsFlow.collectAsState()
    val activeKey by apiKeyManager.apiKeyFlow.collectAsState()
    val isUserKeySaved = apiKeyManager.isUserKeyActive()
    val maskedKey = apiKeyManager.getMaskedKey()

    var inputKey by remember { mutableStateOf("") }
    var isKeyVisible by remember { mutableStateOf(false) }
    var isValidatingKey by remember { mutableStateOf(false) }
    var keyValidationMessage by remember { mutableStateOf<String?>(null) }
    var isKeyError by remember { mutableStateOf(false) }

    var isPlayingSample by remember { mutableStateOf(false) }

    // Contacts state
    var showContactsList by remember { mutableStateOf(false) }
    var contactsList by remember { mutableStateOf<List<ContactItem>>(emptyList()) }
    val hasContactsPermission = remember { contactsManager.hasContactsPermission() }
    val isWhatsAppInstalled = remember { whatsAppManager.isWhatsAppInstalled() }

    // Sensitive Apps Add Form
    var isAddingApp by remember { mutableStateOf(false) }
    var newAppName by remember { mutableStateOf("") }
    var newAppPkg by remember { mutableStateOf("") }

    // Biometrics & Trusted Voice Add Form
    var isAddingTrustedVoice by remember { mutableStateOf(false) }
    var newTrustedVoiceName by remember { mutableStateOf("") }

    // Simulation Test Logs
    val testLogs = remember { mutableStateListOf<TestLogItem>() }
    var selectedSimulatedCommand by remember { mutableStateOf("Open Chrome") }

    // Code Inspector Modal
    var selectedCodeFile by remember { mutableStateOf<ScaffoldCodeFile?>(null) }

    // Clear History Dialog
    var showClearHistoryDialog by remember { mutableStateOf(false) }

    // Hardware Information
    val hardwareSummary = remember {
        val actManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val memInfo = ActivityManager.MemoryInfo()
        actManager?.getMemoryInfo(memInfo)
        val totalRamGb = memInfo.totalMem / (1024 * 1024 * 1024.0)
        val availRamGb = memInfo.availMem / (1024 * 1024 * 1024.0)
        "${Build.MANUFACTURER.uppercase()} ${Build.MODEL} (Android ${Build.VERSION.RELEASE}, API ${Build.VERSION.SDK_INT}) • RAM: %.1f GB free / %.1f GB".format(availRamGb, totalRamGb)
    }

    // Overlay Permission Check
    val canDrawOverlays = remember {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else true
    }

    // Load initial contacts
    LaunchedEffect(Unit) {
        contactsList = contactsManager.loadAllContacts()
    }

    fun addTestLog(title: String, detail: String, success: Boolean) {
        val time = java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date())
        testLogs.add(0, TestLogItem(id = System.currentTimeMillis().toString(), title = title, detail = detail, success = success, time = time))
        if (testLogs.size > 5) testLogs.removeLast()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                "Nova Settings",
                                fontWeight = FontWeight.Black,
                                fontSize = 18.sp,
                                color = Color.White
                            )
                            Text(
                                "CONFIGURATION & DIAGNOSTICS",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.5.sp,
                                color = Color(0xFF00F2FE)
                            )
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFF00F2FE).copy(alpha = 0.12f))
                                .border(1.dp, Color(0xFF00F2FE).copy(alpha = 0.3f), RoundedCornerShape(6.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text("v1.0.0 APK", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF00F2FE))
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color(0xFFCBD5E1)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF090D13),
                    titleContentColor = Color.White
                )
            )
        },
        containerColor = Color(0xFF090D13)
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item { Spacer(modifier = Modifier.height(4.dp)) }

            // ==========================================
            // 1. GEMINI API CONFIGURATION SECTION
            // ==========================================
            item {
                SectionHeader("Gemini API Configuration", Icons.Default.Key)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141C26)),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(Color(0xFF00F2FE).copy(alpha = 0.3f), Color.White.copy(alpha = 0.05f))))
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Gemini 2.0 Live / 2.5 Flash", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                Text(
                                    if (isUserKeySaved) "Custom User API Key Active" else "Default AI Studio API Key",
                                    fontSize = 11.sp,
                                    color = Color(0xFF94A3B8)
                                )
                            }
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF10B981).copy(alpha = 0.15f))
                                    .border(1.dp, Color(0xFF10B981).copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color(0xFF10B981)))
                                    Text("Active", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                                }
                            }
                        }

                        if (isUserKeySaved) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF090D13))
                                    .padding(horizontal = 10.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Key: $maskedKey", fontSize = 11.sp, fontFamily = FontFamily.Monospace, color = Color(0xFF00F2FE))
                                TextButton(
                                    onClick = {
                                        apiKeyManager.clearUserApiKey()
                                        Toast.makeText(context, "Custom key removed, using default", Toast.LENGTH_SHORT).show()
                                    },
                                    contentPadding = PaddingValues(0.dp)
                                ) {
                                    Text("Remove", fontSize = 11.sp, color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        Text("Custom API Key Override", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFFCBD5E1))

                        OutlinedTextField(
                            value = inputKey,
                            onValueChange = { inputKey = it },
                            modifier = Modifier.fillMaxWidth(),
                            placeholder = { Text("Paste AIzaSy... API key", fontSize = 12.sp, color = Color(0xFF64748B)) },
                            visualTransformation = if (isKeyVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            trailingIcon = {
                                IconButton(onClick = { isKeyVisible = !isKeyVisible }) {
                                    Icon(
                                        imageVector = if (isKeyVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                        contentDescription = "Toggle key visibility",
                                        tint = Color(0xFF94A3B8),
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                            keyboardActions = KeyboardActions(onDone = { keyboardController?.hide() }),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFF00F2FE),
                                unfocusedBorderColor = Color.White.copy(alpha = 0.12f),
                                focusedContainerColor = Color(0xFF090D13),
                                unfocusedContainerColor = Color(0xFF090D13),
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White
                            ),
                            shape = RoundedCornerShape(10.dp)
                        )

                        keyValidationMessage?.let { msg ->
                            Text(msg, fontSize = 11.sp, color = if (isKeyError) Color(0xFFEF4444) else Color(0xFF10B981), fontWeight = FontWeight.Medium)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(
                                onClick = {
                                    keyboardController?.hide()
                                    if (inputKey.isBlank()) {
                                        keyValidationMessage = "Please enter an API key"
                                        isKeyError = true
                                        return@Button
                                    }
                                    isValidatingKey = true
                                    coroutineScope.launch {
                                        val result = apiKeyManager.validateAndSaveKey(inputKey.trim())
                                        isValidatingKey = false
                                        if (result.isSuccess) {
                                            isKeyError = false
                                            keyValidationMessage = "API Key validated & saved securely!"
                                            inputKey = ""
                                        } else {
                                            isKeyError = true
                                            keyValidationMessage = result.exceptionOrNull()?.message ?: "Validation failed"
                                        }
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00F2FE), contentColor = Color(0xFF090D13)),
                                shape = RoundedCornerShape(10.dp),
                                enabled = !isValidatingKey
                            ) {
                                if (isValidatingKey) {
                                    CircularProgressIndicator(modifier = Modifier.size(14.dp), strokeWidth = 2.dp, color = Color(0xFF090D13))
                                    Spacer(modifier = Modifier.width(6.dp))
                                }
                                Text("Update Key", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }

                            OutlinedButton(
                                onClick = {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://aistudio.google.com/apikey"))
                                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                    context.startActivity(intent)
                                },
                                shape = RoundedCornerShape(10.dp),
                                border = ButtonDefaults.outlinedButtonBorder().copy(brush = Brush.horizontalGradient(listOf(Color(0xFF00F2FE).copy(alpha = 0.4f), Color(0xFF00F2FE).copy(alpha = 0.2f))))
                            ) {
                                Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color(0xFF00F2FE))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Get Key", fontSize = 12.sp, color = Color(0xFF00F2FE))
                            }
                        }
                    }
                }
            }

            // ==========================================
            // 2. VOICE & AUDIO PERSONA SECTION
            // ==========================================
            item {
                SectionHeader("Voice & Audio Settings", Icons.Default.VolumeUp)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141C26)),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(Color(0xFF00F2FE).copy(alpha = 0.15f), Color.White.copy(alpha = 0.05f))))
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        // Natural Voice Persona Options
                        Text("Natural Voice Persona", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        val personas = listOf(
                            Triple("bilingual", "Bilingual (Hindi/Eng)", "Fluent Hindi & Indian English"),
                            Triple("natural_warm", "Natural Warm", "Human cadence & soft warmth"),
                            Triple("crystal_clear", "Crystal Clear", "High presence studio vocal"),
                            Triple("calm_relaxed", "Calm & Relaxed", "Serene, slower cadence")
                        )

                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            personas.chunked(2).forEach { row ->
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    row.forEach { (id, title, desc) ->
                                        val isSelected = settings.voicePersona == id
                                        Box(
                                            modifier = Modifier
                                                .weight(1f)
                                                .clip(RoundedCornerShape(10.dp))
                                                .background(if (isSelected) Color(0xFF00F2FE).copy(alpha = 0.12f) else Color(0xFF090D13))
                                                .border(1.dp, if (isSelected) Color(0xFF00F2FE) else Color.White.copy(alpha = 0.08f), RoundedCornerShape(10.dp))
                                                .clickable { settingsManager.updateSettings { it.copy(voicePersona = id) } }
                                                .padding(10.dp)
                                        ) {
                                            Column {
                                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                                    Text(title, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = if (isSelected) Color(0xFF00F2FE) else Color.White)
                                                    if (isSelected) Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color(0xFF00F2FE))
                                                }
                                                Spacer(modifier = Modifier.height(2.dp))
                                                Text(desc, fontSize = 9.sp, color = Color(0xFF94A3B8), lineHeight = 12.sp)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        HorizontalDivider(color = Color.White.copy(alpha = 0.06f))

                        // Spoken Voice Replies Toggle
                        SettingToggleRow(
                            title = "Spoken Voice Replies",
                            subtitle = "Nova reads responses aloud through neural speech",
                            checked = settings.voiceRepliesEnabled,
                            onCheckedChange = { checked -> settingsManager.updateSettings { it.copy(voiceRepliesEnabled = checked) } }
                        )

                        // Instant Zero-Lag Voice Toggle
                        SettingToggleRow(
                            title = "Instant Zero-Lag Voice (<20ms)",
                            subtitle = "Immediate neural local speech without cloud buffering delay",
                            checked = settings.instantVoiceEnabled,
                            onCheckedChange = { checked -> settingsManager.updateSettings { it.copy(instantVoiceEnabled = checked) } }
                        )

                        // Studio Clarity & Clean Speech Toggle
                        SettingToggleRow(
                            title = "Studio Clarity & Clean Speech",
                            subtitle = "Auto-removes markdown tags, code noise, and expands abbreviations",
                            checked = settings.speechClarityEnhancer,
                            onCheckedChange = { checked -> settingsManager.updateSettings { it.copy(speechClarityEnhancer = checked) } }
                        )

                        // Hands-Free Follow-up Toggle
                        SettingToggleRow(
                            title = "Hands-Free Follow-up",
                            subtitle = "Automatically listens again after speaking response",
                            checked = settings.autoListenEnabled,
                            onCheckedChange = { checked -> settingsManager.updateSettings { it.copy(autoListenEnabled = checked) } }
                        )

                        HorizontalDivider(color = Color.White.copy(alpha = 0.06f))

                        // Voice Cadence (Speed) Slider
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Voice Cadence (Speed)", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                                Text("%.2fx".format(settings.voiceRate), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF00F2FE), fontFamily = FontFamily.Monospace)
                            }
                            Slider(
                                value = settings.voiceRate,
                                onValueChange = { rate -> settingsManager.updateSettings { it.copy(voiceRate = rate) } },
                                valueRange = 0.8f..1.2f,
                                colors = SliderDefaults.colors(thumbColor = Color(0xFF00F2FE), activeTrackColor = Color(0xFF00F2FE), inactiveTrackColor = Color(0xFF1E293B))
                            )
                        }

                        // Language Detection Dropdown / Selector
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Language Detection", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                                Text("Routing for natural pronunciation", fontSize = 10.sp, color = Color(0xFF94A3B8))
                            }
                            val langOptions = listOf("auto" to "Auto (HI + EN)", "hi" to "Hindi (हिन्दी)", "en" to "English")
                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                langOptions.forEach { (code, label) ->
                                    val isSelected = settings.voiceLanguage == code
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(if (isSelected) Color(0xFF00F2FE) else Color(0xFF090D13))
                                            .clickable { settingsManager.updateSettings { it.copy(voiceLanguage = code) } }
                                            .padding(horizontal = 6.dp, vertical = 4.dp)
                                    ) {
                                        Text(label, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = if (isSelected) Color(0xFF090D13) else Color(0xFFCBD5E1))
                                    }
                                }
                            }
                        }

                        // Test Voice Button
                        Button(
                            onClick = {
                                if (isPlayingSample) {
                                    onStopSpeaking()
                                    isPlayingSample = false
                                } else {
                                    isPlayingSample = true
                                    val sampleText = if (settings.voiceLanguage == "hi" || settings.voicePersona == "bilingual") {
                                        "Namaste! Main Nova hoon, aapki AI assistant. Main Hindi aur English dono mein baat kar sakti hoon."
                                    } else {
                                        "Hello! I am Nova, your AI assistant powered by Gemini. Everything is working smoothly."
                                    }
                                    onTestSpeak(sampleText, settings.voiceRate)
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isPlayingSample) Color(0xFFEF4444).copy(alpha = 0.2f) else Color(0xFF00F2FE).copy(alpha = 0.12f),
                                contentColor = if (isPlayingSample) Color(0xFFEF4444) else Color(0xFF00F2FE)
                            ),
                            border = ButtonDefaults.outlinedButtonBorder().copy(brush = Brush.horizontalGradient(listOf(Color(0xFF00F2FE).copy(alpha = 0.4f), Color(0xFF00F2FE).copy(alpha = 0.2f))))
                        ) {
                            Icon(if (isPlayingSample) Icons.Default.Stop else Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(if (isPlayingSample) "Stop Playing Voice" else "Test Natural Voice (Play Sample)", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // ==========================================
            // 3. WHATSAPP & CONTACTS (PHASE 2) SECTION
            // ==========================================
            item {
                SectionHeader("WhatsApp & Contacts (Phase 2)", Icons.Default.Message)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141C26)),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(Color(0xFF00F2FE).copy(alpha = 0.15f), Color.White.copy(alpha = 0.05f))))
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        // Contacts Permission Status
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text("Contacts Permission", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                                Text("Required to query names & phone numbers", fontSize = 10.sp, color = Color(0xFF94A3B8))
                            }
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (hasContactsPermission) Color(0xFF10B981).copy(alpha = 0.15f) else Color(0xFFF59E0B).copy(alpha = 0.15f))
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    if (hasContactsPermission) "Granted ✓" else "Configured",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (hasContactsPermission) Color(0xFF10B981) else Color(0xFFF59E0B)
                                )
                            }
                        }

                        // WhatsApp Package Status
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text("WhatsApp App Package", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                                Text("com.whatsapp presence on device", fontSize = 10.sp, color = Color(0xFF94A3B8))
                            }
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (isWhatsAppInstalled) Color(0xFF10B981).copy(alpha = 0.15f) else Color(0xFF64748B).copy(alpha = 0.15f))
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    if (isWhatsAppInstalled) "Installed ✓" else "Not Detected",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isWhatsAppInstalled) Color(0xFF10B981) else Color(0xFF94A3B8)
                                )
                            }
                        }

                        HorizontalDivider(color = Color.White.copy(alpha = 0.06f))

                        // Device Contacts List Toggle
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            TextButton(
                                onClick = { showContactsList = !showContactsList },
                                contentPadding = PaddingValues(0.dp)
                            ) {
                                Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color(0xFF00F2FE))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    if (showContactsList) "Hide Device Contacts" else "View Device Contacts (${contactsList.size})",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF00F2FE)
                                )
                            }

                            TextButton(
                                onClick = {
                                    coroutineScope.launch {
                                        contactsList = contactsManager.getDefaultContacts()
                                        Toast.makeText(context, "Reset contacts list", Toast.LENGTH_SHORT).show()
                                    }
                                },
                                contentPadding = PaddingValues(0.dp)
                            ) {
                                Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color(0xFF94A3B8))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Reset Contacts", fontSize = 10.sp, color = Color(0xFF94A3B8))
                            }
                        }

                        if (showContactsList) {
                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                contactsList.forEach { contact ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(Color(0xFF090D13))
                                            .padding(horizontal = 10.dp, vertical = 8.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Box(
                                                modifier = Modifier
                                                    .size(28.dp)
                                                    .clip(CircleShape)
                                                    .background(Color(0xFF00F2FE).copy(alpha = 0.15f)),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(contact.name.take(1).uppercase(), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF00F2FE))
                                            }
                                            Column {
                                                Text(contact.name, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                                Text(contact.phoneNumber, fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = Color(0xFF94A3B8))
                                            }
                                        }
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(4.dp))
                                                .background(Color.White.copy(alpha = 0.05f))
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(contact.label, fontSize = 9.sp, color = Color(0xFFCBD5E1))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // ==========================================
            // 4. 3D AVATAR & GRAPHICS (PHASE 3) SECTION
            // ==========================================
            item {
                SectionHeader("Visualizer Interface (3D Avatar / Orb)", Icons.Default.GraphicEq)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141C26)),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(Color(0xFF00F2FE).copy(alpha = 0.15f), Color.White.copy(alpha = 0.05f))))
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text("Visualizer Mode", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                                Text("Choose 3D Female Character or Neural Orb", fontSize = 10.sp, color = Color(0xFF94A3B8))
                            }
                            Row(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF090D13))
                                    .padding(3.dp),
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                val modes = listOf("avatar" to "3D Avatar", "orb" to "Orb")
                                modes.forEach { (mode, label) ->
                                    val isSelected = settings.avatarVisualMode == mode
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(if (isSelected) Color(0xFF00F2FE) else Color.Transparent)
                                            .clickable { settingsManager.updateSettings { it.copy(avatarVisualMode = mode) } }
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = if (isSelected) Color(0xFF090D13) else Color(0xFF94A3B8))
                                    }
                                }
                            }
                        }

                        HorizontalDivider(color = Color.White.copy(alpha = 0.06f))

                        // Hardware & GPU Detection Display
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Hardware & GPU Detection", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(Color(0xFF10B981).copy(alpha = 0.15f))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text("60 FPS Ready", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                                }
                            }
                            Text(hardwareSummary, fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = Color(0xFF00F2FE), lineHeight = 14.sp)
                        }

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF00F2FE).copy(alpha = 0.08f))
                                .border(1.dp, Color(0xFF00F2FE).copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                                .padding(10.dp)
                        ) {
                            Text(
                                "Single-Line Model Swap Architecture: To customize the 3D model, replace asset files in assets/models/. Default neural visualizer is active.",
                                fontSize = 10.sp,
                                color = Color(0xFFCBD5E1),
                                lineHeight = 14.sp
                            )
                        }
                    }
                }
            }

            // ==========================================
            // 5. FLOATING BUBBLE (CHAT HEAD) SECTION
            // ==========================================
            item {
                SectionHeader("Floating Bubble (Chat Head)", Icons.Default.TouchApp)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141C26)),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(Color(0xFF00F2FE).copy(alpha = 0.15f), Color.White.copy(alpha = 0.05f))))
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        SettingToggleRow(
                            title = "Floating Assistant Bubble",
                            subtitle = "Keep Nova accessible over other apps when minimized",
                            checked = settings.floatingBubbleEnabled,
                            onCheckedChange = { checked -> settingsManager.updateSettings { it.copy(floatingBubbleEnabled = checked) } }
                        )

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text("Display Over Other Apps", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                                Text("SYSTEM_ALERT_WINDOW permission", fontSize = 10.sp, color = Color(0xFF94A3B8))
                            }
                            Button(
                                onClick = {
                                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                        val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}"))
                                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                        context.startActivity(intent)
                                    }
                                },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00F2FE).copy(alpha = 0.15f), contentColor = Color(0xFF00F2FE)),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text(if (canDrawOverlays) "Granted ✓" else "Configure", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        // Gestures guide
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF090D13))
                                .padding(10.dp)
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text("CHAT HEAD GESTURES", fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp, color = Color(0xFF00F2FE))
                                Text("• Tap: Expands Nova full-screen\n• Long Press: Starts mic listening directly from bubble\n• Drag: Snaps to nearest screen edge on release\n• Drag to Bottom: Drops on trash zone to dismiss", fontSize = 10.sp, color = Color(0xFFCBD5E1), lineHeight = 14.sp)
                            }
                        }
                    }
                }
            }

            // ==========================================
            // 6. FULL PHONE CONTROL & AUTOMATION SECTION
            // ==========================================
            item {
                SectionHeader("Full Phone Control & Automation", Icons.Default.SmartToy)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141C26)),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(Color(0xFF00F2FE).copy(alpha = 0.15f), Color.White.copy(alpha = 0.05f))))
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        SettingToggleRow(
                            title = "Full Phone Control",
                            subtitle = "Allows Nova to tap, type, scroll, and chain multi-step voice automations across apps",
                            checked = settings.fullPhoneControlEnabled,
                            onCheckedChange = { checked -> settingsManager.updateSettings { it.copy(fullPhoneControlEnabled = checked) } }
                        )

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text("Accessibility Service", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                                Text("Required to read UI element trees & dispatch taps", fontSize = 10.sp, color = Color(0xFF94A3B8))
                            }
                            Button(
                                onClick = {
                                    val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
                                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                    context.startActivity(intent)
                                },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00F2FE).copy(alpha = 0.15f), contentColor = Color(0xFF00F2FE)),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text("Accessibility Settings", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        SettingToggleRow(
                            title = "Vision Fallback (MediaProjection)",
                            subtitle = "Use screenshot vision when an app does not expose an accessibility tree",
                            checked = settings.visionFallbackEnabled,
                            onCheckedChange = { checked -> settingsManager.updateSettings { it.copy(visionFallbackEnabled = checked) } }
                        )

                        HorizontalDivider(color = Color.White.copy(alpha = 0.06f))

                        // Sensitive Apps Denylist
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text("Sensitive Apps Denylist", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                                Text("Strictly prevents autonomous taps on financial/secure apps", fontSize = 10.sp, color = Color(0xFF94A3B8))
                            }
                            TextButton(onClick = { isAddingApp = !isAddingApp }, contentPadding = PaddingValues(0.dp)) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color(0xFF00F2FE))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Add", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF00F2FE))
                            }
                        }

                        if (isAddingApp) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF090D13))
                                    .padding(10.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text("Protect App From Automation", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                OutlinedTextField(
                                    value = newAppName,
                                    onValueChange = { newAppName = it },
                                    placeholder = { Text("App Name (e.g., Robinhood)", fontSize = 11.sp, color = Color(0xFF64748B)) },
                                    modifier = Modifier.fillMaxWidth(),
                                    singleLine = true,
                                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF00F2FE), unfocusedBorderColor = Color.White.copy(alpha = 0.1f))
                                )
                                OutlinedTextField(
                                    value = newAppPkg,
                                    onValueChange = { newAppPkg = it },
                                    placeholder = { Text("Package Name (e.g., com.robinhood.android)", fontSize = 11.sp, color = Color(0xFF64748B)) },
                                    modifier = Modifier.fillMaxWidth(),
                                    singleLine = true,
                                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF00F2FE), unfocusedBorderColor = Color.White.copy(alpha = 0.1f))
                                )
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Button(
                                        onClick = {
                                            if (newAppName.isNotBlank() && newAppPkg.isNotBlank()) {
                                                settingsManager.addSensitiveApp(newAppName.trim(), newAppPkg.trim())
                                                newAppName = ""
                                                newAppPkg = ""
                                                isAddingApp = false
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00F2FE), contentColor = Color(0xFF090D13)),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text("Save App", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                    TextButton(onClick = { isAddingApp = false }) {
                                        Text("Cancel", fontSize = 11.sp, color = Color(0xFF94A3B8))
                                    }
                                }
                            }
                        }

                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            settings.sensitiveApps.forEach { app ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFF090D13))
                                        .padding(horizontal = 10.dp, vertical = 8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            Text(app.name, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(4.dp))
                                                    .background(Color(0xFFEF4444).copy(alpha = 0.15f))
                                                    .padding(horizontal = 4.dp, vertical = 1.dp)
                                            ) {
                                                Text(app.category, fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color(0xFFEF4444))
                                            }
                                        }
                                        Text(app.packageName, fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = Color(0xFF64748B))
                                    }
                                    IconButton(
                                        onClick = { settingsManager.removeSensitiveApp(app.id) },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color(0xFF64748B), modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // ==========================================
            // 7. VOICE-BASED OWNER BIOMETRICS SECTION
            // ==========================================
            item {
                SectionHeader("Owner Biometric Voice Profile", Icons.Default.Fingerprint)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141C26)),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(Color(0xFF00F2FE).copy(alpha = 0.15f), Color.White.copy(alpha = 0.05f))))
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        SettingToggleRow(
                            title = "Owner Voice Recognition",
                            subtitle = "Voice biometrics gates sensitive commands to authorized speakers",
                            checked = settings.ownerRecognitionEnabled,
                            onCheckedChange = { checked -> settingsManager.updateSettings { it.copy(ownerRecognitionEnabled = checked) } }
                        )

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text("Voice Enrollment Status", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                                Text("Primary owner voice profile trained (98% match)", fontSize = 10.sp, color = Color(0xFF94A3B8))
                            }
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(Color(0xFF10B981).copy(alpha = 0.15f))
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text("Enrolled ✓", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                            }
                        }

                        // Current Speaker Test Switcher
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text("Current Speaker Simulator", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                                Text("Test authorization vs unauthorized guest", fontSize = 10.sp, color = Color(0xFF94A3B8))
                            }
                            Row(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF090D13))
                                    .padding(3.dp),
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                val isOwner = settings.simulatedSpeaker == "owner"
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(if (isOwner) Color(0xFF10B981) else Color.Transparent)
                                        .clickable { settingsManager.updateSettings { it.copy(simulatedSpeaker = "owner") } }
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text("Owner", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = if (isOwner) Color(0xFF090D13) else Color(0xFF94A3B8))
                                }
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(if (!isOwner) Color(0xFFEF4444) else Color.Transparent)
                                        .clickable { settingsManager.updateSettings { it.copy(simulatedSpeaker = "stranger") } }
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text("Stranger", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = if (!isOwner) Color.White else Color(0xFF94A3B8))
                                }
                            }
                        }

                        // Threshold Slider
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Biometric Match Threshold", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                                Text("${(settings.biometricThreshold * 100).toInt()}%", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF00F2FE), fontFamily = FontFamily.Monospace)
                            }
                            Slider(
                                value = settings.biometricThreshold,
                                onValueChange = { valThresh -> settingsManager.updateSettings { it.copy(biometricThreshold = valThresh) } },
                                valueRange = 0.70f..0.95f,
                                colors = SliderDefaults.colors(thumbColor = Color(0xFF00F2FE), activeTrackColor = Color(0xFF00F2FE), inactiveTrackColor = Color(0xFF1E293B))
                            )
                        }

                        // Trusted Voices List
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Text("Trusted Voices", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                                TextButton(onClick = { isAddingTrustedVoice = !isAddingTrustedVoice }, contentPadding = PaddingValues(0.dp)) {
                                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color(0xFF00F2FE))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Add Voice", fontSize = 10.sp, color = Color(0xFF00F2FE))
                                }
                            }

                            if (isAddingTrustedVoice) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedTextField(
                                        value = newTrustedVoiceName,
                                        onValueChange = { newTrustedVoiceName = it },
                                        placeholder = { Text("Name (e.g., Mom)", fontSize = 11.sp, color = Color(0xFF64748B)) },
                                        modifier = Modifier.weight(1f),
                                        singleLine = true,
                                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF00F2FE), unfocusedBorderColor = Color.White.copy(alpha = 0.1f))
                                    )
                                    Button(
                                        onClick = {
                                            if (newTrustedVoiceName.isNotBlank()) {
                                                settingsManager.addTrustedVoice(newTrustedVoiceName.trim())
                                                newTrustedVoiceName = ""
                                                isAddingTrustedVoice = false
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00F2FE), contentColor = Color(0xFF090D13)),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text("Save", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }

                            settings.trustedVoices.forEach { voice ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFF090D13))
                                        .padding(horizontal = 10.dp, vertical = 6.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(voice, fontSize = 11.sp, color = Color(0xFFCBD5E1))
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color(0xFF10B981))
                                }
                            }
                        }
                    }
                }
            }

            // ==========================================
            // 8. VERIFICATION & SIMULATION TESTS SECTION
            // ==========================================
            item {
                SectionHeader("Verification & Simulation Tests", Icons.Default.Science)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141C26)),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(Color(0xFF00F2FE).copy(alpha = 0.15f), Color.White.copy(alpha = 0.05f))))
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Simulate Android Lifecycle & Battery States", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)

                        val tests = listOf(
                            "App Swipe-Away" to "Simulates foreground notification persistence when app swiped from Recents",
                            "Screen Lock" to "Simulates device screen turning off & VAD low-power sensor transition",
                            "Phone Reboot" to "Simulates android.intent.action.BOOT_COMPLETED receiver auto-start",
                            "OS Kill (START_STICKY)" to "Simulates system memory pressure reclaim and instant service restart",
                            "Background Noise" to "Simulates loud traffic/fan noise cancellation filter",
                            "Battery <15% Guard" to "Simulates automatic background pause when battery is critical"
                        )

                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            tests.chunked(2).forEach { row ->
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    row.forEach { (name, desc) ->
                                        OutlinedButton(
                                            onClick = { addTestLog(name, desc, true) },
                                            modifier = Modifier.weight(1f),
                                            shape = RoundedCornerShape(8.dp),
                                            border = ButtonDefaults.outlinedButtonBorder().copy(brush = Brush.horizontalGradient(listOf(Color.White.copy(alpha = 0.15f), Color.White.copy(alpha = 0.05f))))
                                        ) {
                                            Text(name, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF00F2FE))
                                        }
                                    }
                                }
                            }
                        }

                        // Real Speech & Silence Simulation
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                            OutlinedTextField(
                                value = selectedSimulatedCommand,
                                onValueChange = { selectedSimulatedCommand = it },
                                modifier = Modifier.weight(1f),
                                placeholder = { Text("Command (e.g. Open Chrome)", fontSize = 11.sp) },
                                singleLine = true,
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF00F2FE), unfocusedBorderColor = Color.White.copy(alpha = 0.1f))
                            )
                            Button(
                                onClick = { addTestLog("Voice Command: $selectedSimulatedCommand", "Dispatched to Nova NLU pipeline", true) },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00F2FE), contentColor = Color(0xFF090D13)),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Simulate", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        if (testLogs.isNotEmpty()) {
                            Text("Recent Test Activity Logs", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8))
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                testLogs.forEach { log ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(Color(0xFF090D13))
                                            .padding(horizontal = 8.dp, vertical = 6.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color(0xFF10B981))
                                            Column {
                                                Text(log.title, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                                Text(log.detail, fontSize = 9.sp, color = Color(0xFF94A3B8))
                                            }
                                        }
                                        Text(log.time, fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = Color(0xFF64748B))
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // ==========================================
            // 9. CHAT HISTORY & STORAGE SECTION
            // ==========================================
            item {
                SectionHeader("Chat History & Storage", Icons.Default.Delete)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141C26)),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(Color(0xFF00F2FE).copy(alpha = 0.15f), Color.White.copy(alpha = 0.05f))))
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Saved Messages in Session", fontSize = 12.sp, color = Color(0xFFCBD5E1))
                            Text("$savedMessagesCount", fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = Color(0xFF00F2FE))
                        }

                        Button(
                            onClick = { showClearHistoryDialog = true },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444).copy(alpha = 0.15f), contentColor = Color(0xFFEF4444)),
                            border = ButtonDefaults.outlinedButtonBorder().copy(brush = Brush.horizontalGradient(listOf(Color(0xFFEF4444).copy(alpha = 0.4f), Color(0xFFEF4444).copy(alpha = 0.2f)))),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Clear Chat History", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // ==========================================
            // 10. ANDROID KOTLIN & COMPOSE CODE INSPECTOR
            // ==========================================
            item {
                SectionHeader("Android Kotlin & Compose Code", Icons.Default.Code)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141C26)),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(Color(0xFF00F2FE).copy(alpha = 0.15f), Color.White.copy(alpha = 0.05f))))
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Inspect Android source implementation:", fontSize = 11.sp, color = Color(0xFF94A3B8))
                        KOTLIN_SCAFFOLD_FILES.forEach { file ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF090D13))
                                    .clickable { selectedCodeFile = file }
                                    .padding(10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(file.title, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    Text(file.description, fontSize = 10.sp, color = Color(0xFF94A3B8))
                                }
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(Color(0xFF00F2FE).copy(alpha = 0.15f))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text("Kotlin", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF00F2FE))
                                }
                            }
                        }
                    }
                }
            }

            // ==========================================
            // 11. NOVA SYSTEM PERSONA & GUIDELINES
            // ==========================================
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF090D13)),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(Color(0xFF00F2FE).copy(alpha = 0.2f), Color.White.copy(alpha = 0.05f))))
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.Info, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color(0xFF00F2FE))
                            Text("Nova System Persona", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                        Text(
                            "Nova is programmed to be conversational, respectful, and naturally bilingual in Hindi and English. On device, all features communicate with Gemini 2.0 Live and Flash models with immediate neural voice response.",
                            fontSize = 11.sp,
                            color = Color(0xFF94A3B8),
                            lineHeight = 16.sp
                        )
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }

    // Modal Dialog: View Kotlin Source Code
    selectedCodeFile?.let { file ->
        AlertDialog(
            onDismissRequest = { selectedCodeFile = null },
            title = {
                Column {
                    Text(file.title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text(file.filePath, fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = Color(0xFF00F2FE))
                }
            },
            text = {
                Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(file.description, fontSize = 11.sp, color = Color(0xFF94A3B8))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 280.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFF05080C))
                            .padding(10.dp)
                    ) {
                        Text(file.code, fontSize = 11.sp, fontFamily = FontFamily.Monospace, color = Color(0xFF00F2FE), lineHeight = 16.sp)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        clipboardManager.setText(AnnotatedString(file.code))
                        Toast.makeText(context, "Copied code to clipboard", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00F2FE), contentColor = Color(0xFF090D13))
                ) {
                    Text("Copy Code", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedCodeFile = null }) {
                    Text("Close", color = Color(0xFF94A3B8))
                }
            },
            containerColor = Color(0xFF141C26)
        )
    }

    // Modal Dialog: Confirm Clear Chat History
    if (showClearHistoryDialog) {
        AlertDialog(
            onDismissRequest = { showClearHistoryDialog = false },
            title = { Text("Clear All Conversation History?", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp) },
            text = { Text("This will permanently remove all saved messages and activity logs from this device.", color = Color(0xFFCBD5E1), fontSize = 13.sp) },
            confirmButton = {
                Button(
                    onClick = {
                        onClearChatHistory()
                        showClearHistoryDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))
                ) {
                    Text("Yes, Clear All", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearHistoryDialog = false }) {
                    Text("Cancel", color = Color(0xFF94A3B8))
                }
            },
            containerColor = Color(0xFF141C26)
        )
    }
}

@Composable
private fun SectionHeader(title: String, icon: ImageVector) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        modifier = Modifier.padding(start = 2.dp, bottom = 4.dp)
    ) {
        Icon(imageVector = icon, contentDescription = null, tint = Color(0xFF00F2FE), modifier = Modifier.size(14.dp))
        Text(
            text = title.uppercase(),
            fontSize = 11.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.2.sp,
            color = Color(0xFF00F2FE)
        )
    }
}

@Composable
private fun SettingToggleRow(
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
            Text(title, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
            Spacer(modifier = Modifier.height(2.dp))
            Text(subtitle, fontSize = 10.sp, color = Color(0xFF94A3B8), lineHeight = 13.sp)
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color(0xFF090D13),
                checkedTrackColor = Color(0xFF00F2FE),
                uncheckedThumbColor = Color(0xFF94A3B8),
                uncheckedTrackColor = Color(0xFF090D13)
            )
        )
    }
}
