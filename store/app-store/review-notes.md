# Screenshot Shield — App Review Notes

## Prepared-state boundary

- App name: `Screenshot Shield`
- Bundle ID: `io.github.youngsplace.screenshotshield`
- Version: `1.0.0`
- These are prepared review notes and metadata, not evidence of an uploaded, signed, TestFlight-delivered, submitted, accepted, or published native app.

## Account and permission behavior

- Screenshot Shield has no login or account.
- Image import uses the system Files or Photos picker.
- The app does not request camera permission. It does not use camera scanning.
- Processing is local to the device. Automatic suggestions are review aids and can miss sensitive content; reviewers should inspect and manually adjust the final image.

## Synthetic-image review flow

Use only a synthetic screenshot with no real personal data or credentials.

1. Open Screenshot Shield and choose an image through the system Files or Photos picker.
2. Select the synthetic screenshot.
3. Review any automatic suggestions, then add, move, resize, or remove redaction areas as needed.
4. Inspect the preview and prepare a fresh redacted output.
5. Tap Share only when deliberately testing the handoff. Only the freshly redacted output is eligible for that explicit Share action; the source image is not handed off.
6. The receiver is outside the app's control. Do not treat a destination opening, success, cancellation, retention, or deletion as an app behavior claim.

## Human-gated release evidence

The following fields remain human-gated and are intentionally not fabricated in this repository:

| Field                               | Current value                         |
| ----------------------------------- | ------------------------------------- |
| App Store Connect app ID            | `null`                                |
| Signed artifact                     | `null`                                |
| Physical device cohort evidence     | `null`                                |
| TestFlight build or cohort          | `null`                                |
| App Review submission or outcome    | `null`                                |
| Public native availability evidence | `null` (pending independent evidence) |
| Rollback receipt                    | `null`                                |

Native availability remains pending independent signing, device, store-review, and public-availability evidence.
