/**
 * VitruvianMeasure.ts — Live polling of resistance from Vitruvian Trainer+
 * Polls SAMPLE_CHAR_UUID every 100ms (it's readable, not notifiable)
 */

import { Device } from 'react-native-ble-plx';
import { SAMPLE_CHAR_UUID, NUS_SERVICE_UUID, parseSampleCharacteristic, VitruvianSample } from './VitruvianBLE';

export type MeasurementData = {
  resistance: number | null;
  loadA: number | null;
  loadB: number | null;
  raw: string | null;
  characteristicUuid: string | null;
};

type MeasurementCallback = (data: MeasurementData) => void;

let pollingInterval: ReturnType<typeof setInterval> | null = null;

export async function startMeasuring(
  device: Device,
  onData: MeasurementCallback,
  onError: (err: string) => void
): Promise<void> {
  stopMeasuring();

  pollingInterval = setInterval(async () => {
    try {
      const char = await device.readCharacteristicForService(NUS_SERVICE_UUID, SAMPLE_CHAR_UUID);
      if (!char.value) return;
      const sample = parseSampleCharacteristic(char.value);
      if (sample) {
        onData({
          resistance: sample.totalLoad,
          loadA: sample.loadA,
          loadB: sample.loadB,
          raw: char.value,
          characteristicUuid: SAMPLE_CHAR_UUID,
        });
      } else {
        // Emit raw for debugging
        onData({ resistance: null, loadA: null, loadB: null, raw: char.value, characteristicUuid: SAMPLE_CHAR_UUID });
      }
    } catch (e: any) {
      // Don't spam errors — device may be momentarily busy
    }
  }, 150); // Poll at ~6.7Hz
}

export function stopMeasuring(): void {
  if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }
}
