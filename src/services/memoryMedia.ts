import {validMemoryId} from '../core/memories';
import {File,Directory,Paths} from 'expo-file-system';
const directory=()=>new Directory(Paths.document,'ride-memories');
export async function appendMemoryMedia(id:string,bytes:Uint8Array){if(!validMemoryId(id))throw new Error('Invalid memory media identifier');const folder=directory();if(!folder.exists)folder.create({intermediates:true});const file=new File(folder,id);if(!file.exists)file.create();const handle=file.open();try{handle.offset=file.size;handle.writeBytes(bytes);}finally{handle.close();}}
export async function deleteMemoryMedia(id:string){if(!validMemoryId(id))throw new Error('Invalid memory media identifier');const file=new File(directory(),id);if(file.exists)file.delete();}
export async function memoryMediaURL(id:string,_mime?:string){if(!validMemoryId(id))throw new Error('Invalid memory media identifier');return new File(directory(),id).uri;}
