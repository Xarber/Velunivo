import {router,Href} from 'expo-router';import {backOrParent} from '../core/backNavigation';
export function goBack(fallback:Href){backOrParent(router,fallback);}
