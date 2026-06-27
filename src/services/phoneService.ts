import * as Battery from 'expo-battery';
import { Vibration } from 'react-native';

export const getBatteryLevel = async (): Promise<number> => {
  const level = await Battery.getBatteryLevelAsync();
  return Math.round(level * 100);
};

export const startBatteryMonitoring = (
  onLowBattery: (level: number) => void,
  threshold: number = 20
) => {
  const subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
    const percent = Math.round(batteryLevel * 100);
    if (percent <= threshold) {
      onLowBattery(percent);
    }
  });
  return subscription;
};

export const ringPhone = () => {
  Vibration.vibrate([500, 500, 500, 500, 500, 500], true);
};

export const stopRinging = () => {
  Vibration.cancel();
};
