import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Equipment } from '../data/aceWorkouts';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Equipment'> };

const EQUIPMENT_OPTIONS: { id: Equipment; name: string; icon: string }[] = [
  { id: 'vitruvian', name: 'Vitruvian Trainer+', icon: '⚡' },
  { id: 'dumbbells', name: 'Dumbbells', icon: '🏋️' },
  { id: 'trx', name: 'TRX', icon: '🔗' },
  { id: 'pullup_bar', name: 'Pull-Up Bar', icon: '🔝' },
  { id: 'peloton_tread', name: 'Peloton Treadmill', icon: '🏃' },
  { id: 'peloton_bike', name: 'Peloton Bike', icon: '🚴' },
  { id: 'bodyweight', name: 'Bodyweight Only', icon: '💪' },
];

export default function EquipmentScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<Set<Equipment>>(
    new Set(['vitruvian', 'dumbbells', 'trx', 'pullup_bar'])
  );

  const toggle = (id: Equipment) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.appName}>FERN</Text>
        <Text style={styles.title}>What's in your gym?</Text>
        <Text style={styles.sub}>We'll tailor your workouts to what you have.</Text>

        <View style={styles.grid}>
          {EQUIPMENT_OPTIONS.map(eq => {
            const isOn = selected.has(eq.id);
            return (
              <TouchableOpacity
                key={eq.id}
                style={[styles.card, isOn && styles.cardOn]}
                onPress={() => toggle(eq.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.icon}>{eq.icon}</Text>
                <Text style={[styles.cardName, isOn && styles.cardNameOn]}>{eq.name}</Text>
                {isOn && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.continueBtn, selected.size === 0 && styles.continueBtnDisabled]}
          onPress={() => selected.size > 0 && navigation.replace('Home')}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>LET'S GO →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080A0F' },
  scroll: { padding: 24 },
  appName: { fontSize: 13, letterSpacing: 5, color: '#3DDC84', fontWeight: '700', marginBottom: 24 },
  title: { fontSize: 28, color: '#fff', fontWeight: '700', marginBottom: 8 },
  sub: { fontSize: 15, color: '#64748B', marginBottom: 32, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  card: {
    width: '47%', backgroundColor: '#0F172A',
    borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#1E293B',
    alignItems: 'flex-start',
  },
  cardOn: { borderColor: '#3DDC84', backgroundColor: '#091510' },
  icon: { fontSize: 28, marginBottom: 10 },
  cardName: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  cardNameOn: { color: '#fff' },
  check: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#3DDC84', justifyContent: 'center', alignItems: 'center',
  },
  checkText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  continueBtn: {
    backgroundColor: '#3DDC84', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 2 },
});
