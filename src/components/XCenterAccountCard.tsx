import { useState } from 'react';
import { Image, Linking, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../i18n/core';
import type { AccountStatus } from '../services/accountSync';
import Text from './LocalizedText';
import { Button, usePalette } from './ui';

export default function XCenterAccountCard({ profile, photo }: { profile: AccountStatus['profile']; photo?: string }) {
  const palette = usePalette();
  const [failedPhoto, setFailedPhoto] = useState<string>();
  const [error, setError] = useState(false);
  const name = profile?.name || profile?.preferred_username || 'X-Center ID';
  const accent = palette.dark ? '#B9D0FF' : '#174EAA';
  return <View style={{ borderRadius: 20, padding: 16, gap: 14, backgroundColor: palette.dark ? '#243657' : '#E7EFFF' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Image source={require('../../assets/identity/xcenter-id-mark.png')} accessible={false} style={{ width: 24, height: 24 }}/>
      <Text style={{ color: accent, fontWeight: '700' }}>X-Center ID</Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      {photo && failedPhoto !== photo
        ? <Image source={{ uri: photo }} accessibilityLabel={t('Profile photo')} onError={() => setFailedPhoto(photo)}
          style={{ width: 56, height: 56, borderRadius: 28 }}/>
        : <View accessible={false} style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.card }}>
          <Text translate={false} style={{ color: accent, fontSize: 24 }}>{Array.from(name)[0]?.toLocaleUpperCase()}</Text>
        </View>}
      <View style={{ flex: 1, gap: 2 }}>
        <Text accessibilityRole="header" translate={false} style={{ color: palette.text, fontSize: 22, fontWeight: '700' }}>{name}</Text>
        {!!profile?.preferred_username && <Text translate={false} style={{ color: palette.muted }}>@{profile.preferred_username}</Text>}
        {!!profile?.email && <Text translate={false} style={{ color: palette.muted }}>{profile.email}</Text>}
        {!!profile?.age_range && <Text translate={false} style={{ color: palette.muted }}>{profile.age_range}</Text>}
      </View>
    </View>
    {(profile?.verified || profile?.administrator) && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {profile.verified && <Text style={{ color: accent }}><Ionicons name="checkmark-circle-outline" size={15}/> {t('Verified account')}</Text>}
      {profile.administrator && <Text style={{ color: accent }}><Ionicons name="shield-outline" size={15}/> {t('X-Center administrator')}</Text>}
    </View>}
    <Button title={t('Manage X-Center ID')} icon="open-outline" secondary onPress={() => {
      setError(false);
      void Linking.openURL('https://id.xcenter.it/profile').catch(() => setError(true));
    }}/>
    {error && <Text style={{ color: palette.text }}>Could not open X-Center ID. Try again.</Text>}
  </View>;
}
