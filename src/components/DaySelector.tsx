import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, DAYS_OF_WEEK } from '../constants';

interface DaySelectorProps {
  selectedDays: number[];
  onToggleDay: (day: number) => void;
}

export function DaySelector({ selectedDays, onToggleDay }: DaySelectorProps) {
  return (
    <View style={styles.container}>
      {DAYS_OF_WEEK.map(day => (
        <TouchableOpacity
          key={day.value}
          style={[styles.dayButton, selectedDays.includes(day.value) && styles.daySelected]}
          onPress={() => onToggleDay(day.value)}>
          <Text style={[styles.dayText, selectedDays.includes(day.value) && styles.dayTextSelected]}>
            {day.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  daySelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dayTextSelected: {
    color: COLORS.text,
  },
});
