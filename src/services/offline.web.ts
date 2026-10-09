import { Route } from '../core/types';
export type PackView = { id: string; name: string; percentage: number; bytes: number; state: string; pack: { pause(): Promise<void>; resume(): Promise<void> } };
export const packs = async (): Promise<PackView[]> => [];
export const download = async (_r: Route, _progress: (...args: any[]) => void, _error: (msg: string) => void): Promise<any> => { throw new Error('Offline tile downloads require the native iOS build.'); };
export const deletePack = async (_id: string) => {};
export const listen = async (_id: string, _progress: (...args: any[]) => void, _error: (msg: string) => void) => {};
export const unlisten = (_id: string) => {};
