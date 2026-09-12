package com.nova.assistant.live

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import android.util.Base64
import android.util.Log
import com.nova.assistant.ui.components.NovaAssistantState
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.*
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.sqrt

/**
 * GeminiLiveSessionManager handles true real-time, bidirectional voice streaming
 * with the Gemini Multimodal Live API over WebSockets.
 *
 * Features:
 * - 16kHz PCM audio capture directly from microphone to Gemini Live API
 * - 24kHz PCM low-latency audio response playback directly to speaker (zero TTS delay)
 * - Server & client-side Voice Activity Detection (VAD) and instantaneous Interruption handling
 * - Multi-turn conversational context retention for the entire call session
 * - Natural bilingual (Hindi + English) conversational prompt
 * - Real-time state synchronization with NovaAssistantState (IDLE, LISTENING, THINKING, SPEAKING)
 * - Live audio amplitude metering for the animated avatar waveform / equalizer
 */
class GeminiLiveSessionManager(
    private val context: Context,
    private val apiKeyProvider: () -> String
) {
    companion object {
        private const val TAG = "GeminiLiveSession"
        private const val LIVE_API_HOST = "generativelanguage.googleapis.com"
        private const val LIVE_API_PATH = "/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent"
        
        // Supported live voice models
        const val MODEL_GEMINI_2_FLASH_EXP = "models/gemini-2.0-flash-exp"
        const val MODEL_GEMINI_2_FLASH_REALTIME = "models/gemini-2.0-flash-realtime-exp"
        
        // Audio format constants
        private const val INPUT_SAMPLE_RATE = 16000
        private const val OUTPUT_SAMPLE_RATE = 24000
        private const val AUDIO_CHUNK_SIZE = 2048 // ~64ms at 16kHz 16-bit Mono
        private const val USER_BARGE_IN_RMS_THRESHOLD = 1800.0 // Threshold to detect user speaking over Nova
    }

    private val coroutineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .pingInterval(20, TimeUnit.SECONDS)
        .build()

    private var webSocket: WebSocket? = null

    // State Flows
    private val _assistantState = MutableStateFlow(NovaAssistantState.IDLE)
    val assistantState: StateFlow<NovaAssistantState> = _assistantState.asStateFlow()

    private val _isCallActive = MutableStateFlow(false)
    val isCallActive: StateFlow<Boolean> = _isCallActive.asStateFlow()

    private val _liveTranscript = MutableStateFlow("")
    val liveTranscript: StateFlow<String> = _liveTranscript.asStateFlow()

    private val _audioAmplitude = MutableStateFlow(0f)
    val audioAmplitude: StateFlow<Float> = _audioAmplitude.asStateFlow()

    private val _turnCompletedEvent = MutableSharedFlow<String>(extraBufferCapacity = 10)
    val turnCompletedEvent: SharedFlow<String> = _turnCompletedEvent.asSharedFlow()

    private val _sessionError = MutableSharedFlow<String>(extraBufferCapacity = 5)
    val sessionError: SharedFlow<String> = _sessionError.asSharedFlow()

    // Audio Hardware
    private var audioRecord: AudioRecord? = null
    private var audioTrack: AudioTrack? = null

    private val isRecording = AtomicBoolean(false)
    private val isPlaying = AtomicBoolean(false)
    private val isModelSpeaking = AtomicBoolean(false)

    // Audio Playback Queue
    private val playbackQueue = LinkedBlockingQueue<ByteArray>()
    private var recordingJob: Job? = null
    private var playbackJob: Job? = null

    // Transcript Accumulator
    private val currentTurnTranscript = StringBuilder()
    private var consecutiveHighEnergyFrames = 0

    /**
     * Start the live call session
     */
    @SuppressLint("MissingPermission")
    fun startLiveCall(preferredLanguage: String = "EN") {
        if (_isCallActive.value) return

        val apiKey = apiKeyProvider().trim()
        if (apiKey.isEmpty() || apiKey == "DEMO_KEY") {
            _sessionError.tryEmit("Gemini API key is not configured. Please set your GEMINI_API_KEY.")
            _assistantState.value = NovaAssistantState.IDLE
            return
        }

        _isCallActive.value = true
        _assistantState.value = NovaAssistantState.THINKING
        _liveTranscript.value = if (preferredLanguage == "HI") "Nova Live se connect ho raha hai..." else "Connecting to Nova Live..."

        initAudioTrack()
        connectWebSocket(apiKey, preferredLanguage)
    }

    /**
     * End the live call session
     */
    fun endLiveCall() {
        _isCallActive.value = false
        _assistantState.value = NovaAssistantState.IDLE
        _liveTranscript.value = ""
        _audioAmplitude.value = 0f

        stopAudioRecording()
        stopAudioPlayback(clearQueue = true)

        try {
            webSocket?.close(1000, "User ended call")
        } catch (e: Exception) {
            Log.w(TAG, "Error closing WebSocket: ${e.message}")
        }
        webSocket = null

        releaseAudioHardware()
    }

    /**
     * Manual interruption trigger (e.g. user tapped the screen or button)
     */
    fun triggerUserInterruption() {
        if (isModelSpeaking.get()) {
            stopAudioPlayback(clearQueue = true)
            isModelSpeaking.set(false)
            _assistantState.value = NovaAssistantState.LISTENING
            _audioAmplitude.value = 0.1f
        }
    }

    private fun connectWebSocket(apiKey: String, preferredLanguage: String) {
        val url = "wss://$LIVE_API_HOST$LIVE_API_PATH?key=$apiKey"
        val request = Request.Builder()
            .url(url)
            .build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "WebSocket Connected to Gemini Live API")
                sendSetupMessage(webSocket, preferredLanguage)
                startAudioRecording()
                _assistantState.value = NovaAssistantState.LISTENING
                _liveTranscript.value = if (preferredLanguage == "HI") "Nova sun rahi hai... Boliye" else "Nova is listening... Speak now"
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                handleIncomingMessage(text)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket Failure: ${t.message}", t)
                _sessionError.tryEmit("Connection failed: ${t.localizedMessage ?: "Network error"}")
                _assistantState.value = NovaAssistantState.IDLE
                _isCallActive.value = false
                stopAudioRecording()
                stopAudioPlayback(clearQueue = true)
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket Closing: $code $reason")
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket Closed: $code $reason")
                _isCallActive.value = false
                _assistantState.value = NovaAssistantState.IDLE
            }
        })
    }

    private fun sendSetupMessage(ws: WebSocket, preferredLanguage: String) {
        try {
            val systemPrompt = if (preferredLanguage == "HI") {
                "Aap Nova hain — J.A.R.V.I.S. ke persona par aadharit ek shant, atma-vishwas se poorn aur atyant kushal AI assistant. " +
                "Aap user ke saath real-time live voice conversation mein hain. " +
                "User ko aadar se 'Sir' keh kar sambodhit karein. Dheere, gambheer, shant aur spasht bhasha mein baat karein. " +
                "Filler words ('um', 'well', 'basically') ka prayog bilkul na karein. Seedha, sateek aur madhyam sankshipt jawab dein. " +
                "Jab koi task poora ho toh shishtata aur atma-vishwas se kahein ('Nishchit roop se, Sir. Kaam prarambh kiya ja raha hai.'). " +
                "Khabhi anavashyak maafi na maangein. Bina kisi markdown, asterisks ya bullet points ke bolein."
            } else {
                "You are Nova, an advanced AI assistant modeled after J.A.R.V.I.S., engaged in a live voice conversation with the user. " +
                "Speak with calm, unshakeable confidence, polished diction, and subtle dry wit. " +
                "Address the user respectfully as 'Sir' naturally. Be concise, direct, and proactively helpful — never ramble. " +
                "Avoid filler words ('um', 'well', 'basically'). When confirming tasks, be crisp ('Certainly, Sir. Initiating now.'). " +
                "Never offer unnecessary apologies or long-winded excuses. Never use markdown, asterisks, or bullet points in spoken words. " +
                "Support both English and natural Hindi/Hinglish seamlessly."
            }

            val setupPayload = JSONObject().apply {
                put("setup", JSONObject().apply {
                    put("model", MODEL_GEMINI_2_FLASH_EXP)
                    put("generationConfig", JSONObject().apply {
                        put("responseModalities", JSONArray().apply {
                            put("AUDIO")
                        })
                        put("speechConfig", JSONObject().apply {
                            put("voiceConfig", JSONObject().apply {
                                put("prebuiltVoiceConfig", JSONObject().apply {
                                    // Aoede has a warm, natural conversational voice suitable for bilingual speech
                                    put("voiceName", "Aoede")
                                } )
                            })
                        })
                    })
                    put("systemInstruction", JSONObject().apply {
                        put("parts", JSONArray().apply {
                            put(JSONObject().apply {
                                put("text", systemPrompt)
                            })
                        })
                    })
                })
            }

            ws.send(setupPayload.toString())
            Log.d(TAG, "Setup message sent to Gemini Live API")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send setup message: ${e.message}", e)
        }
    }

    private fun handleIncomingMessage(jsonString: String) {
        try {
            val root = JSONObject(jsonString)
            val serverContent = root.optJSONObject("serverContent") ?: return

            // 1. Interruption check from Gemini server
            val isInterrupted = serverContent.optBoolean("interrupted", false)
            if (isInterrupted) {
                Log.d(TAG, "Gemini server flagged interruption: user barge-in detected")
                stopAudioPlayback(clearQueue = true)
                isModelSpeaking.set(false)
                _assistantState.value = NovaAssistantState.LISTENING
                _audioAmplitude.value = 0.05f
                return
            }

            // 2. Model turn parts (Audio + Text)
            val modelTurn = serverContent.optJSONObject("modelTurn")
            if (modelTurn != null) {
                val parts = modelTurn.optJSONArray("parts")
                if (parts != null) {
                    for (i in 0 until parts.length()) {
                        val part = parts.getJSONObject(i)

                        // Check for audio payload (PCM 24kHz)
                        val inlineData = part.optJSONObject("inlineData")
                        if (inlineData != null) {
                            val mimeType = inlineData.optString("mimeType")
                            val base64Data = inlineData.optString("data")
                            if (base64Data.isNotEmpty()) {
                                val pcmBytes = Base64.decode(base64Data, Base64.DEFAULT)
                                enqueueAudioForPlayback(pcmBytes)
                            }
                        }

                        // Check for text transcript stream
                        val text = part.optString("text")
                        if (text.isNotEmpty()) {
                            currentTurnTranscript.append(text)
                            _liveTranscript.value = currentTurnTranscript.toString()
                        }
                    }
                }
            }

            // 3. Turn complete check
            val turnComplete = serverContent.optBoolean("turnComplete", false)
            if (turnComplete) {
                val completedText = currentTurnTranscript.toString().trim()
                if (completedText.isNotEmpty()) {
                    _turnCompletedEvent.tryEmit(completedText)
                    currentTurnTranscript.clear()
                }
                // When playback queue finishes playing, state automatically returns to LISTENING
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing server message: ${e.message}", e)
        }
    }

    // --- Audio Playback (Speaker, 24kHz PCM) ---
    private fun initAudioTrack() {
        try {
            val minBufferSize = AudioTrack.getMinBufferSize(
                OUTPUT_SAMPLE_RATE,
                AudioFormat.CHANNEL_OUT_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            )
            val bufferSize = minBufferSize.coerceAtLeast(OUTPUT_SAMPLE_RATE * 2)

            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build()

            val audioFormat = AudioFormat.Builder()
                .setSampleRate(OUTPUT_SAMPLE_RATE)
                .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                .build()

            audioTrack = AudioTrack(
                audioAttributes,
                audioFormat,
                bufferSize,
                AudioTrack.MODE_STREAM,
                AudioManager.AUDIO_SESSION_ID_GENERATE
            )

            audioTrack?.play()
            startPlaybackWorker()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize AudioTrack: ${e.message}", e)
        }
    }

    private fun startPlaybackWorker() {
        isPlaying.set(true)
        playbackJob = coroutineScope.launch {
            val track = audioTrack ?: return@launch
            while (isPlaying.get() && isActive) {
                val chunk = withContext(Dispatchers.IO) {
                    playbackQueue.poll(50, TimeUnit.MILLISECONDS)
                }

                if (chunk != null && chunk.isNotEmpty()) {
                    isModelSpeaking.set(true)
                    _assistantState.value = NovaAssistantState.SPEAKING

                    // Calculate amplitude for avatar visualization
                    val amp = calculateRmsNormalized(chunk)
                    _audioAmplitude.value = amp

                    track.write(chunk, 0, chunk.size)
                } else {
                    if (playbackQueue.isEmpty() && isModelSpeaking.get()) {
                        isModelSpeaking.set(false)
                        if (_isCallActive.value) {
                            _assistantState.value = NovaAssistantState.LISTENING
                            _audioAmplitude.value = 0.05f
                        }
                    }
                }
            }
        }
    }

    private fun enqueueAudioForPlayback(pcmData: ByteArray) {
        playbackQueue.offer(pcmData)
        if (!isModelSpeaking.get()) {
            isModelSpeaking.set(true)
            _assistantState.value = NovaAssistantState.SPEAKING
        }
    }

    private fun stopAudioPlayback(clearQueue: Boolean = true) {
        if (clearQueue) {
            playbackQueue.clear()
        }
        try {
            audioTrack?.pause()
            audioTrack?.flush()
            audioTrack?.play()
        } catch (e: Exception) {
            Log.w(TAG, "Error flushing AudioTrack: ${e.message}")
        }
        isModelSpeaking.set(false)
    }

    // --- Audio Capture (Microphone, 16kHz PCM) ---
    @SuppressLint("MissingPermission")
    private fun startAudioRecording() {
        if (isRecording.get()) return

        try {
            val minBufferSize = AudioRecord.getMinBufferSize(
                INPUT_SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            )
            val bufferSize = minBufferSize.coerceAtLeast(AUDIO_CHUNK_SIZE * 4)

            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                INPUT_SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferSize
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                Log.e(TAG, "AudioRecord failed to initialize")
                _sessionError.tryEmit("Microphone initialization failed.")
                return
            }

            audioRecord?.startRecording()
            isRecording.set(true)

            recordingJob = coroutineScope.launch {
                val buffer = ByteArray(AUDIO_CHUNK_SIZE)
                while (isRecording.get() && isActive) {
                    val bytesRead = audioRecord?.read(buffer, 0, buffer.size) ?: -1
                    if (bytesRead > 0) {
                        val chunk = buffer.copyOf(bytesRead)
                        val rms = calculateRms(chunk)

                        // 1. Client-Side Voice Activity Detection & Interruption
                        if (isModelSpeaking.get()) {
                            if (rms > USER_BARGE_IN_RMS_THRESHOLD) {
                                consecutiveHighEnergyFrames++
                                if (consecutiveHighEnergyFrames >= 2) {
                                    Log.d(TAG, "Client-side barge-in detected (RMS: $rms). Cutting Nova response.")
                                    stopAudioPlayback(clearQueue = true)
                                    _assistantState.value = NovaAssistantState.LISTENING
                                    consecutiveHighEnergyFrames = 0
                                }
                            } else {
                                consecutiveHighEnergyFrames = 0
                            }
                        } else {
                            consecutiveHighEnergyFrames = 0
                            // Display mic amplitude on avatar while listening
                            val normAmp = (rms / 3000.0).toFloat().coerceIn(0.05f, 1.0f)
                            _audioAmplitude.value = normAmp
                        }

                        // 2. Stream chunk to Gemini Live API WebSocket
                        sendAudioChunk(chunk)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting AudioRecord: ${e.message}", e)
        }
    }

    private fun sendAudioChunk(chunk: ByteArray) {
        val ws = webSocket ?: return
        try {
            val base64 = Base64.encodeToString(chunk, Base64.NO_WRAP)
            val realtimeInput = JSONObject().apply {
                put("realtimeInput", JSONObject().apply {
                    put("mediaChunks", JSONArray().apply {
                        put(JSONObject().apply {
                            put("mimeType", "audio/pcm;rate=16000")
                            put("data", base64)
                        })
                    })
                })
            }
            ws.send(realtimeInput.toString())
        } catch (e: Exception) {
            Log.w(TAG, "Failed to send audio chunk: ${e.message}")
        }
    }

    private fun stopAudioRecording() {
        isRecording.set(false)
        recordingJob?.cancel()
        recordingJob = null
        try {
            audioRecord?.stop()
            audioRecord?.release()
        } catch (e: Exception) {
            Log.w(TAG, "Error stopping AudioRecord: ${e.message}")
        }
        audioRecord = null
    }

    private fun releaseAudioHardware() {
        isPlaying.set(false)
        playbackJob?.cancel()
        playbackJob = null
        try {
            audioTrack?.stop()
            audioTrack?.release()
        } catch (e: Exception) {
            Log.w(TAG, "Error releasing AudioTrack: ${e.message}")
        }
        audioTrack = null
    }

    private fun calculateRms(pcmBytes: ByteArray): Double {
        var sum = 0.0
        val numSamples = pcmBytes.size / 2
        if (numSamples == 0) return 0.0

        for (i in 0 until numSamples) {
            val sample = (pcmBytes[i * 2 + 1].toInt() shl 8) or (pcmBytes[i * 2].toInt() and 0xFF)
            sum += (sample * sample).toDouble()
        }
        return sqrt(sum / numSamples)
    }

    private fun calculateRmsNormalized(pcmBytes: ByteArray): Float {
        val rawRms = calculateRms(pcmBytes)
        return (rawRms / 4500.0).toFloat().coerceIn(0.08f, 1.0f)
    }
}
