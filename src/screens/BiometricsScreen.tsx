import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  StatusBar, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { getBiometrics, getCompliance, BiometricData, ComplianceData } from '../services/fernApi';

// Design System - Luxury Fitness Theme
const COLORS = {
  primary: '#C9A84C',       // Gold
  background: '#0A0A0A',    // Deep black
  surface: '#141414',        // Card background
  surfaceElevated: '#1E1E1E', // Elevated surfaces
  textPrimary: '#FFFFFF',
  textSecondary: '#8A8A8A',
  border: '#2A2A2A',
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#EF4444',
};

const RADIUS = { card: 12, button: 8 };

interface Props {
  onBack: () => void;
}

function ComplianceRing({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 80 ? COLORS.primary : pct >= 60 ? COLORS.warning : COLORS.error;
  return (
    <View style={ring.wrap}>
      <View style={[ring.circle, { borderColor: color }]}>
        <Text style={[ring.score, { color }]}>{pct}</Text>
        <Text style={ring.label}>COMPLIANCE</Text>
      </View>
    </View>
  );
}

const ring = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: 8 },
  circle: {
    width: 148, height: 148, borderRadius: 74,
    borderWidth: 6, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  score: { fontSize: 52, fontWeight: '900', letterSpacing: -2, lineHeight: 56 },
  label: { fontSize: 9, color: COLORS.textSecondary, letterSpacing: 3, fontWeight: '700', marginTop: 2 },
});

interface MetricCardProps {
  label: string;
  value: string | number | undefined | null;
  unit?: string;
  icon?: string;
  sub?: string;
  color?: string;
}

function MetricCard({ label, value, unit, icon, sub, color = COLORS.textPrimary }: MetricCardProps) {
  return (
    <View style={mc.card}>
      {icon && <Text style={mc.icon}>{icon}</Text>}
      <Text style={mc.label}>{label}</Text>
      <View style={mc.valueRow}>
        <Text style={[mc.value, { color }]}>
          {value != null ? value : '—'}
        </Text>
        {unit && value != null && <Text style={mc.unit}>{unit}</Text>}
      </View>
      {sub && <Text style={mc.sub}>{sub}</Text>}
    </View>
  );
}

const mc = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.card, borderWidth: 1,
    borderColor: COLORS.border, padding: 16, flex: 1,
    minHeight: 110,
  },
  icon: { fontSize: 22, marginBottom: 8 },
  label: { fontSize: 10, color: COLORS.textSecondary, letterSpacing: 2, fontWeight: '700', marginBottom: 8 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  value: { fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  unit: { fontSize: 13, color: COLORS.textSecondary, paddingBottom: 4 },
  sub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 6, fontWeight: '600' },
});

export default function BiometricsScreen({ onBack }: Props) {
  const [bio, setBio] = useState<BiometricData | null>(null);
  const [comp, setComp] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [bioData, compData] = await Promise.all([
        getBiometrics(),
        getCompliance(),
      ]);
      setBio(bioData);
      setComp(compData);
    } catch (e: any) {
      setError(e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sleepQualityLabel = (q?: number) => {
    if (q == null) return undefined;
    if (q >= 85) return 'Excellent';
    if (q >= 70) return 'Good';
    if (q >= 50) return 'Fair';
    return 'Poor';
  };

  const hrvColor = (hrv?: number) => {
    if (hrv == null) return COLORS.textPrimary;
    if (hrv >= 60) return COLORS.primary;
    if (hrv >= 40) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={s.topBar}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>DASHBOARD</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.loadingText}>Loading data…</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Text style={s.errorIcon}>⚠️</Text>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => fetchData()}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Compliance Section */}
          {comp && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>WEEKLY COMPLIANCE</Text>
              <View style={s.compCard}>
                <ComplianceRing score={comp.score} />

                <View style={s.compStats}>
                  {comp.workouts_completed != null && comp.workouts_planned != null && (
                    <View style={s.compStat}>
                      <Text style={s.compStatVal}>
                        {comp.workouts_completed}/{comp.workouts_planned}
                      </Text>
                      <Text style={s.compStatLabel}>WORKOUTS</Text>
                    </View>
                  )}
                  {comp.streak_days != null && (
                    <View style={s.compStat}>
                      <Text style={s.compStatVal}>{comp.streak_days}</Text>
                      <Text style={s.compStatLabel}>DAY STREAK</Text>
                    </View>
                  )}
                </View>

                {comp.message && (
                  <View style={s.compMessage}>
                    <Text style={s.compMessageText}>"{comp.message}"</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Biometrics Section */}
          {bio && (
            <>
              <Text style={s.sectionLabel}>BIOMETRICS</Text>
              {bio.date && (
                <Text style={s.bioDate}>
                  Last synced: {new Date(bio.date).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric'
                  })}
                </Text>
              )}

              {/* Row 1: Weight + HRV */}
              <View style={s.row}>
                <MetricCard
                  label="WEIGHT"
                  value={bio.weight_lbs != null ? Math.round(bio.weight_lbs) : undefined}
                  unit="lbs"
                  icon="⚖️"
                />
                <MetricCard
                  label="HRV"
                  value={bio.hrv_ms != null ? Math.round(bio.hrv_ms) : undefined}
                  unit="ms"
                  icon="❤️"
                  color={hrvColor(bio.hrv_ms)}
                  sub={bio.hrv_ms != null
                    ? bio.hrv_ms >= 60 ? 'Recovered' : bio.hrv_ms >= 40 ? 'Moderate' : 'Low'
                    : undefined}
                />
              </View>

              {/* Row 2: Sleep + Steps */}
              <View style={s.row}>
                <MetricCard
                  label="SLEEP"
                  value={bio.sleep_hours != null ? bio.sleep_hours.toFixed(1) : undefined}
                  unit="hrs"
                  icon="🌙"
                  sub={sleepQualityLabel(bio.sleep_quality)}
                  color={bio.sleep_hours != null
                    ? bio.sleep_hours >= 7.5 ? COLORS.primary : bio.sleep_hours >= 6 ? COLORS.warning : COLORS.error
                    : COLORS.textPrimary}
                />
                <MetricCard
                  label="STEPS"
                  value={bio.steps != null ? bio.steps.toLocaleString() : undefined}
                  icon="👟"
                  color={bio.steps != null && bio.steps >= 10000 ? COLORS.primary : COLORS.textPrimary}
                  sub={bio.steps != null && bio.steps >= 10000 ? 'Goal reached 🎯' : undefined}
                />
              </View>

              {/* Row 3: Resting HR + Recovery */}
              {(bio.resting_hr != null || bio.recovery_score != null) && (
                <View style={s.row}>
                  {bio.resting_hr != null && (
                    <MetricCard
                      label="RESTING HR"
                      value={bio.resting_hr}
                      unit="bpm"
                      icon="💓"
                      color={bio.resting_hr <= 60 ? COLORS.primary : bio.resting_hr <= 75 ? COLORS.warning : COLORS.error}
                    />
                  )}
                  {bio.recovery_score != null && (
                    <MetricCard
                      label="RECOVERY"
                      value={bio.recovery_score}
                      unit="%"
                      icon="🔋"
                      color={bio.recovery_score >= 70 ? COLORS.primary : bio.recovery_score >= 50 ? COLORS.warning : COLORS.error}
                    />
                  )}
                </View>
              )}
            </>
          )}

          {!comp && !bio && (
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>📊</Text>
              <Text style={s.emptyTitle}>No Data Yet</Text>
              <Text style={s.emptySub}>Sync your wearables and complete workouts to see your dashboard.</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  title: { fontSize: 12, letterSpacing: 3, color: COLORS.textSecondary, fontWeight: '700' },
  scroll: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { color: COLORS.textSecondary, fontSize: 14, marginTop: 12 },
  errorIcon: { fontSize: 32, marginBottom: 12 },
  errorText: { color: COLORS.error, fontSize: 14, textAlign: 'center', marginBottom: 20 },
  retryBtn: {
    backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.button, paddingHorizontal: 24, paddingVertical: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  retryText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11, letterSpacing: 2, color: COLORS.textSecondary,
    fontWeight: '600', marginBottom: 14,
  },
  bioDate: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
  compCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.card, borderWidth: 1,
    borderColor: COLORS.border, padding: 20, alignItems: 'center',
  },
  compStats: { flexDirection: 'row', gap: 40, marginTop: 20 },
  compStat: { alignItems: 'center' },
  compStatVal: { fontSize: 24, color: COLORS.textPrimary, fontWeight: '800' },
  compStatLabel: { fontSize: 10, color: COLORS.textSecondary, letterSpacing: 2, fontWeight: '600', marginTop: 2 },
  compMessage: {
    marginTop: 18, borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingTop: 16, width: '100%',
  },
  compMessageText: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic', textAlign: 'center', lineHeight: 20 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, color: COLORS.textPrimary, fontWeight: '600', marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});
