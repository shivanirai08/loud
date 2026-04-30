import { NativeModules, Platform, Alert, Linking } from 'react-native';
import { Alarm } from '../types';
import { getNextAlarmTimestamp } from '../utils/alarmHelpers';

const { AlarmScheduler } = NativeModules;

class AlarmService {
  private get isModuleAvailable(): boolean {
    if (!AlarmScheduler) {
      console.error('AlarmScheduler native module is not available. Ensure New Architecture is disabled and the module is properly linked.');
      return false;
    }
    return true;
  }

  /**
   * Check and request exact alarm permission (Android 12+).
   * Returns true if permission is granted or we should still attempt scheduling
   * (the native module has fallback strategies).
   */
  async ensureExactAlarmPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    if (!this.isModuleAvailable) return false;

    try {
      const canSchedule = await AlarmScheduler.canScheduleExactAlarms();
      if (canSchedule) return true;
    } catch (error) {
      console.warn('Permission check failed, will attempt to schedule anyway:', error);
      // If the check itself fails (some MIUI ROMs), still allow scheduling — native has fallbacks
      return true;
    }

    // Permission not granted — prompt user but don't block alarm creation
    return new Promise((resolve) => {
      Alert.alert(
        'Alarm Permission Required',
        'For reliable alarm delivery, please enable "Alarms & reminders" for this app.\n\n' +
        'On Xiaomi/Redmi: Settings → Apps → Manage apps → Loud → Other permissions → Alarms & reminders\n\n' +
        'The alarm will still be created, but may be less precise without this permission.',
        [
          {
            text: 'Continue Anyway',
            style: 'cancel',
            onPress: () => resolve(true), // Still try to schedule with fallback
          },
          {
            text: 'Open Settings',
            onPress: async () => {
              try {
                await AlarmScheduler.openExactAlarmSettings();
              } catch {
                // Fallback to generic app settings
                try {
                  await Linking.openSettings();
                } catch {
                  // Ignore if even this fails
                }
              }
              // Resolve true — native module has fallback scheduling strategies
              resolve(true);
            },
          },
        ],
      );
    });
  }

  async scheduleAlarm(alarm: Alarm): Promise<void> {
    if (!this.isModuleAvailable) {
      throw new Error('AlarmScheduler native module is not available. Please rebuild the app.');
    }

    const timestamp = getNextAlarmTimestamp(
      alarm.hour,
      alarm.minute,
      alarm.repeat,
      alarm.customDays,
    );

    try {
      await AlarmScheduler.scheduleAlarm(
        alarm.id,
        timestamp,
        alarm.text,
        alarm.language,
      );
      console.log(`Alarm scheduled: ${alarm.id} at ${new Date(timestamp).toLocaleString()}`);
    } catch (error: any) {
      console.error('Failed to schedule alarm:', error);
      throw error;
    }
  }

  async cancelAlarm(alarmId: string): Promise<void> {
    if (!this.isModuleAvailable) return;
    try {
      await AlarmScheduler.cancelAlarm(alarmId);
      console.log(`Alarm cancelled: ${alarmId}`);
    } catch (error) {
      console.error('Failed to cancel alarm:', error);
      throw error;
    }
  }

  async stopAlarm(): Promise<void> {
    if (!this.isModuleAvailable) return;
    try {
      await AlarmScheduler.stopAlarmService();
    } catch (error) {
      console.error('Failed to stop alarm service:', error);
      throw error;
    }
  }

  async snoozeAlarm(
    alarmId: string,
    snoozeDurationMinutes: number,
    text: string,
    language: string,
  ): Promise<void> {
    if (!this.isModuleAvailable) return;
    const snoozeDurationMs = snoozeDurationMinutes * 60 * 1000;
    try {
      await AlarmScheduler.snoozeAlarm(alarmId, snoozeDurationMs, text, language);
      console.log(`Alarm snoozed: ${alarmId} for ${snoozeDurationMinutes} minutes`);
    } catch (error) {
      console.error('Failed to snooze alarm:', error);
      throw error;
    }
  }

  async canScheduleExactAlarms(): Promise<boolean> {
    if (!this.isModuleAvailable) return false;
    try {
      return await AlarmScheduler.canScheduleExactAlarms();
    } catch {
      return false;
    }
  }

  async openExactAlarmSettings(): Promise<void> {
    if (!this.isModuleAvailable) {
      Linking.openSettings();
      return;
    }
    try {
      await AlarmScheduler.openExactAlarmSettings();
    } catch {
      Linking.openSettings();
    }
  }
}

export const alarmService = new AlarmService();
