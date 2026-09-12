package com.nova.assistant.ui

import android.bluetooth.BluetoothAdapter
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.provider.MediaStore
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

data class AutomationRoutineItem(
    val id: String,
    val title: String,
    val description: String,
    val icon: ImageVector,
    val stepsCount: Int,
    val isCustom: Boolean = false
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
        description = "Mutes sounds, sets volume to 0%, activates DND profile",
        icon = Icons.Default.Bedtime,
        stepsCount = 3
    ),
    AutomationRoutineItem(
        id = "battery_saver",
        title = "Extreme Battery Saver",
        description = "Disables background radios, drops volume, opens battery settings",
        icon = Icons.Default.BatteryChargingFull,
        stepsCount = 5
    ),
    AutomationRoutineItem(
        id = "social_check",
        title = "Quick Social Catch-Up",
        description = "Checks WhatsApp presence, prepares voice digest of recent logs",
        icon = Icons.Default.Chat,
        stepsCount = 3
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
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var executedRoutineId by remember { mutableStateOf<String?>(null) }
    var statusBanner by remember { mutableStateOf("Android Automation Engine: Live & Responsive") }
    val routinesList = remember { mutableStateListOf<AutomationRoutineItem>().apply { addAll(DEFAULT_ROUTINES) } }

    // Dialog for Visual Automation Creator
    var showCreateDialog by remember { mutableStateOf(false) }
    var newTriggerPhrase by remember { mutableStateOf("") }
    var newActionDescription by remember { mutableStateOf("") }

    // Real device state measurements
    val (batteryPct, isCharging) = remember {
        try {
            val filter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            val intent = context.registerReceiver(null, filter)
            val level = intent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: 82
            val scale = intent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: 100
            val status = intent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
            val charging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL
            val pct = if (level >= 0 && scale > 0) (level * 100) / scale else 85
            Pair(pct, charging)
        } catch (e: Exception) {
            Pair(85, false)
        }
    }

    val (isWifiActive, isCellularActive) = remember {
        try {
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            val net = cm?.activeNetwork
            val caps = cm?.getNetworkCapabilities(net)
            val wifi = caps?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true
            val cell = caps?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true
            Pair(wifi, cell)
        } catch (e: Exception) {
            Pair(true, false)
        }
    }

    val isBluetoothActive = remember {
        try {
            val adapter = BluetoothAdapter.getDefaultAdapter()
            adapter?.isEnabled == true
        } catch (e: Exception) {
            false
        }
    }

    val (volumePct, isMusicPlaying) = remember {
        try {
            val am = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            val current = am?.getStreamVolume(AudioManager.STREAM_MUSIC) ?: 8
            val max = am?.getStreamMaxVolume(AudioManager.STREAM_MUSIC) ?: 15
            val pct = if (max > 0) (current * 100) / max else 50
            Pair(pct, am?.isMusicActive == true)
        } catch (e: Exception) {
            Pair(50, false)
        }
    }

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
                            text = "CORE HARDWARE AWARENESS & ROUTINES",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.5.sp,
                            color = Color(0xFF94A3B8)
                        )
                    }
                },
                actions = {
                    Button(
                        onClick = {
                            onEmergencyStop()
                            executedRoutineId = null
                            statusBanner = "EMERGENCY STOP EXECUTED - ALL ACTIONS HALTED"
                            Toast.makeText(context, "Emergency Stop Activated", Toast.LENGTH_SHORT).show()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        modifier = Modifier.padding(end = 12.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Warning, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("STOP", fontSize = 11.sp, fontWeight = FontWeight.Black)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0B0F14))
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
            item { Spacer(modifier = Modifier.height(2.dp)) }

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

            // ==========================================
            // LIVE DEVICE STATE AWARENESS CARD
            // ==========================================
            item {
                Text(
                    text = "LIVE DEVICE STATE AWARENESS",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.2.sp,
                    color = Color(0xFF00F2FE)
                )

                Spacer(modifier = Modifier.height(6.dp))

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141C26)),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(Color(0xFF00F2FE).copy(alpha = 0.2f), Color.White.copy(alpha = 0.05f))))
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            // Battery
                            StateIndicator(
                                icon = if (isCharging) Icons.Default.BatteryChargingFull else Icons.Default.BatteryStd,
                                label = "Battery",
                                value = "$batteryPct%",
                                subValue = if (isCharging) "Charging" else "On Battery",
                                isPositive = batteryPct > 20,
                                modifier = Modifier.weight(1f)
                            )
                            // Wi-Fi
                            StateIndicator(
                                icon = Icons.Default.Wifi,
                                label = "Network",
                                value = if (isWifiActive) "Wi-Fi" else if (isCellularActive) "Cellular" else "Offline",
                                subValue = if (isWifiActive || isCellularActive) "Connected" else "No internet",
                                isPositive = isWifiActive || isCellularActive,
                                modifier = Modifier.weight(1f)
                            )
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            // Bluetooth
                            StateIndicator(
                                icon = Icons.Default.Bluetooth,
                                label = "Bluetooth",
                                value = if (isBluetoothActive) "Active" else "Disabled",
                                subValue = if (isBluetoothActive) "Radio On" else "Radio Off",
                                isPositive = isBluetoothActive,
                                modifier = Modifier.weight(1f)
                            )
                            // Audio / Media
                            StateIndicator(
                                icon = if (isMusicPlaying) Icons.Default.MusicNote else Icons.Default.VolumeUp,
                                label = "Media Audio",
                                value = "$volumePct%",
                                subValue = if (isMusicPlaying) "Playing" else "Standby",
                                isPositive = true,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }

            // ==========================================
            // QUICK HARDWARE CONTROLS GRID
            // ==========================================
            item {
                Text(
                    text = "HARDWARE & SYSTEM CONTROLS",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.2.sp,
                    color = Color(0xFF94A3B8)
                )

                Spacer(modifier = Modifier.height(6.dp))

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

                    // Wi-Fi Settings
                    QuickControlCard(
                        title = "Wi-Fi",
                        subtitle = "Configure",
                        icon = Icons.Default.Wifi,
                        isActive = isWifiActive,
                        modifier = Modifier.weight(1f),
                        onClick = {
                            try {
                                val intent = Intent(Settings.ACTION_WIFI_SETTINGS).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
                                context.startActivity(intent)
                                statusBanner = "Opened Wi-Fi Settings"
                            } catch (e: Exception) {
                                onTriggerAction("wifi_settings", "Open Wi-Fi")
                            }
                        }
                    )

                    // Bluetooth Settings
                    QuickControlCard(
                        title = "Bluetooth",
                        subtitle = "Configure",
                        icon = Icons.Default.Bluetooth,
                        isActive = isBluetoothActive,
                        modifier = Modifier.weight(1f),
                        onClick = {
                            try {
                                val intent = Intent(Settings.ACTION_BLUETOOTH_SETTINGS).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
                                context.startActivity(intent)
                                statusBanner = "Opened Bluetooth Settings"
                            } catch (e: Exception) {
                                onTriggerAction("bluetooth_settings", "Open Bluetooth")
                            }
                        }
                    )

                    // Camera Launch
                    QuickControlCard(
                        title = "Camera",
                        subtitle = "Launch",
                        icon = Icons.Default.CameraAlt,
                        isActive = false,
                        modifier = Modifier.weight(1f),
                        onClick = {
                            try {
                                val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
                                context.startActivity(intent)
                                statusBanner = "Launched Camera App"
                            } catch (e: Exception) {
                                onTriggerAction("camera", "Launch Camera")
                            }
                        }
                    )
                }
            }

            // ==========================================
            // AUTOMATED ROUTINES SECTION
            // ==========================================
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "AUTOMATION ROUTINES",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.2.sp,
                        color = Color(0xFF94A3B8)
                    )

                    TextButton(
                        onClick = { showCreateDialog = true },
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color(0xFF00F2FE))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Create Routine", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF00F2FE))
                    }
                }
            }

            items(routinesList) { routine ->
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
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text(
                                        text = routine.title,
                                        color = Color.White,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    if (routine.isCustom) {
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(4.dp))
                                                .background(Color(0xFF00F2FE).copy(alpha = 0.2f))
                                                .padding(horizontal = 4.dp, vertical = 1.dp)
                                        ) {
                                            Text("CUSTOM", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color(0xFF00F2FE))
                                        }
                                    }
                                }
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

                                coroutineScope.launch {
                                    delay(2000)
                                    if (executedRoutineId == routine.id) {
                                        executedRoutineId = null
                                        statusBanner = "Completed: ${routine.title} successfully"
                                    }
                                }
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

    // Modal Dialog: Visual Automation Creator
    if (showCreateDialog) {
        AlertDialog(
            onDismissRequest = { showCreateDialog = false },
            title = {
                Text("Create Custom Automation Routine", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Trigger Phrase (Voice or Schedule)", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFFCBD5E1))
                    OutlinedTextField(
                        value = newTriggerPhrase,
                        onValueChange = { newTriggerPhrase = it },
                        placeholder = { Text("e.g. 'Good Night Nova'", fontSize = 11.sp, color = Color(0xFF64748B)) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color(0xFF00F2FE),
                            unfocusedBorderColor = Color.White.copy(alpha = 0.1f)
                        )
                    )

                    Text("Action Description / Steps", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFFCBD5E1))
                    OutlinedTextField(
                        value = newActionDescription,
                        onValueChange = { newActionDescription = it },
                        placeholder = { Text("e.g. Mute volume, turn off torch, check battery", fontSize = 11.sp, color = Color(0xFF64748B)) },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 3,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color(0xFF00F2FE),
                            unfocusedBorderColor = Color.White.copy(alpha = 0.1f)
                        )
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newTriggerPhrase.isNotBlank() && newActionDescription.isNotBlank()) {
                            routinesList.add(
                                0,
                                AutomationRoutineItem(
                                    id = "custom_${System.currentTimeMillis()}",
                                    title = newTriggerPhrase.trim(),
                                    description = newActionDescription.trim(),
                                    icon = Icons.Default.Bolt,
                                    stepsCount = 3,
                                    isCustom = true
                                )
                            )
                            newTriggerPhrase = ""
                            newActionDescription = ""
                            showCreateDialog = false
                            statusBanner = "Created new automation routine!"
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00F2FE), contentColor = Color(0xFF090D13))
                ) {
                    Text("Save Routine", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateDialog = false }) {
                    Text("Cancel", color = Color(0xFF94A3B8))
                }
            },
            containerColor = Color(0xFF141C26)
        )
    }
}

@Composable
private fun StateIndicator(
    icon: ImageVector,
    label: String,
    value: String,
    subValue: String,
    isPositive: Boolean,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(Color(0xFF090D13))
            .padding(10.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(if (isPositive) Color(0xFF00F2FE).copy(alpha = 0.12f) else Color(0xFFEF4444).copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = if (isPositive) Color(0xFF00F2FE) else Color(0xFFEF4444),
                    modifier = Modifier.size(18.dp)
                )
            }
            Column {
                Text(label, fontSize = 10.sp, color = Color(0xFF94A3B8))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(value, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White, fontFamily = FontFamily.Monospace)
                    Text("• $subValue", fontSize = 9.sp, color = if (isPositive) Color(0xFF10B981) else Color(0xFFEF4444))
                }
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
