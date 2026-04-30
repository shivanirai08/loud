import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  NativeModules,
} from 'react-native';
import { ttsService } from '../services/ttsService';
import { VoiceLanguage } from '../types';

const { AlarmScheduler } = NativeModules;

const COLORS = {
  primary: '#6C63FF',
  background: '#121212',
  surface: '#1E1E2E',
  textSecondary: '#B0B0C0',
  warning: '#FFC107',
  border: '#333348',
};

/**
 * Standalone AlarmRingScreen that works without navigation context.
 * This is registered separately with AppRegistry for AlarmRingActivity.
 * It reads alarm data from the intent extras passed as initialProps.
 */
export function AlarmRingScreenStandalone(props: any) {
  const alarmId = props?.alarmId || props?.alarm_id || '';
  const text = props?.alarmText || props?.alarm_text || 'Alarm!';
  const language = (props?.alarmLanguage || props?.alarm_language || 'en-US') as VoiceLanguage;
  const snoozeDuration = 5; // default snooze

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    }, 1000);

    // Start pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    // Start shake animation
    const shake = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    );
    shake.start();

    // Start TTS loop from JS side as backup (native TTS is primary)
    ttsService.startLoop(text, language);

    return () => {
      clearInterval(timer);
      pulse.stop();
      shake.stop();
      ttsService.stopLoop();
    };
  }, []);

  const handleStop = async () => {
    ttsService.stop();
    try {
      await AlarmScheduler.stopAlarmService();
    } catch (e) {
      console.error('Failed to stop alarm service:', e);
    }
  };

  const handleSnooze = async () => {
    ttsService.stop();
    try {
      // Stop current alarm then schedule snooze
      const snoozeDurationMs = snoozeDuration * 60 * 1000;
      await AlarmScheduler.snoozeAlarm(alarmId, snoozeDurationMs, text, language);
    } catch (e) {
      console.error('Failed to snooze alarm:', e);
    }
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.currentTime}>{currentTime}</Text>

      <Animated.View
        style={[
          styles.bellContainer,
          {
            transform: [{ scale: pulseAnim }, { rotate: rotation }],
          },
        ]}>
        <Text style={styles.bellIcon}>🔔</Text>
      </Animated.View>

      <View style={styles.textContainer}>
        <Text style={styles.reminderLabel}>REMINDER</Text>
        <Text style={styles.reminderText}>"{text}"</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.snoozeButton}
          onPress={handleSnooze}
          activeOpacity={0.8}>
          <Text style={styles.snoozeButtonText}>Snooze</Text>
          <Text style={styles.snoozeSubtext}>{snoozeDuration} min</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stopButton}
          onPress={handleStop}
          activeOpacity={0.8}>
          <Text style={styles.stopButtonText}>Stop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  currentTime: {
    fontSize: 48,
    fontWeight: '200',
    color: COLORS.textSecondary,
    marginBottom: 40,
  },
  bellContainer: {
    marginBottom: 40,
  },
  bellIcon: {
    fontSize: 80,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  reminderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  reminderText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 36,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  snoozeButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  snoozeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.warning,
  },
  snoozeSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  stopButton: {
    backgroundColor: '#FF5252',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  stopButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
