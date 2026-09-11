package com.nova.assistant.ui

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nova.assistant.ui.components.*

@Composable
fun HomeScreen(
    novaState: NovaAssistantState,
    liveTranscript: String = "",
    lastResponseSnippet: String = "",
    isTurboMode: Boolean = true,
    isVoiceRepliesEnabled: Boolean = true,
    selectedLanguage: String = "EN", // "EN" or "HI"
    onToggleTurboMode: () -> Unit = {},
    onToggleVoiceReplies: () -> Unit = {},
    onToggleLanguage: () -> Unit = {},
    onStartListening: () -> Unit = {},
    onStopListening: () -> Unit = {},
    onInterruptSpeaking: () -> Unit = {},
    onSendMessage: (String) -> Unit = {},
    onSuggestionSelected: (ActionSuggestion) -> Unit = {},
    onNavigateToChat: () -> Unit = {},
    onNavigateToSettings: () -> Unit = {}
) {
    var isAvatarMode by remember { mutableStateOf(true) }
    val isListening = novaState == NovaAssistantState.LISTENING
    val isSpeaking = novaState == NovaAssistantState.SPEAKING
    val isThinking = novaState == NovaAssistantState.THINKING

    val statusText = when {
        isListening -> if (liveTranscript.isNotBlank()) "\"$liveTranscript\"" else "LISTENING... SPEAK NOW"
        isThinking -> "NOVA IS THINKING..."
        isSpeaking -> "NOVA IS SPEAKING..."
        else -> "TAP AVATAR OR MIC TO SPEAK WITH NOVA"
    }

    val scrollState = rememberScrollState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF090D13))
    ) {
        // Ambient background glow from preview
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .offset(y = 100.dp)
                .size(300.dp)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            Color(0xFF00F2FE).copy(alpha = 0.08f),
                            Color(0xFF14B8A6).copy(alpha = 0.03f),
                            Color.Transparent
                        )
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // 1. TOP HEADER (NOVA, CORE ASSISTANT V1.0, Turbo, Bilingual Voice, Gemini 3.6 Connected, EN/HI, Settings)
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column {
                        Text(
                            text = "NOVA",
                            fontSize = 34.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = (-1).sp,
                            color = Color.White
                        )
                        Text(
                            text = "CORE ASSISTANT V1.0",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 2.5.sp,
                            color = Color(0xFF00F2FE)
                        )

                        // Status Badge: Gemini 3.6 Connected & Language Pill
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.padding(top = 4.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF00F2FE))
                            )
                            Text(
                                text = "GEMINI 3.6 CONNECTED",
                                fontSize = 8.5.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp,
                                color = Color(0xFF94A3B8)
                            )

                            // Language Switcher (EN / HI)
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(Color(0xFF00F2FE).copy(alpha = 0.15f))
                                    .border(1.dp, Color(0xFF00F2FE).copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                                    .clickable { onToggleLanguage() }
                                    .padding(horizontal = 5.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = if (selectedLanguage == "HI") "🇮🇳 HI + EN" else "🇮🇳 EN + HI",
                                    fontSize = 8.5.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color(0xFF00F2FE)
                                )
                            }
                        }
                    }

                    // Header Right Actions (Turbo, Voice, Settings)
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        // Turbo Mode Pill
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(
                                    if (isTurboMode) Color(0xFFF59E0B).copy(alpha = 0.15f)
                                    else Color(0xFF141C26)
                                )
                                .border(
                                    1.dp,
                                    if (isTurboMode) Color(0xFFF59E0B).copy(alpha = 0.4f)
                                    else Color.White.copy(alpha = 0.08f),
                                    RoundedCornerShape(10.dp)
                                )
                                .clickable { onToggleTurboMode() }
                                .padding(horizontal = 7.dp, vertical = 5.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(3.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Bolt,
                                    contentDescription = "Turbo",
                                    tint = if (isTurboMode) Color(0xFFFBBF24) else Color(0xFF64748B),
                                    modifier = Modifier.size(12.dp)
                                )
                                Text(
                                    text = "Turbo",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isTurboMode) Color(0xFFFBBF24) else Color(0xFF94A3B8)
                                )
                            }
                        }

                        // Bilingual Voice Pill
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(
                                    if (isVoiceRepliesEnabled) Color(0xFF00F2FE).copy(alpha = 0.15f)
                                    else Color(0xFF141C26)
                                )
                                .border(
                                    1.dp,
                                    if (isVoiceRepliesEnabled) Color(0xFF00F2FE).copy(alpha = 0.4f)
                                    else Color.White.copy(alpha = 0.08f),
                                    RoundedCornerShape(10.dp)
                                )
                                .clickable { onToggleVoiceReplies() }
                                .padding(horizontal = 7.dp, vertical = 5.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(3.dp)
                            ) {
                                Icon(
                                    imageVector = if (isVoiceRepliesEnabled) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                                    contentDescription = "Voice",
                                    tint = if (isVoiceRepliesEnabled) Color(0xFF00F2FE) else Color(0xFF64748B),
                                    modifier = Modifier.size(12.dp)
                                )
                                Text(
                                    text = if (isVoiceRepliesEnabled) "Bilingual Voice" else "Muted",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isVoiceRepliesEnabled) Color(0xFF00F2FE) else Color(0xFF94A3B8)
                                )
                            }
                        }

                        // Settings Icon
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0xFF141C26))
                                .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(10.dp))
                                .clickable { onNavigateToSettings() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Settings,
                                contentDescription = "Settings",
                                tint = Color(0xFF94A3B8),
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 2. CENTER: ANIMATED CYBER FEMALE AVATAR
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                NovaAnimatedAvatar(
                    state = novaState,
                    isAvatarMode = isAvatarMode,
                    size = 230.dp,
                    onClick = {
                        if (isListening) onStopListening()
                        else if (isSpeaking) onInterruptSpeaking()
                        else onStartListening()
                    }
                )

                // Quick Toggle Pill between 3D Avatar and Orb
                Row(
                    modifier = Modifier
                        .padding(top = 8.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFF141C26))
                        .border(1.dp, Color.White.copy(alpha = 0.06f), RoundedCornerShape(12.dp))
                        .padding(2.dp),
                    horizontalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isAvatarMode) Color(0xFF00F2FE) else Color.Transparent)
                            .clickable { isAvatarMode = true }
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "3D AVATAR",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Black,
                            color = if (isAvatarMode) Color.Black else Color(0xFF94A3B8)
                        )
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (!isAvatarMode) Color(0xFF00F2FE) else Color.Transparent)
                            .clickable { isAvatarMode = false }
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "ORB",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Black,
                            color = if (!isAvatarMode) Color.Black else Color(0xFF94A3B8)
                        )
                    }
                }

                // 3. DYNAMIC STATUS TEXT
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = statusText,
                    fontSize = 11.5.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.2.sp,
                    textAlign = TextAlign.Center,
                    color = when {
                        isListening -> Color(0xFF00F2FE)
                        isSpeaking -> Color(0xFF2DD4BF)
                        isThinking -> Color(0xFFA5B4FC)
                        else -> Color(0xFF94A3B8)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                )

                // TAP TO INTERRUPT BUTTON (when Nova is speaking)
                AnimatedVisibility(
                    visible = isSpeaking,
                    enter = fadeIn() + expandVertically(),
                    exit = fadeOut() + shrinkVertically()
                ) {
                    Button(
                        onClick = onInterruptSpeaking,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF00F2FE).copy(alpha = 0.15f),
                            contentColor = Color(0xFF00F2FE)
                        ),
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF00F2FE).copy(alpha = 0.4f)),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 4.dp),
                        modifier = Modifier.padding(top = 8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Stop,
                            contentDescription = null,
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "TAP TO INTERRUPT",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // 4. QUICK ACTION CHIPS GRID
            if (!isListening && !isSpeaking) {
                SmartActionChipsView(
                    onSelectSuggestion = onSuggestionSelected,
                    modifier = Modifier.padding(bottom = 12.dp)
                )
            } else {
                Spacer(modifier = Modifier.height(12.dp))
            }

            // 5. BOTTOM SECTION: TAP-TO-TALK ACTION BAR
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp)
                    .clip(RoundedCornerShape(26.dp))
                    .background(Color(0xFF141C26))
                    .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(26.dp))
                    .padding(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Big Glowing Mic Button
                    Box(
                        modifier = Modifier
                            .size(50.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.linearGradient(
                                    colors = if (isListening) listOf(Color(0xFF00F2FE), Color(0xFF38BDF8))
                                    else listOf(Color(0xFF00F2FE), Color(0xFF0D9488))
                                )
                            )
                            .clickable {
                                if (isListening) onStopListening() else onStartListening()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (isListening) Icons.Default.MicOff else Icons.Default.Mic,
                            contentDescription = "Mic",
                            tint = Color.Black,
                            modifier = Modifier.size(24.dp)
                        )
                    }

                    // Transcript Snippet or Greeting Quote
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .clickable {
                                if (!isListening) onNavigateToChat()
                            }
                    ) {
                        if (isListening) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(7.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF00F2FE))
                                )
                                Text(
                                    text = if (liveTranscript.isNotBlank()) "\"$liveTranscript\"" else "Listening... speak now",
                                    color = Color(0xFF00F2FE),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        } else {
                            Text(
                                text = if (lastResponseSnippet.isNotBlank()) "\"$lastResponseSnippet\"" else "\"Nova, show me how to send a WhatsApp...\"",
                                color = Color(0xFF94A3B8),
                                fontSize = 11.5.sp,
                                fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }

                    // Send or Chat Button
                    if (isListening && liveTranscript.isNotBlank()) {
                        Button(
                            onClick = {
                                val text = liveTranscript.trim()
                                onStopListening()
                                onSendMessage(text)
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF00F2FE),
                                contentColor = Color.Black
                            ),
                            shape = RoundedCornerShape(14.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text("SEND", fontSize = 11.sp, fontWeight = FontWeight.Black)
                        }
                    } else {
                        Button(
                            onClick = onNavigateToChat,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF1E293B),
                                contentColor = Color(0xFF00F2FE)
                            ),
                            shape = RoundedCornerShape(14.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text("CHAT", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
