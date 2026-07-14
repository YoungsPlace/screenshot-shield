# Contributing

## Development workflow

1. Use synthetic screenshots and synthetic secrets only.
2. Install dependencies with `npm install`.
3. Run the focused check for your change.
4. Run the full local gate before opening a pull request:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run e2e
```

## Privacy rules

- Do not add analytics, telemetry, remote fonts, hosted OCR, or external runtime APIs.
- Do not persist source images in localStorage, IndexedDB, cookies, URLs, logs, fixtures, or screenshots.
- Do not commit real screenshots, real secrets, browser profiles, caches, or credentials.
- Keep OCR optional; manual redaction must work when OCR fails.

## Testing rules

- Prefer deterministic synthetic fixtures.
- Assert pixels/dimensions for export behavior when practical.
- Assert user-facing typed failures for invalid input.
- Assert no third-party runtime egress for editor flows.
- Keep Playwright tests independent and browser-download safe.

## Accessibility rules

- Use semantic controls and labels.
- Preserve keyboard access for import, selection, redaction actions, undo/redo, clear, and export.
- Respect reduced motion preferences.
- Maintain contrast across desktop and mobile layouts.

## Pull request checklist

- [ ] Full local gate passes.
- [ ] New code avoids third-party runtime egress.
- [ ] Synthetic data only.
- [ ] Documentation updated when behavior changes.
- [ ] Limitations are described without absolute detection/security claims.
