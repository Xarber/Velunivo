export function mapHeaderTop(_width:number,safeTop:number,bar?:{top:number;bottom:number}){return Math.max(safeTop,bar?.bottom??0)+8;}
export function libraryColumns(width:number){return width>=900?4:width>=700?3:1;}
