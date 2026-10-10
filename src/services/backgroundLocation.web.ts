import { Fix } from '../core/types';
export async function beginBackgroundLocation(_accept:(fix:Fix)=>Promise<void>,_error:(message:string)=>void,_isCancelled?:()=>boolean):Promise<()=>Promise<void>> {throw new Error('Web navigation requires keeping the page open.');}
