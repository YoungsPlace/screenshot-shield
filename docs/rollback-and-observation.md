# Screenshot Shield 1.0.0 rollback and public-observation procedure

This procedure is a planned operational guide. It contains no evidence that either store has accepted, published, removed, reviewed, processed, or made Screenshot Shield available.

Use it with `store/evidence/publication.template.json`. Keep unknown human-only facts as `null` or empty arrays until real evidence is captured. Never replace them with sample IDs, fabricated timestamps, placeholder checksums, inferred review outcomes, or assumed store availability.

## Evidence-state separation

Track iOS and Android as independent lifecycles. Each platform keeps its own immutable source and artifact links, counter, toolchain/physical-device decision, signing decision, upload/processing decision, cohort decision, review decision, publication decision, availability record, observation clock, halt state, rollback readiness, and any executed rollback. Never advance one platform from evidence recorded for the other.

An unsigned candidate and its signed distribution artifact are separate stages with separate SHA-256 and inspection records. Store processing evidence must identify the signed artifact it processed. A review approval is not a publication approval, publication approval is not console availability, and console availability is not a successful clean install or completed observation.

Rollback readiness is a pre-publication gate: record the current console removal procedure, named owner, and higher-build remediation plan without claiming that removal occurred. An executed rollback is an incident response and requires its own actual console receipt, actor, UTC timestamp, affected countries, and higher-build remediation evidence. Normal successful release closure does not require a fabricated removal receipt.

## Preconditions to start public observation

For each platform separately, a named human must already have recorded:

- the exact immutable source commit and release commit;
- a named physical/toolchain gate decision with UTC timestamp and evidence;
- the unsigned candidate SHA-256 and inspection evidence;
- the separately signed artifact SHA-256, signing certificate fingerprint, protected-signing decision, and archive/IPA/AAB inspection evidence;
- actual store processing/build identifiers, upload/processing decision, and evidence tied to the signed artifact;
- at least 48 hours of internal or closed cohort evidence;
- at least 20 synthetic `import → redact → prepare → explicit Share or prepared-output save` runs across at least three named physical minimum- or target-supported devices;
- zero P0, zero P1, and zero unresolved privacy warnings;
- distinct named cohort, review, and publication GO decisions with UTC timestamps;
- final console availability evidence; and
- a clean install through the real store path on a named physical device.

The iOS bundle ID and Android application ID are both `io.github.youngsplace.screenshotshield`; the URL scheme is `screenshotshield`. This shared identifier does **not** permit counter coupling: iOS `CFBundleVersion` and Android `versionCode` stay independent.

The first 1.0.0 publication must be full/country-first. Record each platform's published country list, then make that approved list fully available. Percentage rollout is prohibited for this release.

## 72-hour observation record

Start a separate 72-hour clock for iOS and Android only after that platform has real final-console availability and clean-install evidence. Record times in ISO 8601 UTC. The release is not observation-complete until both applicable platform clocks have at least 72 elapsed hours of evidence.

At the start, 24-hour, 48-hour, and 72-hour marks, record the following per platform in the publication evidence:

| Check                     | What to record                                                                                                                                                                                                                    | Do not infer                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Store availability        | Console capture/reference, published countries, observed availability timestamp, and actor                                                                                                                                        | Review acceptance, publication in another country, or availability without console evidence                          |
| Clean install             | Named physical device, store path used, timestamp, and observed install/launch result                                                                                                                                             | Availability on untested devices or future availability                                                              |
| Privacy contract          | Whether any observed behavior conflicts with the no-backend/no-account/no-ads/no-analytics/no-telemetry/no-crash-egress/no-tracking/no-app-controlled-collection-or-sharing/no-remote-OCR/no-broad-permissions/no-camera contract | That a lack of one observation proves a permanent absence                                                            |
| Synthetic output handling | Any issue involving import, redact, prepare, explicit Share, or the separate explicit prepared-output save action for a fresh redacted output                                                                                     | Receiver open, receiver save success, receiver cancellation, or receiver content state unless independently observed |
| Severity                  | New P0 count, P1 count, unresolved privacy warning count, incident references, and disposition                                                                                                                                    | A zero count when issues have not been triaged                                                                       |
| Rollback readiness        | Current platform-specific removal-console path, higher-build path, named owner, and timestamp                                                                                                                                     | That removal or a higher build was performed without actual console evidence                                         |

The observation log must distinguish a missing check from a passed check. A missing console record, device result, or incident disposition is a halt condition, not a successful observation.

## Immediate halt criteria

Stop all progression for the affected platform immediately when any of the following is observed or cannot be disproved with evidence:

- a P0, P1, or unresolved privacy warning;
- a breach or possible breach of the fixed privacy contract;
- an identifier, version, independent counter, signing fingerprint, SHA-256, archive/IPA/AAB inspection, or store build/processing mismatch;
- unavailable or failed clean install through the final store path;
- a misleading or unsupported store claim;
- missing named GO decision, missing UTC timestamp, missing country record, or any percentage rollout configuration for 1.0.0;
- a credentials-in-Git exposure or suspected signing compromise;
- missing, contradictory, or untraceable evidence; or
- inability to remove availability or produce a platform-specific higher-build remediation plan.

A shared source, privacy, or safety issue halts both platforms. A platform-specific console or packaging issue halts that platform and requires a documented assessment of the other platform. A halt does not prove that a store removal occurred, that installed users changed state, or that any cache was deleted.

## Public removal procedure

On a halt that requires removal from public availability, a named human with the appropriate console access must perform the following for each affected platform:

1. Freeze further publication changes for that platform and record the halt reason, reporter, and UTC time.
2. In the actual store console, remove, suspend, or unpublish the build from every country where it is currently available, using the platform's available removal control.
3. Capture the actual console receipt/reference, actor, timestamp, countries, and result in the publication evidence.
4. Confirm whether the defect is shared. Apply the same removal procedure to the other platform when it is shared, or record why it is not affected.
5. Preserve the signed-artifact, processing, cohort, review, availability, and observation evidence. Do not alter it to make the release look complete.
6. Inform the named release owner that a higher build is required before any corrected public availability can be claimed.

Do not claim removal until a real console receipt exists. Removal prevents or limits new acquisition according to the store's actual behavior; it cannot downgrade or remotely delete the version already installed by users.

## Higher-build remediation procedure

A correction is a new release path, not a rollback by downgrade. Installed users cannot be downgraded.

For the affected platform:

1. Choose a corrected immutable source and release commit. Record both exactly.
2. Build an unsigned candidate from that source and record provenance/toolchain evidence.
3. Increment only the affected platform's monotonic counter beyond the previously uploaded or processed build: iOS `CFBundleVersion` for iOS and Android `versionCode` for Android. Do not copy a counter from the other platform.
4. Reinspect the new archive, IPA, or AAB; record a new real SHA-256 and the observed signing fingerprint after protected signing.
5. Re-upload through a human-controlled console action, then record actual processing/build IDs and processing evidence.
6. Repeat the relevant physical-device and cohort testing. A privacy, shared-source, or product-safety fix returns both platforms to the full cohort gate.
7. Obtain new named review and publication GO decisions, final console availability, clean-install evidence, and a new 72-hour observation record before closing remediation.

Never reuse a removed artifact, upload the same or lower counter as a replacement, claim byte equality after store processing, or claim a replacement is accepted, published, or delivered before actual evidence exists.

## Closure conditions

The public-observation record may be closed only when, for each published platform, all of the following have actual evidence: all 0-, 24-, 48-, and 72-hour checkpoints; at least 72 elapsed hours; final console availability; named physical clean install; zero P0/P1/unresolved privacy warnings; named observation owner; and verified rollback readiness containing the removal procedure and higher-build plan. An actual removal receipt and executed higher-build evidence are required only when rollback was triggered. Any absent proof leaves that platform lifecycle and aggregate closure open; it is not a completed release claim.
