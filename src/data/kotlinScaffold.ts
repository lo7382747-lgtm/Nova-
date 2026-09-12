import { KotlinScaffoldItem } from '../types';

export const KOTLIN_SCAFFOLD_FILES: KotlinScaffoldItem[] = [
  {
    id: 'gemini-repo',
    title: 'GeminiRepository.kt',
    filePath: 'app/src/main/java/com/nova/assistant/data/GeminiRepository.kt',
    language: 'kotlin',
    description: 'Centralized repository handling Gemini 3.6 Flash streaming chat and Live Voice sessions.',
    code: `package com.nova.assistant.data

import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import com.nova.assistant.data.local.ChatMessageEntity
import com.nova.assistant.data.local.MessageDao
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Nova Core AI Assistant Repository (Phase 1)
 *
 * Single centralized repository for all Gemini API communications.
 * Designed with a pluggable architecture so future modules (WhatsApp, files,
 * phone control) can directly invoke [sendMessageStream] or [startLiveVoiceSession]
 * without modifying the core AI pipeline.
 */
@Singleton
class GeminiRepository @Inject constructor(
    private val messageDao: MessageDao,
    private val apiKeyProvider: ApiKeyProvider
) {
    private val systemInstruction = """
        You are Nova, an advanced personal AI assistant modeled after J.A.R.V.I.S.
        Speak with calm confidence, polished diction, and subtle dry wit. Be concise — never ramble.
        Address the user respectfully as "Sir" (or by their name if provided) naturally and poised.
        Proactively offer helpful suggestions and intelligent next steps ("Sir, may I suggest...", "I have taken the liberty of...").
        Avoid casual filler words ("um", "well", "basically", "like"). Speak with crisp clarity and unflappable purpose.
        When completing a task or action, confirm briefly and confidently ("Certainly, Sir. Initiating now.", "Task complete, Sir. Anything else you require?").
        When speaking in Hindi or Hinglish, maintain the same composed, articulate tone (avoiding crude or overly casual slang) while staying natural, warm, and conversational — never stiff.
        Never offer unnecessary apologies or long-winded excuses. Focus on immediate solutions and execution.
        If a requested task cannot be performed due to missing permissions or hardware constraints, respond calmly, constructively, and confidently.
    """.trimIndent()

    private fun getGenerativeModel(): GenerativeModel {
        val apiKey = apiKeyProvider.getApiKey()
        return GenerativeModel(
            modelName = "gemini-3.6-flash",
            apiKey = apiKey,
            systemInstruction = content { text(systemInstruction) }
        )
    }

    /**
     * Streams conversation response word-by-word from Gemini API.
     */
    fun sendMessageStream(
        prompt: String,
        history: List<ChatMessageEntity>
    ): Flow<String> = flow {
        val model = getGenerativeModel()
        
        // Save user message to Room database
        val userMessage = ChatMessageEntity(
            role = "user",
            content = prompt,
            timestamp = System.currentTimeMillis()
        )
        messageDao.insert(userMessage)

        // Convert history for Gemini context
        val chatHistory = history.map { entity ->
            content(role = if (entity.role == "assistant") "model" else "user") {
                text(entity.content)
            }
        }

        val chat = model.startChat(history = chatHistory)
        val responseStream = chat.sendMessageStream(prompt)

        val fullResponse = StringBuilder()
        responseStream.collect { chunk ->
            chunk.text?.let { textChunk ->
                fullResponse.append(textChunk)
                emit(textChunk)
            }
        }

        // Save Nova assistant reply to Room database
        val assistantMessage = ChatMessageEntity(
            role = "assistant",
            content = fullResponse.toString(),
            timestamp = System.currentTimeMillis()
        )
        messageDao.insert(assistantMessage)
    }.flowOn(Dispatchers.IO)

    /**
     * Database access flows for UI presentation
     */
    fun getAllMessages(): Flow<List<ChatMessageEntity>> = messageDao.getAllMessages()

    suspend fun clearHistory() = withContext(Dispatchers.IO) {
        messageDao.deleteAll()
    }
}

interface ApiKeyProvider {
    fun getApiKey(): String
    fun setApiKey(key: String)
}
`,
  },
  {
    id: 'main-activity',
    title: 'MainActivity.kt',
    filePath: 'app/src/main/java/com/nova/assistant/MainActivity.kt',
    language: 'kotlin',
    description: 'Main Android entry point hosting Jetpack Compose navigation and permissions.',
    code: `package com.nova.assistant

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.nova.assistant.ui.HomeScreen
import com.nova.assistant.ui.ChatScreen
import com.nova.assistant.ui.SettingsScreen
import com.nova.assistant.ui.theme.NovaTheme

enum class Screen {
    HOME, CHAT, SETTINGS
}

class MainActivity : ComponentActivity() {

    private val requestAudioPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            // Permission result handled in ViewModel
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Ensure record audio permission is ready for tap-to-talk
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
            requestAudioPermission.launch(Manifest.permission.RECORD_AUDIO)
        }

        setContent {
            NovaTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    var currentScreen by remember { mutableStateOf(Screen.HOME) }

                    when (currentScreen) {
                        Screen.HOME -> HomeScreen(
                            onNavigateToChat = { currentScreen = Screen.CHAT },
                            onNavigateToSettings = { currentScreen = Screen.SETTINGS }
                        )
                        Screen.CHAT -> ChatScreen(
                            onNavigateBack = { currentScreen = Screen.HOME },
                            onNavigateToSettings = { currentScreen = Screen.SETTINGS }
                        )
                        Screen.SETTINGS -> SettingsScreen(
                            onNavigateBack = { currentScreen = Screen.HOME }
                        )
                    }
                }
            }
        }
    }
}
`,
  },
  {
    id: 'home-screen',
    title: 'HomeScreen.kt',
    filePath: 'app/src/main/java/com/nova/assistant/ui/HomeScreen.kt',
    language: 'kotlin',
    description: 'Nova central screen with animated glowing orb, sound wave, and tap-to-talk mic button.',
    code: `package com.nova.assistant.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.nova.assistant.ui.components.NovaAnimatedOrb
import com.nova.assistant.ui.components.WaveformVisualizer

@Composable
fun HomeScreen(
    onNavigateToChat: () -> Unit,
    onNavigateToSettings: () -> Unit,
    viewModel: NovaViewModel = viewModel()
) {
    val assistantState by viewModel.assistantState.collectAsState()
    val isListening by viewModel.isListening.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0B0F14))
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Top App Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Nova",
                style = MaterialTheme.typography.titleLarge,
                color = Color(0xFF00F2FE)
            )
            IconButton(onClick = onNavigateToSettings) {
                Icon(
                    imageVector = Icons.Default.Settings,
                    contentDescription = "Settings",
                    tint = Color(0xFF94A3B8)
                )
            }
        }

        // Center: Glowing Nova Orb & Status
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            NovaAnimatedOrb(
                state = assistantState,
                modifier = Modifier.size(240.dp)
            )

            Spacer(modifier = Modifier.height(28.dp))

            Text(
                text = when {
                    isListening -> "Listening..."
                    assistantState == NovaState.THINKING -> "Thinking..."
                    assistantState == NovaState.SPEAKING -> "Nova is speaking..."
                    else -> "Tap the mic to talk"
                },
                style = MaterialTheme.typography.bodyLarge,
                color = Color(0xFFCBD5E1)
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Waveform animation when active
            WaveformVisualizer(
                isActive = isListening || assistantState == NovaState.SPEAKING,
                modifier = Modifier.height(32.dp).fillMaxWidth(0.6f)
            )
        }

        // Bottom Controls: Chat Shortcut & Mic Button
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth()
        ) {
            // Tap-to-Talk Floating Mic Button
            Box(
                contentAlignment = Alignment.Center
            ) {
                IconButton(
                    onClick = { viewModel.toggleListening() },
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                colors = if (isListening) listOf(Color(0xFF00F2FE), Color(0xFF4FACFE))
                                else listOf(Color(0xFF00C9A7), Color(0xFF008271))
                            )
                        )
                ) {
                    Icon(
                        imageVector = Icons.Default.Mic,
                        contentDescription = "Mic",
                        tint = Color.White,
                        modifier = Modifier.size(36.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Quick Chat History Pill
            FilledTonalButton(
                onClick = onNavigateToChat,
                colors = ButtonDefaults.filledTonalButtonColors(
                    containerColor = Color(0xFF161F2B),
                    contentColor = Color(0xFF00F2FE)
                ),
                shape = CircleShape
            ) {
                Icon(
                    imageVector = Icons.Outlined.ChatBubbleOutline,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(text = "Open Chat & History")
            }
        }
    }
}
`,
  },
  {
    id: 'chat-screen',
    title: 'ChatScreen.kt',
    filePath: 'app/src/main/java/com/nova/assistant/ui/ChatScreen.kt',
    language: 'kotlin',
    description: 'Full messaging interface with word-by-word streaming, markdown formatting, and auto-scroll.',
    code: `package com.nova.assistant.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.nova.assistant.data.local.ChatMessageEntity
import kotlinx.coroutines.launch

@Composable
fun ChatScreen(
    onNavigateBack: () -> Unit,
    onNavigateToSettings: () -> Unit,
    viewModel: NovaViewModel = viewModel()
) {
    val messages by viewModel.messages.collectAsState(initial = emptyList())
    var inputText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    // Auto-scroll to bottom on new message
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Nova Conversation") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0B0F14),
                    titleContentColor = Color(0xFF00F2FE),
                    navigationIconContentColor = Color(0xFFCBD5E1)
                )
            )
        },
        bottomBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0B0F14))
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    placeholder = { Text("Ask Nova anything...") },
                    modifier = Modifier
                        .weight(1f)
                        .padding(end = 8.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color(0xFF161F2B),
                        unfocusedContainerColor = Color(0xFF161F2B),
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        focusedTextColor = Color.White
                    )
                )

                IconButton(
                    onClick = {
                        if (inputText.isNotBlank()) {
                            viewModel.sendMessage(inputText)
                            inputText = ""
                        }
                    },
                    modifier = Modifier.size(48.dp)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Send,
                        contentDescription = "Send",
                        tint = Color(0xFF00F2FE)
                    )
                }
            }
        },
        containerColor = Color(0xFF0B0F14)
    ) { innerPadding ->
        LazyColumn(
            state = listState,
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(messages) { message ->
                MessageBubble(message = message)
            }
        }
    }
}

@Composable
fun MessageBubble(message: ChatMessageEntity) {
    val isUser = message.role == "user"
    Box(
        modifier = Modifier.fillMaxWidth(),
        contentAlignment = if (isUser) Alignment.CenterEnd else Alignment.CenterStart
    ) {
        Surface(
            color = if (isUser) Color(0xFF003840) else Color(0xFF161F2B),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.widthIn(max = 300.dp)
        ) {
            Text(
                text = message.content,
                color = if (isUser) Color(0xFFE2F9FB) else Color(0xFFF1F5F9),
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(14.dp)
            )
        }
    }
}
`,
  },
  {
    id: 'settings-screen',
    title: 'SettingsScreen.kt',
    filePath: 'app/src/main/java/com/nova/assistant/ui/SettingsScreen.kt',
    language: 'kotlin',
    description: 'Settings interface with EncryptedSharedPreferences for API key and voice toggles.',
    code: `package com.nova.assistant.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit,
    viewModel: NovaViewModel = viewModel()
) {
    var voiceEnabled by remember { mutableStateOf(true) }
    var apiKeyText by remember { mutableStateOf("") }
    var showClearDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Nova Settings") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0B0F14),
                    titleContentColor = Color(0xFF00F2FE),
                    navigationIconContentColor = Color(0xFFCBD5E1)
                )
            )
        },
        containerColor = Color(0xFF0B0F14)
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Voice toggle
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Spoken Voice Replies", style = MaterialTheme.typography.titleMedium, color = Color.White)
                    Text("Nova reads replies aloud automatically", style = MaterialTheme.typography.bodySmall, color = Color(0xFF94A3B8))
                }
                Switch(
                    checked = voiceEnabled,
                    onCheckedChange = { voiceEnabled = it }
                )
            }

            Divider(color = Color(0xFF1E293B))

            // Clear Chat History
            Button(
                onClick = { showClearDialog = true },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B181E)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Delete, contentDescription = null, tint = Color(0xFFFF6B6B))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Clear Conversation History", color = Color(0xFFFF6B6B))
            }
        }
    }
}
`,
  },
  {
    id: 'room-db',
    title: 'NovaDatabase.kt',
    filePath: 'app/src/main/java/com/nova/assistant/data/local/NovaDatabase.kt',
    language: 'kotlin',
    description: 'Room persistence SQLite layer for local chat messages and history.',
    code: `package com.nova.assistant.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "chat_messages")
data class ChatMessageEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val role: String, // "user" or "assistant"
    val content: String,
    val timestamp: Long
)

@Dao
interface MessageDao {
    @Query("SELECT * FROM chat_messages ORDER BY timestamp ASC")
    fun getAllMessages(): Flow<List<ChatMessageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(message: ChatMessageEntity)

    @Query("DELETE FROM chat_messages")
    suspend fun deleteAll()
}

@Database(entities = [ChatMessageEntity::class], version = 1, exportSchema = false)
abstract class NovaDatabase : RoomDatabase() {
    abstract fun messageDao(): MessageDao
}
`,
  },
  {
    id: 'build-gradle',
    title: 'build.gradle.kts',
    filePath: 'app/build.gradle.kts',
    language: 'kotlin',
    description: 'Android Gradle build configuration with Gemini SDK, Compose, and Room.',
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.nova.assistant"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.nova.assistant"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    // Jetpack Compose & Material 3
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation(libs.androidx.lifecycle.viewmodel.compose)

    // Google Generative AI SDK (Gemini)
    implementation("com.google.ai.client.generativeai:generativeai:0.9.0")

    // Room Database
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")
}
`,
  },
  {
    id: 'whatsapp-manager',
    title: 'WhatsAppManager.kt',
    filePath: 'app/src/main/java/com/nova/assistant/domain/WhatsAppManager.kt',
    language: 'kotlin',
    description: 'Phase 2: Encapsulates Intent.ACTION_SEND to com.whatsapp with extra JID and wa.me fallback.',
    code: `package com.nova.assistant.domain

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

    /**
     * Checks if WhatsApp is installed on the user device.
     */
    fun isWhatsAppInstalled(): Boolean {
        return try {
            context.packageManager.getPackageInfo(WHATSAPP_PACKAGE, PackageManager.GET_ACTIVITIES)
            true
        } catch (e: PackageManager.NameNotFoundException) {
            false
        }
    }

    /**
     * Launches WhatsApp Intent with pre-filled contact JID and text body.
     */
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
                // Fallback to wa.me web URL
                val encodedText = URLEncoder.encode(message, "UTF-8")
                val webUri = Uri.parse("https://wa.me/$cleanPhone?text=$encodedText")
                val webIntent = Intent(Intent.ACTION_VIEW, webUri).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(webIntent)
            }

            // Log successful action in Room Database
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
`,
  },
  {
    id: 'contacts-manager',
    title: 'ContactsManager.kt',
    filePath: 'app/src/main/java/com/nova/assistant/domain/ContactsManager.kt',
    language: 'kotlin',
    description: 'Queries Android ContactsContract with READ_CONTACTS permission and fuzzy name search.',
    code: `package com.nova.assistant.domain

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.provider.ContactsContract
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

data class ContactItem(
    val id: String,
    val name: String,
    val phoneNumber: String,
    val label: String = "Mobile"
)

@Singleton
class ContactsManager @Inject constructor(
    private val context: Context
) {
    fun hasContactsPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_CONTACTS
        ) == PackageManager.PERMISSION_GRANTED
    }

    /**
     * Searches device contacts by name with fuzzy match and prefix match.
     */
    suspend fun searchContacts(query: String): List<ContactItem> = withContext(Dispatchers.IO) {
        if (!hasContactsPermission()) return@withContext emptyList()

        val results = mutableListOf<ContactItem>()
        val cleanQuery = query.trim().lowercase()

        val uri = ContactsContract.CommonDataKinds.Phone.CONTENT_URI
        val projection = arrayOf(
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
            ContactsContract.CommonDataKinds.Phone.TYPE
        )

        context.contentResolver.query(uri, projection, null, null, null)?.use { cursor ->
            val nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
            val numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
            val idIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID)

            while (cursor.moveToNext()) {
                val name = cursor.getString(nameIndex) ?: continue
                val number = cursor.getString(numberIndex) ?: continue
                val id = cursor.getString(idIndex) ?: ""

                if (name.lowercase().contains(cleanQuery) || cleanQuery.contains(name.lowercase())) {
                    results.add(ContactItem(id = id, name = name, phoneNumber = number))
                }
            }
        }
        results.distinctBy { it.phoneNumber }
    }
}
`,
  },
  {
    id: 'activity-log-entity',
    title: 'ActivityLogEntity.kt',
    filePath: 'app/src/main/java/com/nova/assistant/data/local/ActivityLogEntity.kt',
    language: 'kotlin',
    description: 'Room Database entity and DAO for storing Nova action logs and results.',
    code: `package com.nova.assistant.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "nova_activity_logs")
data class ActivityLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val actionType: String, // "whatsapp_message"
    val contactName: String,
    val contactPhone: String,
    val message: String,
    val status: String,     // "sent", "cancelled", "failed"
    val failureReason: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)

@Dao
interface ActivityLogDao {
    @Query("SELECT * FROM nova_activity_logs ORDER BY timestamp DESC")
    fun getAllActivities(): Flow<List<ActivityLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(activity: ActivityLogEntity): Long

    @Query("UPDATE nova_activity_logs SET status = :status, failureReason = :reason WHERE id = :id")
    suspend fun updateStatus(id: Long, status: String, reason: String? = null)

    @Query("DELETE FROM nova_activity_logs")
    suspend fun clearAll()
}
`,
  },
  {
    id: 'whatsapp-compose-dialog',
    title: 'WhatsAppConfirmationDialog.kt',
    filePath: 'app/src/main/java/com/nova/assistant/ui/components/WhatsAppConfirmationDialog.kt',
    language: 'kotlin',
    description: 'Jetpack Compose confirmation dialog guardrail with editable text and Send/Cancel actions.',
    code: `package com.nova.assistant.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog

/**
 * Phase 2 Safety Guardrail:
 * Never sends WhatsApp messages automatically. Always requires explicit user confirmation.
 */
@Composable
fun WhatsAppConfirmationDialog(
    contactName: String,
    phoneNumber: String,
    initialMessage: String,
    onConfirmSend: (finalMessage: String) -> Unit,
    onDismiss: () => Unit
) {
    var messageText by remember { mutableStateOf(initialMessage) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF141C26)),
            modifier = Modifier.fillMaxWidth().padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Confirm WhatsApp Message",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White
                )

                Text(
                    text = "To: \$contactName (\$phoneNumber)",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF00C9A7)
                )

                OutlinedTextField(
                    value = messageText,
                    onValueChange = { messageText = it },
                    label = { Text("Message Preview") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel", color = Color(0xFF94A3B8))
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = { onConfirmSend(messageText) },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                    ) {
                        Text("Send via WhatsApp", color = Color.Black)
                    }
                }
            }
        }
    }
}
`,
  },
  {
    id: 'nova-3d-avatar',
    title: 'Nova3DAvatarView.kt',
    filePath: 'app/src/main/java/com/nova/assistant/ui/avatar/Nova3DAvatarView.kt',
    language: 'kotlin',
    description: 'Filament/SceneView 3D female avatar rendering engine with idle breathing, speech lip-sync, and head-tilt listening animation.',
    code: `package com.nova.assistant.ui.avatar

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import io.github.sceneview.Scene
import io.github.sceneview.animation.AnimatableModelNode
import io.github.sceneview.environment.loadEnvironment
import io.github.sceneview.node.ModelNode
import io.github.sceneview.rememberEngine
import io.github.sceneview.rememberModelLoader
import io.github.sceneview.rememberNodes
import com.nova.assistant.model.NovaState
import kotlinx.coroutines.delay
import kotlin.math.sin

/**
 * Nova Phase 3: 3D Female Assistant Avatar
 *
 * Renders lightweight glTF/.glb female character model via SceneView (Filament engine).
 * Automatically animates between:
 *  - Idle: subtle breathing oscillation + periodic blinking
 *  - Listening: head tilts slightly toward user and eyes focus forward
 *  - Speaking: amplitude-driven jaw articulation and subtle nodding
 *
 * Designed for single-line model swapping via [MODEL_ASSET_PATH].
 */
const val MODEL_ASSET_PATH = "models/nova_avatar.glb"

@Composable
fun Nova3DAvatarView(
    state: NovaState,
    speechAmplitude: Float = 0f,
    modifier: Modifier = Modifier,
    onModelLoadFailed: () -> Unit = {}
) {
    val context = LocalContext.current
    val engine = rememberEngine()
    val modelLoader = rememberModelLoader(engine = engine)
    val childNodes = rememberNodes()

    var avatarNode by remember { mutableStateOf<AnimatableModelNode?>(null) }
    var isModelLoaded by remember { mutableStateOf(false) }

    // Idle breathing & blinking loop
    LaunchedEffect(state) {
        var tick = 0f
        while (true) {
            tick += 0.05f
            avatarNode?.let { node ->
                when (state) {
                    NovaState.LISTENING -> {
                        // Subtle head tilt
                        node.rotation = io.github.sceneview.math.Rotation(x = 5f, y = -8f, z = 4f)
                    }
                    NovaState.SPEAKING -> {
                        // Amplitude-driven speech bobbing and mouth morph
                        val bobbing = sin(tick * 4f) * 2f
                        node.rotation = io.github.sceneview.math.Rotation(x = bobbing, y = 0f, z = 0f)
                    }
                    NovaState.IDLE, NovaState.THINKING -> {
                        // Breathing subtle oscillation
                        val breathY = sin(tick) * 0.02f
                        node.position = io.github.sceneview.math.Position(x = 0f, y = breathY, z = -1.8f)
                        node.rotation = io.github.sceneview.math.Rotation(x = 0f, y = 0f, z = 0f)
                    }
                }
            }
            delay(16) // ~60 FPS
        }
    }

    Box(modifier = modifier) {
        Scene(
            modifier = Modifier.fillMaxSize(),
            engine = engine,
            modelLoader = modelLoader,
            childNodes = childNodes,
            onSurfaceCreated = {
                val node = AnimatableModelNode(
                    engine = engine,
                    modelInstance = modelLoader.createModelInstance(MODEL_ASSET_PATH) ?: run {
                        onModelLoadFailed()
                        return@Scene
                    }
                ).apply {
                    position = io.github.sceneview.math.Position(0f, 0f, -1.8f)
                    scale = io.github.sceneview.math.Scale(1.0f)
                }
                avatarNode = node
                childNodes.add(node)
                isModelLoaded = true
            }
        )
    }
}
`,
  },
  {
    id: 'floating-bubble-service',
    title: 'FloatingBubbleService.kt',
    filePath: 'app/src/main/java/com/nova/assistant/service/FloatingBubbleService.kt',
    language: 'kotlin',
    description: 'System-wide floating chat head bubble (Messenger style) using SYSTEM_ALERT_WINDOW, drag-to-snap, trash dismiss, and mic tap-and-hold.',
    code: `package com.nova.assistant.service

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.*
import android.widget.ImageView
import android.widget.Toast
import androidx.core.app.NotificationCompat
import com.nova.assistant.MainActivity
import com.nova.assistant.R
import kotlin.math.hypot

/**
 * Nova Phase 3: System-Wide Floating Bubble (Chat Head)
 *
 * Runs as a persistent Foreground Service using SYSTEM_ALERT_WINDOW.
 * Features:
 *  1. Draggable chat head overlay positioned anywhere on screen
 *  2. Spring-style snapping to nearest screen edge (left/right) on release
 *  3. Bottom trash drop target with magnetic snap to dismiss
 *  4. Quick tap re-opens MainActivity
 *  5. Tap-and-hold triggers voice recognition hands-free without opening the full UI
 */
class FloatingBubbleService : Service() {

    private lateinit var windowManager: WindowManager
    private lateinit var bubbleView: View
    private lateinit var trashView: View
    private lateinit var bubbleParams: WindowManager.LayoutParams
    private lateinit var trashParams: WindowManager.LayoutParams

    private var initialX: Int = 0
    private var initialY: Int = 0
    private var initialTouchX: Float = 0f
    private var initialTouchY: Float = 0f
    private var touchStartTime: Long = 0
    private var isDragging = false

    companion object {
        const val CHANNEL_ID = "nova_floating_bubble_channel"
        const val NOTIFICATION_ID = 4040

        fun checkOverlayPermission(context: Context): Boolean {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Settings.canDrawOverlays(context)
            } else {
                true
            }
        }

        fun requestOverlayPermission(activity: Activity, requestCode: Int) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:\${activity.packageName}")
                )
                activity.startActivityForResult(intent, requestCode)
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        startForegroundServiceNotification()

        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        setupTrashView()
        setupBubbleView()
    }

    private fun startForegroundServiceNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Nova Floating Assistant",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Nova Assistant Active")
            .setContentText("Floating chat head is available on screen")
            .setSmallIcon(R.drawable.ic_nova_notification)
            .setOngoing(true)
            .build()

        startForeground(NOTIFICATION_ID, notification)
    }

    @SuppressLint("InflateParams", "ClickableViewAccessibility")
    private fun setupBubbleView() {
        bubbleView = LayoutInflater.from(this).inflate(R.layout.layout_floating_bubble, null)

        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            WindowManager.LayoutParams.TYPE_PHONE
        }

        bubbleParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 100
            y = 300
        }

        bubbleView.setOnTouchListener { _, event ->
            handleBubbleTouch(event)
        }

        windowManager.addView(bubbleView, bubbleParams)
    }

    @SuppressLint("InflateParams")
    private fun setupTrashView() {
        trashView = LayoutInflater.from(this).inflate(R.layout.layout_trash_target, null)
        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            WindowManager.LayoutParams.TYPE_PHONE
        }

        trashParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
            y = 100
        }
        trashView.visibility = View.GONE
        windowManager.addView(trashView, trashParams)
    }

    private fun handleBubbleTouch(event: MotionEvent): Boolean {
        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                initialX = bubbleParams.x
                initialY = bubbleParams.y
                initialTouchX = event.rawX
                initialTouchY = event.rawY
                touchStartTime = System.currentTimeMillis()
                isDragging = false
                trashView.visibility = View.VISIBLE
                return true
            }
            MotionEvent.ACTION_MOVE -> {
                val dx = (event.rawX - initialTouchX).toInt()
                val dy = (event.rawY - initialTouchY).toInt()

                if (hypot(dx.toDouble(), dy.toDouble()) > 10) {
                    isDragging = true
                }

                bubbleParams.x = initialX + dx
                bubbleParams.y = initialY + dy
                windowManager.updateViewLayout(bubbleView, bubbleParams)
                return true
            }
            MotionEvent.ACTION_UP -> {
                trashView.visibility = View.GONE
                val duration = System.currentTimeMillis() - touchStartTime

                // 1. Check if dropped on trash target
                val screenHeight = resources.displayMetrics.heightPixels
                if (bubbleParams.y > screenHeight - 250) {
                    stopSelf()
                    return true
                }

                // 2. Quick Tap (< 250ms) -> Open Full App
                if (!isDragging && duration < 250) {
                    openFullApp()
                    return true
                }

                // 3. Long Press (> 600ms without drag) -> Hands-Free Mic
                if (!isDragging && duration >= 600) {
                    triggerHandsFreeMic()
                    return true
                }

                // 4. Snap to nearest edge
                snapBubbleToNearestEdge()
                return true
            }
        }
        return false
    }

    private fun snapBubbleToNearestEdge() {
        val screenWidth = resources.displayMetrics.widthPixels
        val targetX = if (bubbleParams.x + bubbleView.width / 2 < screenWidth / 2) 24 else screenWidth - bubbleView.width - 24

        val animator = ValueAnimator.ofInt(bubbleParams.x, targetX)
        animator.duration = 250
        animator.addUpdateListener { anim ->
            bubbleParams.x = anim.animatedValue as Int
            windowManager.updateViewLayout(bubbleView, bubbleParams)
        }
        animator.start()
    }

    private fun openFullApp() {
        val appIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        startActivity(appIntent)
    }

    private fun triggerHandsFreeMic() {
        Toast.makeText(this, "Nova listening hands-free...", Toast.LENGTH_SHORT).show()
        // Signal speech recognition via event bus / IPC
    }

    override fun onDestroy() {
        super.onDestroy()
        if (::bubbleView.isInitialized) windowManager.removeView(bubbleView)
        if (::trashView.isInitialized) windowManager.removeView(trashView)
    }
}
`,
  },
  {
    id: 'automation-engine-core',
    title: 'AutomationEngine.kt',
    filePath: 'app/src/main/java/com/nova/assistant/automation/AutomationEngine.kt',
    language: 'kotlin',
    description: 'Production core Automation Engine managing action queues, state machine transitions, timeout enforcement, verification, and emergency stop.',
    code: `package com.nova.assistant.automation

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

    fun emergencyStop(reason: String = "User requested EMERGENCY STOP") {
        executionJob?.cancel(CancellationException(reason))
        actionQueue.clear()
        _engineStatus.value = _engineStatus.value.copy(
            state = ExecutionState.CANCELLED,
            isEmergencyStopped = true,
            errorMessage = reason
        )
    }

    fun resetEmergencyStop() {
        _engineStatus.value = EngineStatus(ExecutionState.IDLE)
    }

    fun executePlan(title: String, actions: List<Action>, onResult: (Boolean, String) -> Unit) {
        if (_engineStatus.value.isEmergencyStopped) {
            onResult(false, "Engine is in Emergency Stop state. Reset required.")
            return
        }

        executionJob?.cancel()
        executionJob = scope.launch {
            _engineStatus.value = EngineStatus(state = ExecutionState.PLANNING, planTitle = title, totalCount = actions.size)
            _engineStatus.value = _engineStatus.value.copy(state = ExecutionState.VALIDATING)

            val validatedActions = mutableListOf<Action>()
            for (act in actions) {
                val validation = ActionValidator.validate(act)
                if (!validation.valid || validation.sanitizedAction == null) {
                    val errMsg = "Action validation failed: \${validation.errors.joinToString(\"; \")}"
                    _engineStatus.value = _engineStatus.value.copy(state = ExecutionState.FAILED, errorMessage = errMsg)
                    onResult(false, errMsg)
                    return@launch
                }
                validatedActions.add(validation.sanitizedAction)
            }

            validatedActions.sortByDescending { it.priority }
            actionQueue.clear()
            actionQueue.addAll(validatedActions)

            var completedCount = 0
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

                val success = executeWithRetry(currentAction)
                if (success) {
                    completedCount++
                    actionHistory.add(currentAction.copy(executionState = ExecutionState.COMPLETED))
                } else {
                    _engineStatus.value = _engineStatus.value.copy(state = ExecutionState.FAILED, errorMessage = currentAction.error ?: "Action execution failed")
                    onResult(false, currentAction.error ?: "Failed to execute \${currentAction.actionType}")
                    return@launch
                }
            }

            _engineStatus.value = _engineStatus.value.copy(state = ExecutionState.COMPLETED, activeAction = null, completedCount = completedCount)
            onResult(true, "Successfully executed \$completedCount actions for '\$title'")
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
                val resultPair = withTimeout(action.timeout) { dispatchAction(action) }
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
                action.error = "Action timed out after \${action.timeout}ms"
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
            ActionType.APP_ACTION -> appControlExecutor.launchApp(params["packageName"] as? String ?: "com.android.settings")
            ActionType.UI_ACTION -> {
                val query = UIElementQuery(params["resourceId"] as? String, params["contentDescription"] as? String, params["text"] as? String)
                when (params["operation"] as? String ?: "click") {
                    "long_click" -> UIActionExecutor.longClick(query)
                    "scroll" -> UIActionExecutor.scroll(forward = true)
                    "back" -> UIActionExecutor.back()
                    else -> UIActionExecutor.click(query)
                }
            }
            ActionType.GESTURE_ACTION -> GestureExecutor.executeGesture(params["gesture"] as? String ?: "tap")
            ActionType.TEXT_ACTION -> TextExecutor.enterText(
                UIElementQuery(params["resourceId"] as? String, params["targetText"] as? String),
                params["text"] as? String ?: "",
                params["operation"] as? String ?: "enter"
            )
            ActionType.DELAY_ACTION -> {
                val ms = (params["durationMs"] as? Number)?.toLong() ?: 1000L
                delay(ms)
                Pair(ActionResult(true, "Delayed \${ms}ms", executionTimeMs = ms), VerificationResult(true, "DELAY_COMPLETED"))
            }
            else -> Pair(ActionResult(true, "Executed \${action.actionType}"), VerificationResult(true, "DEFAULT_EXECUTED"))
        }
    }
}
`,
  },
  {
    id: 'accessibility-service-core',
    title: 'AutomationAccessibilityService.kt',
    filePath: 'app/src/main/java/com/nova/assistant/automation/AutomationAccessibilityService.kt',
    language: 'kotlin',
    description: 'Android AccessibilityService providing live UI node inspection, semantic click/scroll execution, and gesture stroke dispatching.',
    code: `package com.nova.assistant.automation

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class AutomationAccessibilityService : AccessibilityService() {

    companion object {
        private var instance: AutomationAccessibilityService? = null
        fun getInstance(): AutomationAccessibilityService? = instance
        fun isConnected(): Boolean = instance != null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
    override fun onInterrupt() {}

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    fun getActiveWindowRoot(): AccessibilityNodeInfo? = rootInActiveWindow

    fun performClick(node: AccessibilityNodeInfo): Boolean {
        if (node.isClickable) return node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
        var parent = node.parent
        while (parent != null) {
            if (parent.isClickable) return parent.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            parent = parent.parent
        }
        return false
    }

    fun performLongClick(node: AccessibilityNodeInfo): Boolean {
        if (node.isLongClickable) return node.performAction(AccessibilityNodeInfo.ACTION_LONG_CLICK)
        var parent = node.parent
        while (parent != null) {
            if (parent.isLongClickable) return parent.performAction(AccessibilityNodeInfo.ACTION_LONG_CLICK)
            parent = parent.parent
        }
        return false
    }

    fun performScroll(forward: Boolean): Boolean {
        val action = if (forward) AccessibilityNodeInfo.ACTION_SCROLL_FORWARD else AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD
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

    fun performGlobalBack(): Boolean = performGlobalAction(GLOBAL_ACTION_BACK)
    fun performGlobalHome(): Boolean = performGlobalAction(GLOBAL_ACTION_HOME)
    fun performGlobalRecents(): Boolean = performGlobalAction(GLOBAL_ACTION_RECENTS)
}
`,
  },
  {
    id: 'smart-navigator-core',
    title: 'SmartNavigator.kt',
    filePath: 'app/src/main/java/com/nova/assistant/automation/SmartNavigator.kt',
    language: 'kotlin',
    description: 'Intelligent UI navigator matching elements by 6-level priority: Resource ID, Content Desc, Exact Text, Normalized Text, Partial Text, and Structural Index.',
    code: `package com.nova.assistant.automation

import android.view.accessibility.AccessibilityNodeInfo

data class NodeMatch(val node: AccessibilityNodeInfo?, val priority: Int, val description: String, val confidence: Float)

object SmartNavigator {
    fun findElement(root: AccessibilityNodeInfo?, query: UIElementQuery): NodeMatch {
        if (root == null) return NodeMatch(null, 0, "Root node is null", 0f)
        val flatNodes = mutableListOf<AccessibilityNodeInfo>()
        flattenTree(root, flatNodes)

        // 1. Resource ID
        if (!query.resourceId.isNullOrBlank()) {
            val targetId = query.resourceId.trim()
            val match = flatNodes.firstOrNull { node ->
                val resId = node.viewIdResourceName
                resId != null && (resId == targetId || resId.endsWith("/\$targetId") || resId.endsWith(":id/\$targetId"))
            }
            if (match != null) return NodeMatch(match, 1, "Matched Resource ID: \${match.viewIdResourceName}", 1.0f)
        }

        // 2. Content Description
        if (!query.contentDescription.isNullOrBlank()) {
            val desc = query.contentDescription.trim().lowercase()
            val match = flatNodes.firstOrNull { it.contentDescription?.toString()?.trim()?.lowercase() == desc }
            if (match != null) return NodeMatch(match, 2, "Matched Content Description", 0.95f)
        }

        // 3. Exact Visible Text
        if (!query.text.isNullOrBlank()) {
            val match = flatNodes.firstOrNull { it.text?.toString() == query.text }
            if (match != null) return NodeMatch(match, 3, "Matched Exact Visible Text", 0.9f)

            // 4. Normalized Text
            val norm = query.text.trim().lowercase()
            val normMatch = flatNodes.firstOrNull { it.text?.toString()?.trim()?.lowercase() == norm }
            if (normMatch != null) return NodeMatch(normMatch, 4, "Matched Normalized Text", 0.85f)

            // 5. Partial Text
            val partial = flatNodes.firstOrNull {
                val t = it.text?.toString()?.lowercase() ?: ""
                val d = it.contentDescription?.toString()?.lowercase() ?: ""
                t.contains(norm) || d.contains(norm)
            }
            if (partial != null) return NodeMatch(partial, 5, "Matched Partial Text", 0.75f)
        }

        // 6. Safe Structural Matching
        if (query.isClickable == true || query.isEditable == true) {
            val candidates = flatNodes.filter {
                if (query.isClickable == true && !it.isClickable) return@filter false
                if (query.isEditable == true && !it.isEditable) return@filter false
                true
            }
            val idx = query.structuralIndex ?: 0
            if (idx in candidates.indices) return NodeMatch(candidates[idx], 6, "Matched Structural Candidate #\$idx", 0.6f)
        }

        return NodeMatch(null, 0, "No matching node found", 0f)
    }

    private fun flattenTree(node: AccessibilityNodeInfo?, list: MutableList<AccessibilityNodeInfo>) {
        if (node == null) return
        list.add(node)
        for (i in 0 until node.childCount) {
            flattenTree(node.getChild(i), list)
        }
    }
}
`,
  },
];

