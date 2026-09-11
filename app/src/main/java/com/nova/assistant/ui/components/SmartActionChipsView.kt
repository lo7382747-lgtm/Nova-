package com.nova.assistant.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class ActionSuggestion(
    val emoji: String,
    val label: String,
    val prompt: String,
    val actionType: String = "query"
)

enum class SuggestionCategory(val displayName: String, val icon: ImageVector) {
    HINDI("Hindi / Hinglish", Icons.Default.AutoAwesome),
    AUTOMATION("Automation", Icons.Default.SmartToy),
    CONTROLS("Controls", Icons.Default.Bolt),
    WHATSAPP("WhatsApp & Calls", Icons.Default.Chat),
    ALARMS("Alarms", Icons.Default.Alarm),
    MEDIA("Media & Apps", Icons.Default.MusicNote)
}

val ACTION_SUGGESTIONS_MAP = mapOf(
    SuggestionCategory.HINDI to listOf(
        ActionSuggestion("🤖", "Automation Hub kholo", "Automation Hub kholo", "open_automation"),
        ActionSuggestion("🔦", "Flashlight on karo", "Flashlight on karo", "flashlight"),
        ActionSuggestion("💬", "Priya ko WhatsApp bhejo", "Priya ko WhatsApp bhejo", "whatsapp_priya"),
        ActionSuggestion("📞", "Rahul ko call lagao", "Rahul ko call lagao", "call_rahul"),
        ActionSuggestion("⏰", "Subah 7 baje ka alarm", "Subah 7 baje ka alarm lagao", "alarm_7am"),
        ActionSuggestion("🔋", "Battery kitni hai", "Battery kitni hai", "battery_check")
    ),
    SuggestionCategory.AUTOMATION to listOf(
        ActionSuggestion("🤖", "Automation Hub", "Open Automation Hub", "open_automation"),
        ActionSuggestion("🌅", "Morning Routine", "Run morning routine", "routine_morning"),
        ActionSuggestion("🌙", "Bedtime Routine", "Activate bedtime sleep mode", "routine_bedtime"),
        ActionSuggestion("🔋", "Battery Saver", "Battery bachao routine chalu karo", "routine_battery"),
        ActionSuggestion("❤️", "Instagram Macro", "Instagram auto like macro chalao", "macro_instagram")
    ),
    SuggestionCategory.CONTROLS to listOf(
        ActionSuggestion("🔦", "Torch Toggle", "Flashlight toggle karo", "flashlight"),
        ActionSuggestion("📶", "Wi-Fi Settings", "Wi-Fi settings kholo", "wifi_settings"),
        ActionSuggestion("🔊", "Volume 90%", "Volume badhao", "volume_up"),
        ActionSuggestion("🔇", "Mute Phone", "Mute karo", "mute"),
        ActionSuggestion("📷", "Open Camera", "Camera kholo", "camera"),
        ActionSuggestion("⚙️", "Settings", "Settings kholo", "settings")
    ),
    SuggestionCategory.WHATSAPP to listOf(
        ActionSuggestion("💬", "WhatsApp Priya", "Priya ko WhatsApp par message bhejo", "whatsapp_priya"),
        ActionSuggestion("💬", "WhatsApp Rahul", "Send a WhatsApp message to Rahul", "whatsapp_rahul"),
        ActionSuggestion("📞", "Call Rahul", "Call Rahul Sharma", "call_rahul"),
        ActionSuggestion("📞", "Call Priya", "Call Priya Patel", "call_priya"),
        ActionSuggestion("✉️", "Send SMS", "Send SMS to Rahul", "sms")
    ),
    SuggestionCategory.ALARMS to listOf(
        ActionSuggestion("⏰", "Alarm 7:00 AM", "Set alarm for 7:00 AM", "alarm_7am"),
        ActionSuggestion("⏰", "Alarm 6:00 AM", "Set alarm for 6:00 AM", "alarm_6am"),
        ActionSuggestion("⏱️", "5 Min Timer", "Timer lagao 5 minute ka", "timer_5m"),
        ActionSuggestion("⏱️", "10 Min Timer", "Set a 10 minute timer", "timer_10m")
    ),
    SuggestionCategory.MEDIA to listOf(
        ActionSuggestion("🎵", "Play Spotify", "Play music on Spotify", "music"),
        ActionSuggestion("▶️", "Open YouTube", "YouTube kholo", "youtube"),
        ActionSuggestion("🌤️", "Weather Report", "Mausam kaisa hai", "weather"),
        ActionSuggestion("✨", "Who are you?", "Tum kaun ho", "intro")
    )
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SmartActionChipsView(
    onSelectSuggestion: (ActionSuggestion) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedCategory by remember { mutableStateOf(SuggestionCategory.HINDI) }
    val categoryScrollState = rememberScrollState()

    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Category Tabs Slider
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(categoryScrollState)
                .padding(horizontal = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            SuggestionCategory.entries.forEach { category ->
                val isSelected = category == selectedCategory
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(
                            if (isSelected) Color(0xFF00F2FE).copy(alpha = 0.15f)
                            else Color(0xFF141C26).copy(alpha = 0.7f)
                        )
                        .border(
                            width = 1.dp,
                            color = if (isSelected) Color(0xFF00F2FE).copy(alpha = 0.6f)
                            else Color.White.copy(alpha = 0.08f),
                            shape = RoundedCornerShape(10.dp)
                        )
                        .clickable { selectedCategory = category }
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = category.icon,
                            contentDescription = null,
                            tint = if (isSelected) Color(0xFF00F2FE) else Color(0xFF94A3B8),
                            modifier = Modifier.size(13.dp)
                        )
                        Text(
                            text = category.displayName,
                            color = if (isSelected) Color(0xFF00F2FE) else Color(0xFF94A3B8),
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                }
            }
        }

        // Suggestion Chips Grid (Flow Layout)
        val suggestions = ACTION_SUGGESTIONS_MAP[selectedCategory] ?: emptyList()
        FlowRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp),
            horizontalArrangement = Arrangement.Center,
            verticalArrangement = Arrangement.spacedBy(6.dp),
            maxItemsInEachRow = 3
        ) {
            suggestions.forEach { item ->
                Box(
                    modifier = Modifier
                        .padding(horizontal = 3.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color(0xFF121B26))
                        .border(
                            width = 1.dp,
                            color = Color(0xFF00F2FE).copy(alpha = 0.22f),
                            shape = RoundedCornerShape(14.dp)
                        )
                        .clickable { onSelectSuggestion(item) }
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Text(text = item.emoji, fontSize = 12.sp)
                        Text(
                            text = item.label,
                            color = Color(0xFFE2E8F0),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }
    }
}
