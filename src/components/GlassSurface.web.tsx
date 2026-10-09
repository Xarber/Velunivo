import React from 'react';
import { View, ViewProps, useColorScheme } from 'react-native';
export default function GlassSurface({ interactive: _interactive, expanded = false, style, ...props }: ViewProps & { interactive?: boolean; expanded?: boolean }) {
  const dark = useColorScheme() === 'dark';
  return <View {...props} style={[style, { transition: 'background-color 300ms ease, backdrop-filter 300ms ease', backgroundColor: expanded ? '#071118EF' : dark ? '#172A31DA' : '#FFFFFFDC', borderWidth: 1, borderColor: dark ? '#FFFFFF20' : '#FFFFFFB0', backdropFilter: expanded ? 'blur(44px) saturate(120%)' : 'blur(30px) saturate(160%)' } as any]} />;
}
