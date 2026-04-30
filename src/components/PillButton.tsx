import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../constants';

interface PillButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function PillButton({ label, selected, onPress, style }: PillButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.pill, selected && styles.pillSelected, style]}
      onPress={onPress}
      activeOpacity={0.7}>
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    marginBottom: 8,
  },
  pillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: COLORS.text,
  },
});
