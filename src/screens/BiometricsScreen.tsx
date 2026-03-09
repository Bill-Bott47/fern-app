import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  StatusBar, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { getBiometrics, getCompliance, BiometricData, ComplianceData } from '../services/fernApi';

const G = '#3DDC84';
const BG = '#080A0F';
const CARD = '#111';

interface Props {
  onBack: () => void;
}

function ComplianceRing({ score }: { score: number }) {
  // Simple text-based ring substitute (no SVG needed)
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 80 ? G : pct >= 60 ? '#F59E0B' : '#EF4444';
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
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 5, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0A0A0A',
  },
  score: { fontSize: 48, fontWeight: '900', letterSpacing: -2, lineHeight: 52 },
  label: { fontSize: 9, color: '#333', letterSpacing: 3, fontWeight: '700', marginTop: 2 },
});

interface MetricCardProps {
  label: string;
  value: string | number | undefined | null;
  unit?: string;
  icon?: string;
  sub?: string;
  color?: string;
}

function MetricCard({ label, value, unit, icon, sub, color = '#fff' }: MetricCardProps) {
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
    backgroundColor: CARD, borderRadius: 16, borderWidth: 1,
    borderColor: '#1A1A1A', padding: 16, flex: 1,
    minHeight: 100,
  },
  icon: { fontSize: 20, marginBottom: 6 },
  label: { fontSize: 10, color: '#444', letterSpacing: 2, fontWeight: '700', marginBottom: 8 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  value: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  unit: { fontSize: 12, color: '#444', paddingBottom: 4 },
  sub: { fontSize: 11, color: '#333', marginTop: 4 },
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
    if (hrv == null) return '#fff';
    if (hrv >= 60) return G;
    if (hrv >= 40) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <View style={s.topBar}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>DASHBOARD</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={G} />
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
              tintColor={G}
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
                    ? bio.sleep_hours >= 7.5 ? G : bio.sleep_hours >= 6 ? '#F59E0B' : '#EF4444'
                    : '#fff'}
                />
                <MetricCard
                  label="STEPS"
                  value={bio.steps != null ? bio.steps.toLocaleString() : undefined}
                  icon="👟"
                  color={bio.steps != null && bio.steps >= 10000 ? G : '#fff'}
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
                      color={bio.resting_hr <= 60 ? G : bio.resting_hr <= 75 ? '#F59E0B' : '#EF4444'}
                    />
                  )}
                  {bio.recovery_score != null && (
                    <MetricCard
                      label="RECOVERY"
                      value={bio.recovery_score}
                      unit="%"
                      icon="🔋"
                      color={bio.recovery_score >= 70 ? G : bio.recovery_score >= 50 ? '#F59E0B' : '#EF4444'}
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
  container: { flex: 1, backgroundColor: BG },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#161616',
  },
  backBtn: { width: 60 },
  backText: { fontSize: 15, color: G, fontWeight: '600' },
  title: { fontSize: 11, letterSpacing: 4, color: '#444', fontWeight: '700' },
  scroll: { padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { color: '#444', fontSize: 13, marginTop: 12 },
  errorIcon: { fontSize: 32, marginBottom: 12 },
  errorText: { color: '#FF6B6B', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  retryBtn: {
    backgroundColor: '#1A1A1A', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
    borderWidth: 1, borderColor: '#333',
  },
  retryText: { color: G, fontWeight: '700', fontSize: 14 },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 10, letterSpacing: 4, color: '#2A2A2A',
    fontWeight: '700', marginBottom: 14,
  },
  bioDate: { fontSize: 11, color: '#333', marginBottom: 12 },
  compCard: {
    backgroundColor: CARD, borderRadius: 20, borderWidth: 1,
    borderColor: '#1A1A1A', padding: 24, alignItems: 'center',
  },
  compStats: { flexDirection: 'row', gap: 40, marginTop: 20 },
  compStat: { alignItems: 'center' },
  compStatVal: { fontSize: 24, color: '#fff', fontWeight: '800' },
  compStatLabel: { fontSize: 9, color: '#2A2A2A', letterSpacing: 2, fontWeight: '700', marginTop: 2 },
  compMessage: {
    marginTop: 18, borderTopWidth: 1, borderTopColor: '#1A1A1A',
    paddingTop: 16, width: '100%',
  },
  compMessageText: { fontSize: 13, color: '#555', fontStyle: 'italic', textAlign: 'center', lineHeight: 20 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, color: '#fff', fontWeight: '600', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#444', textAlign: 'center' },
});
