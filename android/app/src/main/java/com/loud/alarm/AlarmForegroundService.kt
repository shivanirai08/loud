package com.loud.alarm

import android.app.*
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
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

    private var tts: TextToSpeech? = null
    private var alarmText: String = "Alarm!"
    private var alarmLanguage: String = "en-US"
    private var alarmId: String = ""
    private var isTtsReady = false
    private var vibrator: Vibrator? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private val handler = Handler(Looper.getMainLooper())
    private var ttsLoopRunnable: Runnable? = null
    private var audioManager: AudioManager? = null
    private var audioFocusRequest: AudioFocusRequest? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
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

        // Request audio focus for alarm
        requestAudioFocus()

        // Set volume to max for alarm stream
        try {
            val maxVolume = audioManager?.getStreamMaxVolume(AudioManager.STREAM_ALARM) ?: 7
            audioManager?.setStreamVolume(AudioManager.STREAM_ALARM, maxVolume, 0)
        } catch (e: Exception) {
            Log.w(TAG, "Could not set alarm volume: ${e.message}")
        }

        // Start foreground with notification (includes fullScreenIntent)
        val notification = buildNotification()
        startForeground(NOTIFICATION_ID, notification)

        // Start vibration
        startVibration()

        // TTS will start speaking once initialized (via onInit callback)
        // If TTS is already initialized (service reused), start immediately
        if (isTtsReady) {
            startTtsLoop()
        }

        return START_STICKY
    }

    private fun requestAudioFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val attrs = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build()
            audioFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
                .setAudioAttributes(attrs)
                .build()
            audioManager?.requestAudioFocus(audioFocusRequest!!)
        } else {
            @Suppress("DEPRECATION")
            audioManager?.requestAudioFocus(null, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
        }
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

            // Set TTS to use alarm audio stream so it's loud
            val params = Bundle()
            params.putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_ALARM)
            tts?.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )

            isTtsReady = true
            startTtsLoop()
        } else {
            Log.e(TAG, "TTS initialization failed with status: $status")
        }
    }

    private fun startTtsLoop() {
        if (!isTtsReady) return

        tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {
                Log.d(TAG, "TTS started speaking: $alarmText")
            }
            override fun onDone(utteranceId: String?) {
                Log.d(TAG, "TTS finished speaking, will repeat in 2s")
                // Schedule next TTS after a short delay
                ttsLoopRunnable = Runnable {
                    if (isTtsReady) {
                        speakText()
                    }
                }
                handler.postDelayed(ttsLoopRunnable!!, 2000)
            }
            override fun onError(utteranceId: String?) {
                Log.e(TAG, "TTS error on utterance")
                handler.postDelayed({
                    if (isTtsReady) speakText()
                }, 3000)
            }
        })

        // Start speaking immediately
        speakText()
    }

    private fun speakText() {
        if (!isTtsReady) return
        Log.d(TAG, "Speaking alarm text: $alarmText")
        val params = Bundle()
        params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f)
        params.putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_ALARM)
        tts?.speak(alarmText, TextToSpeech.QUEUE_FLUSH, params, "alarm_utterance")
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

        // Stop vibration
        vibrator?.cancel()

        // Release audio focus
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest?.let { audioManager?.abandonAudioFocusRequest(it) }
        } else {
            @Suppress("DEPRECATION")
            audioManager?.abandonAudioFocus(null)
        }

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

        // Full-screen intent to launch AlarmRingActivity over lock screen
        val fullScreenIntent = Intent(this, AlarmRingActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarmId)
            putExtra(AlarmReceiver.EXTRA_ALARM_TEXT, alarmText)
            putExtra(AlarmReceiver.EXTRA_ALARM_LANGUAGE, alarmLanguage)
        }
        val fullScreenPendingIntent = PendingIntent.getActivity(
            this, 2, fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Loud Alarm")
            .setContentText("Speaking: $alarmText")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setContentIntent(fullScreenPendingIntent)
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
                // No sound on channel - we use TTS instead
                setSound(null, null)
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
