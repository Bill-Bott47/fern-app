import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  StatusBar, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { getWorkouts, WorkoutSession } from '../services/fernApi';

// Design System - Luxury Fitness Theme
const COLORS = {
  primary: '#C9A84C',       // Gold
  background: '#0A0A0A',     // Deep black
  surface: '#141414',        // Card background
  surfaceElevated: '#1E1E1E', // Elevated surfaces
  textPrimary: '#FFFFFF',
  textSecondary: '#8A8A8A',
  border: '#2A2A2A',
  success: '#22C55E',
  warning: '#FBBF24',
  error: '#EF4444',
};

const RADIUS = { card: 12, button: 8 };

interface Props {
  onBack: () => void;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function daysAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff}d ago`;
  } catch {
    return '';
  }
}

export default function WorkoutHistoryScreen({ onBack }: Props) {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getWorkouts();
      const sorted = [...data].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setWorkouts(sorted);
    } catch (e: any) {
      setError(e?.message || 'Failed to load workouts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>WORKOUT HISTORY</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading workouts…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️ <Text style={styles.errorText}>{error}</Text></Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              tintColor={COLORS.primary}
            />
          }
        >
          {workouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌿</Text>
              <Text style={styles.emptyTitle}>No Workouts Yet</Text>
              <Text style={styles.emptySub}>Complete your first workout to see it here.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>{workouts.length} SESSION{workouts.length !== 1 ? 'S' : ''}</Text>
              {workouts.map((w, i) => (
                <View key={w.id ?? i} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardMeta}>
                      <Text style={styles.cardAgo}>{daysAgo(w.date)}</Text>
                      <Text style={styles.cardDate}>{formatDate(w.date)}</Text>
                    </View>
                    {w.duration_min != null && (
                      <View style={styles.durationPill}>
                        <Text style={styles.durationText}>{w.duration_min} min</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.cardName}>{w.name}</Text>
                  {w.focus && <Text style={styles.cardFocus}>{w.focus}</Text>}

                  <View style={styles.stats}>
                    {w.total_sets != null && (
                      <View style={styles.stat}>
                        <Text style={styles.statVal}>{w.total_sets}</Text>
                        <Text style={styles.statLabel}>SETS</Text>
                      </View>
                    )}
                    {w.sets_logged && (
                      <View style={styles.stat}>
                        <Text style={styles.statVal}>{w.sets_logged.length}</Text>
                        <Text style={styles.statLabel}>EXERCISES</Text>
                      </View>
                    )}
                  </View>

                  {w.notes && (
                    <Text style={styles.notes}>{w.notes}</Text>
                  )}

                  {w.sets_logged && w.sets_logged.length > 0 && (
                    <View style={styles.setsList}>
                      {w.sets_logged.slice(0, 4).map((set, si) => (
                        <View key={si} style={styles.setRow}>
                          <Text style={styles.setName}>{set.exercise}</Text>
                          <Text style={styles.setSpec}>
                            {[
                              set.sets != null ? `${set.sets}×${set.reps}` : null,
                              set.weight_lbs != null ? `${set.weight_lbs} lbs` : null,
                            ].filter(Boolean).join(' · ')}
                          </Text>
                        </View>
                      ))}
                      {w.sets_logged.length > 4 && (
                        <Text style={styles.moreText}>+{w.sets_logged.length - 4} more exercises</Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, color: COLORS.textPrimary, fontWeight: '600', marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  sectionLabel: {
    fontSize: 11, letterSpacing: 2, color: COLORS.textSecondary,
    fontWeight: '600', marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.card, borderWidth: 1,
    borderColor: COLORS.border, padding: 16, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardMeta: { gap: 2 },
  cardAgo: { fontSize: 12, color: COLORS.primary, fontWeight: '700', letterSpacing: 0.5 },
  cardDate: { fontSize: 12, color: COLORS.textSecondary },
  durationPill: {
    backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)', paddingHorizontal: 10, paddingVertical: 4,
  },
  durationText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  cardName: { fontSize: 20, color: COLORS.textPrimary, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4 },
  cardFocus: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 14 },
  stats: { flexDirection: 'row', gap: 24, marginBottom: 14 },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 24, color: COLORS.textPrimary, fontWeight: '800' },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, letterSpacing: 1.5, fontWeight: '600', marginTop: 2 },
  notes: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic', marginBottom: 12 },
  setsList: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, gap: 8 },
  setRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  setName: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  setSpec: { fontSize: 12, color: COLORS.textSecondary },
  moreText: { fontSize: 11, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 4 },
});
