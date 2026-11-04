// SPDX-License-Identifier: AGPL-3.0-only
import * as Location from 'expo-location';
import {Platform} from 'react-native';
import {requestLocalNotifications} from './localNotifications';
/** Called only by the explicit Settings switch, never from background callbacks. */
export async function prepareAutomaticRide(): Promise<'background'|'foreground'|'notifications'> {
  if (Platform.OS === 'web') throw new Error('Automatic Bluetooth recording requires the native app.');
  await requestLocalNotifications();
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) return 'notifications';
  const background = await Location.requestBackgroundPermissionsAsync();
  return background.granted ? 'background' : 'foreground';
}
