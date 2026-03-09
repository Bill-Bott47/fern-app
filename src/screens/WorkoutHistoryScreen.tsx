import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  StatusBar, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { getWorkouts, WorkoutSession } from '../services/fernApi';

// ─── Design Tokens ──────────────────────────────────────────────
const GOLD   = '#C9A84C';
const BG     = '#0A0A0A';
const SURFACE = '#141414';
const SURFACE_ELEVATED = '#1E1E1E';
const TEXT   = '#FFFFFF';
const TEXT2  = '#8A8A8A';
const BORDER = '#2A2A2A';
const ERROR  = '#EF4444';

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
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);

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
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>WORKOUT HISTORY</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={s.loadingText}>Loading workouts…</Text>
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
              tintColor={GOLD}
            />
          }
        >
          {workouts.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>🌿</Text>
              <Text style={s.emptyTitle}>No Workouts Yet</Text>
              <Text style={s.emptySub}>Complete your first workout to see it here.</Text>
            </View>
          ) : (
            <>
              <Text style={s.sectionLabel}>
                {workouts.length} SESSION{workouts.length !== 1 ? 'S' : ''}
              </Text>
              {workouts.map((w, i) => (
                <View key={w.id ?? i} style={s.card}>
                  <View style={s.cardHeader}>
                    <View style={s.cardMeta}>
                      <Text style={s.cardAgo}>{daysAgo(w.date)}</Text>
                      <Text style={s.cardDate}>{formatDate(w.date)}</Text>
                    </View>
                    {w.duration_min != null && (
                      <View style={s.durationPill}>
                        <Text style={s.durationText}>{w.duration_min} min</Text>
                      </View>
                    )}
                  </View>

                  <Text style={s.cardName}>{w.name}</Text>
                  {w.focus && <Text style={s.cardFocus}>{w.focus}</Text>}

                  <View style={s.stats}>
                    {w.total_sets != null && (
                      <View style={s.stat}>
                        <Text style={s.statVal}>{w.total_sets}</Text>
                        <Text style={s.statLabel}>SETS</Text>
                      </View>
                    )}
                    {w.sets_logged && (
                      <View style={s.stat}>
                        <Text style={s.statVal}>{w.sets_logged.length}</Text>
                        <Text style={s.statLabel}>EXERCISES</Text>
                      </View>
                    )}
                  </View>

                  {w.notes && <Text style={s.notes}>{w.notes}</Text>}

                  {w.sets_logged && w.sets_logged.length > 0 && (
                    <View style={s.setsList}>
                      {w.sets_logged.slice(0, 4).map((set, si) => (
                        <View key={si} style={s.setRow}>
                          <Text style={s.setName}>{set.exercise}</Text>
                          <Text style={s.setSpec}>
                            {[
                              set.sets != null ? `${set.sets}×${set.reps}` : null,
                              set.weight_lbs != null ? `${set.weight_lbs} lbs` : null,
                            ].filter(Boolean).join(' · ')}
                          </Text>
                        </View>
                      ))}
                      {w.sets_logged.length > 4 && (
                        <Text style={s.moreText}>
                          +{w.sets_logged.length - 4} more exercises
                        </Text>
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 15, color: GOLD, fontWeight: '600' },
  title: {
    fontSize: 11, letterSpacing: 4, color: TEXT2,
    fontWeight: '700', fontFamily: 'Inter',
  },
  scroll: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { color: TEXT2, fontSize: 13, marginTop: 12 },
  errorIcon: { fontSize: 32, marginBottom: 12 },
  errorText: { color: ERROR, fontSize: 14, textAlign: 'center', marginBottom: 20 },
  retryBtn: {
    backgroundColor: SURFACE_ELEVATED, borderRadius: 8,
    paddingHorizontal: 24, paddingVertical: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  retryText: { color: GOLD, fontWeight: '700', fontSize: 14 },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, color: TEXT, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, color: TEXT2, textAlign: 'center', lineHeight: 22 },

  sectionLabel: {
    fontSize: 10, letterSpacing: 4, color: TEXT2,
    fontWeight: '700', marginBottom: 16,
  },

  // ─── Card ──────────────────────────────────────────────────────
  card: {
    backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1,
    borderColor: BORDER, padding: 16, marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 10,
  },
  cardMeta: { gap: 2 },
  cardAgo: { fontSize: 11, color: GOLD, fontWeight: '700', letterSpacing: 1 },
  cardDate: { fontSize: 12, color: TEXT2 },
  durationPill: {
    backgroundColor: `${GOLD}18`, borderRadius: 20, borderWidth: 1,
    borderColor: `${GOLD}40`, paddingHorizontal: 10, paddingVertical: 4,
  },
  durationText: { fontSize: 11, color: GOLD, fontWeight: '700' },

  cardName: {
    fontSize: 20, color: TEXT, fontWeight: '800',
    letterSpacing: -0.5, marginBottom: 4,
  },
  cardFocus: { fontSize: 12, color: TEXT2, marginBottom: 14 },

  stats: { flexDirection: 'row', gap: 24, marginBottom: 14 },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 22, color: TEXT, fontWeight: '800' },
  statLabel: {
    fontSize: 9, color: TEXT2, letterSpacing: 2,
    fontWeight: '700', marginTop: 2,
  },
  notes: {
    fontSize: 12, color: TEXT2, fontStyle: 'italic', marginBottom: 12,
  },

  setsList: {
    borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 12, gap: 8,
  },
  setRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  setName: { fontSize: 13, color: TEXT2, flex: 1 },
  setSpec: { fontSize: 12, color: '#666' },
  moreText: { fontSize: 11, color: '#555', fontStyle: 'italic', marginTop: 4 },
});
