# Security Policy

## Supported project

Screenshot Shield is a static, browser-only redaction app. Security fixes apply to the current `main` branch and the latest GitHub Pages deployment.

## Security model

The intended security properties are:

- Screenshots are processed locally in browser memory.
- No external runtime API is required for import, review, redaction, OCR suggestions, or export.
- OCR assets, when present, are loaded from the same origin as the app.
- Export draws into a fresh canvas and newly encodes PNG/JPEG output.
- Manual opaque redaction is the reliable default.

## Out of scope

- Automatic face detection in the MVP.
- Absolute guarantees that all sensitive text is detected.
- Protection from compromised browsers, malicious extensions, hostile operating systems, or altered deployments.
- Recovery of data already shared before redaction.

## Reporting a vulnerability

Open a private security advisory in GitHub when available, or contact the repository owner with:

1. A concise description of the issue.
2. Reproduction steps using synthetic data only.
3. Expected impact and affected browser/version.
4. Whether network requests, persistence, or exported pixels are involved.

Do not include real secrets, real screenshots, credentials, production customer data, or exploit payloads that contact third-party systems.

## Verification expectations for fixes

Security-sensitive changes should include focused tests for the relevant boundary: egress, storage, typed failures, export pixel output, metadata stripping, or detector behavior.
