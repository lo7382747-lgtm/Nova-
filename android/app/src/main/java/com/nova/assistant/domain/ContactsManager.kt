package com.nova.assistant.domain

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.provider.ContactsContract
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

data class ContactItem(
    val id: String,
    val name: String,
    val phoneNumber: String,
    val label: String = "Mobile"
)

@Singleton
class ContactsManager @Inject constructor(
    private val context: Context
) {
    fun hasContactsPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_CONTACTS
        ) == PackageManager.PERMISSION_GRANTED
    }

    fun getDefaultContacts(): List<ContactItem> = listOf(
        ContactItem("1", "Priya Sharma", "+91 98765 43210", "Sister"),
        ContactItem("2", "Rahul Verma", "+91 98123 45678", "Colleague"),
        ContactItem("3", "Dr. Rajesh Gupta", "+91 98234 56789", "Family Doctor"),
        ContactItem("4", "Amit Patel", "+91 98345 67890", "Work"),
        ContactItem("5", "Mom", "+91 98456 78901", "Family"),
        ContactItem("6", "Emergency Hotline", "112", "Emergency")
    )

    suspend fun loadAllContacts(): List<ContactItem> = withContext(Dispatchers.IO) {
        if (!hasContactsPermission()) {
            return@withContext getDefaultContacts()
        }

        val results = mutableListOf<ContactItem>()
        val uri = ContactsContract.CommonDataKinds.Phone.CONTENT_URI
        val projection = arrayOf(
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
            ContactsContract.CommonDataKinds.Phone.LABEL
        )

        try {
            context.contentResolver.query(uri, projection, null, null, null)?.use { cursor ->
                val nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
                val numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
                val idIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID)
                val labelIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.LABEL)

                while (cursor.moveToNext()) {
                    val name = cursor.getString(nameIndex) ?: continue
                    val number = cursor.getString(numberIndex) ?: continue
                    val id = cursor.getString(idIndex) ?: ""
                    val label = if (labelIndex >= 0) cursor.getString(labelIndex) ?: "Mobile" else "Mobile"

                    results.add(ContactItem(id = id, name = name, phoneNumber = number, label = label))
                }
            }
        } catch (e: Exception) {
            return@withContext getDefaultContacts()
        }

        if (results.isEmpty()) getDefaultContacts() else results.distinctBy { it.phoneNumber }
    }

    suspend fun searchContacts(query: String): List<ContactItem> = withContext(Dispatchers.IO) {
        if (!hasContactsPermission()) {
            val clean = query.trim().lowercase()
            return@withContext getDefaultContacts().filter {
                it.name.lowercase().contains(clean) || clean.contains(it.name.lowercase())
            }
        }

        val results = mutableListOf<ContactItem>()
        val cleanQuery = query.trim().lowercase()

        val uri = ContactsContract.CommonDataKinds.Phone.CONTENT_URI
        val projection = arrayOf(
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
            ContactsContract.CommonDataKinds.Phone.TYPE
        )

        try {
            context.contentResolver.query(uri, projection, null, null, null)?.use { cursor ->
                val nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
                val numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
                val idIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID)

                while (cursor.moveToNext()) {
                    val name = cursor.getString(nameIndex) ?: continue
                    val number = cursor.getString(numberIndex) ?: continue
                    val id = cursor.getString(idIndex) ?: ""

                    if (name.lowercase().contains(cleanQuery) || cleanQuery.contains(name.lowercase())) {
                        results.add(ContactItem(id = id, name = name, phoneNumber = number))
                    }
                }
            }
        } catch (e: Exception) {
            // fallback
        }
        results.distinctBy { it.phoneNumber }
    }
}
