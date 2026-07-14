# Screenshot Shield Privacy Policy

Public localized policy pages are available at:

- Korean: <https://youngsplace.github.io/screenshot-shield/privacy.html?lang=ko>
- English: <https://youngsplace.github.io/screenshot-shield/privacy.html?lang=en>
- Simplified Chinese: <https://youngsplace.github.io/screenshot-shield/privacy.html?lang=zh-CN>

## Scope and current availability

The currently provided Screenshot Shield product is a GitHub Pages mobile web app. This policy describes that current web behavior and separately records the bounded privacy design for planned native apps. It does **not** claim that an iOS or Android native app is published, available in a store, or otherwise available today.

## Current web processing

Screenshot Shield processes a selected, pasted, or dropped screenshot in browser memory. The browser decodes the image, applies review and manual redaction work, and renders a fresh PNG or JPEG from a new canvas. The fresh export does not reuse the original image bytes or metadata.

The web app has no application upload endpoint, backend, account system, screenshot/export relay, advertising, analytics, telemetry, session replay, tracking pixel, remote logging, or app-controlled crash-report egress. It has no remote OCR API, third-party image-processing API, or remote font. When OCR assistance is available, it uses same-origin assets in the browser; it remains a review aid rather than a guarantee.

## Web persistence

The only persisted product setting is the `localStorage` key `screenshot-shield.locale`. Its only accepted values are `ko`, `en`, and `zh-CN`; its only purpose is reopening an installed home-screen web app in the last language explicitly selected in normal or installed chrome.

A bare normal URL does not read that preference and defaults to Korean. If storage is cleared, unavailable, blocked, invalid, or throws, the installed start also falls back to Korean. This failure is nonblocking.

Screenshot Shield does not persist source-image bytes, object/data URLs, filenames, image dimensions, redaction geometry or styles, prepared files, OCR text/results, UI history, output metadata, or any second product setting. Those items are not written to localStorage, sessionStorage, IndexedDB, Cache Storage, cookies, URLs, or a backend.

## Download and explicit share boundary

Only a newly prepared redacted output may leave the web app, and only through a user-initiated download/save or Share action. The same fresh redacted file is used for both web Share and download; the original input is prohibited from those APIs.

A user-selected share destination may store or upload the redacted output under its own policy. Screenshot Shield does not promise that the receiving app succeeds, that it retains or deletes a file in a particular way, or that a handoff is reversible. Review the final preview before sharing.

## Web installation and offline boundary

A browser may offer a home-screen or standalone installation through its own menu. This remains browser-managed mobile web behavior, not a native-app or app-store claim. Screenshot Shield has no web service worker and makes no web-offline claim.

## Planned native boundary

Native iOS/Android work is planned and is not evidence of a released product. If a separately verified native release is built, it must continue to prohibit backend/upload, accounts, ads, analytics, telemetry, tracking, remote OCR, and app-controlled collection or sharing of source images.

For an explicit native Share handoff, at most one freshly redacted output may temporarily exist in a private, bounded cache. That cache is intended to be excluded from backups and the photo gallery, is not a general media library, and must never contain an original image, draft, redaction geometry, OCR history, or a second output. Cleanup and OS cache eviction are bounded operational behaviors, not a guarantee that a receiver has deleted or not retained a user-shared file.

Native availability, signing, store review, and publication will be stated only after independent evidence exists.

## Your responsibilities and contact

Automatic suggestions can miss sensitive content, and OCR can fail. Manually review the final image before sharing. A malicious extension, compromised browser/device, or altered deployment can violate the local-processing boundary.

For general help, use the [support page](https://youngsplace.github.io/screenshot-shield/support.html?lang=en) or the [public GitHub repository](https://github.com/YoungsPlace/screenshot-shield). For a privacy or security concern, follow [SECURITY.md](./SECURITY.md) and do not include real screenshots, credentials, secrets, or personal data in public reports.
