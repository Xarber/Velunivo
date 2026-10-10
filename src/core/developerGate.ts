/** Three taps strictly inside a rolling three-second window. */
export function versionTap(taps: number[], now: number) {
  const recent = [...taps.filter(t => now >= t && now - t < 3000), now];
  return { revealed: recent.length >= 3, taps: recent.length >= 3 ? [] : recent };
}
