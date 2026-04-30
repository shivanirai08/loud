import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
  id: 'loud-alarm-storage',
});

export const StorageKeys = {
  ALARMS: 'alarms',
  SETTINGS: 'settings',
} as const;
