# Screenshot Shield — Google Play review notes

## Preparation status

This document prepares reviewer instructions only. It is not evidence that a build was uploaded, a track was selected, a review was submitted or accepted, or the app was published.

| Field                      | Value                                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| App name                   | Screenshot Shield                                                                                                                  |
| Package ID                 | `io.github.youngsplace.screenshotshield`                                                                                           |
| Intended version           | `1.0.0`                                                                                                                            |
| Signed artifact / build ID | Pending human-supplied signed-artifact evidence                                                                                    |
| Play Console track         | Pending human selection in Play Console                                                                                            |
| Review credentials         | Pending human confirmation; no account is expected or required for the intended reviewer flow, so no credentials are supplied here |

## Reviewer flow

1. Launch the app. No sign-in or special access is required.
2. Use the Android system picker to choose a provided **synthetic** screenshot. Do not use real personal data, credentials, secrets, or production screenshots.
3. Inspect the image and add, move, resize, or remove manual redaction regions. Manually review the final preview.
4. Prepare a fresh PNG or JPEG output. The app creates this output rather than handing off the original input.
5. Tap **Share** only when ready. The Android share sheet opens for a destination the reviewer chooses. The destination is outside Screenshot Shield's control; no receiver success, cancellation, opening, retention, or deletion outcome is asserted.

## Privacy and permissions

- Redaction and review are on-device. The app has no backend, account, ads, analytics, telemetry, crash-reporting egress, tracking, or remote OCR.
- The app does not request camera permission, broad storage/media permission, or network permission. Image selection is through the system picker.
- The only intended external handoff is one freshly redacted output after the user explicitly chooses Share and a destination. This is not background or app-controlled sharing.
- All functionality is available without an account or reviewer credentials.

## Reviewer data and support

Use only synthetic test data, including the listing screenshots and any image selected during review. The localized policy and support pages are public and unauthenticated:

| Locale | Privacy policy                                                          | Support                                                                 |
| ------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| ko-KR  | https://youngsplace.github.io/screenshot-shield/privacy.html?lang=ko    | https://youngsplace.github.io/screenshot-shield/support.html?lang=ko    |
| en-US  | https://youngsplace.github.io/screenshot-shield/privacy.html?lang=en    | https://youngsplace.github.io/screenshot-shield/support.html?lang=en    |
| zh-CN  | https://youngsplace.github.io/screenshot-shield/privacy.html?lang=zh-CN | https://youngsplace.github.io/screenshot-shield/support.html?lang=zh-CN |

The global Play privacy-policy and support-website fields use the English URLs above.
