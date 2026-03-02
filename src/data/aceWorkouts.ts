export type Equipment = 'vitruvian' | 'dumbbells' | 'trx' | 'pullup_bar' | 'peloton_tread' | 'peloton_bike' | 'bodyweight';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: number; // seconds
  equipment: Equipment[];
  coachingNote?: string;
  vitruvianWeight?: number;
}

export interface Workout {
  id: string;
  name: string;
  day: number; // 1=Mon, 2=Tue, etc.
  label: string;
  focus: string;
  exercises: Exercise[];
}

export const ACE_WORKOUTS: Workout[] = [
  {
    id: 'upper_push_a',
    name: 'Upper Push A',
    day: 1,
    label: 'Monday',
    focus: 'Chest, Shoulders, Triceps',
    exercises: [
      { id: 'chest_press', name: 'Chest Press', sets: 4, reps: '8-10', rest: 90, equipment: ['vitruvian'], vitruvianWeight: 40, coachingNote: 'Full range, control the eccentric' },
      { id: 'overhead_press', name: 'Overhead Press', sets: 3, reps: '10-12', rest: 75, equipment: ['vitruvian', 'dumbbells'], coachingNote: 'Brace your core, no arch' },
      { id: 'incline_press', name: 'Incline Press', sets: 3, reps: '10-12', rest: 75, equipment: ['vitruvian'], coachingNote: '30-45 degree angle' },
      { id: 'lateral_raise', name: 'Lateral Raise', sets: 3, reps: '12-15', rest: 60, equipment: ['vitruvian', 'dumbbells'], coachingNote: 'Lead with elbows, stop at shoulder height' },
      { id: 'tricep_pushdown', name: 'Tricep Pushdown', sets: 3, reps: '12-15', rest: 60, equipment: ['vitruvian'], coachingNote: 'Keep elbows pinned to sides' },
    ]
  },
  {
    id: 'upper_pull_a',
    name: 'Upper Pull A',
    day: 2,
    label: 'Tuesday',
    focus: 'Back, Biceps, Rear Delts',
    exercises: [
      { id: 'pullup', name: 'Pull-Up', sets: 4, reps: '6-8', rest: 90, equipment: ['pullup_bar'], coachingNote: 'Dead hang to chin over bar' },
      { id: 'row', name: 'Bent Over Row', sets: 4, reps: '8-10', rest: 90, equipment: ['vitruvian', 'dumbbells'], vitruvianWeight: 35, coachingNote: 'Pull to lower chest, squeeze at top' },
      { id: 'face_pull', name: 'Face Pull', sets: 3, reps: '15', rest: 60, equipment: ['vitruvian', 'trx'], coachingNote: 'Elbows high, external rotate at top' },
      { id: 'bicep_curl', name: 'Bicep Curl', sets: 3, reps: '10-12', rest: 60, equipment: ['vitruvian', 'dumbbells'], coachingNote: 'Supinate at top, control down' },
      { id: 'rear_delt_fly', name: 'Rear Delt Fly', sets: 3, reps: '15', rest: 60, equipment: ['vitruvian', 'dumbbells'], coachingNote: 'Slight bend in elbow, lead with elbows' },
    ]
  },
  {
    id: 'legs_maintenance',
    name: 'Legs Maintenance',
    day: 3,
    label: 'Wednesday',
    focus: 'Quads, Hamstrings, Glutes',
    exercises: [
      { id: 'squat', name: 'Goblet Squat', sets: 3, reps: '12-15', rest: 75, equipment: ['vitruvian', 'dumbbells'], coachingNote: '20 min session — keep it moving' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, reps: '12', rest: 75, equipment: ['vitruvian', 'dumbbells'], coachingNote: 'Hinge at hips, soft knee' },
      { id: 'split_squat', name: 'Split Squat', sets: 2, reps: '10 each', rest: 60, equipment: ['bodyweight', 'dumbbells'], coachingNote: 'Keep torso upright' },
      { id: 'hip_thrust', name: 'Hip Thrust', sets: 3, reps: '15', rest: 60, equipment: ['vitruvian', 'bodyweight'], coachingNote: 'Full hip extension, squeeze glutes at top' },
    ]
  },
  {
    id: 'upper_push_b',
    name: 'Upper Push B',
    day: 4,
    label: 'Thursday',
    focus: 'Chest, Shoulders, Triceps',
    exercises: [
      { id: 'incline_chest_press', name: 'Incline Chest Press', sets: 4, reps: '8-10', rest: 90, equipment: ['vitruvian'], coachingNote: 'Upper chest focus' },
      { id: 'arnold_press', name: 'Arnold Press', sets: 3, reps: '10', rest: 75, equipment: ['dumbbells'], coachingNote: 'Full rotation through movement' },
      { id: 'cable_fly', name: 'Cable Fly', sets: 3, reps: '12-15', rest: 60, equipment: ['vitruvian'], coachingNote: 'Slight bend in elbow, squeeze at center' },
      { id: 'front_raise', name: 'Front Raise', sets: 3, reps: '12', rest: 60, equipment: ['vitruvian', 'dumbbells'], coachingNote: 'Alternate arms, control' },
      { id: 'overhead_tricep', name: 'Overhead Tricep Extension', sets: 3, reps: '12', rest: 60, equipment: ['vitruvian', 'dumbbells'], coachingNote: 'Keep elbows close to head' },
    ]
  },
  {
    id: 'upper_pull_b',
    name: 'Upper Pull B',
    day: 5,
    label: 'Friday',
    focus: 'Back, Biceps, Rear Delts',
    exercises: [
      { id: 'trx_row', name: 'TRX Row', sets: 4, reps: '10-12', rest: 75, equipment: ['trx'], coachingNote: 'Body at angle, squeeze shoulder blades' },
      { id: 'lat_pulldown', name: 'Lat Pulldown', sets: 4, reps: '10', rest: 90, equipment: ['vitruvian'], coachingNote: 'Drive elbows to hips, lean back slightly' },
      { id: 'hammer_curl', name: 'Hammer Curl', sets: 3, reps: '12', rest: 60, equipment: ['dumbbells'], coachingNote: 'Neutral grip throughout' },
      { id: 'cable_row', name: 'Seated Cable Row', sets: 3, reps: '12', rest: 75, equipment: ['vitruvian'], coachingNote: 'Full stretch, full contraction' },
      { id: 'shrug', name: 'Shrug', sets: 3, reps: '15', rest: 60, equipment: ['dumbbells', 'vitruvian'], coachingNote: 'Straight up — no rolling' },
    ]
  },
];

export function getTodaysWorkout(): Workout | null {
  const day = new Date().getDay(); // 0=Sun, 1=Mon...
  const mappedDay = day === 0 ? 7 : day; // 1=Mon, 7=Sun
  return ACE_WORKOUTS.find(w => w.day === mappedDay) || null;
}
