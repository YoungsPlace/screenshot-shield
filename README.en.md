<p align="center">
  <a href="./README.md">한국어</a> · <strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <img src="./public/icons/icon-192.png" width="112" height="112" alt="Screenshot Shield shield logo" />
</p>

<h1 align="center">Screenshot Shield</h1>

<p align="center">
  <strong>Hide it before you share it.</strong><br />
  Review and conceal screenshots directly in your browser without uploading them to a server<br />
  Korean-first · multilingual · local-only privacy editor
</p>

<p align="center">
  <a href="https://github.com/YoungsPlace/screenshot-shield/actions/workflows/ci.yml">
    <img src="https://github.com/YoungsPlace/screenshot-shield/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI status" />
  </a>
  <a href="https://github.com/YoungsPlace/screenshot-shield/actions/workflows/deploy.yml">
    <img src="https://github.com/YoungsPlace/screenshot-shield/actions/workflows/deploy.yml/badge.svg?branch=main" alt="GitHub Pages deployment status" />
  </a>
  <br />
  <strong>Local-only source · Korean / English / Simplified Chinese</strong>
</p>

<p align="center">
  <a href="https://youngsplace.github.io/screenshot-shield/?view=editor&lang=en"><strong>Open the local editor</strong></a>
  ·
  <a href="https://youngsplace.github.io/screenshot-shield/?lang=en"><strong>View the launch story</strong></a>
  ·
  <a href="https://youngsplace.github.io/screenshot-shield/privacy.html?lang=en">Privacy</a>
  ·
  <a href="https://youngsplace.github.io/screenshot-shield/support.html?lang=en">Support</a>
</p>

<p align="center">
  <a href="https://youngsplace.github.io/screenshot-shield/?lang=en">
    <img src="./public/social-card.png" width="960" alt="Screenshot Shield — hide it before sharing" />
  </a>
</p>

## Why Screenshot Shield?

- **Images are processed locally only.** There are no upload endpoints, accounts, ads, analytics, tracking, or remote OCR.
- **It creates a new output instead of using the original.** It renders the reviewed screen onto a new canvas and prepares it as a PNG or JPEG.
- **It does not depend on automatic suggestions.** Manual concealment, movement, resizing, and deletion remain available even when OCR is unavailable or misses an item.
- **Sharing is a separate, explicit action.** Only the newly prepared output is passed to a download/save or sharing flow selected by the user.

## Synthetic Resident Registration Card Demo

The card below is **not a replica of a real resident registration card**. It is an unmistakably synthetic profile created to explain the sensitive-information concealment flow. The character name `김빵주`, the intentionally invalid sample number `940913-1234567`, and the fictional household address `서울 올림픽파크포레온 999동 999호` are all for testing only and do not represent a real person.

<p align="center">
  <img src="./docs/assets/synthetic-id-redaction-demo.svg" width="960" alt="Screenshot Shield demo comparing a synthetic profile for 김빵주 before and after concealing the name, intentionally invalid resident registration number, and fictional address" />
</p>

This example shows the product boundary: manually review and conceal the name, identification number, address, and character face, then prepare only a **newly rendered output**, not the original. Do not add images containing real sensitive information to the repository, issues, or test data.

## Start Now

| Language               | Launch screen                                                               | Open editor directly                                                                      |
| ---------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Korean**             | [Launch story](https://youngsplace.github.io/screenshot-shield/?lang=ko)    | [Korean editor](https://youngsplace.github.io/screenshot-shield/?view=editor&lang=ko)     |
| **English**            | [Launch story](https://youngsplace.github.io/screenshot-shield/?lang=en)    | [English editor](https://youngsplace.github.io/screenshot-shield/?view=editor&lang=en)    |
| **Simplified Chinese** | [Launch story](https://youngsplace.github.io/screenshot-shield/?lang=zh-CN) | [Chinese editor](https://youngsplace.github.io/screenshot-shield/?view=editor&lang=zh-CN) |

Screenshot Shield is a Korean-first, multilingual mobile web tool for preparing newly concealed screenshots in your browser. It is not an image upload service.

[Privacy Policy](https://youngsplace.github.io/screenshot-shield/privacy.html?lang=en) ·
[Support](https://youngsplace.github.io/screenshot-shield/support.html?lang=en) ·
[Security Reporting Policy](./SECURITY.md)

## Mobile Workflow

1. Open one of the language links above and select a screenshot from **Photos** or **Files**. Paste and drag-and-drop are also available on desktop.
2. Review the local automatic suggestions, then add manual concealment areas and select, move, resize, or delete them. Manual concealment remains available even when OCR is unavailable or misses an item.
3. Review the final preview and prepare a new PNG or JPEG. The editor draws the result onto a new canvas without reusing the original bytes or metadata.
4. If the browser supports file sharing, share through a separate user action, or download/save the same prepared file.

A selected share target may save or upload the output under its own policies, not Screenshot Shield's. Inspect the completed image yourself before sending it.

## Editor-First Paths, Language, and Installation Behavior

The root service is the Korean launch screen. To skip the launch screen, use one of these editor-first addresses:

- `https://youngsplace.github.io/screenshot-shield/?view=editor&lang=ko`
- `https://youngsplace.github.io/screenshot-shield/?view=editor&lang=en`
- `https://youngsplace.github.io/screenshot-shield/?view=editor&lang=zh-CN`

The public language tags are exactly `ko`, `en`, and `zh-CN`. If the `lang` value is absent, invalid, malformed, or duplicated, Korean is used regardless of the browser language. The app normalizes `lang=zh` to `zh-CN`.

Only a language explicitly selected by the user on a regular screen may be stored in `screenshot-shield.locale` in `localStorage`. When an app installed on the home screen starts, it opens editor-first and reads only this one setting before rendering. It falls back to Korean if storage has been cleared, is unavailable, contains an invalid value, or access is blocked. The regular root address does not read this setting and is always Korean. Images, filenames, concealment areas, OCR results, prepared outputs, and edit history are not stored.

The app uses one fixed web manifest and one mobile web identity. Browser installation is controlled by the browser. In Safari on iPhone or iPad, use **Share → Add to Home Screen**. In Android Chromium, use **Install app** or **Add to Home screen** only when the browser offers it. Menu names and availability vary by browser, operating system, and policy. Even when launched from the home screen, it remains a mobile web app and does not imply a native binary or app store listing.

## Availability and Boundaries

The currently claimed availability is the GitHub Pages web service above. The repository includes branded phase-zero Capacitor iOS/Android projects and fail-closed policy checks. However, `npm run native:preflight` blocks expansion of the native runtime and sharing implementation until evidence confirms the exact toolchain and the launch-link, rename, timestamp, and force-quit matrices on physical devices. Native availability is further blocked until signing, cohort, review, and public store availability evidence is confirmed. No App Store or Google Play release is claimed.

There is no claim of a web service worker or web offline support. The browser may retain resources under its own policies, but Screenshot Shield does not provide an offline editor or offline cache lifecycle.

The current web app has no application upload endpoint, backend, accounts, ads, analytics, telemetry, tracking, remote OCR, or external image-processing API. The original image remains only in browser memory while it is being edited. The only intended image egress is the new concealed output that the user explicitly downloads, saves, or shares.

OCR and automatic detection are review aids, not guarantees. OCR may be unavailable or may miss sensitive items. Face detection is currently out of scope. Browser extensions, compromised devices or browsers, or a tampered deployment can break the local-processing boundary.

In the planned native design, explicit sharing may use a restricted private cache for only one newly concealed output. Originals, backups, and galleries are excluded, and it is not a general image repository. This plan does not guarantee the receiving app's open, success, cancellation, retention, or deletion behavior, nor is it evidence that a native app is currently available. See [PRIVACY.md](./PRIVACY.md) for the full distinction.

## Report Issues Safely

For general, non-sensitive help, use the [public repository](https://github.com/YoungsPlace/screenshot-shield) and, when GitHub is accessible, [issues](https://github.com/YoungsPlace/screenshot-shield/issues). Include the app or deployment version, full address and language, device, operating system and browser versions, reproduction steps, and expected and actual results. Attach only evidence that has already been concealed or is synthetic.

Do not post original screenshots, credentials, real secrets, personal information, or attack code in public issues. Use the [Security Reporting Policy](./SECURITY.md) for unexpected network activity, persistent image storage, output or sharing boundary issues, or other vulnerabilities. Repository maintenance does not guarantee a real-time response or a specific response time.

## Future Expansion Boundaries

Document scanning, perspective correction, contrast enhancement, PDF, and additional image formats are not included in the current release scope. Future work must extend the local pipeline through acquisition → non-destructive transformation → concealment → review → format encoding while keeping the original isolated from sharing and download APIs. New encoders must take the reviewed rendered result as input, not the original file.

Ads or other monetization features require a separately approved privacy, consent, network, and content-isolation design. Such features must not access original images, OCR text, concealment areas, prepared files, or editing actions, and must not degrade the usability of the tracking-free local editor.

## Contributing and Local Development

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before proposing changes. Preserve the browser-local processing boundary, existing public paths, `?embed=editor`, the launch screen, and the GitHub Pages subpath.

```bash
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run native:policy
npm run store:verify
VITE_BASE_PATH=/screenshot-shield/ npm run build
VITE_BASE_PATH=/screenshot-shield/ PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173/screenshot-shield/ npm run e2e
```

Both `npm run build:native` and `npm run cap:sync` run the native preflight first. They are expected to stop on computers that lack the fully reviewed Xcode/JDK/Android SDK, connected physical iOS and Android devices, pinned toolchain and SPM lock, and signed physical-device gate evidence. Do not bypass this stop. Release-readiness materials that do not require credentials are available in [`docs/native-release-runbook.md`](./docs/native-release-runbook.md), [`docs/rollback-and-observation.md`](./docs/rollback-and-observation.md), and [`store/`](./store/).

This project is a Vite/React static application. Tests use synthetic images and must verify actual behavior rather than an external OCR service. Without a separately approved privacy and lifecycle design, do not add a backend, upload relay, telemetry, remote OCR, service worker, claims of web offline support, web share target, or persistent image storage.

## GitHub Pages Deployment

GitHub Pages deploys the static `dist/` output through [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml). In the repository settings, select **Pages → Build and deployment → GitHub Actions**, then merge approved changes into `main`. Production builds must preserve Vite's `/screenshot-shield/` base path; local development uses `/`.

This deployment is not a native release. Do not describe a store build as available without independently approved evidence of signing, devices, store review, and public availability.

## License

MIT. See [LICENSE](./LICENSE).
