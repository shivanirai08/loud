export type RepeatType = 'once' | 'daily' | 'weekdays' | 'custom';

export type VoiceLanguage = 'en-US' | 'hi-IN';

export interface Alarm {
  id: string;
  time: string; // ISO string of the alarm time
  hour: number;
  minute: number;
  text: string;
  repeat: RepeatType;
  customDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  language: VoiceLanguage;
  enabled: boolean;
  snoozeDuration: number; // in minutes
  createdAt: string;
  updatedAt: string;
}

export interface AlarmFormData {
  hour: number;
  minute: number;
  text: string;
  repeat: RepeatType;
  customDays: number[];
  language: VoiceLanguage;
  snoozeDuration: number;
}

export type RootStackParamList = {
  Home: undefined;
  CreateAlarm: undefined;
  EditAlarm: { alarmId: string };
  AlarmRing: { alarmId: string; text: string; language: VoiceLanguage };
};
