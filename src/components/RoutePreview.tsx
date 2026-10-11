import {t} from '../i18n/core';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import RideMap from './RideMap';
import { Route } from '../core/types';
const padding = { top: 16, bottom: 16, left: 16, right: 16 };
export default function RoutePreview({ route,height=170 }: { route: Route;height?:number }) {
  const routes = useMemo(() => [route], [route]);
  return <View accessibilityLabel={t(`Map preview of ${route.name}`)} pointerEvents="none" style={{ height, overflow: 'hidden', borderRadius: 18 }}><RideMap routes={routes} selected={route} follow={false} overview fitPadding={padding} /></View>;
}
