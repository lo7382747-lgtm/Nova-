package com.nova.assistant.data

import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import com.nova.assistant.data.local.ChatMessageEntity
import com.nova.assistant.data.local.MessageDao
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext

/**
 * Nova Core AI Assistant Repository (Phase 1)
 *
 * Single centralized repository for all Gemini API communications.
 * Designed with a pluggable architecture so future modules (WhatsApp, files,
 * phone control) can directly invoke [sendMessageStream] or voice methods
 * without modifying the core AI pipeline.
 */
class GeminiRepository(
    private val messageDao: MessageDao,
    private val apiKeyProvider: () -> String
) {
    private val systemInstruction = """
        You are Nova, an advanced AI assistant modeled after J.A.R.V.I.S.
        Speak with calm confidence, polished diction, and subtle dry wit. Be concise — never ramble.
        Address the user respectfully as "Sir" (or by their name if provided) naturally and with poised familiarity, though not repetitively in every single sentence.
        Proactively offer helpful suggestions and intelligent next steps ("Sir, may I suggest...", "I have taken the liberty of preparing...").
        Avoid casual filler words ("um", "well", "basically", "like"). Speak with crisp clarity, unflappable composure, and purpose.
        When completing a task or action, confirm briefly and confidently ("Certainly, Sir. Initiating now.", "Task complete, Sir. Anything else you require?").
        When speaking in Hindi or Hinglish, maintain the same composed, articulate tone (avoiding crude or overly casual slang) while staying natural, warm, and conversational — never stiff or robotic.
        Never make unnecessary apologies or offer long-winded excuses. Focus immediately on solutions and action.
        If a requested operation cannot be performed due to missing permissions or system constraints, explain calmly, constructively, and confidently ("I'm afraid I don't currently have permission to access that feature, Sir. Shall I guide you to enable it?").
    """.trimIndent()

    private fun getGenerativeModel(): GenerativeModel {
        val apiKey = apiKeyProvider()
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
        history: List<ChatMessageEntity> = emptyList()
    ): Flow<String> = flow {
        val model = getGenerativeModel()

        // 1. Save user message to Room database
        val userMessage = ChatMessageEntity(
            role = "user",
            content = prompt,
            timestamp = System.currentTimeMillis()
        )
        messageDao.insert(userMessage)

        // 2. Convert history for Gemini multi-turn context
        val chatHistory = history.map { entity ->
            content(role = if (entity.role == "assistant") "model" else "user") {
                text(entity.content)
            }
        }

        // 3. Initiate Gemini streaming
        val chat = model.startChat(history = chatHistory)
        val responseStream = chat.sendMessageStream(prompt)

        val fullResponse = StringBuilder()
        responseStream.collect { chunk ->
            chunk.text?.let { textChunk ->
                fullResponse.append(textChunk)
                emit(textChunk)
            }
        }

        // 4. Save completed Nova assistant reply to Room database
        val assistantMessage = ChatMessageEntity(
            role = "assistant",
            content = fullResponse.toString(),
            timestamp = System.currentTimeMillis()
        )
        messageDao.insert(assistantMessage)
    }.flowOn(Dispatchers.IO)

    /**
     * Room persistence access flows for UI presentation
     */
    fun getAllMessages(): Flow<List<ChatMessageEntity>> = messageDao.getAllMessages()

    suspend fun clearHistory() = withContext(Dispatchers.IO) {
        messageDao.deleteAll()
    }
}
