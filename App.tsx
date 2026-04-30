import React, { useEffect } from 'react';
import { StatusBar, Platform, Linking } from 'react-native';
import { AppNavigator } from './src/navigation';
import { useAlarmStore } from './src/store';
import { notificationService } from './src/services/notificationService';
import { ttsService } from './src/services/ttsService';
import { alarmService } from './src/services/alarmService';

export default function App() {
  useEffect(() => {
    const init = async () => {
      // Initialize services
      notificationService.initialize();
      ttsService.initialize();

      // Load alarms from storage
      useAlarmStore.getState().loadAlarms();

      // Check exact alarm permission (non-blocking)
      if (Platform.OS === 'android') {
        try {
          await alarmService.ensureExactAlarmPermission();
        } catch (e) {
          console.warn('Permission check failed:', e);
        }
      }

      // Reschedule all alarms (handles boot + app restart)
      useAlarmStore.getState().rescheduleAllAlarms();
    };
    init();
  }, []);

  // Handle deep links for alarm ring screen
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      // Handle alarm ring deep link if needed
      console.log('Deep link:', event.url);
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <AppNavigator />
    </>
  );
}
