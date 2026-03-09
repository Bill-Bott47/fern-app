import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  StatusBar, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { getTips, Tip } from '../services/fernApi';

const G = '#3DDC84';
const BG = '#080C12';
const CARD = '#0F1520';

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
    recovery: '#60A5FA',
    training: G,
    mindset: '#A78BFA',
    sleep: '#818CF8',
  };
  return category ? (map[category.toLowerCase()] ?? '#555') : '#555';
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
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <View style={s.topBar}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={s.titleRow}>
          <Text style={s.title}>ACE TIPS</Text>
          {unreadCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={G} />
          <Text style={s.loadingText}>Loading tips from ACE…</Text>
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
          {tips.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>🤖</Text>
              <Text style={s.emptyTitle}>No Tips Yet</Text>
              <Text style={s.emptySub}>ACE will send personalized coaching tips here as you train.</Text>
            </View>
          ) : (
            <>
              {/* Header stats */}
              <View style={s.statsRow}>
                <View style={s.stat}>
                  <Text style={s.statVal}>{tips.length}</Text>
                  <Text style={s.statLabel}>TOTAL</Text>
                </View>
                {unreadCount > 0 && (
                  <View style={s.stat}>
                    <Text style={[s.statVal, { color: G }]}>{unreadCount}</Text>
                    <Text style={s.statLabel}>UNREAD</Text>
                  </View>
                )}
              </View>

              {/* Tips list */}
              {tips.map((tip, i) => (
                <View key={tip.id ?? i} style={[s.card, !tip.read && s.cardUnread]}>
                  {/* Unread indicator */}
                  {!tip.read && <View style={s.unreadDot} />}

                  <View style={s.cardTop}>
                    <View style={s.cardLeft}>
                      {tip.category && (
                        <View style={[s.catPill, { borderColor: categoryColor(tip.category) + '40' }]}>
                          <Text style={[s.catText, { color: categoryColor(tip.category) }]}>
                            {tip.category.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={s.cardRight}>
                      {tip.priority && tip.priority !== 'low' && (
                        <Text style={s.priorityDot}>{priorityDot(tip.priority)}</Text>
                      )}
                      <Text style={s.timeText}>{formatTime(tip.created_at)}</Text>
                    </View>
                  </View>

                  <Text style={[s.tipMessage, !tip.read && s.tipMessageUnread]}>
                    {tip.message}
                  </Text>

                  <View style={s.aceTag}>
                    <Text style={s.aceTagText}>— ACE</Text>
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#161616',
  },
  backBtn: { width: 60 },
  backText: { fontSize: 15, color: G, fontWeight: '600' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 11, letterSpacing: 4, color: '#444', fontWeight: '700' },
  badge: {
    backgroundColor: G, borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, color: '#000', fontWeight: '800' },
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
  statsRow: { flexDirection: 'row', gap: 32, marginBottom: 20 },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 22, color: '#fff', fontWeight: '800' },
  statLabel: { fontSize: 9, color: '#4A6078', letterSpacing: 2, fontWeight: '700', marginTop: 2 },
  card: {
    backgroundColor: CARD, borderRadius: 18, borderWidth: 1,
    borderColor: '#1A1A1A', padding: 18, marginBottom: 10,
    position: 'relative',
  },
  cardUnread: {
    borderColor: 'rgba(61,220,132,0.2)',
    backgroundColor: '#0D130F',
  },
  unreadDot: {
    position: 'absolute', top: 18, right: 18,
    width: 7, height: 7, borderRadius: 3.5, backgroundColor: G,
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
  catText: { fontSize: 9, fontWeight: '700', letterSpacing: 2 },
  priorityDot: { fontSize: 10 },
  timeText: { fontSize: 11, color: '#333' },
  tipMessage: {
    fontSize: 15, color: '#888', lineHeight: 24, letterSpacing: 0.2,
  },
  tipMessageUnread: { color: '#CCC' },
  aceTag: { marginTop: 12, alignItems: 'flex-end' },
  aceTagText: { fontSize: 11, color: '#4A6478', fontStyle: 'italic', letterSpacing: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, color: '#fff', fontWeight: '600', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#444', textAlign: 'center', lineHeight: 22 },
});
