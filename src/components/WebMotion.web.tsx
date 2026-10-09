import React, { useSyncExternalStore } from 'react';
const query = '(prefers-reduced-motion: reduce)';
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query); media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true);
}
export function motionProps(kind: string, state?: string) {
  return { dataSet: { velunivoMotion: kind, ...(state ? { motionState: state } : {}) } };
}
export default function WebMotion() {
  return <style>{`
    @keyframes velunivo-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes velunivo-sidebar { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes velunivo-content { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes velunivo-popup-in { from { opacity: 0; transform: translateY(18px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes velunivo-popup-out { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(10px) scale(.985); } }
    [data-velunivo-motion="sheet"] { transition: height 360ms cubic-bezier(.22,1,.36,1); animation: velunivo-rise 300ms cubic-bezier(.22,1,.36,1); }
    @media (min-width: 700px) { [data-velunivo-motion="sheet"] { animation-name: velunivo-sidebar; } }
    [data-velunivo-motion="content"] { animation: velunivo-content 200ms ease-out; }
    [data-velunivo-motion="planner"][data-motion-state="open"] { animation: velunivo-popup-in 240ms cubic-bezier(.22,1,.36,1) both; }
    [data-velunivo-motion="planner"][data-motion-state="closed"] { animation: velunivo-popup-out 200ms ease-in both; }
    [data-velunivo-motion="button"], [data-velunivo-motion="route"] { transition: transform 160ms ease, background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease, opacity 160ms ease; }
    @media (hover: hover) and (pointer: fine) {
      [data-velunivo-motion="button"]:not([aria-disabled="true"]):hover { transform: translateY(-1px); box-shadow: 0 4px 12px #00000016; }
      [data-velunivo-motion="route"]:hover { transform: translateY(-2px); }
    }
    [data-velunivo-motion="button"]:not([aria-disabled="true"]):active { transform: scale(.98); }
    [data-velunivo-motion="field"] { transition: border-color 180ms ease, box-shadow 180ms ease; }
    [data-velunivo-motion="field"]:focus-visible { outline: 2px solid #007F6D; outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) {
      [data-velunivo-motion] { animation: none !important; transition: none !important; }
      [data-velunivo-motion="button"], [data-velunivo-motion="route"] { transform: none !important; }
    }
  `}</style>;
}
