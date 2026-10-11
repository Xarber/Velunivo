import {t} from '../i18n/core';
import Text from './LocalizedText';
import React from 'react';
import {Image, View} from 'react-native';
import { usePalette } from './ui';
export default function Brand() {
  const p = usePalette();
  return <View accessible accessibilityLabel={t("Velunivo")} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <Image source={require('../../assets/icon.png')} accessibilityIgnoresInvertColors style={{ width: 32, height: 32, borderRadius: 9 }} />
    <Text style={{ color: p.text, fontSize: 25, letterSpacing: -1.2, fontWeight: '800' }}>Velunivo</Text>
  </View>;
}
