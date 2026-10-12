import { router, Href } from 'expo-router';
/** Direct links may have no parent history; replace only in that case. */
export function goBack(fallback: Href) { if (router.canGoBack()) router.back(); else router.replace(fallback); }
