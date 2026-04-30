import { useEffect } from 'react';
import { useAlarmStore } from '../store';

export function useAlarms() {
  const { alarms, loadAlarms, addAlarm, updateAlarm, deleteAlarm, toggleAlarm, rescheduleAllAlarms } =
    useAlarmStore();

  useEffect(() => {
    loadAlarms();
  }, []);

  return {
    alarms,
    addAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
    rescheduleAllAlarms,
  };
}
