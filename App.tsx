import React, { useState, useEffect, useRef } from 'react';

const kgToLbs = (kg: number) => Math.round(kg * 2.205);
const lbs = (kg: number) => `${kgToLbs(kg)} lbs`;
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, BackHandler, Vibration } from 'react-native';
import { startMeasuring, stopMeasuring, MeasurementData } from './src/ble/VitruvianMeasure';
import { setResistance, VitruvianMode } from './src/ble/VitruvianBLE';
import { Device } from 'react-native-ble-plx';
import { ACE_WORKOUTS, getTodaysWorkout, Workout } from './src/data/aceWorkouts';
import ConnectScreen from './src/screens/ConnectScreen';
import WorkoutScreenFile from './src/screens/WorkoutScreen';
import WorkoutHistoryScreen from './src/screens/WorkoutHistoryScreen';
import BiometricsScreen from './src/screens/BiometricsScreen';
import TipsScreen from './src/screens/TipsScreen';

type Screen = 'home' | 'workout' | 'connect' | 'history' | 'biometrics' | 'tips';

export type RootStackParamList = {
  Home: undefined;
  Workout: { workoutId: string };
  Connect: undefined;
  Equipment: undefined;
  History: undefined;
  Biometrics: undefined;
  Tips: undefined;
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [vitruvian, setVitruvian] = useState<Device | null>(null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen !== 'home') { setScreen('home'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [screen]);

  if (screen === 'connect') {
    return <ConnectScreen onConnected={(d) => { setVitruvian(d); setScreen('home'); }} />;
  }
  if (screen === 'workout' && activeWorkout) {
    return <WorkoutScreenFile workout={activeWorkout} onBack={() => setScreen('home')} vitruvian={vitruvian ?? undefined} />;
  }
  if (screen === 'history') {
    return <WorkoutHistoryScreen onBack={() => setScreen('home')} />;
  }
  if (screen === 'biometrics') {
    return <BiometricsScreen onBack={() => setScreen('home')} />;
  }
  if (screen === 'tips') {
    return <TipsScreen onBack={() => setScreen('home')} />;
  }
  return <HomeScreen
    onStart={(w) => { setActiveWorkout(w); setScreen('workout'); }}
    onConnect={() => setScreen('connect')}
    onHistory={() => setScreen('history')}
    onBiometrics={() => setScreen('biometrics')}
    onTips={() => setScreen('tips')}
    vitruvian={vitruvian}
  />;
}

interface HomeScreenProps {
  onStart: (w: Workout) => void;
  onConnect: () => void;
  onHistory: () => void;
  onBiometrics: () => void;
  onTips: () => void;
  vitruvian: any;
}

function HomeScreen({ onStart, onConnect, onHistory, onBiometrics, onTips, vitruvian }: HomeScreenProps) {
  const today = getTodaysWorkout();
  const dayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const DAYS = ['M','T','W','T','F','S','S'];

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080A0F" />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.wordmark}>FERN</Text>
        <Text style={s.date}>{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</Text>

        <View style={s.weekStrip}>
          {DAYS.map((d,i) => (
            <View key={i} style={[s.dayCol, i===dayIdx && s.dayColActive]}>
              <View style={[s.pip, i===dayIdx && s.pipActive]} />
              <Text style={[s.dayLetter, i===dayIdx && s.dayLetterActive]}>{d}</Text>
            </View>
          ))}
        </View>

        {today ? (
          <View style={s.todayCard}>
            <View style={s.todayPill}><Text style={s.todayPillText}>TODAY</Text></View>
            <Text style={s.todayName}>{today.name}</Text>
            <Text style={s.todayFocus}>{today.focus}</Text>
            <View style={s.chips}>
              <View style={s.chip}><Text style={s.chipText}>{today.exercises.length} exercises</Text></View>
              <View style={s.chip}><Text style={s.chipText}>~{today.durationMin ?? 45} min</Text></View>
              <View style={s.chip}><Text style={s.chipText}>Vitruvian</Text></View>
            </View>
            <TouchableOpacity style={s.startBtn} onPress={() => onStart(today)} activeOpacity={0.85}>
              <Text style={s.startBtnText}>Start Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.connectBtn} onPress={onConnect} activeOpacity={0.8}>
              <Text style={s.connectBtnText}>{vitruvian ? '⚡ Vitruvian Connected' : '📡 Connect Vitruvian'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.restCard}>
            <Text style={s.restEmoji}>🌿</Text>
            <Text style={s.restTitle}>Rest Day</Text>
            <Text style={s.restSub}>Recovery is part of the program.</Text>
          </View>
        )}

        <Text style={s.secLabel}>THIS WEEK</Text>
        {ACE_WORKOUTS.map(w => (
          <TouchableOpacity key={w.id} style={[s.schedRow, w.id===today?.id && s.schedRowActive]} onPress={() => onStart(w)} activeOpacity={0.8}>
            <View style={[s.schedBadge, w.id===today?.id && s.schedBadgeActive]}>
              <Text style={[s.schedBadgeText, w.id===today?.id && s.schedBadgeTextActive]}>{w.label.slice(0,3).toUpperCase()}</Text>
            </View>
            <View style={s.schedInfo}>
              <Text style={[s.schedName, w.id===today?.id && s.schedNameActive]}>{w.name}</Text>
              <Text style={s.schedFocus}>{w.focus}</Text>
            </View>
            <Text style={s.schedArrow}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Quick Nav Section */}
        <Text style={[s.secLabel, {marginTop: 24}]}>ACE INTELLIGENCE</Text>
        <View style={s.aceNav}>
          <TouchableOpacity style={s.aceNavBtn} onPress={onBiometrics} activeOpacity={0.8}>
            <Text style={s.aceNavIcon}>📊</Text>
            <Text style={s.aceNavLabel}>Dashboard</Text>
            <Text style={s.aceNavSub}>Biometrics & Compliance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.aceNavBtn} onPress={onHistory} activeOpacity={0.8}>
            <Text style={s.aceNavIcon}>🏋️</Text>
            <Text style={s.aceNavLabel}>History</Text>
            <Text style={s.aceNavSub}>Past Workouts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.aceNavBtn} onPress={onTips} activeOpacity={0.8}>
            <Text style={s.aceNavIcon}>🤖</Text>
            <Text style={s.aceNavLabel}>ACE Tips</Text>
            <Text style={s.aceNavSub}>Coaching Inbox</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Nav Bar */}
      <View style={s.bottomNav}>
        <TouchableOpacity style={[s.navTab, s.navTabActive]} activeOpacity={0.7}>
          <Text style={s.navTabIcon}>🏠</Text>
          <Text style={[s.navTabLabel, s.navTabLabelActive]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navTab} onPress={onHistory} activeOpacity={0.7}>
          <Text style={s.navTabIcon}>📋</Text>
          <Text style={s.navTabLabel}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navTab} onPress={onBiometrics} activeOpacity={0.7}>
          <Text style={s.navTabIcon}>📊</Text>
          <Text style={s.navTabLabel}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navTab} onPress={onTips} activeOpacity={0.7}>
          <Text style={s.navTabIcon}>💬</Text>
          <Text style={s.navTabLabel}>Tips</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function WorkoutScreen({ workout, onBack, vitruvian }: { workout: Workout; onBack: () => void; vitruvian?: any }) {
  const [done, setDone] = useState<Record<string, Set<number>>>({});
  const [practiceDone, setPracticeDone] = useState<Set<string>>(new Set());
  const [measurement, setMeasurement] = useState<MeasurementData | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [weightStatus, setWeightStatus] = useState<Record<string, 'sending'|'set'|'error'>>({});
  const [restSecs, setRestSecs] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(0);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startRest(seconds: number) {
    if (restRef.current) clearInterval(restRef.current);
    setRestTotal(seconds);
    setRestSecs(seconds);
    restRef.current = setInterval(() => {
      setRestSecs(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(restRef.current!);
          Vibration.vibrate([0, 200, 100, 200]);
          setRestSecs(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function skipRest() {
    if (restRef.current) clearInterval(restRef.current);
    setRestSecs(null);
  }

  useEffect(() => () => { if (restRef.current) clearInterval(restRef.current); }, []);

  async function sendWeight(exId: string, kg: number, mode?: VitruvianMode) {
    if (!vitruvian) return;
    setWeightStatus(p => ({...p, [exId]: 'sending'}));
    try {
      await setResistance(vitruvian, kg, mode ?? 'echo-hard');
      setWeightStatus(p => ({...p, [exId]: 'set'}));
    } catch {
      setWeightStatus(p => ({...p, [exId]: 'error'}));
    }
  }

  // Send calibration weight on connect
  useEffect(() => {
    if (!vitruvian) return;
    workout.exercises.forEach(ex => {
      if (ex.vitruvianWeight && !practiceDone.has(ex.id)) {
        sendWeight(ex.id, Math.round(ex.vitruvianWeight * 0.5), ex.vitruvianMode);
      }
    });
  }, [vitruvian]);

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const doneSets = Object.values(done).reduce((a, s) => a + s.size, 0);
  const pct = totalSets > 0 ? doneSets / totalSets : 0;
  const isConnected = !!vitruvian;

  useEffect(() => {
    if (vitruvian) {
      setMeasuring(true);
      startMeasuring(
        vitruvian,
        (data) => setMeasurement(data),
        (err) => console.log('Measure error:', err)
      );
    }
    return () => { stopMeasuring(); };
  }, [vitruvian]);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080A0F" />
      <View style={s.wkTopBar}>
        <TouchableOpacity onPress={onBack}><Text style={s.backBtn}>‹ Back</Text></TouchableOpacity>
        <View style={s.wkCounter}>
          <Text style={s.wkFrac}>{doneSets}<Text style={s.wkFracOf}>/{totalSets}</Text></Text>
          <Text style={s.wkFracLabel}>SETS DONE</Text>
        </View>

      </View>
      <View style={s.progressBar}><View style={[s.progressFill, {width:`${pct*100}%` as any}]} /></View>

      {/* Rest timer banner */}
      {restSecs !== null && (
        <View style={s.restBanner}>
          <View style={s.restLeft}>
            <Text style={s.restLabel}>REST</Text>
            <Text style={s.restTime}>{restSecs}s</Text>
          </View>
          <View style={s.restBarWrap}>
            <View style={[s.restBarFill, {width: `${((restSecs / restTotal) * 100)}%` as any}]} />
          </View>
          <TouchableOpacity style={s.restSkip} onPress={skipRest}>
            <Text style={s.restSkipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.wkTitle}>{workout.name}</Text>
        <Text style={s.wkFocus}>{workout.focus}</Text>

        {/* Vitruvian connection banner */}
        <View style={[s.connBanner, isConnected ? s.connBannerOn : s.connBannerOff]}>
          <Text style={[s.connBannerText, isConnected ? s.connBannerTextOn : s.connBannerTextOff]}>
            {isConnected ? '⚡ Vitruvian Connected' : '○  Vitruvian Not Connected'}
          </Text>
        </View>

        {/* Measurement hidden from workout screen — data flows to set tracking only */}

        {workout.exercises.map((ex, idx) => {
          const exDoneSet = done[ex.id] || new Set<number>();
          const exDoneCount = exDoneSet.size;
          const isPracticeDone = practiceDone.has(ex.id);
          const hasVitruvian = !!ex.vitruvianWeight;
          const practiceWeight = ex.vitruvianWeight ? Math.round(ex.vitruvianWeight * 0.5) : null;
          const complete = exDoneCount >= ex.sets && (!hasVitruvian || isPracticeDone);
          return (
            <View key={ex.id} style={[s.exCard, complete && s.exCardDone]}>
              <View style={s.exRow}>
                <Text style={[s.exIdx, complete && s.exIdxDone]}>{String(idx+1).padStart(2,'0')}</Text>
                <View style={s.exInfo}>
                  <Text style={[s.exName, complete && s.exNameDone]}>{ex.name}</Text>
                  <Text style={s.exSpec}>{ex.sets} sets · {ex.reps} reps · {ex.rest}s rest</Text>
                  {ex.vitruvianWeight && <Text style={s.exVit}>⚡ {lbs(ex.vitruvianWeight)} · {ex.vitruvianMode === 'echo-harder' ? 'Echo Hard+' : ex.vitruvianMode === 'echo-hard' ? 'Echo' : ex.vitruvianMode === 'echo-hardest' ? 'Echo Max' : 'Standard'}</Text>}
                  {ex.coachingNote && <Text style={s.exNote}>{ex.coachingNote}</Text>}
                </View>
              </View>
              {/* VITRUVIAN EXERCISE FLOW */}
              {hasVitruvian ? (
                isPracticeDone ? (
                  /* Phase 2: Working sets */
                  <View style={s.phaseBlock}>
                    <View style={s.phaseHeader}>
                      <View style={s.phasePill}><Text style={s.phasePillText}>STEP 2 — WORKING SETS · {lbs(ex.vitruvianWeight)}</Text></View>
                    </View>
                    <View style={{marginBottom:10}}>
                      {weightStatus[ex.id + '_work'] === 'sending' && <Text style={s.calStatusSending}>⟳  Setting machine to {lbs(ex.vitruvianWeight)}…</Text>}
                      {weightStatus[ex.id + '_work'] === 'set'     && <Text style={s.calStatusSet}>✅  Machine at {lbs(ex.vitruvianWeight)} — go!</Text>}
                      {weightStatus[ex.id + '_work'] === 'error'   && <Text style={s.calStatusErr}>⚠️  Couldn't set weight — check connection</Text>}
                    </View>
                    <Text style={s.setsLabel}>TAP EACH SET WHEN DONE</Text>
                  <View style={s.setsRowInner}>
                      {Array.from({length: ex.sets}).map((_,si) => {
                        const isDone = exDoneSet.has(si);
                        return (
                          <TouchableOpacity
                            key={si}
                            style={[s.setBtn, isDone && s.setBtnDone]}
                            onPress={() => {
                              setDone(prev => {
                                const cur = new Set(prev[ex.id] || []);
                                if (cur.has(si)) { cur.delete(si); } else { cur.add(si); startRest(ex.rest); }
                                return {...prev, [ex.id]: cur};
                              });
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={[s.setBtnText, isDone && s.setBtnTextDone]}>{isDone ? '✓' : si+1}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  /* Phase 1: Calibration */
                  <View style={s.phaseBlock}>
                    {/* Calibration weight sent via useEffect in parent */}
                    {/* Weight status */}
                    <View style={s.calStatusRow}>
                      {weightStatus[ex.id] === 'sending' && <Text style={s.calStatusSending}>⟳  Setting machine to {practiceWeight ? lbs(practiceWeight) : '--'}…</Text>}
                      {weightStatus[ex.id] === 'set'     && <Text style={s.calStatusSet}>✅  Machine set to {practiceWeight ? lbs(practiceWeight) : '--'} — ready</Text>}
                      {weightStatus[ex.id] === 'error'   && <Text style={s.calStatusErr}>⚠️  Couldn't set weight — check connection</Text>}
                      {!weightStatus[ex.id]              && <Text style={s.calStatusSending}>Connecting to machine…</Text>}
                    </View>
                    <View style={s.calHeader}>
                      <Text style={s.calStep}>STEP 1 OF 2 — CALIBRATION</Text>
                      <Text style={s.calInstr}>Do 3 reps now at {practiceWeight ? lbs(practiceWeight) : '--'} to feel the range of motion</Text>
                    </View>
                    <TouchableOpacity
                      style={s.calBtn}
                      onPress={() => {
                        setPracticeDone(prev => { const n = new Set(prev); n.add(ex.id); return n; });
                        if (ex.vitruvianWeight) sendWeight(ex.id + '_work', ex.vitruvianWeight, ex.vitruvianMode);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={s.calBtnText}>Done — Load {lbs(ex.vitruvianWeight)} Working Weight →</Text>
                    </TouchableOpacity>
                  </View>
                )
              ) : (
                /* Non-Vitruvian exercise: clear set tracking */
                <View style={s.bodyweightBlock}>
                  <View style={s.bodyweightMeta}>
                    <Text style={s.bodyweightReps}>{ex.reps} reps</Text>
                    <Text style={s.bodyweightSets}>{ex.sets} sets · {ex.rest}s rest</Text>
                  </View>
                  <Text style={s.setsLabel}>TAP EACH SET WHEN DONE</Text>
                  <View style={s.setsRowInner}>
                    {Array.from({length: ex.sets}).map((_,si) => {
                      const isDone = exDoneSet.has(si);
                      return (
                        <TouchableOpacity
                          key={si}
                          style={[s.setBtn, isDone && s.setBtnDone]}
                          onPress={() => {
                            setDone(prev => {
                              const cur = new Set(prev[ex.id] || []);
                              if (cur.has(si)) { cur.delete(si); } else { cur.add(si); startRest(ex.rest); }
                              return {...prev, [ex.id]: cur};
                            });
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[s.setBtnText, isDone && s.setBtnTextDone]}>{isDone ? '✓' : `Set ${si+1}`}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {doneSets === totalSets && totalSets > 0 && (
          <TouchableOpacity style={s.finishBtn} onPress={onBack}>
            <Text style={s.finishBtnText}>🌿 Workout Complete</Text>
          </TouchableOpacity>
        )}
        <View style={{height:40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const G = '#3DDC84';
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#080A0F'},
  scroll:{padding:22},
  wordmark:{fontSize:11,letterSpacing:6,color:G,fontWeight:'700',marginBottom:6},
  date:{fontSize:22,color:'#fff',fontWeight:'300',marginBottom:22},
  weekStrip:{flexDirection:'row',justifyContent:'space-between',backgroundColor:'#111',borderRadius:16,padding:16,marginBottom:22,borderWidth:1,borderColor:'#1A1A1A'},
  dayCol:{alignItems:'center',gap:5},
  dayColActive:{},
  pip:{width:5,height:5,borderRadius:2.5,backgroundColor:'#2A2A2A'},
  pipActive:{backgroundColor:G,width:14},
  dayLetter:{fontSize:11,color:'#333',fontWeight:'700'},
  dayLetterActive:{color:G},
  todayCard:{backgroundColor:'#141414',borderRadius:22,borderWidth:1,borderColor:'#1E2E23',padding:22,marginBottom:24},
  todayPill:{alignSelf:'flex-start',backgroundColor:'rgba(61,220,132,0.1)',borderWidth:1,borderColor:'rgba(61,220,132,0.2)',borderRadius:20,paddingHorizontal:12,paddingVertical:5,marginBottom:12},
  todayPillText:{fontSize:10,color:G,fontWeight:'700',letterSpacing:2},
  todayName:{fontSize:32,color:'#fff',fontWeight:'900',letterSpacing:-1,marginBottom:4},
  todayFocus:{fontSize:13,color:'#444',marginBottom:16},
  chips:{flexDirection:'row',gap:8,marginBottom:20},
  chip:{backgroundColor:'#1A1A1A',borderWidth:1,borderColor:'#252525',borderRadius:20,paddingHorizontal:12,paddingVertical:5},
  chipText:{fontSize:11,color:'#555',fontWeight:'600'},
  startBtn:{backgroundColor:G,borderRadius:14,paddingVertical:17,alignItems:'center',shadowColor:G,shadowOffset:{width:0,height:6},shadowOpacity:0.3,shadowRadius:12,marginBottom:10},
  startBtnText:{color:'#000',fontWeight:'800',fontSize:15},
  connectBtn:{backgroundColor:'#141414',borderRadius:14,paddingVertical:13,alignItems:'center',borderWidth:1,borderColor:'#252525'},
  connectBtnText:{color:'#444',fontWeight:'600',fontSize:13},
  restCard:{backgroundColor:'#111',borderRadius:20,padding:40,alignItems:'center',marginBottom:24},
  restEmoji:{fontSize:40,marginBottom:12},
  restTitle:{fontSize:22,color:'#fff',fontWeight:'600',marginBottom:8},
  restSub:{fontSize:14,color:'#444',textAlign:'center'},
  secLabel:{fontSize:10,letterSpacing:4,color:'#2A2A2A',fontWeight:'700',marginBottom:14},
  schedRow:{flexDirection:'row',alignItems:'center',gap:14,paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#131313'},
  schedRowActive:{},
  schedBadge:{width:44,height:44,borderRadius:13,backgroundColor:'#111',borderWidth:1,borderColor:'#1A1A1A',justifyContent:'center',alignItems:'center'},
  schedBadgeActive:{backgroundColor:'rgba(61,220,132,0.1)',borderColor:'rgba(61,220,132,0.3)'},
  schedBadgeText:{fontSize:10,color:'#333',fontWeight:'800'},
  schedBadgeTextActive:{color:G},
  schedInfo:{flex:1},
  schedName:{fontSize:14,color:'#CCC',fontWeight:'600',marginBottom:2},
  schedNameActive:{color:'#fff'},
  schedFocus:{fontSize:11,color:'#333'},
  schedArrow:{fontSize:18,color:'#222'},
  wkTopBar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:22,paddingTop:20,paddingBottom:12},
  backBtn:{fontSize:15,color:G,fontWeight:'600'},
  wkCounter:{alignItems:'flex-end'},
  wkFrac:{fontSize:22,color:'#fff',fontWeight:'800'},
  wkFracOf:{fontSize:14,color:'#2A2A2A',fontWeight:'500'},
  wkFracLabel:{fontSize:9,color:'#282828',letterSpacing:2,fontWeight:'700'},
  progressBar:{height:2,backgroundColor:'#161616',marginHorizontal:22,marginBottom:20},
  progressFill:{height:2,backgroundColor:G,shadowColor:G,shadowOffset:{width:0,height:0},shadowOpacity:0.8,shadowRadius:6},
  wkTitle:{fontSize:28,color:'#fff',fontWeight:'900',letterSpacing:-1,marginBottom:4},
  wkFocus:{fontSize:13,color:'#333',marginBottom:20},
  exCard:{backgroundColor:'#111',borderRadius:18,borderWidth:1,borderColor:'#1A1A1A',padding:17,marginBottom:10},
  exCardDone:{borderColor:'rgba(61,220,132,0.2)',backgroundColor:'#0F140F'},
  exRow:{flexDirection:'row',gap:12,marginBottom:13},
  exIdx:{fontSize:10,color:'#252525',fontWeight:'800',width:20,paddingTop:3},
  exIdxDone:{color:'rgba(61,220,132,0.3)'},
  exInfo:{flex:1},
  exName:{fontSize:16,color:'#E0E0E0',fontWeight:'700',marginBottom:3},
  exNameDone:{color:G},
  exSpec:{fontSize:11,color:'#555',marginBottom:3},
  exVit:{fontSize:11,color:'rgba(61,220,132,0.5)',fontWeight:'600'},
  exNote:{fontSize:11,color:'#2A2A2A',fontStyle:'italic',marginTop:4},
  restBanner:{flexDirection:'row',alignItems:'center',backgroundColor:'#0A1A0F',borderBottomWidth:1,borderBottomColor:'rgba(61,220,132,0.15)',paddingHorizontal:22,paddingVertical:14,gap:12},
  restLeft:{width:52,alignItems:'center'},
  restLabel:{fontSize:8,color:'rgba(61,220,132,0.5)',letterSpacing:3,fontWeight:'800'},
  restTime:{fontSize:26,color:G,fontWeight:'900',lineHeight:30},
  restBarWrap:{flex:1,height:3,backgroundColor:'#1A1A1A',borderRadius:2,overflow:'hidden'},
  restBarFill:{height:3,backgroundColor:G,borderRadius:2},
  restSkip:{paddingHorizontal:14,paddingVertical:8,backgroundColor:'#1A1A1A',borderRadius:10,borderWidth:1,borderColor:'#252525'},
  restSkipText:{fontSize:11,color:'#444',fontWeight:'700'},
  measureCard:{backgroundColor:'#080F0A',borderRadius:18,borderWidth:1,borderColor:'rgba(61,220,132,0.2)',padding:20,marginBottom:20,alignItems:'center'},
  measureLabel:{fontSize:9,letterSpacing:4,color:'rgba(61,220,132,0.4)',fontWeight:'700',marginBottom:8},
  measureRow:{flexDirection:'row',alignItems:'flex-end',gap:6},
  measureValue:{fontSize:56,color:G,fontWeight:'900',letterSpacing:-2,lineHeight:60},
  measureUnit:{fontSize:18,color:'rgba(61,220,132,0.5)',fontWeight:'600',paddingBottom:6},
  measureRaw:{fontSize:9,color:'#1A1A1A',fontFamily:'monospace',marginTop:8},
  measureCharUuid:{fontSize:9,color:'#1A1A1A',fontFamily:'monospace',marginTop:2},
  connBanner:{borderRadius:12,paddingVertical:10,paddingHorizontal:14,marginBottom:20,borderWidth:1,flexDirection:'row',alignItems:'center'},
  connBannerOn:{backgroundColor:'rgba(61,220,132,0.08)',borderColor:'rgba(61,220,132,0.25)'},
  connBannerOff:{backgroundColor:'#111',borderColor:'#1A1A1A'},
  connBannerText:{fontSize:12,fontWeight:'700'},
  connBannerTextOn:{color:G},
  connBannerTextOff:{color:'#2A2A2A'},
  phaseBlock:{marginTop:4},
  phaseHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10},
  phasePill:{backgroundColor:'rgba(61,220,132,0.1)',borderRadius:20,paddingHorizontal:10,paddingVertical:4,borderWidth:1,borderColor:'rgba(61,220,132,0.2)'},
  phasePillText:{fontSize:9,color:G,fontWeight:'800',letterSpacing:2},
  liveKg:{fontSize:12,color:'rgba(61,220,132,0.6)',fontWeight:'700'},
  calStatusRow:{marginBottom:10},
  calStatusSending:{fontSize:12,color:'#555',fontStyle:'italic'},
  calStatusSet:{fontSize:12,color:G,fontWeight:'700'},
  calStatusErr:{fontSize:12,color:'#FF6B6B',fontWeight:'700'},
  calHeader:{marginBottom:12},
  calStep:{fontSize:9,color:G,letterSpacing:3,fontWeight:'800',marginBottom:6},
  calInstr:{fontSize:14,color:'#888',lineHeight:20},
  calBtn:{backgroundColor:'rgba(61,220,132,0.12)',borderRadius:12,paddingVertical:16,alignItems:'center',borderWidth:1,borderColor:'rgba(61,220,132,0.3)',marginTop:4},
  calBtnText:{fontSize:14,color:G,fontWeight:'800'},
  setsLabel:{fontSize:9,color:'#333',letterSpacing:3,fontWeight:'700',marginBottom:10},
  bodyweightBlock:{marginTop:8},
  bodyweightMeta:{marginBottom:12},
  bodyweightReps:{fontSize:28,color:'#fff',fontWeight:'900',letterSpacing:-1},
  bodyweightSets:{fontSize:12,color:'#444',marginTop:2},
  setsRowInner:{flexDirection:'row',gap:8,flexWrap:'wrap'},
  setsRow:{paddingLeft:32},
  setBtn:{height:44,minWidth:64,paddingHorizontal:12,borderRadius:12,backgroundColor:'#1C1C1C',borderWidth:1,borderColor:'#2E2E2E',justifyContent:'center',alignItems:'center'},
  setBtnDone:{backgroundColor:G,borderWidth:0},
  setBtnNext:{borderColor:'rgba(61,220,132,0.4)'},
  setBtnText:{fontSize:12,color:'#666',fontWeight:'700'},
  setBtnTextDone:{color:'#000'},
  finishBtn:{backgroundColor:G,borderRadius:16,paddingVertical:18,alignItems:'center',marginTop:8},
  finishBtnText:{color:'#000',fontSize:16,fontWeight:'800'},
  // ACE Quick Nav cards
  aceNav:{flexDirection:'row',gap:10,marginBottom:12},
  aceNavBtn:{flex:1,backgroundColor:'#111',borderRadius:16,borderWidth:1,borderColor:'#1A1A1A',padding:14,alignItems:'center',gap:6},
  aceNavIcon:{fontSize:22},
  aceNavLabel:{fontSize:12,color:'#fff',fontWeight:'700'},
  aceNavSub:{fontSize:9,color:'#333',textAlign:'center'},
  // Bottom nav bar
  bottomNav:{flexDirection:'row',backgroundColor:'#0D0D0D',borderTopWidth:1,borderTopColor:'#1A1A1A',paddingBottom:12,paddingTop:8},
  navTab:{flex:1,alignItems:'center',gap:3,paddingVertical:6},
  navTabActive:{},
  navTabIcon:{fontSize:20},
  navTabLabel:{fontSize:10,color:'#444',fontWeight:'600'},
  navTabLabelActive:{color:G},
});
