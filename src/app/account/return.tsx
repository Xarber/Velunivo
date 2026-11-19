import { useEffect, useRef } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Platform, View } from 'react-native';
import Text from '../../components/LocalizedText';
import { usePalette } from '../../components/ui';
import { refreshAccountSync } from '../../components/AccountSyncWorker';
import { finishAccountSignIn } from '../../services/accountSession';

export default function AccountReturn() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const started = useRef(false);
  const palette = usePalette();
  useEffect(() => {
    if (started.current || Platform.OS === 'web') return;
    started.current = true;
    const finish = typeof code === 'string' ? finishAccountSignIn(code) : Promise.reject(new Error('Missing code'));
    void finish.then(() => {
      refreshAccountSync();
      router.replace('/settings/xcenter-id');
    }, () => router.replace('/settings/xcenter-id?account=failed'));
  }, [code]);
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: palette.bg }}>
    <Text style={{ color: palette.text }}>{Platform.OS === 'web'
      ? 'Open this link in Velunivo to finish signing in. If the app did not open, return to Velunivo and try again.'
      : 'Finishing X-Center ID sign-in…'}</Text>
  </View>;
}
