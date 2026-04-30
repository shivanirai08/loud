export const SNOOZE_OPTIONS = [1, 3, 5, 10, 15, 20, 30];
export const DEFAULT_SNOOZE_DURATION = 5; // minutes

export const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export const WEEKDAY_VALUES = [1, 2, 3, 4, 5];

export const VOICE_LANGUAGES = [
  { label: 'English', value: 'en-US' as const },
  { label: 'Hindi', value: 'hi-IN' as const },
];

export const REPEAT_OPTIONS = [
  { label: 'Once', value: 'once' as const },
  { label: 'Daily', value: 'daily' as const },
  { label: 'Weekdays', value: 'weekdays' as const },
  { label: 'Custom', value: 'custom' as const },
];

export const COLORS = {
  primary: '#6C63FF',
  primaryDark: '#5A52D5',
  secondary: '#FF6584',
  background: '#121212',
  surface: '#1E1E2E',
  surfaceLight: '#2A2A3E',
  text: '#FFFFFF',
  textSecondary: '#B0B0C0',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#FF5252',
  border: '#333348',
};
