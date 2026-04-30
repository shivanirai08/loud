import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants';
import { alarmService } from '../services/alarmService';
import { ttsService } from '../services/ttsService';
import { useAlarmStore } from '../store';

type RouteProps = RouteProp<RootStackParamList, 'AlarmRing'>;

export function AlarmRingScreen() {
  const route = useRoute<RouteProps>();
  const { alarmId, text, language } = route.params;
  const alarm = useAlarmStore(state => state.alarms.find(a => a.id === alarmId));

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

    // Start TTS loop from JS side as backup
    ttsService.startLoop(text, language);

    return () => {
      pulse.stop();
      shake.stop();
      ttsService.stopLoop();
    };
  }, []);

  const handleStop = async () => {
    ttsService.stop();
    await alarmService.stopAlarm();
  };

  const handleSnooze = async () => {
    ttsService.stop();
    const snoozeDuration = alarm?.snoozeDuration ?? 5;
    await alarmService.snoozeAlarm(alarmId, snoozeDuration, text, language);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  const currentTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
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
          <Text style={styles.snoozeSubtext}>
            {alarm?.snoozeDuration ?? 5} min
          </Text>
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
    backgroundColor: COLORS.error,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  stopButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
});
