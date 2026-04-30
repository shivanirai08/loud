package com.loud.alarm

import android.app.*
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.*
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import androidx.core.app.NotificationCompat
import java.util.*

class AlarmForegroundService : Service(), TextToSpeech.OnInitListener {
    companion object {
        const val TAG = "AlarmForegroundService"
        const val CHANNEL_ID = "loud_alarm_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_STOP = "com.loud.alarm.ACTION_STOP"
        const val ACTION_SNOOZE = "com.loud.alarm.ACTION_SNOOZE"
    }

    private var mediaPlayer: MediaPlayer? = null
    private var tts: TextToSpeech? = null
    private var alarmText: String = "Alarm!"
    private var alarmLanguage: String = "en-US"
    private var alarmId: String = ""
    private var isTtsReady = false
    private var vibrator: Vibrator? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private val handler = Handler(Looper.getMainLooper())
    private var ttsLoopRunnable: Runnable? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        tts = TextToSpeech(this, this)
        vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopAlarm()
                return START_NOT_STICKY
            }
            ACTION_SNOOZE -> {
                stopAlarm()
                return START_NOT_STICKY
            }
        }

        alarmId = intent?.getStringExtra(AlarmReceiver.EXTRA_ALARM_ID) ?: ""
        alarmText = intent?.getStringExtra(AlarmReceiver.EXTRA_ALARM_TEXT) ?: "Alarm!"
        alarmLanguage = intent?.getStringExtra(AlarmReceiver.EXTRA_ALARM_LANGUAGE) ?: "en-US"

        // Acquire wake lock
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "loud:AlarmWakeLock"
        )
        wakeLock?.acquire(10 * 60 * 1000L) // 10 minutes max

        // Start foreground with notification
        val notification = buildNotification()
        startForeground(NOTIFICATION_ID, notification)

        // Start ringtone
        startRingtone()

        // Start vibration
        startVibration()

        return START_STICKY
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val locale = if (alarmLanguage.startsWith("hi")) {
                Locale("hi", "IN")
            } else {
                Locale.US
            }
            val result = tts?.setLanguage(locale)
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.e(TAG, "Language not supported, falling back to default")
                tts?.setLanguage(Locale.US)
            }
            isTtsReady = true
            startTtsLoop()
        } else {
            Log.e(TAG, "TTS initialization failed")
        }
    }

    private fun startTtsLoop() {
        if (!isTtsReady) return

        tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {}
            override fun onDone(utteranceId: String?) {
                // Schedule next TTS after a short delay
                ttsLoopRunnable = Runnable {
                    if (isTtsReady) {
                        speakText()
                    }
                }
                handler.postDelayed(ttsLoopRunnable!!, 2000)
            }
            override fun onError(utteranceId: String?) {
                handler.postDelayed({
                    if (isTtsReady) speakText()
                }, 3000)
            }
        })

        // Start speaking after a brief delay (let ringtone play first)
        handler.postDelayed({ speakText() }, 1500)
    }

    private fun speakText() {
        if (!isTtsReady) return
        val params = Bundle()
        params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f)
        tts?.speak(alarmText, TextToSpeech.QUEUE_FLUSH, params, "alarm_utterance")
    }

    private fun startRingtone() {
        try {
            val alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

            mediaPlayer = MediaPlayer().apply {
                setDataSource(this@AlarmForegroundService, alarmUri)
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                isLooping = true
                prepare()
                start()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting ringtone: ${e.message}")
        }
    }

    private fun startVibration() {
        val pattern = longArrayOf(0, 1000, 500, 1000, 500, 1000)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(pattern, 0)
        }
    }

    private fun stopAlarm() {
        // Stop TTS
        isTtsReady = false
        ttsLoopRunnable?.let { handler.removeCallbacks(it) }
        tts?.stop()

        // Stop ringtone
        mediaPlayer?.let {
            if (it.isPlaying) it.stop()
            it.release()
        }
        mediaPlayer = null

        // Stop vibration
        vibrator?.cancel()

        // Release wake lock
        wakeLock?.let {
            if (it.isHeld) it.release()
        }

        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun buildNotification(): Notification {
        val stopIntent = Intent(this, AlarmForegroundService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val snoozeIntent = Intent(this, AlarmForegroundService::class.java).apply {
            action = ACTION_SNOOZE
        }
        val snoozePendingIntent = PendingIntent.getService(
            this, 1, snoozeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Loud Alarm")
            .setContentText(alarmText)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setOngoing(true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopPendingIntent)
            .addAction(android.R.drawable.ic_popup_reminder, "Snooze", snoozePendingIntent)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Loud Alarm",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alarm notifications"
                setBypassDnd(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        stopAlarm()
        tts?.shutdown()
        super.onDestroy()
    }
}
