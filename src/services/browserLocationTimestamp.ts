/** Some Safari/Core Location versions return milliseconds since 2001.
 * Correct only that exact epoch offset and only for a demonstrably fresh fix.
 * Never stamp old, invalid or arbitrary timestamps with the current time.
 */
export function browserLocationTimestamp(timestamp:number,now=Date.now()):number {
 const adjusted=timestamp+978307200000,age=now-adjusted;
 return Number.isFinite(timestamp)&&age>=-5000&&age<30000?adjusted:timestamp;
}
