import { useRef } from 'react';
import { ScreenshotEditor } from './editor/ScreenshotEditor';
import './styles.css';

function FallbackMarketing({ onStartEditing }: { onStartEditing: () => void }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div>
        <p className="eyebrow">Browser-only screenshot privacy</p>
        <h1 id="hero-title">Redact before screenshots leave your desk.</h1>
        <p>
          Screenshot Shield helps you cover emails, tokens, URLs, payment-card-like numbers, IP
          addresses, and any manual area locally in your browser. Detection suggestions are review aids,
          not guarantees.
        </p>
        <div className="hero-actions">
          <button className="primary" type="button" onClick={onStartEditing}>
            Open the editor
          </button>
          <a className="button-like" href="#privacy-model">
            See privacy model
          </a>
        </div>
        <ul className="local-proof" aria-label="Local privacy guarantees">
          <li>No upload endpoint</li>
          <li>No remote fonts or analytics</li>
          <li>Fresh canvas export strips original bytes</li>
        </ul>
      </div>
      <div className="demo-card" aria-label="Before and after redaction demonstration">
        <h2>Before → after</h2>
        <div className="demo-grid">
          <div className="fake-shot" aria-label="Unredacted synthetic screenshot">
            <span>support@example.com</span>
            <span>https://app.local/account?token=abc123</span>
            <span>card 4242 4242 4242 4242</span>
            <span className="fake-line short" />
          </div>
          <div className="fake-shot" aria-label="Redacted synthetic screenshot">
            <span className="fake-line secret">support@example.com</span>
            <span className="fake-line secret">query token covered</span>
            <span className="fake-line secret">card covered</span>
            <span className="fake-line short" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductNotes() {
  return (
    <section id="privacy-model" className="info-grid" aria-label="Product details">
      <article className="stat-card">
        <h2>Local-only pipeline</h2>
        <p>Paste, drop, detect, redact, and export happen in browser memory. Source image bytes are never persisted by the app.</p>
      </article>
      <article className="stat-card">
        <h2>Manual fallback first</h2>
        <p>Draw rectangles over any area. Optional OCR suggestions can fail without blocking manual redaction.</p>
      </article>
      <article className="stat-card">
        <h2>Irreversible export</h2>
        <p>Opaque covers are the default. Pixelation is darkened and flattened into a fresh PNG or JPEG canvas export.</p>
      </article>
    </section>
  );
}

export default function App() {
  const editorRef = useRef<HTMLElement | null>(null);
  const focusEditor = () => {
    editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      const picker = editorRef.current?.querySelector<HTMLButtonElement>('button, [href], input');
      picker?.focus();
    }, 100);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#editor">
        Skip to editor
      </a>
      <FallbackMarketing onStartEditing={focusEditor} />
      <main ref={editorRef}>
        <ScreenshotEditor />
        <ProductNotes />
      </main>
    </div>
  );
}
