import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import {
  HomeScreen,
  CreateAlarmScreen,
  EditAlarmScreen,
  AlarmRingScreen,
} from '../screens';
import { COLORS } from '../constants';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateAlarm" component={CreateAlarmScreen} />
        <Stack.Screen name="EditAlarm" component={EditAlarmScreen} />
        <Stack.Screen
          name="AlarmRing"
          component={AlarmRingScreen}
          options={{
            gestureEnabled: false,
            animation: 'fade',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
