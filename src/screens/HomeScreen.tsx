import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, StatusBar
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getTodaysWorkout, ACE_WORKOUTS } from '../data/aceWorkouts';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Home'> };

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function HomeScreen({ navigation }: Props) {
  const todaysWorkout = getTodaysWorkout();
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>FERN</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Week Strip */}
        <View style={styles.weekStrip}>
          {DAYS.map((d, i) => (
            <View key={i} style={[styles.dayDot, i === todayIdx && styles.dayDotActive]}>
              <Text style={[styles.dayLabel, i === todayIdx && styles.dayLabelActive]}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Today's Workout Card */}
        {todaysWorkout ? (
          <TouchableOpacity
            style={styles.workoutCard}
            onPress={() => navigation.navigate('Workout', { workoutId: todaysWorkout.id })}
            activeOpacity={0.85}
          >
            <Text style={styles.workoutLabel}>TODAY</Text>
            <Text style={styles.workoutName}>{todaysWorkout.name}</Text>
            <Text style={styles.workoutFocus}>{todaysWorkout.focus}</Text>
            <Text style={styles.workoutExCount}>{todaysWorkout.exercises.length} exercises</Text>
            <View style={styles.startBtn}>
              <Text style={styles.startBtnText}>START WORKOUT</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.restCard}>
            <Text style={styles.restEmoji}>🌿</Text>
            <Text style={styles.restTitle}>Rest Day</Text>
            <Text style={styles.restSub}>Recovery is part of the program.</Text>
          </View>
        )}

        {/* Weekly Schedule */}
        <Text style={styles.sectionTitle}>THIS WEEK</Text>
        {ACE_WORKOUTS.map(w => (
          <TouchableOpacity
            key={w.id}
            style={[styles.scheduleRow, w.day === (today === 0 ? 7 : today) && styles.scheduleRowActive]}
            onPress={() => navigation.navigate('Workout', { workoutId: w.id })}
          >
            <Text style={styles.scheduleDay}>{w.label}</Text>
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleName}>{w.name}</Text>
              <Text style={styles.scheduleFocus}>{w.focus}</Text>
            </View>
            <Text style={styles.scheduleChevron}>›</Text>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080A0F' },
  scroll: { padding: 20 },
  header: { marginBottom: 24 },
  appName: { fontSize: 13, letterSpacing: 5, color: '#3DDC84', fontWeight: '700' },
  date: { fontSize: 22, color: '#fff', fontWeight: '300', marginTop: 4 },
  weekStrip: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#0F172A', borderRadius: 12,
    padding: 16, marginBottom: 24,
  },
  dayDot: { alignItems: 'center', gap: 6 },
  dayDotActive: {},
  dayLabel: { fontSize: 13, color: '#475569' },
  dayLabelActive: { color: '#3DDC84', fontWeight: '700' },
  workoutCard: {
    backgroundColor: '#0F172A', borderRadius: 20,
    borderWidth: 1, borderColor: '#1E293B',
    padding: 24, marginBottom: 32,
  },
  workoutLabel: { fontSize: 11, letterSpacing: 3, color: '#3DDC84', marginBottom: 8 },
  workoutName: { fontSize: 28, color: '#fff', fontWeight: '700', marginBottom: 4 },
  workoutFocus: { fontSize: 14, color: '#94A3B8', marginBottom: 16 },
  workoutExCount: { fontSize: 12, color: '#475569', marginBottom: 20 },
  startBtn: {
    backgroundColor: '#3DDC84', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
  restCard: {
    backgroundColor: '#0F172A', borderRadius: 20,
    padding: 40, alignItems: 'center', marginBottom: 32,
  },
  restEmoji: { fontSize: 40, marginBottom: 12 },
  restTitle: { fontSize: 22, color: '#fff', fontWeight: '600', marginBottom: 8 },
  restSub: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  sectionTitle: {
    fontSize: 11, letterSpacing: 3, color: '#475569',
    marginBottom: 12,
  },
  scheduleRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0F172A', borderRadius: 12,
    padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: '#1E293B',
  },
  scheduleRowActive: { borderColor: '#3DDC84' },
  scheduleDay: { fontSize: 12, color: '#64748B', width: 70 },
  scheduleInfo: { flex: 1 },
  scheduleName: { fontSize: 15, color: '#fff', fontWeight: '600' },
  scheduleFocus: { fontSize: 12, color: '#64748B', marginTop: 2 },
  scheduleChevron: { fontSize: 22, color: '#334155' },
});
