/**
 * Fern Backend API Service
 * Base URL: http://192.168.1.189:8000/api/v1
 */

const BASE_URL = 'http://192.168.1.189:8000/api/v1';
const DEFAULT_USER_ID = 'jonathan';

const HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-API-Key': 'fern-ace-2026',
  'X-Service-Account': 'ace',
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...HEADERS, ...options?.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkoutSet {
  exercise: string;
  sets?: number;
  reps?: number;
  weight_lbs?: number;
  duration_sec?: number;
}

export interface WorkoutSession {
  id?: string;
  date: string;
  name: string;
  focus?: string;
  duration_min?: number;
  sets_logged?: WorkoutSet[];
  total_sets?: number;
  notes?: string;
}

export interface BiometricData {
  date?: string;
  weight_lbs?: number;
  hrv_ms?: number;
  sleep_hours?: number;
  sleep_quality?: number;
  steps?: number;
  resting_hr?: number;
  recovery_score?: number;
}

export interface ComplianceData {
  week_start?: string;
  week_end?: string;
  score: number;               // 0–100
  workouts_completed?: number;
  workouts_planned?: number;
  streak_days?: number;
  message?: string;
}

export interface Tip {
  id?: string;
  created_at?: string;
  message: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  read?: boolean;
}

// ─── API Methods ──────────────────────────────────────────────────────────────

/** Fetch workout history for a user */
export async function getWorkouts(userId: string = DEFAULT_USER_ID): Promise<WorkoutSession[]> {
  return apiFetch<WorkoutSession[]>(`/workouts/${userId}`);
}

/** Fetch biometric data for a user */
export async function getBiometrics(userId: string = DEFAULT_USER_ID): Promise<BiometricData> {
  return apiFetch<BiometricData>(`/biometrics/${userId}`);
}

/** Fetch weekly compliance score for a user */
export async function getCompliance(userId: string = DEFAULT_USER_ID): Promise<ComplianceData> {
  return apiFetch<ComplianceData>(`/compliance/${userId}`);
}

/** Get tips for a user */
export async function getTips(userId: string = DEFAULT_USER_ID): Promise<Tip[]> {
  return apiFetch<Tip[]>(`/tips/${userId}`);
}

/** Send a tip to a user (ACE → Jonathan) */
export async function sendTip(message: string, userId: string = DEFAULT_USER_ID, category?: string): Promise<Tip> {
  return apiFetch<Tip>('/tips', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, message, category }),
  });
}

/** Sync biometric data to the backend */
export async function syncBiometrics(data: BiometricData & { user_id?: string }): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/biometrics/sync', {
    method: 'POST',
    body: JSON.stringify({ user_id: DEFAULT_USER_ID, ...data }),
  });
}
