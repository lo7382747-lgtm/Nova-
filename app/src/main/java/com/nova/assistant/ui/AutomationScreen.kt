package com.nova.assistant.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class AutomationRoutineItem(
    val id: String,
    val title: String,
    val description: String,
    val icon: ImageVector,
    val stepsCount: Int
)

val DEFAULT_ROUTINES = listOf(
    AutomationRoutineItem(
        id = "morning",
        title = "Morning Routine",
        description = "Turns off Flashlight, sets volume 80%, speaks weather & greeting",
        icon = Icons.Default.WbSunny,
        stepsCount = 4
    ),
    AutomationRoutineItem(
        id = "bedtime",
        title = "Bedtime Sleep Routine",
        description = "Mutes sounds, sets 7:00 AM alarm, activates DND",
        icon = Icons.Default.Bedtime,
        stepsCount = 3
    ),
    AutomationRoutineItem(
        id = "battery_saver",
        title = "Extreme Battery Saver",
        description = "Disables background radios, drops brightness, cleans memory",
        icon = Icons.Default.BatteryChargingFull,
        stepsCount = 5
    ),
    AutomationRoutineItem(
        id = "instagram_macro",
        title = "Instagram Auto-Like",
        description = "Navigates feed and engages with selected priority creators",
        icon = Icons.Default.Favorite,
        stepsCount = 6
    )
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AutomationScreen(
    onTriggerAction: (String, String) -> Unit,
    isFlashlightOn: Boolean = false,
    onToggleFlashlight: () -> Unit = {},
    onEmergencyStop: () -> Unit = {}
) {
    var executedRoutineId by remember { mutableStateOf<String?>(null) }
    var statusBanner by remember { mutableStateOf("Android Automation Engine: Ready") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "AUTOMATION HUB",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp,
                            color = Color(0xFF00F2FE)
                        )
                        Text(
                            text = "CORE AUTOMATION ENGINE V1.0",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.5.sp,
                            color = Color(0xFF94A3B8)
                        )
                    }
                },
                actions = {
                    // Emergency Stop Button
                    Button(
                        onClick = {
                            onEmergencyStop()
                            statusBanner = "EMERGENCY STOP EXECUTED - ALL QUEUES CLEARED"
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFDC2626)
                        ),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        modifier = Modifier.padding(end = 12.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.ReportProblem,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("STOP", fontSize = 11.sp, fontWeight = FontWeight.Black)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0B0F14)
                )
            )
        },
        containerColor = Color(0xFF0B0F14)
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Status Banner
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(
                            Brush.horizontalGradient(
                                listOf(Color(0xFF00F2FE).copy(alpha = 0.12f), Color(0xFF14B8A6).copy(alpha = 0.06f))
                            )
                        )
                        .border(1.dp, Color(0xFF00F2FE).copy(alpha = 0.3f), RoundedCornerShape(14.dp))
                        .padding(12.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF00F2FE))
                        )
                        Text(
                            text = statusBanner,
                            color = Color(0xFFE2E8F0),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            // Quick Device Controls Grid
            item {
                Text(
                    text = "HARDWARE & SYSTEM CONTROLS",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.2.sp,
                    color = Color(0xFF94A3B8)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Flashlight
                    QuickControlCard(
                        title = "Torch",
                        subtitle = if (isFlashlightOn) "Active" else "Off",
                        icon = if (isFlashlightOn) Icons.Default.FlashlightOn else Icons.Default.FlashlightOff,
                        isActive = isFlashlightOn,
                        modifier = Modifier.weight(1f),
                        onClick = {
                            onToggleFlashlight()
                            statusBanner = if (!isFlashlightOn) "Flashlight Turned ON" else "Flashlight Turned OFF"
                        }
                    )

                    // Wi-Fi
                    QuickControlCard(
                        title = "Wi-Fi",
                        subtitle = "Settings",
                        icon = Icons.Default.Wifi,
                        isActive = false,
                        modifier = Modifier.weight(1f),
                        onClick = {
                            onTriggerAction("wifi_settings", "Open Wi-Fi")
                            statusBanner = "Dispatched Wi-Fi Intent"
                        }
                    )

                    // Camera
                    QuickControlCard(
                        title = "Camera",
                        subtitle = "Launch",
                        icon = Icons.Default.CameraAlt,
                        isActive = false,
                        modifier = Modifier.weight(1f),
                        onClick = {
                            onTriggerAction("camera", "Launch Camera")
                            statusBanner = "Opening Camera"
                        }
                    )
                }
            }

            // Automated Routines Section
            item {
                Text(
                    text = "AUTOMATION ROUTINES",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.2.sp,
                    color = Color(0xFF94A3B8)
                )
            }

            items(DEFAULT_ROUTINES) { routine ->
                val isExecuting = executedRoutineId == routine.id

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color(0xFF141C26))
                        .border(
                            width = 1.dp,
                            color = if (isExecuting) Color(0xFF00F2FE) else Color.White.copy(alpha = 0.08f),
                            shape = RoundedCornerShape(16.dp)
                        )
                        .padding(14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            modifier = Modifier.weight(1f),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF00F2FE).copy(alpha = 0.12f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = routine.icon,
                                    contentDescription = null,
                                    tint = Color(0xFF00F2FE),
                                    modifier = Modifier.size(22.dp)
                                )
                            }

                            Column {
                                Text(
                                    text = routine.title,
                                    color = Color.White,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = routine.description,
                                    color = Color(0xFF94A3B8),
                                    fontSize = 11.sp,
                                    lineHeight = 15.sp
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "${routine.stepsCount} automated steps",
                                    color = Color(0xFF00F2FE),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }

                        Button(
                            onClick = {
                                executedRoutineId = routine.id
                                onTriggerAction(routine.id, routine.title)
                                statusBanner = "Executing ${routine.title}..."
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isExecuting) Color(0xFF00F2FE) else Color(0xFF1E293B),
                                contentColor = if (isExecuting) Color.Black else Color(0xFF00F2FE)
                            ),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = if (isExecuting) "RUNNING" else "RUN",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(20.dp))
            }
        }
    }
}

@Composable
private fun QuickControlCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    isActive: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(
                if (isActive) Color(0xFF00F2FE).copy(alpha = 0.2f)
                else Color(0xFF141C26)
            )
            .border(
                1.dp,
                if (isActive) Color(0xFF00F2FE) else Color.White.copy(alpha = 0.08f),
                RoundedCornerShape(14.dp)
            )
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp, horizontal = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (isActive) Color(0xFF00F2FE) else Color(0xFFCBD5E1),
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = title,
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = subtitle,
                color = if (isActive) Color(0xFF00F2FE) else Color(0xFF94A3B8),
                fontSize = 10.sp
            )
        }
    }
}
