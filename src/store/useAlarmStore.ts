import { create } from 'zustand';
import { Alarm, AlarmFormData } from '../types';
import { storage, StorageKeys } from '../utils/storage';
import { alarmService } from '../services/alarmService';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

interface AlarmStore {
  alarms: Alarm[];
  loadAlarms: () => void;
  addAlarm: (data: AlarmFormData) => Promise<void>;
  updateAlarm: (id: string, data: AlarmFormData) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
  markAlarmTriggered: (id: string) => void;
  rescheduleAllAlarms: () => Promise<void>;
}

function persistAlarms(alarms: Alarm[]) {
  storage.set(StorageKeys.ALARMS, JSON.stringify(alarms));
}

function loadAlarmsFromStorage(): Alarm[] {
  const raw = storage.getString(StorageKeys.ALARMS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Alarm[];
  } catch {
    return [];
  }
}

export const useAlarmStore = create<AlarmStore>((set, get) => ({
  alarms: [],

  loadAlarms: () => {
    const alarms = loadAlarmsFromStorage();
    set({ alarms });
  },

  addAlarm: async (data: AlarmFormData) => {
    const now = new Date().toISOString();
    const newAlarm: Alarm = {
      id: generateId(),
      time: now,
      hour: data.hour,
      minute: data.minute,
      text: data.text,
      repeat: data.repeat,
      customDays: data.customDays,
      language: data.language,
      enabled: true,
      snoozeDuration: data.snoozeDuration,
      createdAt: now,
      updatedAt: now,
    };

    // Check permission (non-blocking — native has fallback strategies)
    await alarmService.ensureExactAlarmPermission();

    // Schedule the alarm natively
    await alarmService.scheduleAlarm(newAlarm);

    const alarms = [...get().alarms, newAlarm];
    set({ alarms });
    persistAlarms(alarms);
  },

  updateAlarm: async (id: string, data: AlarmFormData) => {
    const alarms = get().alarms.map(alarm => {
      if (alarm.id === id) {
        return {
          ...alarm,
          hour: data.hour,
          minute: data.minute,
          text: data.text,
          repeat: data.repeat,
          customDays: data.customDays,
          language: data.language,
          snoozeDuration: data.snoozeDuration,
          updatedAt: new Date().toISOString(),
        };
      }
      return alarm;
    });

    const updatedAlarm = alarms.find(a => a.id === id);
    if (updatedAlarm) {
      // Cancel old and schedule new
      await alarmService.cancelAlarm(id);
      if (updatedAlarm.enabled) {
        await alarmService.scheduleAlarm(updatedAlarm);
      }
    }

    set({ alarms });
    persistAlarms(alarms);
  },

  deleteAlarm: async (id: string) => {
    await alarmService.cancelAlarm(id);
    const alarms = get().alarms.filter(a => a.id !== id);
    set({ alarms });
    persistAlarms(alarms);
  },

  toggleAlarm: async (id: string) => {
    const alarms = get().alarms.map(alarm => {
      if (alarm.id === id) {
        return { ...alarm, enabled: !alarm.enabled, updatedAt: new Date().toISOString() };
      }
      return alarm;
    });

    const toggledAlarm = alarms.find(a => a.id === id);
    if (toggledAlarm) {
      if (toggledAlarm.enabled) {
        await alarmService.scheduleAlarm(toggledAlarm);
      } else {
        await alarmService.cancelAlarm(id);
      }
    }

    set({ alarms });
    persistAlarms(alarms);
  },

  markAlarmTriggered: (id: string) => {
    const existingAlarm = get().alarms.find(alarm => alarm.id === id);
    if (!existingAlarm || existingAlarm.repeat !== 'once' || !existingAlarm.enabled) {
      return;
    }

    const alarms = get().alarms.map(alarm => {
      if (alarm.id === id) {
        return {
          ...alarm,
          enabled: false,
          updatedAt: new Date().toISOString(),
        };
      }

      return alarm;
    });

    set({ alarms });
    persistAlarms(alarms);
  },

  rescheduleAllAlarms: async () => {
    const alarms = get().alarms;
    for (const alarm of alarms) {
      if (alarm.enabled) {
        await alarmService.scheduleAlarm(alarm);
      }
    }
  },
}));
