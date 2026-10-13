import {ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import ExplorationProfile from '../../../components/ExplorationProfile';
import {IconButton,usePalette} from '../../../components/ui';
import {t} from '../../../i18n/core';
export default function Exploration(){const p=usePalette();return <SafeAreaView style={{flex:1,backgroundColor:p.bg}}><ScrollView contentContainerStyle={{padding:16,gap:16}}><IconButton label={t('Back')} icon="chevron-back" onPress={()=>router.back()}/><ExplorationProfile details/></ScrollView></SafeAreaView>;}
