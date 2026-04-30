import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Alarm } from '../types';
import { COLORS } from '../constants';
import { formatAlarmTime, getRepeatLabel } from '../utils';

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AlarmCard({ alarm, onToggle, onEdit, onDelete }: AlarmCardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, !alarm.enabled && styles.disabled]}
      onPress={() => onEdit(alarm.id)}
      onLongPress={() => onDelete(alarm.id)}
      activeOpacity={0.7}>
      <View style={styles.leftSection}>
        <Text style={[styles.time, !alarm.enabled && styles.disabledText]}>
          {formatAlarmTime(alarm.hour, alarm.minute)}
        </Text>
        <Text style={[styles.text, !alarm.enabled && styles.disabledText]} numberOfLines={1}>
          "{alarm.text}"
        </Text>
        <Text style={[styles.repeat, !alarm.enabled && styles.disabledText]}>
          {getRepeatLabel(alarm.repeat, alarm.customDays)} • {alarm.language === 'hi-IN' ? 'Hindi' : 'English'}
        </Text>
      </View>
      <View style={styles.rightSection}>
        <TouchableOpacity
          style={[styles.toggle, alarm.enabled && styles.toggleActive]}
          onPress={() => onToggle(alarm.id)}>
          <View style={[styles.toggleDot, alarm.enabled && styles.toggleDotActive]} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabled: {
    opacity: 0.5,
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    marginLeft: 12,
  },
  time: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -1,
  },
  text: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  repeat: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  disabledText: {
    color: COLORS.textSecondary,
  },
  toggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.textSecondary,
  },
  toggleDotActive: {
    backgroundColor: COLORS.text,
    alignSelf: 'flex-end',
  },
});
