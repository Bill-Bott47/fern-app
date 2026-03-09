export type Equipment = 'vitruvian' | 'dumbbells' | 'trx' | 'pullup_bar' | 'peloton_tread' | 'peloton_bike' | 'bodyweight';
export type VitruvianMode = 'echo-hard' | 'echo-harder' | 'echo-hardest' | 'old-school';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: number; // seconds
  equipment: Equipment[];
  coachingNote?: string;
  vitruvianWeight?: number; // in LBS — converted to kg when sending to machine
  vitruvianMode?: VitruvianMode;
}

export interface Workout {
  id: string;
  name: string;
  day: number; // 1=Mon, 2=Tue, etc.
  label: string;
  focus: string;
  durationMin?: number;
  exercises: Exercise[];
}

export const ACE_WORKOUTS: Workout[] = [
  {
    id: 'upper_push_a',
    name: 'Upper Push A',
    day: 1,
    label: 'Monday',
    focus: 'Chest, Shoulders, Triceps',
    durationMin: 40,
    exercises: [
      { id: 'chest_press', name: 'Bench Press', sets: 4, reps: '6-8', rest: 90, equipment: ['vitruvian'], vitruvianWeight: 60, vitruvianMode: 'echo-harder', coachingNote: 'Full range, pause at chest' },
      { id: 'shoulder_press', name: 'Shoulder Press', sets: 4, reps: '10-12', rest: 75, equipment: ['vitruvian'], vitruvianWeight: 30, vitruvianMode: 'echo-hard', coachingNote: 'Brace core, no arch' },
      { id: 'incline_press', name: 'Incline Bench Press', sets: 3, reps: '10-12', rest: 75, equipment: ['vitruvian'], vitruvianWeight: 50, vitruvianMode: 'echo-hard', coachingNote: 'Upper chest focus, 30-45° angle' },
      { id: 'lateral_raise', name: 'Lateral Raise', sets: 3, reps: '12-15', rest: 60, equipment: ['dumbbells'], coachingNote: 'Lead with elbows — 15 lbs' },
      { id: 'overhead_tricep', name: 'Overhead Tricep Ext.', sets: 3, reps: '15', rest: 60, equipment: ['vitruvian'], vitruvianWeight: 38, vitruvianMode: 'echo-hard', coachingNote: 'Keep elbows close to head' },
    ]
  },
  {
    id: 'upper_pull_a',
    name: 'Upper Pull A',
    day: 2,
    label: 'Tuesday',
    focus: 'Back, Biceps, Rear Delts',
    durationMin: 45,
    exercises: [
      { id: 'pullup', name: 'Pull-Up', sets: 4, reps: '6-8', rest: 90, equipment: ['pullup_bar'], coachingNote: 'Dead hang to chin over bar' },
      { id: 'row', name: 'Bent Over Row', sets: 4, reps: '8-10', rest: 90, equipment: ['vitruvian'], vitruvianWeight: 48, vitruvianMode: 'echo-harder', coachingNote: 'Pull to lower chest, squeeze at top' },
      { id: 'face_pull', name: 'Face Pull', sets: 3, reps: '12-15', rest: 60, equipment: ['trx'], coachingNote: 'Elbows high, external rotate at top' },
      { id: 'cable_curl', name: 'Cable Curl', sets: 3, reps: '10-12', rest: 60, equipment: ['vitruvian'], vitruvianWeight: 22, vitruvianMode: 'echo-hard', coachingNote: 'Supinate at top, control down' },
      { id: 'rear_delt_fly', name: 'Rear Delt Fly', sets: 3, reps: '15-20', rest: 60, equipment: ['dumbbells'], coachingNote: 'Bend 45°, pinky up, squeeze at top' },
    ]
  },
  {
    id: 'legs_maintenance',
    name: 'Legs Maintenance',
    day: 3,
    label: 'Wednesday',
    focus: 'Quads, Hamstrings, Glutes',
    durationMin: 20,
    exercises: [
      { id: 'goblet_squat', name: 'Goblet Squat', sets: 3, reps: '12-15', rest: 75, equipment: ['dumbbells'], coachingNote: 'Keep torso upright, depth to parallel' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, reps: '12', rest: 75, equipment: ['dumbbells'], coachingNote: 'Hinge at hips, soft knee, feel the stretch' },
      { id: 'split_squat', name: 'Split Squat', sets: 2, reps: '10 each', rest: 60, equipment: ['bodyweight', 'dumbbells'], coachingNote: 'Keep torso upright' },
      { id: 'hip_thrust', name: 'Hip Thrust', sets: 3, reps: '15', rest: 60, equipment: ['vitruvian', 'bodyweight'], coachingNote: 'Full hip extension, squeeze glutes at top' },
      { id: 'face_pull_wed', name: 'Face Pull', sets: 2, reps: '20', rest: 45, equipment: ['trx'], coachingNote: 'Slow controlled, elbows high' },
    ]
  },
  {
    id: 'upper_push_b',
    name: 'Upper Push B',
    day: 4,
    label: 'Thursday',
    focus: 'Chest, Shoulders, Triceps',
    durationMin: 40,
    exercises: [
      { id: 'incline_chest_press', name: 'Incline Bench Press', sets: 4, reps: '8-10', rest: 90, equipment: ['vitruvian'], vitruvianWeight: 50, vitruvianMode: 'echo-hard', coachingNote: 'Upper chest focus, 30-45° angle' },
      { id: 'cable_fly', name: 'Lying Pec Fly', sets: 3, reps: '15-20', rest: 60, equipment: ['vitruvian'], vitruvianWeight: 29, vitruvianMode: 'echo-hard', coachingNote: 'Slight bend in elbow, squeeze at center' },
      { id: 'shoulder_press_b', name: 'Shoulder Press', sets: 3, reps: '10-12', rest: 75, equipment: ['vitruvian'], vitruvianWeight: 30, vitruvianMode: 'echo-hard', coachingNote: 'Brace core, no arch' },
      { id: 'lateral_raise_b', name: 'Lateral Raise', sets: 3, reps: '12-15', rest: 60, equipment: ['dumbbells'], coachingNote: 'Lead with elbows — 15 lbs' },
      { id: 'overhead_tricep_b', name: 'Overhead Tricep Ext.', sets: 3, reps: '15', rest: 60, equipment: ['vitruvian'], vitruvianWeight: 38, vitruvianMode: 'echo-hard', coachingNote: 'Keep elbows close to head' },
    ]
  },
  {
    id: 'upper_pull_b',
    name: 'Upper Pull B',
    day: 5,
    label: 'Friday',
    focus: 'Back, Biceps, Rear Delts',
    durationMin: 45,
    exercises: [
      { id: 'trx_row', name: 'TRX Row', sets: 4, reps: '10-12', rest: 75, equipment: ['trx'], coachingNote: 'Body at angle, squeeze shoulder blades' },
      { id: 'lat_pulldown', name: 'Lat Pulldown', sets: 4, reps: '10', rest: 90, equipment: ['vitruvian'], vitruvianWeight: 48, vitruvianMode: 'echo-harder', coachingNote: 'Drive elbows to hips, lean back slightly' },
      { id: 'cable_row', name: 'Seated Cable Row', sets: 3, reps: '12', rest: 75, equipment: ['vitruvian'], vitruvianWeight: 48, vitruvianMode: 'echo-hard', coachingNote: 'Full stretch, full contraction' },
      { id: 'cable_curl_b', name: 'Cable Curl', sets: 3, reps: '10-12', rest: 60, equipment: ['vitruvian'], vitruvianWeight: 22, vitruvianMode: 'echo-hard', coachingNote: 'Supinate at top, control down' },
      { id: 'rear_delt_fly_b', name: 'Rear Delt Fly', sets: 3, reps: '15-20', rest: 60, equipment: ['dumbbells'], coachingNote: 'Bend 45°, pinky up, squeeze at top' },
    ]
  },
];

export function getTodaysWorkout(): Workout | null {
  const day = new Date().getDay(); // 0=Sun, 1=Mon...
  const mappedDay = day === 0 ? 7 : day; // 1=Mon, 7=Sun
  return ACE_WORKOUTS.find(w => w.day === mappedDay) || null;
}
