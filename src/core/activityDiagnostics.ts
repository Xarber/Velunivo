export interface ActivityChecks {nativeRenderer?:boolean;systemEnabled:boolean;declaredSupport:boolean;extensionBundled:boolean;groupConfigured:boolean;groupsMatch:boolean;sharedContainerAvailable:boolean;layoutStored:boolean;}
export interface ActivityReport {checks:ActivityChecks|null;activeCount:number|null;lastError:string;}
export function activityDiagnosis(report:ActivityReport) {
 const c=report.checks;
 if(!c)return 'Installation checks need the latest native build.';
 if(!c.systemEnabled)return 'iOS currently denies Live Activities for this app, despite any visible settings switches.';
 if(!c.declaredSupport || !c.extensionBundled)return 'The installed app is missing its Live Activity configuration or widget extension.';
 if(!c.nativeRenderer && (!c.groupConfigured || !c.groupsMatch))return 'The app and widget have inconsistent shared-storage configuration.';
 if(!c.nativeRenderer && !c.sharedContainerAvailable)return 'Shared widget storage is unavailable in this installation. The app cannot share its navigation layout with the widget.';
 if(!c.nativeRenderer && !c.layoutStored)return 'The navigation layout is missing from shared widget storage.';
 if(report.lastError)return `Live Activity error: ${report.lastError}`;
 if(c.nativeRenderer && (!c.sharedContainerAvailable || !c.layoutStored))return report.activeCount && report.activeCount>0 ? 'iOS reports an active Live Activity. Shared widget storage is unavailable; this build renders navigation directly from ActivityKit data. Lock Screen appearance still needs checking.' : 'Shared widget storage is unavailable; this build renders navigation directly from ActivityKit data. Start a test or ride to check the Lock Screen.';
 if(report.activeCount===null)return 'Could not read ActivityKit state. Installation checks passed; Lock Screen visibility is unverified.';
 return report.activeCount>0 ? 'iOS reports an active Live Activity. This does not confirm that the widget rendered on the Lock Screen.' : 'Installation checks passed. iOS reports no active Live Activity; check again while a ride is running.';
}
