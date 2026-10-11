import { AssociationStorage } from './bridge';
export const associationStorage:AssociationStorage={load:async()=>[],save:async()=>{throw new Error('Physical Bluetooth associations are available in native builds only.');}};
