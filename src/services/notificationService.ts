import { Platform, PermissionsAndroid } from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidCategory,
  AndroidVisibility,
} from '@notifee/react-native';

class NotificationService {
  private channelId: string | null = null;

  async initialize(): Promise<void> {
    // Request notification permission on Android 13+
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    }

    // Create notification channel (no sound - TTS handles audio)
    this.channelId = await notifee.createChannel({
      id: 'loud_alarm_channel',
      name: 'Loud Alarm',
      importance: AndroidImportance.HIGH,
      sound: '',
      vibration: true,
      bypassDnd: true,
      visibility: AndroidVisibility.PUBLIC,
    });
  }

  async showAlarmNotification(title: string, body: string): Promise<string> {
    if (!this.channelId) {
      await this.initialize();
    }

    const notificationId = await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: this.channelId!,
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        fullScreenAction: {
          id: 'default',
        },
        pressAction: {
          id: 'default',
        },
        actions: [
          {
            title: 'Stop',
            pressAction: { id: 'stop' },
          },
          {
            title: 'Snooze',
            pressAction: { id: 'snooze' },
          },
        ],
        ongoing: true,
        autoCancel: false,
      },
    });

    return notificationId;
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await notifee.cancelNotification(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await notifee.cancelAllNotifications();
  }
}

export const notificationService = new NotificationService();
