# Telemetry expansion: feasibility and measurement contract

Inspected the bridge, partial-update cache, plugin capability declarations, M365 decoder, GPS recorder, energy model, performance comparisons and stored sample format before implementation.

Available with the current real plugin: vehicle speed, battery %, voltage/current, calculated electrical power (V × A), battery temperature, odometer/trip distance, charging status, mode and RSSI. GPS supplies position/time, reported or estimated speed, accuracy and sometimes altitude. Raw samples and their original timestamps/sources already persist; extend these rather than create another recorder.

Feasible derived metrics: bounded-gap electrical integration, separate consumption/recovery/net energy, Wh/km with coverage, speed distributions, acceleration/sustained-speed events, voltage sag/recovery observations, temperature changes, speed/mode energy bands, GPS-versus-vehicle comparisons and per-domain quality. These describe observations, not mechanical diagnoses or precise battery health. Historical comparisons require sufficient matched observations; unsupported series are omitted. Nominal battery capacity alone is not a measured usable-energy estimate.

Current sign is explicitly declared by the protocol. M365 documents positive discharge and negative regenerative current; negative current is not charger detection. Do not apply this convention to an arbitrary future plugin. Simulated readings are excluded from real historical analytics. Electrical integration needs fresh endpoint samples and rejects long gaps rather than carrying the last value forward.

Not exposed/validated by current protocol: motor RPM, motor/phase/torque current, field weakening, motor/controller temperature and internal controller limits. No register or firmware write is added for these. New plugins may advertise these later; no invented readings are displayed.

Native implementation/testing constraints: no new SDK, no local native compilation, no user browser interaction. Swift syntax checks and automated tests do not constitute real scooter or Duo UI validation.

## Processing and storage

The new analytics page reads a selected ride on demand. Library cards do not launch raw-sample analyses in the background. Historical vehicle views load at most 25 additional rides per action and yield between rides. Aggregate calculations use original samples; charts keep at most roughly 600 timestamps. A bounded six-result cache is evicted automatically. No second raw telemetry store is created.

New connection-attempt/failure counters are optional per-process observations captured in ride samples. Older rides show observed interruptions but omit unavailable attempt counters. Electrical sign is optional metadata in new samples; older samples may use the installed plugin's explicit convention. Unknown conventions omit energy. Charging periods and inconsistent battery increases cannot become automatic consumption claims. Sensor accuracy is not certified by the coverage score.
