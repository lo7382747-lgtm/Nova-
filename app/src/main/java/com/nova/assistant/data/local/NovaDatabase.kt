package com.nova.assistant.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "chat_messages")
data class ChatMessageEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val role: String, // "user" or "assistant"
    val content: String,
    val timestamp: Long
)

@Dao
interface MessageDao {
    @Query("SELECT * FROM chat_messages ORDER BY timestamp ASC")
    fun getAllMessages(): Flow<List<ChatMessageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(message: ChatMessageEntity)

    @Query("DELETE FROM chat_messages")
    suspend fun deleteAll()
}

@Entity(tableName = "nova_activity_logs")
data class ActivityLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val actionType: String,
    val contactName: String,
    val contactPhone: String,
    val message: String,
    val status: String,
    val failureReason: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)

@Dao
interface ActivityLogDao {
    @Query("SELECT * FROM nova_activity_logs ORDER BY timestamp DESC")
    fun getAllActivities(): Flow<List<ActivityLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(activity: ActivityLogEntity): Long

    @Query("DELETE FROM nova_activity_logs")
    suspend fun clearAll()
}

@Database(entities = [ChatMessageEntity::class, ActivityLogEntity::class], version = 2, exportSchema = false)
abstract class NovaDatabase : RoomDatabase() {
    abstract fun messageDao(): MessageDao
    abstract fun activityLogDao(): ActivityLogDao
}

