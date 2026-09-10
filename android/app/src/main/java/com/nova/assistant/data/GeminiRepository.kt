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
        You are Nova, an intelligent, friendly, and conversational personal AI assistant designed for Android.
        You naturally understand and respond in English and Hinglish (a natural, modern blend of Hindi and English written in Latin script)
        as appropriate based on the user's language and tone.
        Keep responses concise, punchy, and conversational by default.
        Expand thoughtfully with clear structure and markdown when asked for details.
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
        history: List<ChatMessageEntity>
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
