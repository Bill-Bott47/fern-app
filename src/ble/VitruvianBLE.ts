/**
 * VitruvianBLE.ts
 * Full BLE protocol for Vitruvian Trainer+
 * Protocol sourced from Project Phoenix (github.com/9thLevelSoftware/VitruvianProjectPhoenix)
 */

import { BleManager, Device, State } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

export const bleManager = new BleManager();

// Service & Characteristic UUIDs (from Project Phoenix / BleConstants.kt)
export const NUS_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const NUS_RX_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // Write commands here
export const SAMPLE_CHAR_UUID = '90e991a6-c548-44ed-969b-eb541014eae3'; // Read: 28-byte sample (load, pos, vel)
export const REPS_CHAR_UUID   = '8308f2a6-0875-4a94-a86f-5c5c5e1b068a'; // Notify: rep events
export const MODE_CHAR_UUID   = '67d0dae0-5bfc-4ea2-acc9-ac784dee7f29'; // Notify: mode changes

// Device name: broadcasts as "Vee..." (not "Vitruvian")
const VITRUVIAN_PATTERNS = ['vitruvian', 'vee'];

export function isVitruvian(d: Device): boolean {
  const name = (d.name || d.localName || '').toLowerCase();
  return VITRUVIAN_PATTERNS.some(p => name.startsWith(p) || name.includes('vitruvian'));
}

export async function requestBLEPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    return Object.values(granted).every(v => v === PermissionsAndroid.RESULTS.GRANTED);
  } catch { return false; }
}

export async function connectToVitruvian(device: Device): Promise<Device> {
  const connected = await device.connect({ timeout: 15000 });
  await connected.discoverAllServicesAndCharacteristics();
  // CRITICAL: Negotiate higher MTU for 96-byte command frames
  // Default BLE MTU is 23 bytes (20 usable) — Vitruvian needs 96+
  try {
    await connected.requestMTU(247);
    console.log('MTU negotiated to 247');
  } catch (e) {
    console.log('MTU negotiation failed, commands may be truncated:', e);
  }
  return connected;
}

// ── PROTOCOL BUILDERS (ported from ProtocolBuilder.kt) ──────────────────────
// NOTE: buildInitCommand (0x0A) and buildInitPreset (0x11) are DEPRECATED.
// Project Phoenix confirmed: official app does NOT use 0x0A handshake.
// Send ONLY buildProgramParams directly.

/** Old School mode profile (32 bytes) — from getModeProfile(ProgramMode.OldSchool) */
function buildOldSchoolProfile(): Uint8Array {
  const buf = new ArrayBuffer(32);
  const dv = new DataView(buf);
  dv.setInt16(0x00, 0, true);
  dv.setInt16(0x02, 20, true);
  dv.setFloat32(0x04, 3.0, true);
  dv.setInt16(0x08, 75, true);
  dv.setInt16(0x0a, 600, true);
  dv.setFloat32(0x0c, 50.0, true);
  dv.setInt16(0x10, -1300, true);
  dv.setInt16(0x12, -1200, true);
  dv.setFloat32(0x14, 100.0, true);
  dv.setInt16(0x18, -260, true);
  dv.setInt16(0x1a, -110, true);
  dv.setFloat32(0x1c, 0.0, true);
  return new Uint8Array(buf);
}

/**
 * Step 3: 96-byte program parameters frame (command 0x04)
 * Sets workout weight, reps, and mode.
 * Weight offsets: 0x54 = effectiveKg (weight + 10), 0x58 = totalWeightKg
 */
export function buildProgramParams(weightKg: number, reps = 0xFF): Uint8Array {
  const frame = new Uint8Array(96).fill(0);
  const dv = new DataView(frame.buffer);

  // Header: command 0x04
  frame[0x00] = 0x04;
  frame[0x01] = 0x00;
  frame[0x02] = 0x00;
  frame[0x03] = 0x00;

  // Reps: 0xFF = unlimited
  frame[0x04] = reps & 0xFF;
  frame[0x05] = 0x03;
  frame[0x06] = 0x03;
  frame[0x07] = 0x00;

  // Constant floats
  dv.setFloat32(0x08, 5.0, true);
  dv.setFloat32(0x0c, 5.0, true);
  dv.setFloat32(0x1c, 5.0, true);

  // Constant fields from working capture
  frame[0x14] = 0xFA; frame[0x15] = 0x00;
  frame[0x16] = 0xFA; frame[0x17] = 0x00;
  frame[0x18] = 0xC8; frame[0x19] = 0x00;
  frame[0x1a] = 0x1E; frame[0x1b] = 0x00;
  frame[0x24] = 0xFA; frame[0x25] = 0x00;
  frame[0x26] = 0xFA; frame[0x27] = 0x00;
  frame[0x28] = 0xC8; frame[0x29] = 0x00;
  frame[0x2a] = 0x1E; frame[0x2b] = 0x00;
  frame[0x2c] = 0xFA; frame[0x2d] = 0x00;
  frame[0x2e] = 0x50; frame[0x2f] = 0x00;

  // Old School mode profile at 0x30-0x4F (32 bytes)
  const profile = buildOldSchoolProfile();
  frame.set(profile, 0x30);

  // Weight fields — send exact weight requested (no +10 offset)
  dv.setFloat32(0x54, weightKg, true);
  dv.setFloat32(0x58, weightKg, true);
  dv.setFloat32(0x5c, 0.0, true); // no progression

  return frame;
}

/** Convert Uint8Array to base64 for react-native-ble-plx */
function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/** Write bytes to the NUS RX characteristic */
async function writeCommand(device: Device, bytes: Uint8Array): Promise<void> {
  await device.writeCharacteristicWithoutResponseForService(
    NUS_SERVICE_UUID,
    NUS_RX_CHAR_UUID,
    toBase64(bytes)
  );
}

/**
 * Echo mode levels — ACE prescribes per exercise
 * HARD = standard (gain 1.0), HARDER = heavy compounds (gain 1.25),
 * HARDEST = advanced (gain 1.67), EPIC = beast (gain 3.33)
 */
export type EchoLevel = 'HARD' | 'HARDER' | 'HARDEST' | 'EPIC';

interface EchoParams {
  eccentricPct: number;
  concentricPct: number;
  smoothing: number;
  gain: number;
  cap: number;
  floor: number;
  negLimit: number;
}

function getEchoParams(level: EchoLevel, eccentricPct = 75): EchoParams {
  const base: EchoParams = {
    eccentricPct,
    concentricPct: 50,
    smoothing: 0.1,
    floor: 0.0,
    negLimit: -100.0,
    gain: 1.0,
    cap: 50.0,
  };
  switch (level) {
    case 'HARD':    return { ...base, gain: 1.0,   cap: 50.0 };
    case 'HARDER':  return { ...base, gain: 1.25,  cap: 40.0 };
    case 'HARDEST': return { ...base, gain: 1.667, cap: 30.0 };
    case 'EPIC':    return { ...base, gain: 3.333, cap: 15.0 };
  }
}

/**
 * Build 32-byte Echo control frame (command 0x4E)
 * Eccentric overload mode — machine increases resistance during lowering phase
 */
export function buildEchoControl(
  level: EchoLevel = 'HARD',
  warmupReps = 3,
  targetReps = 0xFF,
  eccentricPct = 75
): Uint8Array {
  const frame = new Uint8Array(32).fill(0);
  const dv = new DataView(frame.buffer);
  const p = getEchoParams(level, eccentricPct);

  // Command 0x4E
  dv.setUint32(0x00, 0x0000004E, true);
  frame[0x04] = warmupReps & 0xFF;
  frame[0x05] = targetReps & 0xFF; // 0xFF = unlimited (Just Lift)
  dv.setUint16(0x06, 0, true); // reserved
  dv.setUint16(0x08, p.eccentricPct, true);
  dv.setUint16(0x0a, p.concentricPct, true);
  dv.setFloat32(0x0c, p.smoothing, true);
  dv.setFloat32(0x10, p.gain, true);
  dv.setFloat32(0x14, p.cap, true);
  dv.setFloat32(0x18, p.floor, true);
  dv.setFloat32(0x1c, p.negLimit, true);

  return frame;
}

export type VitruvianMode = 'echo-hard' | 'echo-harder' | 'echo-hardest' | 'old-school';

/**
 * Set resistance on the Vitruvian.
 * Defaults to Echo HARD (standard eccentric overload).
 * ACE prescribes mode per exercise via vitruvianMode field.
 */
export async function setResistance(
  device: Device,
  kg: number,
  mode: VitruvianMode = 'echo-hard'
): Promise<void> {
  if (mode === 'old-school') {
    // Old School: send exact weight
    const frame = buildProgramParams(kg);
    await writeCommand(device, frame);
  } else {
    // Echo modes: send difficulty level, machine auto-adjusts resistance
    const levelMap: Record<string, EchoLevel> = {
      'echo-hard': 'HARD',
      'echo-harder': 'HARDER',
      'echo-hardest': 'HARDEST',
    };
    const level = levelMap[mode] || 'HARD';
    const frame = buildEchoControl(level);
    await writeCommand(device, frame);
  }
}

export async function stopMachine(device: Device): Promise<void> {
  // 0x05 = stop command (NOT 0x50 which is official app soft-stop)
  await writeCommand(device, new Uint8Array([0x05, 0x00, 0x00, 0x00]));
}

// ── SAMPLE PARSING ───────────────────────────────────────────────────────────

export type VitruvianSample = {
  loadA: number;
  loadB: number;
  posA: number;
  posB: number;
  velA: number;
  velB: number;
  totalLoad: number;
};

export function parseSampleCharacteristic(base64: string): VitruvianSample | null {
  try {
    const binary = atob(base64);
    if (binary.length < 24) return null;
    const buf = new ArrayBuffer(binary.length);
    const u8 = new Uint8Array(buf);
    for (let i = 0; i < binary.length; i++) u8[i] = binary.charCodeAt(i);
    const dv = new DataView(buf);
    const loadA = dv.getFloat32(0, true);
    const loadB = dv.getFloat32(4, true);
    const posA  = dv.getFloat32(8, true);
    const posB  = dv.getFloat32(12, true);
    const velA  = dv.getFloat32(16, true);
    const velB  = dv.getFloat32(20, true);
    if (!isFinite(loadA) || loadA < 0 || loadA > 300) return null;
    return { loadA, loadB, posA, posB, velA, velB, totalLoad: loadA + loadB };
  } catch { return null; }
}
