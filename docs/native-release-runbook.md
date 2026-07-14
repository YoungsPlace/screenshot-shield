# Screenshot Shield 1.0.0 native release runbook

This runbook is for the **planned** `v1.0.0` release only. It is not evidence that a build was signed, uploaded, processed, reviewed, published, installed, or accepted.

## Fixed release contract

| Item                   | Required value                                     |
| ---------------------- | -------------------------------------------------- |
| App name               | `Screenshot Shield`                                |
| iOS bundle ID          | `io.github.youngsplace.screenshotshield`           |
| Android application ID | `io.github.youngsplace.screenshotshield`           |
| URL scheme             | `screenshotshield`                                 |
| Version                | `1.0.0`                                            |
| Public base URL        | `https://youngsplace.github.io/screenshot-shield/` |
| Apple locales          | `ko`, `en-US`, `zh-Hans`                           |
| Google Play locales    | `ko-KR`, `en-US`, `zh-CN`                          |

The release record is `releases/v1.0.0.json`. It remains in `planned` state until human-only evidence exists. Store-console identifiers, processing identifiers, signing fingerprints, checksums, cohort results, review results, availability results, and rollback receipts are intentionally absent from that plan until they are observed.

## Non-negotiable release rules

- Keep iOS `CFBundleVersion` and Android `versionCode` as independent monotonic counters. Never copy, link, or infer one from the other.
- Do not place private keys, keystores, provisioning profiles, passwords, API tokens, or any other credentials in Git, issue text, templates, screenshots, or release evidence.
- Do not automatically publish. Upload, testing, review submission, publication, removal, and rollback decisions are named human actions in their respective store consoles.
- Do not state or imply that a store accepted, reviewed, published, installed, or made a build available without the corresponding console and physical-device evidence.
- Do not claim that a Share receiver opened, saved, cancelled, or successfully received output unless independently observed. The app may only hand off a fresh redacted output after explicit Share.
- Do not make a post-store byte-equality claim. Store processing, signing, and delivery packaging can change the distributed bytes; prove identity with each store's real build ID, artifact inspection, signing fingerprint, version, counter, and console evidence instead.
- The v1 privacy contract is fixed: no backend, account, ads, analytics, telemetry, crash egress, tracking, app-controlled collection or sharing, remote OCR, broad permissions, or camera. The explicit fresh-redacted-output Share handoff is the sole permitted output handoff.
- Future scanner, contrast, PDF, extra-format, or advertising ideas are out of v1 and must not be promised in store material or release evidence.
- Do not claim guaranteed cache deletion; no release, removal, or observation evidence can make that guarantee.

## Evidence records

Start with these unfilled files; do not replace nulls or empty arrays with invented values:

- `store/evidence/internal-cohort.template.json`
- `store/evidence/publication.template.json`

Evidence must record an exact immutable source commit and exact immutable release commit, not a branch name, abbreviated hash, or guessed tag. Keep stage-separated immutable records for each unsigned candidate and signed distribution artifact: each has its own observed lowercase 64-hex SHA-256 and inspection output, and every console processing ID links to the signed artifact hash. Never use a sample or placeholder checksum. Certificate fingerprints are acceptable evidence; credential material is not.

## Mandatory sequence and human gates

Every gate is blocking. A named human records the gate's decision, UTC timestamp, and evidence location in the applicable template. Do not run a later stage when an earlier gate lacks passing evidence.

| Order | Human-only gate                      | Required action and proof                                                                                                                                                                                                                                                                                                                               | Stop condition                                                                                                                                                                                                   |
| ----- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Source and unsigned-build provenance | Select the exact source and release commits. Produce an unsigned iOS archive candidate and uncredentialed Android AAB candidate from that source. Record operator, UTC times, source provenance, tool versions, independent counters, artifact SHA-256 values, and unsigned inspections.                                                                | Either commit is not exact, version/ID/counter differs from the contract, or any checksum/inspection is missing.                                                                                                 |
| 2     | Physical-device and toolchain gate   | On physical devices, verify the unsigned candidates against the recorded toolchain. Inspect the iOS archive and Android AAB for expected IDs, `1.0.0`, independent counters, permissions/privacy contents, and package contents. Record platform-specific inspection output.                                                                            | Toolchain or inspection evidence is missing, the app contract differs, or a physical-device result fails.                                                                                                        |
| 3     | Protected-signing gate               | A human with protected store-signing access signs/exports the verified candidates outside Git. Record a new signed-distribution record with its own IPA/AAB path, SHA-256, signing fingerprint, profile where applicable, source unsigned hash, and signed inspection. Never overwrite the unsigned record.                                             | Credentials are exposed, a fingerprint is missing or unexpected, the signed record is not linked to the unsigned hash, or signing changes a required identifier/counter.                                         |
| 4     | Upload and processing gate           | A human uploads the verified signed IPA and AAB to the appropriate consoles. Record actual console build IDs, upload UTC times, processing completion UTC times, console proof, and the exact signed artifact SHA-256 each console record represents.                                                                                                   | Upload or processing is absent, rejected, incomplete, tied to a different signed hash, or tied to a different counter.                                                                                           |
| 5     | Internal-or-closed cohort gate       | Run independent iOS and Android internal/closed cohorts for at least 48 elapsed hours each. Per platform, record its own membership, devices, issue counts, clock, and failures; use at least three named physical minimum/target devices and complete at least 20 synthetic `import → redact → prepare → explicit Share or prepared-output save` runs. | Either platform cohort is under 48 hours, has fewer than 20 runs or three named devices, shares evidence with the other platform, has any P0/P1/unresolved privacy warning, or lacks its own cohort GO decision. |
| 6     | Store-review gate                    | A named human submits the platform-specific store review materials and records a distinct review decision, UTC timestamp, submission ID, and review evidence.                                                                                                                                                                                           | A review decision or required store item is missing, rejected, conflated with publication GO, or inconsistent with the fixed privacy contract.                                                                   |
| 7     | Full/country-first publication gate  | A named human records platform-specific publication GO with UTC timestamp, the exact countries, and final console availability. For 1.0.0, make the approved country set fully available; do not use percentage rollout.                                                                                                                                | No named GO, no final console evidence, unavailable clean install on a named physical device, any percentage rollout setting, or incomplete country record.                                                      |
| 8     | 72-hour public-observation gate      | Observe each published platform independently for at least 72 elapsed hours. Record a named owner and explicit 0/24/48/72-hour checkpoint status, UTC time, evidence, incidents, disposition, and final closure. Missing is not passed.                                                                                                                 | Either platform lacks a checkpoint or 72 hours of evidence, an incident has no disposition, a P0/P1/unresolved privacy warning appears, or clean rollback readiness is unavailable.                              |

Physical/toolchain, protected-signing, upload/processing, cohort, review, and publication are six separate per-platform decisions. Each requires its own named approver, UTC timestamp, and evidence location; no decision or clock may be copied between iOS and Android.

A clean-install check is availability evidence only after a named physical device installs through the actual final store path and the result is recorded. It does not prove receiver behavior, store-review acceptance beyond the recorded console result, or byte equality with an uploaded artifact.

## Cohort test execution standard

Use synthetic screenshots and synthetic sensitive values only. For each platform, the evidence must identify:

1. The internal or closed track/group and actual membership evidence.
2. The cohort start and completion timestamps proving at least 48 hours.
3. At least three distinct, named physical minimum- or target-supported devices. Simulators and emulators do not count.
4. At least 20 completed runs spread across those devices, each covering import, redact, prepare, and an explicit Share or save handoff attempt.
5. The run timestamp, device name, input case, redaction result, prepared-output result, and handoff attempt. Do not infer a receiver outcome.
6. Counts of P0, P1, and unresolved privacy warnings, each equal to zero.
7. A named human cohort GO decision and ISO 8601 UTC timestamp for iOS and Android separately.

## Publication standard

Publication may begin only after the cohort and review gates are complete for that platform. The first 1.0.0 publication is full/country-first: record the approved country list and release to that list at full availability. Percentage rollout is prohibited for 1.0.0.

Before closing publication evidence, record for iOS and Android separately:

- actual console build/processing/submission IDs;
- final console availability evidence;
- named physical clean-install device and result;
- publication GO approver and UTC timestamp;
- public-observation start timestamp; and
- rollback readiness evidence (removal procedure plus higher-build plan) before publication; and
- executed removal receipt/remediation evidence only when rollback is actually triggered.

No availability, review, publication, or clean-install field may be filled by prediction or copied from the other platform.

## Halt rules

Immediately halt progression for the affected platform when any required proof is missing, contradictory, stale, or cannot be tied to the exact source/release commit and signed artifact. Halt both platform releases when the issue indicates a shared source, privacy-contract, or product-safety defect.

Do not proceed past the current gate when any of these occur:

- identifier, scheme, version, or independent counter mismatch;
- missing or non-real artifact SHA-256, signing fingerprint, archive/IPA/AAB inspection, or store processing ID;
- credential exposure or a signing identity mismatch;
- failed physical-device test, insufficient cohort duration, insufficient device count, or insufficient synthetic-run count;
- P0, P1, or unresolved privacy warning count other than zero;
- review rejection, unknown review result, missing named GO/timestamp, failed clean install, or absent final console evidence;
- any percentage rollout configuration for 1.0.0; or
- missing per-platform removal and higher-build rollback path.

A halt is not publication removal evidence. Record the reason and preserve the observed evidence; do not declare an upload, review, or store state that was not observed.

## Removal and higher-build remediation rules

### Remove availability

When a published platform has a P0, P1, unresolved privacy warning, privacy-contract breach, security issue, misleading store claim, or material availability failure, a named human must:

1. stop further publication changes for the affected platform immediately;
2. remove or suspend that platform's public availability in its store console for every published country as soon as the console permits;
3. record the console action, actor, UTC timestamp, affected countries, and actual removal result in the publication evidence; and
4. evaluate the other platform and remove it too when the defect is shared or its evidence is incomplete.

Do not call a removal successful without the platform's actual console receipt. Removal controls new availability; it does not remove an installed app from a user's device.

### Ship a higher build, never a downgrade

Installed users cannot be downgraded. A fix must be a newly built, newly inspected, newly signed artifact with a strictly higher platform-specific counter:

- iOS: use a `CFBundleVersion` greater than the previously uploaded/processed iOS build for the applicable marketing version, subject to App Store Connect's actual monotonicity rules.
- Android: use a `versionCode` greater than every prior Play build that could conflict, subject to Play Console's actual monotonicity rules.

Do not reuse the removed build, upload a lower counter, or use one platform's counter to choose the other platform's counter. Start the remediation at the unsigned-build provenance gate, repeat the required inspection and affected physical/cohort checks, and obtain new platform-specific processing, review, publication, availability, observation, and rollback evidence. A higher-build plan is not proof that the higher build has been accepted or delivered.
