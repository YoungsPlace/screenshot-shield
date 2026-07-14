# Screenshot Shield

Screenshot Shield is a privacy-first static web app for redacting sensitive information from screenshots in the browser. It is designed for local-only import, review, manual rectangle redaction, optional local OCR-assisted suggestions, and fresh-canvas PNG/JPEG export that does not reuse the original encoded file bytes.

## Product goals

- Import PNG, JPEG, and WebP screenshots by paste, drag/drop, or file picker.
- Keep source images in browser memory only; no upload endpoint, analytics, remote fonts, or third-party runtime APIs.
- Suggest likely sensitive text for review: email addresses, phone numbers, payment-card-like numbers, IPv4 addresses, URLs with query strings, and long token-like IDs.
- Keep manual redaction fully usable even when OCR assets fail to initialize.
- Export a newly encoded PNG or JPEG from a fresh canvas so metadata and original bytes are stripped.

## Local development

```bash
npm install
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run e2e
```

The app is a Vite/React static application. Playwright tests start the production preview server from `npm run preview` after `npm run build`.

## Deployment

GitHub Pages deployment is handled by `.github/workflows/deploy.yml`.

1. In GitHub repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.
2. Push to `main`.
3. The Pages workflow installs dependencies, runs the full verification gate, builds the static site, and uploads `dist/`.

Vite must be configured with a repository-subpath-safe base path for production Pages builds, typically `/screenshot-shield/`, while local development remains `/`.

## Verification scope

Lane C verification covers:

- Import → manual redaction → export smoke coverage with synthetic screenshots.
- Detector copy/pattern visibility for supported sensitive-data classes.
- Keyboard focus and mobile viewport smoke checks.
- Typed user-facing import failures.
- Fresh-canvas export dimensions and opaque redaction pixel checks where browser APIs expose the download.
- Runtime network egress assertions blocking third-party hosts after app load.

## Privacy model

Screenshot Shield is built for local processing. The browser decodes the selected image, stores editor state in memory, and exports by drawing into a clean canvas. See [PRIVACY.md](./PRIVACY.md) and [SECURITY.md](./SECURITY.md) for the exact threat model and limitations.

## Limitations

- Detection suggestions are review aids, not guarantees.
- OCR quality depends on screenshot clarity and same-origin OCR asset availability.
- Face detection is out of MVP scope; users can manually redact faces or any other area.
- A malicious browser extension, compromised dependency, or modified deployment can break the local-only model.

## License

MIT. See [LICENSE](./LICENSE).
