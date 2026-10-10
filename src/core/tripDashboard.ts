export function tripDuration(startedAt: number, now: number) {
  const seconds=Math.floor(Math.max(0,now-startedAt)/1000);
  return `${Math.floor(seconds/3600).toString().padStart(2,'0')}:${Math.floor(seconds%3600/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;
}
export function tripAverage(meters: number, startedAt: number, now: number) {return now>startedAt ? Math.max(0,meters)/(now-startedAt)*3600 : 0;}
