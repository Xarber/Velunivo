import { useEffect } from 'react';
import { startPwa } from '../services/pwa.web';
export default function PwaLifecycle(){useEffect(startPwa,[]);return null;}
