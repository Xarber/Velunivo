import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { Coord } from '../core/types';
import { routeBounds } from '../core/geo';
import { serverUrl } from '../services/api';
import OfflineRideMap, { MapProps } from './OfflineRideMap';
const point = (p: Coord) => ({ longitude: p[0], latitude: p[1] });
export default function RideMap(props: MapProps & { offlineMap?: boolean }) {
  if (props.offlineMap || Platform.OS === 'android') return <OfflineRideMap {...props} />;
  return <DeviceMap {...props} />;
}
function DeviceMap({ routes, selected, position, follow, onPick, traffic, startPoint, endPoint, fitPadding, heading = 0, tilted = false, overviewRequest = 0 }: MapProps) {
  const map = useRef<MapView>(null);
  const fit = () => { if (!selected && startPoint && !follow) { if (endPoint) map.current?.fitToCoordinates([startPoint, endPoint].map(point), { edgePadding: fitPadding || { top: 45, bottom: 45, left: 45, right: 45 }, animated: true }); else map.current?.animateCamera({ center: point(startPoint), zoom: 13, heading: 0, pitch: 0 }, { duration: 400 }); } if (selected && !follow) { map.current?.setCamera({ heading: 0, pitch: tilted ? 40 : 0 }); map.current?.fitToCoordinates(selected.coordinates.map(point), { edgePadding: fitPadding || { top: 45, bottom: 45, left: 45, right: 45 }, animated: true }); } };
  useEffect(fit, [selected, follow, fitPadding, overviewRequest, tilted, startPoint, endPoint]);
  useEffect(() => { if (position && follow) map.current?.animateCamera({ center: point(position), zoom: 16, heading, pitch: tilted ? 40 : 0 }, { duration: 250 }); }, [position, follow, heading, tilted]);
  const [w, s, e, n] = selected ? routeBounds(selected.coordinates) : [9.18, 45.46, 9.20, 45.48];
  return <MapView ref={map} style={{ flex: 1 }} mapPadding={fitPadding} showsBuildings pitchEnabled rotateEnabled={!follow} onMapReady={fit} legalLabelInsets={{ top: 120, left: 12, right: 12, bottom: fitPadding?.bottom || 45 }} initialRegion={{ latitude: (s + n) / 2, longitude: (w + e) / 2, latitudeDelta: Math.max(.005, (n - s) * 1.5), longitudeDelta: Math.max(.005, (e - w) * 1.5) }} onPress={ev => onPick?.([ev.nativeEvent.coordinate.longitude, ev.nativeEvent.coordinate.latitude])}>
    {routes.map(r => <Polyline key={r.id} coordinates={r.coordinates.map(point)} strokeColor={r.id === selected?.id ? '#007F6D' : '#658ACA'} strokeWidth={r.id === selected?.id ? 6 : 4} />)}
    {(startPoint || selected?.coordinates[0]) && <Marker coordinate={point(startPoint || selected!.coordinates[0])} title="Start" pinColor="#007F6D" />}
    {(endPoint || selected?.coordinates.at(-1)) && <Marker coordinate={point(endPoint || selected!.coordinates.at(-1)!)} title="Destination" />}
    {position && <Marker coordinate={point(position)} title="Your position" pinColor="#287CF5" />}
    {traffic && serverUrl && <UrlTile urlTemplate={`${serverUrl}/traffic/{z}/{x}/{y}.png`} tileSize={256} zIndex={1} />}
  </MapView>;
}
