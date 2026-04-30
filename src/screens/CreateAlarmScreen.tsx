import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, RepeatType, VoiceLanguage, AlarmFormData } from '../types';
import {
  COLORS,
  REPEAT_OPTIONS,
  VOICE_LANGUAGES,
  SNOOZE_OPTIONS,
  DEFAULT_SNOOZE_DURATION,
  WEEKDAY_VALUES,
} from '../constants';
import { useAlarms } from '../hooks';
import { DaySelector, PillButton } from '../components';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateAlarm'>;

export function CreateAlarmScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { addAlarm } = useAlarms();

  const now = new Date();
  const [time, setTime] = useState(now);
  const [text, setText] = useState('');
  const [repeat, setRepeat] = useState<RepeatType>('once');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [language, setLanguage] = useState<VoiceLanguage>('en-US');
  const [snoozeDuration, setSnoozeDuration] = useState(DEFAULT_SNOOZE_DURATION);
  const [showTimePicker, setShowTimePicker] = useState(true);

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Missing Text', 'Please enter a reminder text for the alarm.');
      return;
    }

    const formData: AlarmFormData = {
      hour: time.getHours(),
      minute: time.getMinutes(),
      text: text.trim(),
      repeat,
      customDays: repeat === 'custom' ? customDays : repeat === 'weekdays' ? WEEKDAY_VALUES : [],
      language,
      snoozeDuration,
    };

    try {
      await addAlarm(formData);
      navigation.goBack();
    } catch (error: any) {
      const errorMsg = error?.message || '';
      let message: string;
      if (errorMsg.includes('not available')) {
        message = 'Native alarm module not loaded. Please reinstall the app (ensure you are NOT using Expo Go).';
      } else if (errorMsg.includes('permission') || errorMsg.includes('SecurityException') || errorMsg.includes('scheduling methods failed')) {
        message = 'Alarm permission issue.\n\n' +
          'On Xiaomi/Redmi: Settings → Apps → Manage apps → Loud → Other permissions → enable "Alarms & reminders"\n\n' +
          'Also check: Settings → Apps → Manage apps → Loud → Autostart → enable';
      } else {
        message = `Failed to create alarm: ${errorMsg || 'Unknown error'}`;
      }
      Alert.alert('Error', message);
    }
  };

  const toggleCustomDay = (day: number) => {
    setCustomDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );
  };

  const onTimeChange = (_: any, selectedTime: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>New Alarm</Text>

      {/* Time Picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time</Text>
        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
            themeVariant="dark"
          />
        )}
        {Platform.OS === 'android' && !showTimePicker && (
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}>
            <Text style={styles.timeButtonText}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Reminder Text */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reminder Text</Text>
        <TextInput
          style={styles.textInput}
          placeholder='e.g., "Dawai kha lo"'
          placeholderTextColor={COLORS.textSecondary}
          value={text}
          onChangeText={setText}
          maxLength={200}
          multiline
        />
      </View>

      {/* Repeat */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repeat</Text>
        <View style={styles.pillRow}>
          {REPEAT_OPTIONS.map(option => (
            <PillButton
              key={option.value}
              label={option.label}
              selected={repeat === option.value}
              onPress={() => setRepeat(option.value)}
            />
          ))}
        </View>
        {repeat === 'custom' && (
          <DaySelector selectedDays={customDays} onToggleDay={toggleCustomDay} />
        )}
      </View>

      {/* Voice Language */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voice Language</Text>
        <View style={styles.pillRow}>
          {VOICE_LANGUAGES.map(lang => (
            <PillButton
              key={lang.value}
              label={lang.label}
              selected={language === lang.value}
              onPress={() => setLanguage(lang.value)}
            />
          ))}
        </View>
      </View>

      {/* Snooze Duration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Snooze Duration</Text>
        <View style={styles.pillRow}>
          {SNOOZE_OPTIONS.map(min => (
            <PillButton
              key={min}
              label={`${min} min`}
              selected={snoozeDuration === min}
              onPress={() => setSnoozeDuration(min)}
            />
          ))}
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
        <Text style={styles.saveButtonText}>Save Alarm</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 50,
  },
  timeButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeButtonText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
});
