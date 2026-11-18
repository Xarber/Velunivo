# Velunivo development queue

| ID | Request | State | Evidence and next action |
| --- | --- | --- | --- |
| VN-ACCOUNT-01 | Use X-Center ID for sync, with separate permissions for recently visited neighborhoods and ride insights | Implemented | Web summary sync, explicit per-category uploads and deletion. Lint, type checking and nine focused tests passed. Live authentication is tracked separately. |
| VN-ACCOUNT-02 | Activate and verify account sync | Blocked | Requires a confirmed active Velunivo website registration, private app storage, and provisioned backend credentials for the exact HTTPS callback. Verify with isolated accounts before deployment. Native sign-in additionally requires verified links for the actual signing identities and a one-time backend session handoff. |
| VN-UADS-01 | Apply the new UADS requirements from the prior ride detection assignment | Queued | The repository has project documentation and CI but no compliance manifest. Inventory applicable requirements and integrate a validator with existing source checks before promotion. |
| VN-ACCOUNT-03 | Guide portal registration and use automatic sync with profile, email and age-range consent | Implemented | Portal fields inspected and documented. Foreground web sync uses independent category consent and protects newer remote revisions. Live sign-in, synchronization, and native handoff depend on VN-ACCOUNT-02. |
