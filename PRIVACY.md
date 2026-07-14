# Privacy Policy

Screenshot Shield is designed to redact screenshots locally in your browser.

## What the app processes

- Images you paste, drop, or select from disk.
- Rectangle regions and review decisions you make while editing.
- Optional OCR-assisted suggestion data generated in the browser from same-origin assets.

## What is not collected

The project intentionally does not include:

- Upload endpoints for screenshots or exports.
- Analytics, telemetry, session replay, advertising pixels, or remote logging.
- Remote fonts, hosted OCR APIs, or third-party image-processing APIs.
- Persistent storage of source images in localStorage, IndexedDB, cookies, URLs, or fixtures.

## In-memory workflow

Source screenshots should live only in page memory while the editor is open. Export renders a new image from a fresh canvas and encodes a new PNG or JPEG, which strips original file metadata and avoids reusing original bytes.

## Network expectations

After the static app shell and same-origin assets load, editing and export should not contact third-party hosts. The Playwright egress test fails on runtime requests to non-local/non-same-origin hosts.

## Your responsibilities

Review the final preview before sharing. Detection can miss sensitive text, OCR can fail, and manual review is required for anything important.

## Contact

Report privacy or security issues using the process in [SECURITY.md](./SECURITY.md).
