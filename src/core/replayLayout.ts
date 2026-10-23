/** Keep the replay position in the map area left uncovered by the measured panel. */
export function replayMapPadding(width:number,height:number,insets:{top:number;bottom:number;left:number;right:number},panelHeight:number){
 const side=width>height||width>=800,column=width>height?Math.min(340,width*.42):390;
 if(side)return {top:insets.top+65,bottom:insets.bottom+24,left:insets.left+column+48,right:insets.right+100};
 const top=insets.top+90;
 return {top,bottom:Math.min(insets.bottom+panelHeight+36,Math.max(0,height-top-100)),left:24+insets.left,right:70+insets.right};
}
