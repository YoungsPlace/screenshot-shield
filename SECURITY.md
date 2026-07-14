# Screenshot Shield Security Policy

## Scope and availability

The supported current surface is the static Screenshot Shield web app served from GitHub Pages. Native iOS and Android shells are planned separately; this document does not claim a signed, reviewed, store-published, or publicly available native release without independent evidence.

Security fixes target the current `main` branch and the corresponding GitHub Pages deployment. Use the [public support page](https://youngsplace.github.io/screenshot-shield/support.html?lang=en) for non-sensitive help.

## Current web security and privacy boundary

The web app is designed around these properties:

- A selected screenshot is decoded, reviewed, redacted, and exported in browser memory.
- There is no app backend, upload endpoint, account system, advertising, analytics, telemetry, tracking, remote OCR, third-party image-processing API, or app-controlled crash-report egress.
- OCR assets, when available, are loaded from the same origin and run locally; automatic suggestions are not a guarantee.
- A fresh canvas creates a new PNG or JPEG output. The original input is not supplied to download or Share APIs.
- Only a freshly prepared redacted output can leave through an explicit user download/save or Share action. A destination chosen by the user may store or upload that output under its own policy.
- `screenshot-shield.locale` is the one allowed persisted product setting. It can contain only `ko`, `en`, or `zh-CN` for installed-entry language presentation. It must not contain image-derived state.
- No source image, edit state, OCR result, output, filename, or other product setting is written to cookies, URLs, localStorage, sessionStorage, IndexedDB, or Cache Storage.
- The web app has one immutable manifest identity and an installed-entry resolver. Normal bare URLs remain Korean and do not read the stored locale; unavailable, invalid, or cleared locale storage falls back to Korean.
- There is no web service worker, offline cache lifecycle, Web Share Target, or offline-support claim.

## Planned native boundary

A planned native implementation must preserve the same no-backend, no-upload, no-account, no-analytics, no-tracking, and no-remote-OCR boundary. It is not currently a released distribution surface.

For an explicit native Share operation only, the intended design permits at most one fresh redacted output in a private, bounded cache share lease. It excludes original images, drafts, edit geometry, OCR history, backups, and gallery visibility. Cache phase/provenance or cleanup failures are security-relevant; an app must not silently treat an unknown cache state as clean. Neither the app nor this policy can guarantee a receiver's success, retention, deletion, or upload behavior after a user selects a destination.

A native/store claim requires separate device, signing, binary, privacy, review, and availability evidence. Do not infer availability from source code or a planned configuration.

## Out of scope and limitations

Screenshot Shield does not guarantee that every sensitive item is detected. Face detection is outside the current scope. It cannot protect against a compromised browser, malicious extension, hostile operating system, modified deployment, or data already shared before redaction.

## Reporting a vulnerability

Use [GitHub's private security-advisory flow](https://github.com/YoungsPlace/screenshot-shield/security/advisories/new) when it is available for the repository. If that flow is unavailable, do not disclose technical details in public; use a minimal, non-sensitive [GitHub issue](https://github.com/YoungsPlace/screenshot-shield/issues) only to request a private reporting channel.

Include only synthetic or already-redacted evidence and provide:

1. A concise description of the suspected boundary failure.
2. Reproduction steps and the affected Screenshot Shield version/deployment, full URL and `lang` value, browser/OS or native build identifier, and device details.
3. Expected impact and actual behavior.
4. Whether the concern involves unexpected network activity, locale storage, image/output persistence, share/download handoff, manifest/navigation, permissions, or cache provenance.
5. Relevant sanitized logs, timestamps, and non-sensitive screenshots.

Never include an original screenshot, real secret, credential, token, personal data, or an exploit payload that contacts third-party systems.

Do not use a public Issue for a vulnerability report. Security review and response are handled as maintenance capacity permits; this policy does not promise synchronous support, acknowledgement, or a particular remediation time.

## Verification expectations for fixes

A security-sensitive change should include focused evidence for the affected boundary: same-origin egress, storage allowlists and failure paths, fresh-canvas pixel output/metadata stripping, prepared-file share/download behavior, locale resolver behavior, manifest identity, or native cache/permission/navigation provenance where applicable. Fixes must not add a backend, worker/offline layer, Share Target, remote OCR, or image persistence as an undocumented workaround.
