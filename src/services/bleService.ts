// import { BleManager, Device } from 'react-native-ble-plx';
// import { Platform, PermissionsAndroid } from 'react-native';
// import { Buffer } from 'buffer';

// const manager = new BleManager();

// const JARVIS_SERVICE_UUID = '12345678-1234-1234-1234-123456789012';
// const WIFI_CHARACTERISTIC_UUID = '12345678-1234-1234-1234-123456789013';

// let connectedDevice: Device | null = null;

// export const requestPermissions = async (): Promise<boolean> => {
//   if (Platform.OS === 'android') {
//     const granted = await PermissionsAndroid.requestMultiple([
//       PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
//       PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
//       PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//     ]);
//     return Object.values(granted).every(v => v === PermissionsAndroid.RESULTS.GRANTED);
//   }
//   return true;
// };

// export const scanForJarvis = (
//   onFound: (device: Device) => void,
//   onError: (error: string) => void
// ) => {
//   manager.startDeviceScan(null, null, (error, device) => {
//     if (error) {
//       onError(error.message);
//       return;
//     }
//     if (device?.name?.includes('Jarvis')) {
//       manager.stopDeviceScan();
//       onFound(device);
//     }
//   });

//   setTimeout(() => manager.stopDeviceScan(), 10000);
// };

// export const connectToDevice = async (device: Device): Promise<boolean> => {
//   try {
//     connectedDevice = await device.connect();
//     await connectedDevice.discoverAllServicesAndCharacteristics();
//     return true;
//   } catch (e) {
//     console.error('BLE connect error:', e);
//     return false;
//   }
// };

// export const sendWifiCredentials = async (ssid: string, password: string): Promise<boolean> => {
//   if (!connectedDevice) return false;

//   try {
//     const payload = JSON.stringify({ ssid, password });
//     const encoded = Buffer.from(payload).toString('base64');

//     await connectedDevice.writeCharacteristicWithResponseForService(
//       JARVIS_SERVICE_UUID,
//       WIFI_CHARACTERISTIC_UUID,
//       encoded
//     );

//     return true;
//   } catch (e) {
//     console.error('BLE write error:', e);
//     return false;
//   }
// };

// export const disconnectBLE = async () => {
//   if (connectedDevice) {
//     await connectedDevice.cancelConnection();
//     connectedDevice = null;
//   }
// };
