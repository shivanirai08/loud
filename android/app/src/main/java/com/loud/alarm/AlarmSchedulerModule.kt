package com.loud.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.*

class AlarmSchedulerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val TAG = "AlarmSchedulerModule"
    }

    override fun getName(): String = "AlarmScheduler"

    @ReactMethod
    fun scheduleAlarm(alarmId: String, timestamp: Double, text: String, language: String, promise: Promise) {
        try {
            val context = reactApplicationContext
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

            val intent = Intent(context, AlarmReceiver::class.java).apply {
                putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarmId)
                putExtra(AlarmReceiver.EXTRA_ALARM_TEXT, text)
                putExtra(AlarmReceiver.EXTRA_ALARM_LANGUAGE, language)
            }

            val pendingIntent = PendingIntent.getBroadcast(
                context,
                alarmId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val triggerTime = timestamp.toLong()

            // Strategy: Try the most reliable method first, fall through on failure.
            // setAlarmClock is the proper API for alarm clock apps and gets special
            // treatment from the system (shows alarm icon, bypasses doze, etc.)
            var scheduled = false

            // Attempt 1: setAlarmClock (best for alarm apps, requires SCHEDULE_EXACT_ALARM on API 31+)
            if (!scheduled) {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
                        Log.w(TAG, "canScheduleExactAlarms() false, skipping setAlarmClock")
                    } else {
                        alarmManager.setAlarmClock(
                            AlarmManager.AlarmClockInfo(triggerTime, pendingIntent),
                            pendingIntent
                        )
                        scheduled = true
                        Log.d(TAG, "Alarm scheduled (setAlarmClock): $alarmId at $triggerTime")
                    }
                } catch (e: SecurityException) {
                    Log.w(TAG, "setAlarmClock failed (SecurityException): ${e.message}")
                }
            }

            // Attempt 2: setExactAndAllowWhileIdle (exact + survives doze)
            if (!scheduled) {
                try {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
                    scheduled = true
                    Log.d(TAG, "Alarm scheduled (setExactAndAllowWhileIdle): $alarmId at $triggerTime")
                } catch (e: SecurityException) {
                    Log.w(TAG, "setExactAndAllowWhileIdle failed (SecurityException): ${e.message}")
                }
            }

            // Attempt 3: setAndAllowWhileIdle (inexact but doesn't require SCHEDULE_EXACT_ALARM)
            if (!scheduled) {
                try {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
                    scheduled = true
                    Log.d(TAG, "Alarm scheduled (setAndAllowWhileIdle): $alarmId at $triggerTime")
                } catch (e: SecurityException) {
                    Log.w(TAG, "setAndAllowWhileIdle failed (SecurityException): ${e.message}")
                }
            }

            // Attempt 4: set (basic alarm, last resort)
            if (!scheduled) {
                try {
                    alarmManager.set(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
                    scheduled = true
                    Log.d(TAG, "Alarm scheduled (set): $alarmId at $triggerTime")
                } catch (e: SecurityException) {
                    Log.w(TAG, "set() also failed: ${e.message}")
                }
            }

            if (scheduled) {
                promise.resolve(true)
            } else {
                promise.reject("SCHEDULE_ERROR", "All alarm scheduling methods failed. Please grant alarm permission in device settings.")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error scheduling alarm: ${e.message}")
            promise.reject("SCHEDULE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun openExactAlarmSettings(promise: Promise) {
        try {
            val context = reactApplicationContext
            val packageName = context.packageName

            // Use currentActivity for launching — MIUI/HyperOS often blocks startActivity from non-Activity context
            val activity = reactApplicationContext.currentActivity

            // Build list of intents to try, ordered by specificity
            val intents = mutableListOf<Intent>()

            // Stock Android 12+ exact alarm settings
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                intents.add(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                    data = Uri.parse("package:$packageName")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                })
            }

            // HyperOS / MIUI 14+ permission editor
            intents.add(Intent().apply {
                setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.PermissionsEditorActivity")
                putExtra("extra_pkgname", packageName)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })

            // MIUI legacy permission editor (older MIUI versions)
            intents.add(Intent("miui.intent.action.APP_PERM_EDITOR").apply {
                putExtra("extra_pkgname", packageName)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })

            // HyperOS app info page (newer Xiaomi devices)
            intents.add(Intent().apply {
                setClassName("com.miui.securitycenter", "com.miui.appmanager.AppManagerMainActivity")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })

            // General app details settings (universal fallback)
            intents.add(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:$packageName")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })

            // Try each intent — don't check resolveActivity (unreliable on MIUI/HyperOS)
            for (intent in intents) {
                try {
                    if (activity != null) {
                        activity.startActivity(intent)
                    } else {
                        context.startActivity(intent)
                    }
                    Log.d(TAG, "Successfully launched settings intent: ${intent.component ?: intent.action}")
                    promise.resolve(true)
                    return
                } catch (e: Exception) {
                    Log.w(TAG, "Intent failed (${intent.component ?: intent.action}): ${e.message}")
                    continue
                }
            }

            // Absolute last resort: general device settings
            val fallbackIntent = Intent(Settings.ACTION_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            if (activity != null) {
                activity.startActivity(fallbackIntent)
            } else {
                context.startActivity(fallbackIntent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to open settings: ${e.message}")
            promise.reject("SETTINGS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun cancelAlarm(alarmId: String, promise: Promise) {
        try {
            val context = reactApplicationContext
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

            val intent = Intent(context, AlarmReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                alarmId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()

            Log.d(TAG, "Alarm cancelled: $alarmId")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error cancelling alarm: ${e.message}")
            promise.reject("CANCEL_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopAlarmService(promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = Intent(context, AlarmForegroundService::class.java).apply {
                action = AlarmForegroundService.ACTION_STOP
            }
            context.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message)
        }
    }

    @ReactMethod
    fun snoozeAlarm(alarmId: String, snoozeDurationMs: Double, text: String, language: String, promise: Promise) {
        try {
            // First stop the current alarm
            val context = reactApplicationContext
            val stopIntent = Intent(context, AlarmForegroundService::class.java).apply {
                action = AlarmForegroundService.ACTION_SNOOZE
            }
            context.startService(stopIntent)

            // Then schedule a new alarm for snooze duration
            val snoozeTime = System.currentTimeMillis() + snoozeDurationMs.toLong()
            scheduleAlarm(alarmId, snoozeTime.toDouble(), text, language, promise)
        } catch (e: Exception) {
            promise.reject("SNOOZE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun canScheduleExactAlarms(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val alarmManager = reactApplicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            promise.resolve(alarmManager.canScheduleExactAlarms())
        } else {
            promise.resolve(true)
        }
    }
}
