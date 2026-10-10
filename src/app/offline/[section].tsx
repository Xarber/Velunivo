import { useLocalSearchParams } from 'expo-router';
import LibrarySection from '../../components/LibrarySection';
export default function Section() { const {section}=useLocalSearchParams<{section:string}>(); return <LibrarySection section={section} />; }
