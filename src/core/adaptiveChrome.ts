export function mapHeaderTop(width:number,safeTop:number,bar?:{top:number;bottom:number}){return bar?(width>=1100?Math.max(safeTop+8,bar.top+Math.max(0,(bar.bottom-bar.top-54)/2)):bar.bottom+8):safeTop+8;}
export function libraryColumns(width:number){return width>=900?4:width>=700?3:1;}
