# Turn-following correction — 2.3.2

Includes all 2.3.1 review, optimization, reversible UI and scratch-replay changes. That build was force-cancelled to include this follow-up; its immutable tag had already been pinned, so the replacement uses 2.3.2 rather than moving the tag.

The shared navigation/recording/replay heading tracker now holds its last orientation when the upcoming route tangent changes without actual turn evidence. Significant compass/GPS heading changes are checked against accuracy-filtered displacement (at least 4 m, scaled by GPS uncertainty), with a five-second freshness limit and teleport rejection. Small changes cannot accumulate into an anticipatory rotation. Route bearing can initialize the view, but cannot predict the next corner. Turning the compass option on/off intentionally resets this presentation gate.

Compass remains primary when supported by the movement evidence. Existing eight-second pocket-phone mismatch correction, stale-heading fallback, stationary compass behavior, north wraparound and camera animation coalescing remain. With delayed GPS, rotation can follow a short distance after the turn; it does not pretend to know the vehicle's physical orientation from upcoming instructions.

Three additional regression cases cover route-only anticipation, compass pointing into a corner before actual displacement, and gradual compass changes while moving straight. Existing heading/camera tests also pass. No native sensor configuration, CallKit/media or routing protocol changed.
