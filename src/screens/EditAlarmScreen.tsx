import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, RepeatType, VoiceLanguage, AlarmFormData } from '../types';
import {
  COLORS,
  REPEAT_OPTIONS,
  VOICE_LANGUAGES,
  SNOOZE_OPTIONS,
  WEEKDAY_VALUES,
} from '../constants';
import { useAlarmStore } from '../store';
import { DaySelector, PillButton } from '../components';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditAlarm'>;
type RouteProps = RouteProp<RootStackParamList, 'EditAlarm'>;

export function EditAlarmScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { alarmId } = route.params;

  const alarm = useAlarmStore(state => state.alarms.find(a => a.id === alarmId));
  const updateAlarm = useAlarmStore(state => state.updateAlarm);

  const [time, setTime] = useState(new Date());
  const [text, setText] = useState('');
  const [repeat, setRepeat] = useState<RepeatType>('once');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [language, setLanguage] = useState<VoiceLanguage>('en-US');
  const [snoozeDuration, setSnoozeDuration] = useState(5);
  const [showTimePicker, setShowTimePicker] = useState(true);

  useEffect(() => {
    if (alarm) {
      const d = new Date();
      d.setHours(alarm.hour);
      d.setMinutes(alarm.minute);
      setTime(d);
      setText(alarm.text);
      setRepeat(alarm.repeat);
      setCustomDays(alarm.customDays);
      setLanguage(alarm.language);
      setSnoozeDuration(alarm.snoozeDuration);
    }
  }, [alarm]);

  if (!alarm) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Alarm not found</Text>
      </View>
    );
  }

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
      await updateAlarm(alarmId, formData);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update alarm.');
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
      <Text style={styles.header}>Edit Alarm</Text>

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
        <Text style={styles.saveButtonText}>Update Alarm</Text>
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
