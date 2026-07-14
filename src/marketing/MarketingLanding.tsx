import '../styles/marketing.css';

import { detectorItems, faqItems, workflowSteps } from './content';
import { RedactionDemo } from './RedactionDemo';

export type MarketingLandingProps = {
  readonly onStartEditing: () => void;
  readonly appReady?: boolean;
};

export function MarketingLanding({ onStartEditing, appReady = true }: MarketingLandingProps) {
  return (
    <div className="marketing-shell" id="top">
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Private screenshot redaction</p>
          <h1 id="hero-title">
            Screenshot Shield — Clean screenshots before they leave your browser.
          </h1>
          <p className="hero-lede">
            Screenshot Shield helps you paste or drop a screenshot, review likely sensitive text,
            draw final redaction boxes, and export a newly rendered file without sending the image
            to a server.
          </p>
          <div className="hero-actions" aria-label="Primary actions">
            <button
              type="button"
              className="primary-cta"
              onClick={onStartEditing}
              disabled={!appReady}
            >
              {appReady ? 'Open the local editor' : 'Preparing editor'}
            </button>
            <a className="secondary-link" href="#privacy-proof">
              See privacy model
            </a>
          </div>
          <ul className="trust-strip" aria-label="Product safeguards">
            <li>No upload endpoint</li>
            <li>Manual fallback always available</li>
            <li>Fresh-canvas export</li>
          </ul>
        </div>
        <RedactionDemo />
      </section>

      <section className="proof-panel" id="privacy-proof" aria-labelledby="privacy-title">
        <div>
          <p className="eyebrow">Local-only proof</p>
          <h2 id="privacy-title">Designed for short-lived, in-memory work.</h2>
        </div>
        <div className="proof-grid">
          <article>
            <span className="proof-icon" aria-hidden="true">
              01
            </span>
            <h3>Same browser session</h3>
            <p>
              Imported images are decoded for editing and are not written to localStorage,
              IndexedDB, or remote storage by the app.
            </p>
          </article>
          <article>
            <span className="proof-icon" aria-hidden="true">
              02
            </span>
            <h3>Same-origin assets</h3>
            <p>
              Detection helpers are expected to load from the built site. Manual redaction remains
              usable if OCR support is unavailable.
            </p>
          </article>
          <article>
            <span className="proof-icon" aria-hidden="true">
              03
            </span>
            <h3>New export bytes</h3>
            <p>
              Downloads are rendered from a fresh canvas as PNG or JPEG, which avoids reusing the
              original encoded file and its metadata.
            </p>
          </article>
        </div>
      </section>

      <section className="workflow-section" aria-labelledby="workflow-title">
        <p className="eyebrow">Three-step workflow</p>
        <h2 id="workflow-title">From risky capture to reviewed share copy.</h2>
        <div className="step-list">
          {workflowSteps.map((step, index) => (
            <article className="step-card" key={step.title}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="detectors-section" aria-labelledby="detectors-title">
        <div className="section-heading">
          <p className="eyebrow">Suggestion coverage</p>
          <h2 id="detectors-title">Detectors give you a review checklist, not a promise.</h2>
          <p>
            OCR-assisted suggestions focus on patterns commonly leaked in product, support, and
            engineering screenshots. You stay in control of every region before export.
          </p>
        </div>
        <div className="detector-grid">
          {detectorItems.map((detector) => (
            <article className="detector-card" key={detector.label}>
              <h3>{detector.label}</h3>
              <code>{detector.example}</code>
              <p>{detector.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="limitations-section" aria-labelledby="limits-title">
        <div>
          <p className="eyebrow">Honest limits</p>
          <h2 id="limits-title">Reduces sharing risk; does not replace manual review.</h2>
        </div>
        <ul className="limits-list">
          <li>Low-contrast, rotated, cropped, or stylized text can evade OCR or pattern checks.</li>
          <li>
            Faces, diagrams, custom IDs, and visual secrets require manual rectangle redaction.
          </li>
          <li>
            Pixelation is only safe when the export renderer applies irreversible blocks to a fresh
            canvas.
          </li>
          <li>Always inspect the final preview before publishing or attaching a screenshot.</li>
        </ul>
      </section>

      <section className="faq-section" aria-labelledby="faq-title">
        <p className="eyebrow">FAQ</p>
        <h2 id="faq-title">Privacy and workflow details.</h2>
        <div className="faq-list">
          {faqItems.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-cta" aria-labelledby="final-cta-title">
        <div>
          <p className="eyebrow">Ready when your screenshot is</p>
          <h2 id="final-cta-title">Open the editor, mark what matters, export a safer copy.</h2>
        </div>
        <button
          type="button"
          className="primary-cta primary-cta--light"
          onClick={onStartEditing}
          disabled={!appReady}
        >
          Start redacting locally
        </button>
      </section>
    </div>
  );
}
