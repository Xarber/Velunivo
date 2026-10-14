/** Presentation-only rollback. Set EXPO_PUBLIC_UI_REFINEMENTS=0 and rebuild for the original dashboard. */
export const UI_REFINEMENTS = process.env.EXPO_PUBLIC_UI_REFINEMENTS !== '0';
