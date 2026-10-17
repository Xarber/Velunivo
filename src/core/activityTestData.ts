import {NavigationActivity} from './liveActivity';
import {batteryColor} from '../bluetooth/telemetry';
import {t} from '../i18n/core';
export type ActivityTestKind='navigation'|'recording'|'shared'|'regroup'|'join-approval'|'charging'|'stale';
/** All test kinds use the existing renderer, never a live ride's factory. */
export function activityTestData(kind:ActivityTestKind='navigation',overrides:Partial<NavigationActivity>={},now=Date.now()):NavigationActivity {
 const base:NavigationActivity={actionLabel:t(kind==='join-approval'?'Review request':kind==='regroup'?'View group':'Open ride'),requestLabel:t('Join request'),updatedAt:now,turn:t('Live Activity test · Turn right'),symbol:'arrow.turn.up.right',distance:'100 m',arrival:new Date(now+600000).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}),minutes:'10 min',remaining:'2.5 km',arrivalLabel:t('Arrival'),oldLabel:t('Old'),batteryPercent:64,batterySymbol:'battery.75percent',batteryUpdatedAt:now,groupCount:3,viewerCount:2};
 const result={...base,...overrides};
 if(kind==='regroup')result.regroup=t('Regroup requested')+' · Alex';
 if(kind==='join-approval'){result.joinRequest='Alex';result.approveTarget='group-approval:TEST1234:00000000000000000000000000000000:1';result.declineTarget=result.approveTarget.slice(0,-1)+'0';}
 if(kind==='stale'){result.batteryOld=true;result.batteryUpdatedAt=now-120000;result.updatedAt=now-120000;}
 const charging=result.batterySymbol==='battery.100percent.bolt';const battery=result.batteryPercent;result.batteryColor=battery===undefined?undefined:batteryColor(battery);result.batterySymbol=`battery.${battery!==undefined&&battery<13?0:battery!==undefined&&battery<38?25:battery!==undefined&&battery<63?50:battery!==undefined&&battery<88?75:100}percent`;
 if(kind==='charging'||charging){result.batterySymbol='battery.100percent.bolt';result.batteryColor='#39C982';}
 if(kind==='recording')return {...result,recording:true,symbol:'record.circle',turn:t('Recording trip'),timer:overrides.timer||'12:34',arrival:t('Trip time')+' · '+(overrides.timer||'12:34'),distance:'22 km/h',minutes:overrides.remaining||'2.5 km',remaining:t('Travelled')};
 if(kind==='shared'){delete result.batteryPercent;delete result.batterySymbol;delete result.batteryUpdatedAt;result.turn=t('Shared trip')+' · '+t('Turn right');}
 return result;
}
