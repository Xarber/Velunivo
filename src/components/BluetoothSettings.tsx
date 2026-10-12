import {t} from '../i18n/core';
import Text from './LocalizedText';
import InfoButton from './InfoButton';
import React from 'react';
import {View, Switch} from 'react-native';
import {useStore} from '../services/store';
import {useBluetoothPreferences} from '../bluetooth/react';
import {registry} from '../bluetooth/service';
import {metricLabels} from '../bluetooth/telemetry';
import {globalTelemetryMetrics} from '../bluetooth/policy';
import {styles,usePalette} from './ui';
export default function BluetoothSettings(){const p=usePalette(),{navigationOptions:n}=useStore(),{preferences,update}=useBluetoothPreferences();
 return <><View style={[styles.card,{backgroundColor:p.card}]}><View style={{flexDirection:'row',alignItems:'center',gap:12}}><Text style={{color:p.text,fontWeight:'800',fontSize:18,flex:1}}>Connection & recording</Text><InfoButton title={t("Bluetooth information")}>Visibility only controls display. Collection separately controls telemetry stored in ride records. GPS recording continues either way. iOS may suspend Bluetooth work while backgrounded or after termination.</InfoButton></View><Text style={{color:p.muted}}>These preferences apply to all your personal vehicles. Add or manage a connection from Vehicles. Public sharing vehicles cannot be connected.</Text><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{color:p.text}}>Automatic reconnection</Text><Switch accessibilityLabel={t("Automatic reconnection")} value={preferences.autoReconnect} onValueChange={autoReconnect=>update({autoReconnect})} /></View><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{color:p.text}}>Collect trip telemetry</Text><Switch accessibilityLabel={t("Collect trip telemetry")} value={preferences.collectTelemetry} onValueChange={collectTelemetry=>update({collectTelemetry})} /></View></View>
 <View style={[styles.card,{backgroundColor:p.card}]}><Text style={{color:p.text,fontWeight:'800',fontSize:18}}>Telemetry visibility</Text>{globalTelemetryMetrics(registry,n.developerMode).map(metric=><View key={metric} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}><Text style={{color:p.text,flex:1}}>{metricLabels[metric]}</Text><Switch accessibilityLabel={t(`Show ${metricLabels[metric]}`)} value={preferences.visible[metric]!==false} onValueChange={value=>update({visible:{[metric]:value}})} /></View>)}<Text style={{color:p.muted,lineHeight:22}}>Applies throughout the app. Only supported readings are shown.</Text></View>
</>;
}
