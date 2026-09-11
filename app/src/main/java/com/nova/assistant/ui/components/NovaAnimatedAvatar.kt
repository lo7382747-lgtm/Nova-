package com.nova.assistant.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlin.math.*

enum class NovaAssistantState {
    IDLE,
    LISTENING,
    SPEAKING,
    THINKING
}

/**
 * High-craft Animated Cyber Female Avatar for Nova in Jetpack Compose
 * Replicates the preview's glowing holographic 3D aesthetic with:
 * - Concentric rotating cybernetic rings & pulse waves
 * - Dynamic audio-reactive voice equalizer mouth spectrum
 * - Stylized cyber-female head & visor contours with glowing teal eyes
 * - Orbiting cyber energy particles & background neon ambiance
 */
@Composable
fun NovaAnimatedAvatar(
    state: NovaAssistantState,
    isAvatarMode: Boolean = true,
    size: Dp = 260.dp,
    onClick: () -> Unit = {}
) {
    val infiniteTransition = rememberInfiniteTransition(label = "NovaAvatarTransitions")

    // Rotation for outer cyber rings
    val ringRotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = when (state) {
                    NovaAssistantState.LISTENING -> 4000
                    NovaAssistantState.SPEAKING -> 3000
                    NovaAssistantState.THINKING -> 2000
                    else -> 10000
                },
                easing = LinearEasing
            ),
            repeatMode = RepeatMode.Restart
        ),
        label = "ringRotation"
    )

    // Breathing / Pulsing scale
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = when (state) {
                    NovaAssistantState.LISTENING -> 800
                    NovaAssistantState.SPEAKING -> 1200
                    else -> 2200
                },
                easing = FastOutSlowInEasing
            ),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    // Mouth spectrum / voice bar phase
    val voiceBarPhase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = (2 * PI).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = if (state == NovaAssistantState.SPEAKING) 400 else 2000,
                easing = LinearEasing
            ),
            repeatMode = RepeatMode.Restart
        ),
        label = "voiceBarPhase"
    )

    // Eye blinking animation
    val blinkProgress by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 0.05f,
        animationSpec = infiniteRepeatable(
            animation = keyframes {
                durationMillis = 4000
                1f at 0
                1f at 3700
                0.05f at 3850
                1f at 4000
            },
            repeatMode = RepeatMode.Restart
        ),
        label = "blinkProgress"
    )

    val interactionSource = remember { MutableInteractionSource() }

    Box(
        modifier = Modifier
            .size(size)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val center = Offset(size.width / 2f, size.height / 2f)
            val baseRadius = (min(size.width, size.height) / 2f) * 0.85f

            // 1. Ambient Background Neon Glow
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        when (state) {
                            NovaAssistantState.LISTENING -> Color(0xFF00F2FE).copy(alpha = 0.35f)
                            NovaAssistantState.SPEAKING -> Color(0xFF14B8A6).copy(alpha = 0.40f)
                            NovaAssistantState.THINKING -> Color(0xFF818CF8).copy(alpha = 0.35f)
                            else -> Color(0xFF0D9488).copy(alpha = 0.20f)
                        },
                        Color(0xFF0B192C).copy(alpha = 0.15f),
                        Color.Transparent
                    ),
                    center = center,
                    radius = baseRadius * 1.3f
                ),
                radius = baseRadius * 1.3f,
                center = center
            )

            // 2. Concentric Holographic Cyber Rings
            drawCyberRings(center, baseRadius * pulseScale, ringRotation, state)

            // 3. Floating Orbiting Particles
            drawOrbitingParticles(center, baseRadius, ringRotation, state)

            // 4. Center Core: Cyber Female Avatar or Nova Orb
            if (isAvatarMode) {
                drawCyberFemaleAvatar(
                    center = center,
                    radius = baseRadius * 0.72f,
                    state = state,
                    voicePhase = voiceBarPhase,
                    blink = blinkProgress,
                    pulse = pulseScale
                )
            } else {
                drawNovaCoreOrb(
                    center = center,
                    radius = baseRadius * 0.65f,
                    state = state,
                    pulse = pulseScale
                )
            }
        }
    }
}

/**
 * Draws concentric sci-fi rings around the avatar
 */
private fun DrawScope.drawCyberRings(
    center: Offset,
    radius: Float,
    rotation: Float,
    state: NovaAssistantState
) {
    val ringColor = when (state) {
        NovaAssistantState.LISTENING -> Color(0xFF00F2FE)
        NovaAssistantState.SPEAKING -> Color(0xFF2DD4BF)
        NovaAssistantState.THINKING -> Color(0xFFA5B4FC)
        else -> Color(0xFF14B8A6).copy(alpha = 0.6f)
    }

    // Outer segmented dashed ring
    drawCircle(
        color = ringColor.copy(alpha = 0.45f),
        radius = radius,
        center = center,
        style = Stroke(
            width = 2f,
            pathEffect = PathEffect.dashPathEffect(floatArrayOf(24f, 14f, 6f, 14f), rotation)
        )
    )

    // Middle fine tech ring
    drawCircle(
        color = ringColor.copy(alpha = 0.25f),
        radius = radius * 0.88f,
        center = center,
        style = Stroke(
            width = 1.5f,
            pathEffect = PathEffect.dashPathEffect(floatArrayOf(40f, 20f), -rotation * 0.8f)
        )
    )

    // Inner glowing ring
    drawCircle(
        brush = Brush.sweepGradient(
            colors = listOf(
                ringColor.copy(alpha = 0.8f),
                Color.Transparent,
                ringColor.copy(alpha = 0.8f),
                Color.Transparent,
                ringColor.copy(alpha = 0.8f)
            ),
            center = center
        ),
        radius = radius * 0.76f,
        center = center,
        style = Stroke(width = 2.5f)
    )

    // When listening: radar ping wave
    if (state == NovaAssistantState.LISTENING) {
        drawCircle(
            color = Color(0xFF00F2FE).copy(alpha = 0.25f),
            radius = radius * 1.08f,
            center = center,
            style = Stroke(width = 3f)
        )
    }
}

/**
 * Draws small orbiting energy nodes
 */
private fun DrawScope.drawOrbitingParticles(
    center: Offset,
    radius: Float,
    rotation: Float,
    state: NovaAssistantState
) {
    val particleColor = when (state) {
        NovaAssistantState.LISTENING -> Color(0xFF00F2FE)
        NovaAssistantState.SPEAKING -> Color(0xFF5EEAD4)
        else -> Color(0xFF2DD4BF)
    }

    val numParticles = 6
    for (i in 0 until numParticles) {
        val angleRad = Math.toRadians((rotation + (i * 360f / numParticles)).toDouble())
        val particleRadius = radius * (0.85f + 0.1f * sin(angleRad * 2).toFloat())
        val px = center.x + (particleRadius * cos(angleRad)).toFloat()
        val py = center.y + (particleRadius * sin(angleRad)).toFloat()

        drawCircle(
            color = particleColor.copy(alpha = 0.85f),
            radius = 3.5f,
            center = Offset(px, py)
        )
    }
}

/**
 * Draws the cybernetic female assistant silhouette and features
 */
private fun DrawScope.drawCyberFemaleAvatar(
    center: Offset,
    radius: Float,
    state: NovaAssistantState,
    voicePhase: Float,
    blink: Float,
    pulse: Float
) {
    // 1. Dark Head Silhouette Base
    val headCenter = Offset(center.x, center.y - radius * 0.05f)
    val headRadiusX = radius * 0.65f
    val headRadiusY = radius * 0.78f

    // Dark sleek gradient background for the bust / head
    drawOval(
        brush = Brush.verticalGradient(
            colors = listOf(
                Color(0xFF1E293B),
                Color(0xFF0F172A),
                Color(0xFF0A0F1D)
            ),
            startY = headCenter.y - headRadiusY,
            endY = headCenter.y + headRadiusY
        ),
        topLeft = Offset(headCenter.x - headRadiusX, headCenter.y - headRadiusY),
        size = Size(headRadiusX * 2, headRadiusY * 2)
    )

    // Outer cyber rim glow on head
    drawOval(
        brush = Brush.verticalGradient(
            colors = listOf(
                Color(0xFF00F2FE).copy(alpha = 0.8f),
                Color(0xFF14B8A6).copy(alpha = 0.4f),
                Color.Transparent
            )
        ),
        topLeft = Offset(headCenter.x - headRadiusX, headCenter.y - headRadiusY),
        size = Size(headRadiusX * 2, headRadiusY * 2),
        style = Stroke(width = 2.5f)
    )

    // 2. Sleek Cyber Hair & Headset Crown Accents
    val hairPath = Path().apply {
        // Left sweep
        moveTo(headCenter.x - headRadiusX * 0.9f, headCenter.y + headRadiusY * 0.3f)
        quadraticTo(
            headCenter.x - headRadiusX * 1.1f,
            headCenter.y - headRadiusY * 0.6f,
            headCenter.x,
            headCenter.y - headRadiusY * 0.95f
        )
        // Right sweep
        quadraticTo(
            headCenter.x + headRadiusX * 1.1f,
            headCenter.y - headRadiusY * 0.6f,
            headCenter.x + headRadiusX * 0.9f,
            headCenter.y + headRadiusY * 0.3f
        )
    }
    drawPath(
        path = hairPath,
        brush = Brush.horizontalGradient(
            colors = listOf(
                Color(0xFF00F2FE).copy(alpha = 0.9f),
                Color(0xFF2DD4BF),
                Color(0xFF00F2FE).copy(alpha = 0.9f)
            )
        ),
        style = Stroke(width = 4f, cap = StrokeCap.Round)
    )

    // Headset Nodes (Left & Right Ear Cyber Audio Receptors)
    val leftEar = Offset(headCenter.x - headRadiusX * 0.95f, headCenter.y)
    val rightEar = Offset(headCenter.x + headRadiusX * 0.95f, headCenter.y)

    listOf(leftEar, rightEar).forEach { ear ->
        drawCircle(
            color = Color(0xFF00F2FE),
            radius = 7f,
            center = ear
        )
        drawCircle(
            color = Color(0xFF0F172A),
            radius = 4f,
            center = ear
        )
    }

    // 3. Cyber Visor / Glowing Teal Eyes
    val eyeLevelY = headCenter.y - headRadiusY * 0.15f
    val eyeSpacing = headRadiusX * 0.38f
    val eyeWidth = headRadiusX * 0.30f
    val eyeHeight = (headRadiusY * 0.12f) * max(blink, 0.08f)

    // Left Eye
    drawOval(
        brush = Brush.radialGradient(
            colors = listOf(Color.White, Color(0xFF00F2FE), Color(0xFF0D9488)),
            center = Offset(headCenter.x - eyeSpacing, eyeLevelY),
            radius = eyeWidth
        ),
        topLeft = Offset(headCenter.x - eyeSpacing - eyeWidth / 2, eyeLevelY - eyeHeight / 2),
        size = Size(eyeWidth, eyeHeight)
    )

    // Right Eye
    drawOval(
        brush = Brush.radialGradient(
            colors = listOf(Color.White, Color(0xFF00F2FE), Color(0xFF0D9488)),
            center = Offset(headCenter.x + eyeSpacing, eyeLevelY),
            radius = eyeWidth
        ),
        topLeft = Offset(headCenter.x + eyeSpacing - eyeWidth / 2, eyeLevelY - eyeHeight / 2),
        size = Size(eyeWidth, eyeHeight)
    )

    // Eyebrow cyber accents
    drawLine(
        color = Color(0xFF5EEAD4).copy(alpha = 0.7f),
        start = Offset(headCenter.x - eyeSpacing - eyeWidth / 2, eyeLevelY - eyeHeight - 4f),
        end = Offset(headCenter.x - eyeSpacing + eyeWidth / 2, eyeLevelY - eyeHeight - 8f),
        strokeWidth = 2.5f,
        cap = StrokeCap.Round
    )
    drawLine(
        color = Color(0xFF5EEAD4).copy(alpha = 0.7f),
        start = Offset(headCenter.x + eyeSpacing - eyeWidth / 2, eyeLevelY - eyeHeight - 8f),
        end = Offset(headCenter.x + eyeSpacing + eyeWidth / 2, eyeLevelY - eyeHeight - 4f),
        strokeWidth = 2.5f,
        cap = StrokeCap.Round
    )

    // 4. Voice Spectrum Mouth / Cyber Equalizer
    val mouthY = headCenter.y + headRadiusY * 0.38f
    if (state == NovaAssistantState.SPEAKING) {
        // Dynamic sound spectrum equalizer bars for speaking
        val barCount = 7
        val totalWidth = headRadiusX * 0.7f
        val barSpacing = totalWidth / (barCount - 1)
        val startX = headCenter.x - totalWidth / 2

        for (i in 0 until barCount) {
            val offsetMult = sin(voicePhase + i * 0.8f).absoluteValue
            val barHeight = (8f + 20f * offsetMult).coerceAtLeast(4f)
            val bx = startX + i * barSpacing

            drawLine(
                brush = Brush.verticalGradient(
                    colors = listOf(Color(0xFF00F2FE), Color(0xFF2DD4BF)),
                    startY = mouthY - barHeight / 2,
                    endY = mouthY + barHeight / 2
                ),
                start = Offset(bx, mouthY - barHeight / 2),
                end = Offset(bx, mouthY + barHeight / 2),
                strokeWidth = 3.5f,
                cap = StrokeCap.Round
            )
        }
    } else if (state == NovaAssistantState.LISTENING) {
        // Active Listening Mic Indicator Node
        drawCircle(
            color = Color(0xFF00F2FE),
            radius = 5f,
            center = Offset(headCenter.x, mouthY)
        )
        drawCircle(
            color = Color(0xFF00F2FE).copy(alpha = 0.4f),
            radius = 12f * pulse,
            center = Offset(headCenter.x, mouthY),
            style = Stroke(width = 2f)
        )
    } else {
        // Idle Calm Digital Smile Line
        val smilePath = Path().apply {
            moveTo(headCenter.x - headRadiusX * 0.22f, mouthY)
            quadraticTo(headCenter.x, mouthY + 6f, headCenter.x + headRadiusX * 0.22f, mouthY)
        }
        drawPath(
            path = smilePath,
            color = Color(0xFF2DD4BF).copy(alpha = 0.85f),
            style = Stroke(width = 2.5f, cap = StrokeCap.Round)
        )
    }
}

/**
 * Alternative Classic Nova Orb Mode
 */
private fun DrawScope.drawNovaCoreOrb(
    center: Offset,
    radius: Float,
    state: NovaAssistantState,
    pulse: Float
) {
    val orbColors = when (state) {
        NovaAssistantState.LISTENING -> listOf(Color(0xFF00F2FE), Color(0xFF0284C7), Color(0xFF0B192C))
        NovaAssistantState.SPEAKING -> listOf(Color(0xFF2DD4BF), Color(0xFF0F766E), Color(0xFF042F2E))
        NovaAssistantState.THINKING -> listOf(Color(0xFFA5B4FC), Color(0xFF6366F1), Color(0xFF1E1B4B))
        else -> listOf(Color(0xFF00F2FE), Color(0xFF00A896), Color(0xFF0A2540))
    }

    drawCircle(
        brush = Brush.radialGradient(
            colors = orbColors,
            center = center,
            radius = radius * pulse
        ),
        radius = radius * pulse,
        center = center
    )

    // Inner bright white core
    drawCircle(
        color = Color.White.copy(alpha = 0.9f),
        radius = radius * 0.32f * pulse,
        center = center
    )
}
