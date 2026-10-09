import React from 'react';
import { View, ViewProps, useColorScheme } from 'react-native';
export default function GlassSurface({ interactive: _interactive, style, ...props }: ViewProps & { interactive?: boolean }) {
  const dark = useColorScheme() === 'dark';
  return <View {...props} style={[style, { backgroundColor: dark ? '#172A31DA' : '#FFFFFFDC', borderWidth: 1, borderColor: dark ? '#FFFFFF20' : '#FFFFFFB0', backdropFilter: 'blur(22px) saturate(160%)' } as any]} />;
}
