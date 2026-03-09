import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  StatusBar, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { getTips, Tip } from '../services/fernApi';

// Design System - Luxury Fitness Theme
const COLORS = {
  primary: '#C9A84C',       // Gold
  background: '#0A0A0A',    // Deep black
  surface: '#141414',       // Card background
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

function formatTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function categoryColor(category?: string): string {
  const map: Record<string, string> = {
    nutrition: '#F59E0B',
    recovery: '#C9A84C',
    training: COLORS.primary,
    mindset: '#A78BFA',
    sleep: '#818CF8',
  };
  return category ? (map[category.toLowerCase()] ?? COLORS.textSecondary) : COLORS.textSecondary;
}

function priorityDot(priority?: string): string {
  if (priority === 'high') return '🔴';
  if (priority === 'medium') return '🟡';
  return '';
}

export default function TipsScreen({ onBack }: Props) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getTips();
      // Sort: unread first, then by date desc
      const sorted = [...data].sort((a, b) => {
        if (!!a.read !== !!b.read) return a.read ? 1 : -1;
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      });
      setTips(sorted);
    } catch (e: any) {
      setError(e?.message || 'Failed to load tips');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const unreadCount = tips.filter(t => !t.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.title}>ACE TIPS</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading tips from ACE…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
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
          {tips.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🤖</Text>
              <Text style={styles.emptyTitle}>No Tips Yet</Text>
              <Text style={styles.emptySub}>ACE will send personalized coaching tips here as you train.</Text>
            </View>
          ) : (
            <>
              {/* Header stats */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statVal}>{tips.length}</Text>
                  <Text style={styles.statLabel}>TOTAL</Text>
                </View>
                {unreadCount > 0 && (
                  <View style={styles.stat}>
                    <Text style={[styles.statVal, { color: COLORS.primary }]}>{unreadCount}</Text>
                    <Text style={styles.statLabel}>UNREAD</Text>
                  </View>
                )}
              </View>

              {/* Tips list */}
              {tips.map((tip, i) => (
                <View key={tip.id ?? i} style={[styles.card, !tip.read && styles.cardUnread]}>
                  {/* Unread indicator */}
                  {!tip.read && <View style={styles.unreadDot} />}

                  <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                      {tip.category && (
                        <View style={[styles.catPill, { borderColor: categoryColor(tip.category) + '40' }]}>
                          <Text style={[styles.catText, { color: categoryColor(tip.category) }]}>
                            {tip.category.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardRight}>
                      {tip.priority && tip.priority !== 'low' && (
                        <Text style={styles.priorityDot}>{priorityDot(tip.priority)}</Text>
                      )}
                      <Text style={styles.timeText}>{formatTime(tip.created_at)}</Text>
                    </View>
                  </View>

                  <Text style={[styles.tipMessage, !tip.read && styles.tipMessageUnread]}>
                    {tip.message}
                  </Text>

                  <View style={styles.aceTag}>
                    <Text style={styles.aceTagText}>— ACE</Text>
                  </View>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 12, letterSpacing: 3, color: COLORS.textSecondary, fontWeight: '700' },
  badge: {
    backgroundColor: COLORS.primary, borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, color: '#000', fontWeight: '800' },
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
  statsRow: { flexDirection: 'row', gap: 32, marginBottom: 20 },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 22, color: COLORS.textPrimary, fontWeight: '800' },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, letterSpacing: 2, fontWeight: '600', marginTop: 2 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.card, borderWidth: 1,
    borderColor: COLORS.border, padding: 16, marginBottom: 10,
    position: 'relative',
  },
  cardUnread: {
    borderColor: 'rgba(201,168,76,0.25)',
    backgroundColor: 'rgba(201,168,76,0.05)',
  },
  unreadDot: {
    position: 'absolute', top: 16, right: 16,
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  cardLeft: {},
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catPill: {
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  catText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  priorityDot: { fontSize: 10 },
  timeText: { fontSize: 11, color: COLORS.textSecondary },
  tipMessage: {
    fontSize: 15, color: COLORS.textSecondary, lineHeight: 24, letterSpacing: 0.2,
  },
  tipMessageUnread: { color: COLORS.textPrimary },
  aceTag: { marginTop: 12, alignItems: 'flex-end' },
  aceTagText: { fontSize: 11, color: COLORS.textSecondary, fontStyle: 'italic', letterSpacing: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, color: COLORS.textPrimary, fontWeight: '600', marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
});
