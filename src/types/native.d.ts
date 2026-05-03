import { NativeModulesStatic } from 'react-native';

declare module 'react-native' {
  interface NativeModulesStatic {
    AlarmScheduler: {
      scheduleAlarm(
        alarmId: string,
        timestamp: number,
        text: string,
        language: string,
      ): Promise<boolean>;
      cancelAlarm(alarmId: string): Promise<boolean>;
      stopAlarmService(): Promise<boolean>;
      snoozeAlarm(
        alarmId: string,
        snoozeDurationMs: number,
        text: string,
        language: string,
      ): Promise<boolean>;
      canScheduleExactAlarms(): Promise<boolean>;
      openExactAlarmSettings(): Promise<boolean>;
      dismissAlarmActivity(): Promise<boolean>;
    };
  }
}
