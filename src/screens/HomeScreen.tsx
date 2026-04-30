import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants';
import { useAlarms } from '../hooks';
import { AlarmCard } from '../components';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { alarms, toggleAlarm, deleteAlarm } = useAlarms();

  const sortedAlarms = [...alarms].sort((a, b) => {
    const aMin = a.hour * 60 + a.minute;
    const bMin = b.hour * 60 + b.minute;
    return aMin - bMin;
  });

  const handleEdit = useCallback(
    (id: string) => {
      navigation.navigate('EditAlarm', { alarmId: id });
    },
    [navigation],
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert('Delete Alarm', 'Are you sure you want to delete this alarm?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAlarm(id),
        },
      ]);
    },
    [deleteAlarm],
  );

  const renderAlarm = useCallback(
    ({ item }: { item: typeof sortedAlarms[0] }) => (
      <AlarmCard
        alarm={item}
        onToggle={toggleAlarm}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ),
    [toggleAlarm, handleEdit, handleDelete],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <Text style={styles.title}>Loud</Text>
        <Text style={styles.subtitle}>Voice Alarm</Text>
      </View>

      {sortedAlarms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>No alarms yet</Text>
          <Text style={styles.emptySubtext}>
            Tap + to create your first voice alarm
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedAlarms}
          renderItem={renderAlarm}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateAlarm')}
        activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  list: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 32,
    color: COLORS.text,
    fontWeight: '300',
    marginTop: -2,
  },
});
