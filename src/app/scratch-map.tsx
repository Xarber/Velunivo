import {goBack} from '../services/navigation';

import ScratchViewer from '../components/ScratchViewer';
export default function ScratchView(){return <ScratchViewer close={()=>goBack('/')}/>;}
