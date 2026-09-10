package com.nova.assistant

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.core.content.ContextCompat
import com.nova.assistant.ui.ChatScreen
import com.nova.assistant.ui.HomeScreen
import com.nova.assistant.ui.SettingsScreen

enum class Screen {
    HOME, CHAT, SETTINGS
}

class MainActivity : ComponentActivity() {

    private val requestAudioPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            // Record Audio permission granted for Nova speech recognition
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request microphone permission for voice conversation
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
            requestAudioPermission.launch(Manifest.permission.RECORD_AUDIO)
        }

        setContent {
            val darkColors = darkColorScheme(
                primary = Color(0xFF00F2FE),
                secondary = Color(0xFF00C9A7),
                background = Color(0xFF0B0F14),
                surface = Color(0xFF141C26),
                onPrimary = Color(0xFF0B0F14),
                onBackground = Color(0xFFE2E8F0)
            )

            MaterialTheme(colorScheme = darkColors) {
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
