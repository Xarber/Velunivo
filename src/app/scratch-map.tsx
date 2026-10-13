import {router} from 'expo-router';
import ScratchViewer from '../components/ScratchViewer';
export default function ScratchView(){return <ScratchViewer close={()=>router.back()}/>;}
