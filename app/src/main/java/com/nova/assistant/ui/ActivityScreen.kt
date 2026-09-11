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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nova.assistant.data.local.ActivityLogEntity
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActivityScreen(
    activities: List<ActivityLogEntity>,
    onClearActivities: () -> Unit = {}
) {
    var selectedFilter by remember { mutableStateOf("ALL") }

    val filteredList = remember(activities, selectedFilter) {
        when (selectedFilter) {
            "SUCCESS" -> activities.filter { it.status.uppercase() == "SUCCESS" }
            "FAILED" -> activities.filter { it.status.uppercase() == "FAILED" }
            else -> activities
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "ACTIVITY LOGS",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp,
                            color = Color(0xFF00F2FE)
                        )
                        Text(
                            text = "${activities.size} TOTAL ACTIONS LOGGED",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.5.sp,
                            color = Color(0xFF94A3B8)
                        )
                    }
                },
                actions = {
                    if (activities.isNotEmpty()) {
                        IconButton(onClick = onClearActivities) {
                            Icon(
                                imageVector = Icons.Default.DeleteOutline,
                                contentDescription = "Clear History",
                                tint = Color(0xFF94A3B8)
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0B0F14)
                )
            )
        },
        containerColor = Color(0xFF0B0F14)
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            // Filter Pills Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("ALL", "SUCCESS", "FAILED").forEach { filter ->
                    val isSelected = selectedFilter == filter
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(
                                if (isSelected) Color(0xFF00F2FE).copy(alpha = 0.2f)
                                else Color(0xFF141C26)
                            )
                            .border(
                                1.dp,
                                if (isSelected) Color(0xFF00F2FE) else Color.White.copy(alpha = 0.08f),
                                RoundedCornerShape(10.dp)
                            )
                            .clickable { selectedFilter = filter }
                            .padding(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = filter,
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            color = if (isSelected) Color(0xFF00F2FE) else Color(0xFF94A3B8)
                        )
                    }
                }
            }

            if (filteredList.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.CheckCircleOutline,
                            contentDescription = null,
                            tint = Color(0xFF334155),
                            modifier = Modifier.size(56.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "No Activity Logs Yet",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF64748B)
                        )
                        Text(
                            text = "Actions, messages, and routines will appear here.",
                            fontSize = 12.sp,
                            color = Color(0xFF475569)
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 16.dp)
                ) {
                    items(filteredList) { item ->
                        ActivityLogCard(item)
                    }
                }
            }
        }
    }
}

@Composable
fun ActivityLogCard(item: ActivityLogEntity) {
    val isSuccess = item.status.uppercase() == "SUCCESS"
    val timeFormatter = remember { SimpleDateFormat("hh:mm a, dd MMM", Locale.getDefault()) }
    val formattedTime = remember(item.timestamp) { timeFormatter.format(Date(item.timestamp)) }

    val icon: ImageVector = when {
        item.actionType.contains("whatsapp", ignoreCase = true) -> Icons.Default.Chat
        item.actionType.contains("call", ignoreCase = true) -> Icons.Default.Phone
        item.actionType.contains("torch", ignoreCase = true) || item.actionType.contains("flash", ignoreCase = true) -> Icons.Default.FlashlightOn
        item.actionType.contains("alarm", ignoreCase = true) -> Icons.Default.Alarm
        else -> Icons.Default.SmartToy
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFF141C26))
            .border(1.dp, Color.White.copy(alpha = 0.06f), RoundedCornerShape(14.dp))
            .padding(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(
                        if (isSuccess) Color(0xFF00F2FE).copy(alpha = 0.15f)
                        else Color(0xFFEF4444).copy(alpha = 0.15f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = if (isSuccess) Color(0xFF00F2FE) else Color(0xFFEF4444),
                    modifier = Modifier.size(20.dp)
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = item.contactName.ifEmpty { item.actionType.uppercase() },
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = formattedTime,
                        color = Color(0xFF64748B),
                        fontSize = 10.sp
                    )
                }

                if (item.message.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = item.message,
                        color = Color(0xFFCBD5E1),
                        fontSize = 12.sp,
                        maxLines = 2
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(
                                if (isSuccess) Color(0xFF10B981).copy(alpha = 0.2f)
                                else Color(0xFFEF4444).copy(alpha = 0.2f)
                            )
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = item.status.uppercase(),
                            color = if (isSuccess) Color(0xFF34D399) else Color(0xFFF87171),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Black
                        )
                    }

                    if (item.failureReason != null) {
                        Text(
                            text = item.failureReason,
                            color = Color(0xFFF87171),
                            fontSize = 10.sp
                        )
                    }
                }
            }
        }
    }
}
