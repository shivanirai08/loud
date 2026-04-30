import dayjs from 'dayjs';
import { RepeatType } from '../types';

const WEEKDAY_VALUES = [1, 2, 3, 4, 5];

/**
 * Calculate the next trigger timestamp for an alarm
 */
export function getNextAlarmTimestamp(
  hour: number,
  minute: number,
  repeat: RepeatType,
  customDays: number[],
): number {
  const now = dayjs();
  let alarmTime = now.hour(hour).minute(minute).second(0).millisecond(0);

  // If the time has already passed today, move to next occurrence
  if (alarmTime.isBefore(now)) {
    alarmTime = alarmTime.add(1, 'day');
  }

  switch (repeat) {
    case 'once':
      return alarmTime.valueOf();

    case 'daily':
      return alarmTime.valueOf();

    case 'weekdays': {
      while (!WEEKDAY_VALUES.includes(alarmTime.day())) {
        alarmTime = alarmTime.add(1, 'day');
      }
      return alarmTime.valueOf();
    }

    case 'custom': {
      if (customDays.length === 0) return alarmTime.valueOf();
      // Find the next day that matches
      for (let i = 0; i < 7; i++) {
        const checkDay = alarmTime.add(i, 'day');
        if (customDays.includes(checkDay.day())) {
          return checkDay.hour(hour).minute(minute).second(0).millisecond(0).valueOf();
        }
      }
      return alarmTime.valueOf();
    }

    default:
      return alarmTime.valueOf();
  }
}

/**
 * Format alarm time for display
 */
export function formatAlarmTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

/**
 * Get a human-readable repeat description
 */
export function getRepeatLabel(repeat: RepeatType, customDays: number[]): string {
  switch (repeat) {
    case 'once':
      return 'Once';
    case 'daily':
      return 'Every day';
    case 'weekdays':
      return 'Weekdays';
    case 'custom': {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return customDays.map(d => dayNames[d]).join(', ');
    }
    default:
      return '';
  }
}

/**
 * Get time until alarm fires (human readable)
 */
export function getTimeUntilAlarm(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;

  if (diff <= 0) return 'Now';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
