import {getRegroupWarning} from '../groups/regroupPresence';
import {t} from '../i18n/core';
import {getGroupJoinRequest,getGroupActivityCount} from '../groups/activityPresence';
import {bluetoothBridge} from '../bluetooth/service';
import {getBluetoothPreferences} from '../bluetooth/preferences';
import {getHostPresence} from '../sharing/hostPresence';
import {activityExtras} from '../core/activityTelemetry';
export const currentActivityExtras=(vehicleId:string,now=Date.now())=>({...activityExtras(bluetoothBridge.getSnapshot(),getBluetoothPreferences(),vehicleId,getHostPresence(),now),groupCount:getGroupActivityCount(),joinRequest:getGroupJoinRequest(),requestLabel:t('Join request'),actionLabel:t(getGroupJoinRequest()?'Review request':getRegroupWarning()?'View group':'Open ride'),...(getRegroupWarning()!==undefined?{regroup:t('Regroup requested')+' · '+getRegroupWarning()}:{})});
