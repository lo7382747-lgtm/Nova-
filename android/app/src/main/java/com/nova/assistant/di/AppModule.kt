package com.nova.assistant.di

import android.content.Context
import androidx.room.Room
import com.nova.assistant.data.local.ActivityLogDao
import com.nova.assistant.data.local.MessageDao
import com.nova.assistant.data.local.NovaDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideContext(@ApplicationContext context: Context): Context = context

    @Provides
    @Singleton
    fun provideNovaDatabase(@ApplicationContext context: Context): NovaDatabase {
        return Room.databaseBuilder(
            context,
            NovaDatabase::class.java,
            "nova_assistant.db"
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    fun provideMessageDao(database: NovaDatabase): MessageDao {
        return database.messageDao()
    }

    @Provides
    fun provideActivityLogDao(database: NovaDatabase): ActivityLogDao {
        return database.activityLogDao()
    }

    @Provides
    @Singleton
    fun provideGeminiRepository(messageDao: MessageDao): com.nova.assistant.data.GeminiRepository {
        return com.nova.assistant.data.GeminiRepository(messageDao) {
            com.nova.assistant.BuildConfig.GEMINI_API_KEY.ifEmpty { "DEMO_KEY" }
        }
    }

    @Provides
    @Singleton
    fun provideGeminiLiveSessionManager(
        @dagger.hilt.android.qualifiers.ApplicationContext context: android.content.Context
    ): com.nova.assistant.live.GeminiLiveSessionManager {
        return com.nova.assistant.live.GeminiLiveSessionManager(context) {
            com.nova.assistant.BuildConfig.GEMINI_API_KEY.ifEmpty { "DEMO_KEY" }
        }
    }
}
