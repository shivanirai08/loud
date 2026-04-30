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

        // Start foreground service to play alarm
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

        // Launch the alarm ring activity
        val activityIntent = Intent(context, AlarmRingActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra(EXTRA_ALARM_ID, alarmId)
            putExtra(EXTRA_ALARM_TEXT, alarmText)
            putExtra(EXTRA_ALARM_LANGUAGE, alarmLanguage)
        }
        context.startActivity(activityIntent)
    }
}
