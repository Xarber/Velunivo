import {useLocalSearchParams} from 'expo-router';
import RecordedRideReplay from '../../components/RecordedRideReplay';
export default function Replay(){const {id}=useLocalSearchParams<{id:string}>();return <RecordedRideReplay id={id} />;}
