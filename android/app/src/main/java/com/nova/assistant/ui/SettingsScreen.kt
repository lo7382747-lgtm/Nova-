package com.nova.assistant.ui

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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit
) {
    var voiceEnabled by remember { mutableStateOf(true) }

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
            // Voice Output toggle
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

            HorizontalDivider(color = Color(0xFF1E293B))

            // Clear Chat History Button
            Button(
                onClick = { /* Clear local Room database */ },
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
