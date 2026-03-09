import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, FlatList, SafeAreaView, StatusBar, PermissionsAndroid, Platform
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { connectToVitruvian } from '../ble/VitruvianBLE';

const G = '#3DDC84';
const manager = new BleManager();

// From Project Phoenix source: device name starts with "Vee" or matches "Vitruvian*"
const VITRUVIAN_PATTERNS = ['vitruvian', 'vee'];
const isVitruvian = (d: Device) => {
  const name = (d.name || d.localName || '').toLowerCase();
  return VITRUVIAN_PATTERNS.some(p => name.startsWith(p) || name.includes('vitruvian'));
};

export default function ConnectScreen({ onConnected }: { onConnected: (device: Device) => void }) {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [status, setStatus] = useState('');
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectedId, setConnectedId] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const found = useRef<Map<string, Device>>(new Map());

  useEffect(() => () => { manager.stopDeviceScan(); }, []);

  async function requestPermissions() {
    if (Platform.OS !== 'android') return true;
    const res = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    return Object.values(res).every(v => v === PermissionsAndroid.RESULTS.GRANTED);
  }

  async function startScan() {
    const ok = await requestPermissions();
    if (!ok) { setStatus('Bluetooth permission denied'); return; }
    found.current.clear();
    setDevices([]);
    setStatus('');
    setScanning(true);
    manager.startDeviceScan(null, { allowDuplicates: false }, (err, device) => {
      if (err) { setStatus(`Error: ${err.message}`); setScanning(false); return; }
      if (!device) return;
      if (!found.current.has(device.id)) {
        found.current.set(device.id, device);
        setDevices(Array.from(found.current.values())
          .sort((a, b) => (isVitruvian(b) ? 1 : 0) - (isVitruvian(a) ? 1 : 0)));
      }
    });
    setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);
      setStatus(`Found ${found.current.size} devices`);
    }, 20000);
  }

  async function connectDevice(device: Device) {
    setConnecting(device.id);
    setStatus(`Connecting to ${device.name || device.id}…`);
    try {
      const conn = await connectToVitruvian(device);
      const svcs = await conn.services();
      const result: any[] = [];
      for (const svc of svcs) {
        const chars = await svc.characteristics();
        result.push({
          uuid: svc.uuid,
          characteristics: chars.map(c => ({
            uuid: c.uuid,
            isReadable: c.isReadable,
            isWritable: c.isWritableWithResponse || c.isWritableWithoutResponse,
            isNotifiable: c.isNotifiable,
          })),
        });
      }
      setServices(result);
      setConnectedId(conn.id);
      setConnecting(null);
      setStatus(`✅ Connected — ${svcs.length} services`);
      onConnected(conn);
    } catch (e: any) {
      setStatus(`Failed: ${e.message}`);
      setConnecting(null);
    }
  }

  const namedDevices = devices.filter(d => d.name || d.localName);
  const unnamedDevices = devices.filter(d => !d.name && !d.localName);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080A0F" />
      <View style={s.header}>
        <Text style={s.wordmark}>FERN</Text>
        <Text style={s.title}>Connect Vitruvian</Text>
        {status ? <Text style={s.statusText}>{status}</Text> : null}
      </View>

      <TouchableOpacity style={[s.scanBtn, scanning && s.scanBtnActive]} onPress={startScan} disabled={scanning}>
        {scanning
          ? <><ActivityIndicator color="#000" size="small" style={{marginRight:8}} /><Text style={s.scanBtnText}>Scanning…</Text></>
          : <Text style={s.scanBtnText}>⟳  Scan for Devices</Text>
        }
      </TouchableOpacity>

      <FlatList
        data={[...namedDevices, ...unnamedDevices]}
        keyExtractor={d => d.id}
        contentContainerStyle={s.list}
        ListHeaderComponent={namedDevices.length > 0 ? (
          <Text style={s.sectionLabel}>NEARBY DEVICES ({namedDevices.length})</Text>
        ) : null}
        ListEmptyComponent={
          <Text style={s.empty}>{scanning ? 'Looking for devices…' : 'Tap Scan to find your Vitruvian\n\nMake sure the Vitruvian is powered on.'}</Text>
        }
        renderItem={({ item: d }) => {
          const vit = isVitruvian(d);
          const name = d.name || d.localName || 'Unknown';
          const isConn = connectedId === d.id;
          const isConnecting = connecting === d.id;
          return (
            <TouchableOpacity
              style={[s.deviceRow, vit && s.deviceRowVit, isConn && s.deviceRowConn]}
              onPress={() => connectDevice(d)}
              disabled={!!connecting}
              activeOpacity={0.8}
            >
              <View style={s.deviceLeft}>
                <Text style={[s.deviceName, vit && { color: G }, isConn && { color: G }]}>{name}</Text>
                <Text style={s.deviceSub}>{d.id} · {d.rssi ?? '?'} dBm</Text>
              </View>
              <View style={s.deviceRight}>
                {vit && !isConn && <View style={s.vitPill}><Text style={s.vitPillText}>VITRUVIAN</Text></View>}
                {isConn && <Text style={s.connCheck}>✓</Text>}
                {isConnecting && <ActivityIndicator color={G} size="small" />}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* GATT dump for reverse engineering */}
      {services.length > 0 && (
        <View style={s.gattSection}>
          <Text style={s.sectionLabel}>GATT SERVICES ({services.length})</Text>
          {services.map(svc => (
            <View key={svc.uuid} style={s.svcCard}>
              <Text style={s.svcUuid}>{svc.uuid}</Text>
              {svc.characteristics.map((c: any) => (
                <View key={c.uuid} style={s.charRow}>
                  <Text style={s.charUuid} numberOfLines={1}>{c.uuid}</Text>
                  <Text style={s.charFlags}>{c.isReadable?'R ':''}{c.isWritable?'W ':''}{c.isNotifiable?'N':''}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C12' },
  header: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 16 },
  wordmark: { fontSize: 11, letterSpacing: 6, color: G, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 26, color: '#fff', fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  statusText: { fontSize: 13, color: '#555', marginTop: 4 },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: G, borderRadius: 14, paddingVertical: 16,
    marginHorizontal: 22, marginBottom: 20,
  },
  scanBtnActive: { opacity: 0.7 },
  scanBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
  list: { paddingHorizontal: 22, paddingBottom: 40 },
  sectionLabel: { fontSize: 10, letterSpacing: 4, color: '#4A6078', fontWeight: '700', marginBottom: 12 },
  empty: { color: '#4A6078', fontSize: 14, textAlign: 'center', marginTop: 40, lineHeight: 24 },
  deviceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#1A1A1A',
  },
  deviceRowVit: { borderColor: 'rgba(61,220,132,0.3)', backgroundColor: '#0F140F' },
  deviceRowConn: { borderColor: G },
  deviceLeft: { flex: 1 },
  deviceName: { fontSize: 15, color: '#DDD', fontWeight: '600', marginBottom: 2 },
  deviceSub: { fontSize: 10, color: '#4D6478', fontFamily: 'monospace' },
  deviceRight: { alignItems: 'flex-end', marginLeft: 8 },
  vitPill: { backgroundColor: 'rgba(61,220,132,0.1)', borderWidth: 1, borderColor: 'rgba(61,220,132,0.3)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  vitPillText: { fontSize: 9, color: G, fontWeight: '700', letterSpacing: 1 },
  connCheck: { fontSize: 20, color: G, fontWeight: '800' },
  gattSection: { padding: 22 },
  svcCard: { backgroundColor: '#111', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1A1A1A' },
  svcUuid: { fontSize: 10, color: G, fontWeight: '700', marginBottom: 6, fontFamily: 'monospace' },
  charRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  charUuid: { fontSize: 9, color: '#4D6478', flex: 1, fontFamily: 'monospace' },
  charFlags: { fontSize: 9, color: '#3DDC84', fontWeight: '700', width: 36, textAlign: 'right' },
});
