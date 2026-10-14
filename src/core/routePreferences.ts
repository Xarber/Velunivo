export interface RoutePreferences {preferBikeLanes?:boolean;preferQuietRoads?:boolean;preferFewerHills?:boolean;}
export function routePreferences(raw:unknown):RoutePreferences{const v=raw as RoutePreferences;return {preferBikeLanes:v?.preferBikeLanes!==false,preferQuietRoads:v?.preferQuietRoads!==false,preferFewerHills:v?.preferFewerHills===true};}
export const customRoutePreferences=(p:RoutePreferences)=>!!(p.preferBikeLanes||p.preferQuietRoads||p.preferFewerHills);
