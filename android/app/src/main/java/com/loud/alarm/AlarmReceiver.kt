package com.loud.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class AlarmReceiver : BroadcastReceiver() {
    companion object {
        const val TAG = "AlarmReceiver"
        const val EXTRA_ALARM_ID = "alarm_id"
        const val EXTRA_ALARM_TEXT = "alarm_text"
        const val EXTRA_ALARM_LANGUAGE = "alarm_language"
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Alarm received!")

        val alarmId = intent.getStringExtra(EXTRA_ALARM_ID) ?: return
        val alarmText = intent.getStringExtra(EXTRA_ALARM_TEXT) ?: "Alarm!"
        val alarmLanguage = intent.getStringExtra(EXTRA_ALARM_LANGUAGE) ?: "en-US"

        // Start foreground service to play alarm (TTS + vibration)
        // The service's notification has fullScreenIntent which will launch AlarmRingActivity
        val serviceIntent = Intent(context, AlarmForegroundService::class.java).apply {
            putExtra(EXTRA_ALARM_ID, alarmId)
            putExtra(EXTRA_ALARM_TEXT, alarmText)
            putExtra(EXTRA_ALARM_LANGUAGE, alarmLanguage)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }

        // Also try to launch the activity directly (works when app has SYSTEM_ALERT_WINDOW
        // or when launched from an alarm clock PendingIntent on some devices)
        try {
            val activityIntent = Intent(context, AlarmRingActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_NO_USER_ACTION)
                putExtra(EXTRA_ALARM_ID, alarmId)
                putExtra(EXTRA_ALARM_TEXT, alarmText)
                putExtra(EXTRA_ALARM_LANGUAGE, alarmLanguage)
            }
            context.startActivity(activityIntent)
        } catch (e: Exception) {
            Log.w(TAG, "Could not start activity directly (expected on Android 10+): ${e.message}")
            // This is fine - the fullScreenIntent in the notification will handle it
        }
    }
}
