import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Vibration
} from 'react-native';
import { Device } from 'react-native-ble-plx';
import { Workout, Exercise } from '../data/aceWorkouts';
import { setResistance, stopMachine, VitruvianMode, NUS_SERVICE_UUID, REPS_CHAR_UUID } from '../ble/VitruvianBLE';
import { startMeasuring, stopMeasuring, MeasurementData } from '../ble/VitruvianMeasure';

// API endpoint for workout logging
const API_BASE = 'http://192.168.1.189:8505';

type SetLog = {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightLbs: number;
  mode: string;
  peakLoad: number;
  band?: string;
};

async function submitWorkoutLog(
  workout: Workout,
  sets: SetLog[],
  startedAt: Date,
): Promise<void> {
  try {
    const body = {
      user_id: 'jonathan',
      plan_id: workout.id,
      started_at: startedAt.toISOString(),
      completed_at: new Date().toISOString(),
      sets: sets.map((s, i) => ({
        exercise_id: s.exerciseId,
        set_number: s.setNumber,
        actual_reps: s.reps,
        actual_weight_kg: s.weightLbs * 0.4536,
        is_pr: false,
      })),
      notes: `Exercises: ${[...new Set(sets.map(s => s.exerciseName))].join(', ')}`,
    };
    await fetch(`${API_BASE}/workout/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': 'jonathan' },
      body: JSON.stringify(body),
    });
    console.log('Workout logged to API');
  } catch (e) {
    console.log('Failed to log workout:', e);
  }
}

type Props = {
  workout: Workout;
  onBack: () => void;
  vitruvian?: Device;
};

type WorkoutPhase = 'idle' | 'calibrating' | 'working' | 'resting';

export default function WorkoutScreen({ workout, onBack, vitruvian }: Props) {
  // Exercise & set tracking
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(0); // 0-indexed
  const [completedSets, setCompletedSets] = useState<Record<string, number>>({});
  
  // Workout phase
  const [phase, setPhase] = useState<WorkoutPhase>('idle');
  const [repCount, setRepCount] = useState(0);
  const [currentLoad, setCurrentLoad] = useState<number | null>(null);
  
  // Rest timer
  const [restSeconds, setRestSeconds] = useState(0);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Workout logging
  const [loggedSets, setLoggedSets] = useState<SetLog[]>([]);
  const workoutStartRef = useRef(new Date());
  const peakLoadRef = useRef(0);
  
  // Manual input for non-Vitruvian exercises
  const [manualWeight, setManualWeight] = useState<Record<string, number>>({});
  const [manualReps, setManualReps] = useState<Record<string, number>>({});
  const [bandAssist, setBandAssist] = useState<Record<string, string>>({});
  
  const BAND_OPTIONS = ['None', 'Light', 'Medium', 'Heavy', 'Extra Heavy'];
  
  // Refs
  const measuringRef = useRef(false);
  const repSubscriptionRef = useRef<any>(null);

  const exercises = workout.exercises;
  const currentEx = exercises[currentExIndex];
  const isVitruvianExercise = currentEx?.equipment?.includes('vitruvian');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMeasuring();
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      if (repSubscriptionRef.current) {
        repSubscriptionRef.current.remove();
        repSubscriptionRef.current = null;
      }
    };
  }, []);

  // Subscribe to rep notifications
  useEffect(() => {
    if (!vitruvian) return;
    
    try {
      const sub = vitruvian.monitorCharacteristicForService(
        NUS_SERVICE_UUID,
        REPS_CHAR_UUID,
        (error, char) => {
          if (error) {
            console.log('Rep notification error:', error.message);
            return;
          }
          if (char?.value) {
            // Rep event received — increment count
            setRepCount(prev => prev + 1);
            Vibration.vibrate(50); // Quick haptic on rep
          }
        }
      );
      repSubscriptionRef.current = sub;
    } catch (e) {
      console.log('Failed to subscribe to reps:', e);
    }

    return () => {
      if (repSubscriptionRef.current) {
        repSubscriptionRef.current.remove();
        repSubscriptionRef.current = null;
      }
    };
  }, [vitruvian]);

  // Start live load polling when working or calibrating
  useEffect(() => {
    if (!vitruvian || (phase !== 'working' && phase !== 'calibrating')) {
      stopMeasuring();
      measuringRef.current = false;
      return;
    }
    if (measuringRef.current) return;
    measuringRef.current = true;
    startMeasuring(
      vitruvian,
      (data) => {
        if (data.resistance !== null) {
          setCurrentLoad(Math.round(data.resistance));
          if (data.resistance > peakLoadRef.current) {
            peakLoadRef.current = data.resistance;
          }
        }
      },
      (err) => console.log('Measure error:', err)
    );
    return () => { stopMeasuring(); measuringRef.current = false; };
  }, [vitruvian, phase]);

  // Rest timer countdown
  useEffect(() => {
    if (phase !== 'resting' || restSeconds <= 0) return;
    restTimerRef.current = setInterval(() => {
      setRestSeconds(prev => {
        if (prev <= 1) {
          if (restTimerRef.current) clearInterval(restTimerRef.current);
          Vibration.vibrate([0, 200, 100, 200]); // Double vibrate when rest is done
          setPhase('idle');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (restTimerRef.current) clearInterval(restTimerRef.current); };
  }, [phase, restSeconds]);

  // Start exercise: send weight + enter calibration
  const startExercise = useCallback(async (exIndex: number) => {
    const ex = exercises[exIndex];
    if (!ex) return;
    
    setCurrentExIndex(exIndex);
    setRepCount(0);
    setCurrentLoad(null);
    
    // Initialize manual weight/reps from previous values or defaults
    const targetReps = parseInt(ex.reps.match(/(\d+)/)?.[1] || '10');
    if (!manualReps[ex.id]) {
      setManualReps(prev => ({ ...prev, [ex.id]: targetReps }));
    }
    
    if (ex.equipment?.includes('vitruvian') && vitruvian) {
      setPhase('calibrating');
      try {
        const isEcho = (ex.vitruvianMode || 'old-school').startsWith('echo');
        const weightKg = isEcho ? 0 : (ex.vitruvianWeight || 0) * 0.4536;
        await setResistance(vitruvian, weightKg, ex.vitruvianMode || 'old-school');
      } catch (e) {
        console.log('Weight send error:', e);
      }
    } else {
      // Non-Vitruvian exercise — go straight to working
      setPhase('working');
    }
  }, [exercises, vitruvian]);

  // Complete calibration (after 3 practice reps) → start working set
  const finishCalibration = useCallback(() => {
    setRepCount(0);
    setPhase('working');
  }, []);

  // Complete current set
  const completeSet = useCallback(() => {
    const ex = exercises[currentExIndex];
    if (!ex) return;
    
    const setsDone = (completedSets[ex.id] || 0) + 1;
    setCompletedSets(prev => ({ ...prev, [ex.id]: setsDone }));
    
    // Log this set with manual or Vitruvian data
    const isVit = ex.equipment?.includes('vitruvian');
    const isDumbbell = ex.equipment?.includes('dumbbells');
    const logWeight = isVit ? (ex.vitruvianWeight || 0) : (manualWeight[ex.id] || 0);
    const logReps = isVit ? (repCount || manualReps[ex.id] || parseInt(ex.reps) || 10) : (manualReps[ex.id] || parseInt(ex.reps) || 10);
    
    setLoggedSets(prev => [...prev, {
      exerciseId: ex.id,
      exerciseName: ex.name,
      setNumber: setsDone,
      reps: logReps,
      weightLbs: logWeight,
      mode: ex.vitruvianMode || (isDumbbell ? 'dumbbell' : 'bodyweight'),
      peakLoad: isVit ? Math.round(peakLoadRef.current * 2.205) : logWeight,
      band: bandAssist[ex.id] || undefined,
    }]);
    peakLoadRef.current = 0;
    setRepCount(0);
    
    // Check if all sets done for this exercise
    if (setsDone >= ex.sets) {
      // Move to next exercise
      const nextIndex = currentExIndex + 1;
      if (nextIndex >= exercises.length) {
        // Workout complete!
        setPhase('idle');
        if (vitruvian) stopMachine(vitruvian).catch(() => {});
        // Submit workout log
        submitWorkoutLog(workout, loggedSets, workoutStartRef.current);
        return;
      }
      // Start rest before next exercise
      setPhase('resting');
      setRestSeconds(ex.rest || 60);
      setCurrentSet(0);
      // After rest, start next exercise
      const afterRest = () => {
        startExercise(nextIndex);
      };
      // Store callback for when rest ends
      setTimeout(() => {
        if (phase === 'resting') afterRest();
      }, (ex.rest || 60) * 1000);
    } else {
      // More sets — rest then repeat
      setCurrentSet(setsDone);
      setPhase('resting');
      setRestSeconds(ex.rest || 60);
    }
  }, [currentExIndex, exercises, completedSets, vitruvian, startExercise, phase]);

  // Skip rest early
  const skipRest = useCallback(() => {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    setRestSeconds(0);
    setPhase('idle');
    
    const ex = exercises[currentExIndex];
    const setsDone = completedSets[ex?.id] || 0;
    if (ex && setsDone >= ex.sets) {
      // Move to next exercise
      const nextIndex = currentExIndex + 1;
      if (nextIndex < exercises.length) {
        startExercise(nextIndex);
      }
    } else {
      // Same exercise, next set — re-send weight
      if (ex?.vitruvianWeight && vitruvian) {
        setPhase('working');
        setRepCount(0);
        const isEcho = (ex.vitruvianMode || 'old-school').startsWith('echo');
        const wKg = isEcho ? 0 : (ex.vitruvianWeight || 0) * 0.4536;
        setResistance(vitruvian, wKg, ex.vitruvianMode || 'old-school').catch(() => {});
      } else {
        setPhase('working');
        setRepCount(0);
      }
    }
  }, [currentExIndex, exercises, completedSets, vitruvian, startExercise]);

  // Format time
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
  };

  // Calculate progress
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const doneSets = Object.values(completedSets).reduce((a, b) => a + b, 0);
  const progress = totalSets > 0 ? doneSets / totalSets : 0;
  const allDone = doneSets >= totalSets;

  // Parse target reps from string like "8-10"
  const getTargetReps = (reps: string): number => {
    const match = reps.match(/(\d+)/);
    return match ? parseInt(match[1]) : 10;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{workout.name}</Text>
          <Text style={styles.headerSub}>{Math.round(progress * 100)}% complete</Text>
        </View>
        <View style={styles.connectionDot}>
          <View style={[styles.dot, { backgroundColor: vitruvian ? '#3DDC84' : '#F44336' }]} />
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Rest Timer Overlay */}
      {phase === 'resting' && (
        <View style={styles.restOverlay}>
          <Text style={styles.restLabel}>REST</Text>
          <Text style={styles.restTimer}>{formatTime(restSeconds)}</Text>
          <TouchableOpacity onPress={skipRest} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Live Load Display */}
      {(phase === 'working' || phase === 'calibrating') && currentLoad !== null && (
        <View style={styles.loadBar}>
          <Text style={styles.loadLabel}>
            {phase === 'calibrating' ? '🎯 CALIBRATING' : '💪 LIVE LOAD'}
          </Text>
          <Text style={styles.loadValue}>{Math.round(currentLoad * 2.205)} lbs</Text>
          <Text style={styles.repCounter}>
            Reps: {repCount}{phase === 'calibrating' ? ' / 3' : ` / ${currentEx?.reps || '?'}`}
          </Text>
        </View>
      )}

      {/* Calibration prompt */}
      {phase === 'calibrating' && (
        <View style={styles.calibrationBar}>
          <Text style={styles.calibrationText}>
            Do 3 light reps to calibrate, then tap "Ready"
          </Text>
          <TouchableOpacity onPress={finishCalibration} style={styles.readyBtn}>
            <Text style={styles.readyText}>Ready ✓</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Working set controls */}
      {phase === 'working' && currentEx && (
        <View style={styles.workingBar}>
          <Text style={styles.workingText}>
            {currentEx.name} — Set {(completedSets[currentEx.id] || 0) + 1}/{currentEx.sets}
          </Text>
          
          {/* Manual weight input for dumbbell exercises */}
          {currentEx.equipment?.includes('dumbbells') && (
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Weight:</Text>
              <TouchableOpacity 
                onPress={() => setManualWeight(prev => ({ ...prev, [currentEx.id]: Math.max(0, (prev[currentEx.id] || 0) - 5) }))}
                style={styles.adjBtn}
              >
                <Text style={styles.adjText}>−5</Text>
              </TouchableOpacity>
              <Text style={styles.inputValue}>{manualWeight[currentEx.id] || 0} lbs</Text>
              <TouchableOpacity 
                onPress={() => setManualWeight(prev => ({ ...prev, [currentEx.id]: (prev[currentEx.id] || 0) + 5 }))}
                style={styles.adjBtn}
              >
                <Text style={styles.adjText}>+5</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Manual rep input for non-Vitruvian exercises */}
          {!currentEx.equipment?.includes('vitruvian') && (
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Reps:</Text>
              <TouchableOpacity 
                onPress={() => setManualReps(prev => ({ ...prev, [currentEx.id]: Math.max(1, (prev[currentEx.id] || 10) - 1) }))}
                style={styles.adjBtn}
              >
                <Text style={styles.adjText}>−1</Text>
              </TouchableOpacity>
              <Text style={styles.inputValue}>{manualReps[currentEx.id] || 10}</Text>
              <TouchableOpacity 
                onPress={() => setManualReps(prev => ({ ...prev, [currentEx.id]: (prev[currentEx.id] || 10) + 1 }))}
                style={styles.adjBtn}
              >
                <Text style={styles.adjText}>+1</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Band assist selector for pull-up bar exercises */}
          {currentEx.equipment?.includes('pullup_bar') && (
            <View style={styles.bandRow}>
              <Text style={styles.inputLabel}>Band:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bandScroll}>
                {BAND_OPTIONS.map(band => (
                  <TouchableOpacity
                    key={band}
                    onPress={() => setBandAssist(prev => ({ ...prev, [currentEx.id]: band }))}
                    style={[
                      styles.bandChip,
                      (bandAssist[currentEx.id] || 'None') === band && styles.bandChipActive,
                    ]}
                  >
                    <Text style={[
                      styles.bandChipText,
                      (bandAssist[currentEx.id] || 'None') === band && styles.bandChipTextActive,
                    ]}>{band}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          <TouchableOpacity onPress={completeSet} style={styles.completeBtn}>
            <Text style={styles.completeText}>Complete Set ✓</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Exercise List */}
      <ScrollView style={styles.exerciseList}>
        {exercises.map((ex, i) => {
          const done = completedSets[ex.id] || 0;
          const isActive = i === currentExIndex && phase !== 'idle' && phase !== 'resting';
          const isComplete = done >= ex.sets;
          const isVit = ex.equipment?.includes('vitruvian');
          
          return (
            <TouchableOpacity
              key={ex.id}
              style={[
                styles.exerciseCard,
                isActive && styles.activeCard,
                isComplete && styles.completedCard,
              ]}
              onPress={() => {
                if (!isComplete && phase === 'idle') {
                  startExercise(i);
                }
              }}
              disabled={phase !== 'idle' || isComplete}
            >
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseName, isComplete && styles.completedText]}>
                    {isComplete ? '✅ ' : isVit ? '⚡ ' : ''}{ex.name}
                  </Text>
                  <Text style={styles.exerciseDetail}>
                    {done}/{ex.sets} sets • {ex.reps} reps • {ex.rest}s rest
                    {isVit && (ex.vitruvianMode || '').startsWith('echo') 
                      ? ` • ${(ex.vitruvianMode || '').replace('echo-', '').toUpperCase()}`
                      : isVit && ex.vitruvianWeight ? ` • ${ex.vitruvianWeight} lbs` : ''}
                  </Text>
                  {ex.coachingNote && (
                    <Text style={styles.coachingNote}>{ex.coachingNote}</Text>
                  )}
                </View>
              </View>
              
              {/* Set indicators */}
              <View style={styles.setRow}>
                {Array.from({ length: ex.sets }, (_, s) => (
                  <View
                    key={s}
                    style={[
                      styles.setDot,
                      s < done && styles.setDotDone,
                      isActive && s === done && styles.setDotActive,
                    ]}
                  >
                    <Text style={styles.setDotText}>{s + 1}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        {allDone && (
          <View style={styles.completeOverlay}>
            <Text style={styles.completeEmoji}>🎉</Text>
            <Text style={styles.completeTitle}>Workout Complete!</Text>
            <TouchableOpacity onPress={onBack} style={styles.finishBtn}>
              <Text style={styles.finishText}>Finish</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C12' },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 },
  backBtn: { padding: 8 },
  backText: { color: '#3DDC84', fontSize: 16, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#F0F4FF', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#6B8090', fontSize: 12, marginTop: 2 },
  connectionDot: { padding: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  
  // Progress
  progressBar: { height: 4, backgroundColor: '#141D2B', marginHorizontal: 16 },
  progressFill: { height: 4, backgroundColor: '#3DDC84', borderRadius: 2 },
  
  // Rest timer
  restOverlay: { 
    backgroundColor: '#0A1810', padding: 24, margin: 16, borderRadius: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#3DDC84'
  },
  restLabel: { color: '#3DDC84', fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  restTimer: { color: '#F0F4FF', fontSize: 64, fontWeight: '800', marginVertical: 8 },
  skipBtn: { 
    backgroundColor: '#141D2B', paddingHorizontal: 24, paddingVertical: 10, 
    borderRadius: 20, marginTop: 8 
  },
  skipText: { color: '#F0F4FF', fontSize: 14, fontWeight: '600' },
  
  // Live load
  loadBar: { 
    backgroundColor: '#0F1520', padding: 16, marginHorizontal: 16, marginTop: 8,
    borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#3DDC84'
  },
  loadLabel: { color: '#3DDC84', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  loadValue: { fontSize: 40, color: '#3DDC84', fontWeight: '800', marginVertical: 4 },
  repCounter: { color: '#C8D4E0', fontSize: 16, fontWeight: '600' },
  
  // Calibration
  calibrationBar: { 
    backgroundColor: '#141D2B', padding: 12, marginHorizontal: 16, marginTop: 8,
    borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#FFD700'
  },
  calibrationText: { color: '#FFD700', fontSize: 13, flex: 1, marginRight: 12 },
  readyBtn: { backgroundColor: '#FFD700', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  readyText: { color: '#000', fontWeight: '700', fontSize: 14 },
  
  // Working
  workingBar: { 
    backgroundColor: '#0F1520', padding: 12, marginHorizontal: 16, marginTop: 8,
    borderRadius: 12, borderWidth: 1, borderColor: '#3DDC84'
  },
  workingText: { color: '#F0F4FF', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputRow: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: 8, gap: 8 
  },
  inputLabel: { color: '#6B8090', fontSize: 13, fontWeight: '600', width: 55 },
  inputValue: { color: '#F0F4FF', fontSize: 18, fontWeight: '700', minWidth: 70, textAlign: 'center' },
  adjBtn: { 
    backgroundColor: '#141D2B', width: 44, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center'
  },
  adjText: { color: '#3DDC84', fontSize: 16, fontWeight: '700' },
  bandRow: { 
    flexDirection: 'row', alignItems: 'center', marginBottom: 8 
  },
  bandScroll: { flexDirection: 'row' },
  bandChip: { 
    backgroundColor: '#141D2B', paddingHorizontal: 12, paddingVertical: 6, 
    borderRadius: 16, marginRight: 6 
  },
  bandChipActive: { backgroundColor: '#3DDC84' },
  bandChipText: { color: '#6B8090', fontSize: 12, fontWeight: '600' },
  bandChipTextActive: { color: '#F0F4FF' },
  completeBtn: { 
    backgroundColor: '#3DDC84', paddingHorizontal: 16, paddingVertical: 10, 
    borderRadius: 8, alignItems: 'center', marginTop: 4 
  },
  completeText: { color: '#F0F4FF', fontWeight: '700', fontSize: 14 },
  
  // Exercise list
  exerciseList: { flex: 1, padding: 16 },
  exerciseCard: { 
    backgroundColor: '#0F1520', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#1C2535'
  },
  activeCard: { borderColor: '#3DDC84', backgroundColor: '#0F1520' },
  completedCard: { opacity: 0.6, borderColor: '#3DDC84' },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center' },
  exerciseInfo: { flex: 1 },
  exerciseName: { color: '#F0F4FF', fontSize: 16, fontWeight: '700' },
  completedText: { color: '#3DDC84' },
  exerciseDetail: { color: '#6B8090', fontSize: 13, marginTop: 4 },
  coachingNote: { color: '#F59E0B', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  
  // Set dots
  setRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  setDot: { 
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#141D2B',
    alignItems: 'center', justifyContent: 'center'
  },
  setDotDone: { backgroundColor: '#3DDC84' },
  setDotActive: { backgroundColor: '#3DDC84' },
  setDotText: { color: '#F0F4FF', fontSize: 13, fontWeight: '700' },
  
  // Workout complete
  completeOverlay: { alignItems: 'center', padding: 32 },
  completeEmoji: { fontSize: 64 },
  completeTitle: { color: '#F0F4FF', fontSize: 24, fontWeight: '800', marginTop: 16 },
  finishBtn: { 
    backgroundColor: '#3DDC84', paddingHorizontal: 32, paddingVertical: 14, 
    borderRadius: 12, marginTop: 20 
  },
  finishText: { color: '#F0F4FF', fontSize: 16, fontWeight: '700' },
});
