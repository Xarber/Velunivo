import { useLocalSearchParams } from 'expo-router';
import SettingsScreen from '../../components/SettingsScreen';
export default function SettingsSection() { const {section}=useLocalSearchParams<{section:string}>(); return <SettingsScreen section={section} />; }
