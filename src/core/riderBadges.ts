import {ProfileBadge,profileBadges} from './cosmeticRewards';
import {ExplorationProgress,explorationAchievements} from './explorationProgress';
export function readBadges(raw:unknown,legacy?:unknown):ProfileBadge[]{const values=Array.isArray(raw)?raw:typeof raw==='string'?raw.split(','):[legacy];return [...new Set(values.filter((id):id is ProfileBadge=>typeof id==='string'&&id!=='none'&&profileBadges.some(b=>b.id===id)))].slice(0,3);}
export function milestoneBadges(progress:ExplorationProgress):ProfileBadge[]{return [...(explorationAchievements.every(a=>progress.achievements.includes(a.id))?['completion' as const]:[]),...(1+Math.floor(Math.sqrt(progress.xp/100))>=50?['level50' as const]:[])];}
export function displayedBadges(selected:unknown,legacy:unknown,progress:ExplorationProgress){return readBadges([...milestoneBadges(progress),...readBadges(selected,legacy)]);}
