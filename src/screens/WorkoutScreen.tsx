import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { ACE_WORKOUTS } from '../data/aceWorkouts';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Workout'>;
  route: RouteProp<RootStackParamList, 'Workout'>;
};

export default function WorkoutScreen({ navigation, route }: Props) {
  const workout = ACE_WORKOUTS.find(w => w.id === route.params.workoutId);
  const [completedSets, setCompletedSets] = useState<Record<string, number>>({});

  if (!workout) return null;

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const doneSets = Object.values(completedSets).reduce((a, b) => a + b, 0);
  const progress = totalSets > 0 ? doneSets / totalSets : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.progressText}>{doneSets}/{totalSets} sets</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.workoutName}>{workout.name}</Text>
        <Text style={styles.workoutFocus}>{workout.focus}</Text>

        {workout.exercises.map((ex, idx) => {
          const done = completedSets[ex.id] || 0;
          const isComplete = done >= ex.sets;
          return (
            <View key={ex.id} style={[styles.exerciseCard, isComplete && styles.exerciseCardDone]}>
              <View style={styles.exHeader}>
                <Text style={styles.exNumber}>{String(idx + 1).padStart(2, '0')}</Text>
                <View style={styles.exInfo}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exDetail}>{ex.sets} sets · {ex.reps} reps · {ex.rest}s rest</Text>
                  {ex.vitruvianWeight && (
                    <Text style={styles.exWeight}>Vitruvian: ~{ex.vitruvianWeight}kg</Text>
                  )}
                  {ex.coachingNote && (
                    <Text style={styles.coachNote}>💬 {ex.coachingNote}</Text>
                  )}
                </View>
              </View>

              {/* Set Trackers */}
              <View style={styles.setRow}>
                {Array.from({ length: ex.sets }).map((_, sIdx) => (
                  <TouchableOpacity
                    key={sIdx}
                    style={[styles.setBtn, sIdx < done && styles.setBtnDone]}
                    onPress={() => {
                      const current = completedSets[ex.id] || 0;
                      const next = sIdx < current ? sIdx : Math.min(sIdx + 1, ex.sets);
                      setCompletedSets(prev => ({ ...prev, [ex.id]: next }));
                    }}
                  >
                    <Text style={[styles.setBtnText, sIdx < done && styles.setBtnTextDone]}>
                      {sIdx < done ? '✓' : `${sIdx + 1}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        {/* Finish Button */}
        {doneSets === totalSets && totalSets > 0 && (
          <TouchableOpacity style={styles.finishBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.finishBtnText}>🔥 WORKOUT COMPLETE</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080A0F' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  back: { fontSize: 17, color: '#FF6B00' },
  progressText: { fontSize: 13, color: '#64748B' },
  progressBar: { height: 3, backgroundColor: '#1E293B', marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: '#FF6B00', borderRadius: 2 },
  scroll: { padding: 20 },
  workoutName: { fontSize: 28, color: '#fff', fontWeight: '700', marginBottom: 4 },
  workoutFocus: { fontSize: 14, color: '#64748B', marginBottom: 24 },
  exerciseCard: {
    backgroundColor: '#0F172A', borderRadius: 16,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#1E293B',
  },
  exerciseCardDone: { borderColor: '#FF6B00', opacity: 0.7 },
  exHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  exNumber: { fontSize: 12, color: '#334155', fontWeight: '700', width: 24, paddingTop: 2 },
  exInfo: { flex: 1 },
  exName: { fontSize: 16, color: '#fff', fontWeight: '600', marginBottom: 3 },
  exDetail: { fontSize: 12, color: '#64748B' },
  exWeight: { fontSize: 12, color: '#FF6B00', marginTop: 3 },
  coachNote: { fontSize: 12, color: '#475569', marginTop: 6, fontStyle: 'italic' },
  setRow: { flexDirection: 'row', gap: 8 },
  setBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center',
  },
  setBtnDone: { backgroundColor: '#FF6B00' },
  setBtnText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  setBtnTextDone: { color: '#fff' },
  finishBtn: {
    backgroundColor: '#FF6B00', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center', marginTop: 8,
  },
  finishBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});
