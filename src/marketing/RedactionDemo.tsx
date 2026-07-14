import { useId, useState } from 'react';

type DemoMode = 'before' | 'after';

const syntheticRows = [
  { label: 'Owner', value: 'Mina Park' },
  { label: 'Email', value: 'mina.park@example.test', sensitive: true },
  { label: 'Phone', value: '+1 (415) 555-0198', sensitive: true },
  { label: 'Deploy URL', value: 'console.example.test/run?token=demo-secret', sensitive: true },
  { label: 'Public note', value: 'Share launch crop with design review' },
] as const;

export function RedactionDemo() {
  const [mode, setMode] = useState<DemoMode>('after');
  const labelId = useId();
  const isAfter = mode === 'after';

  return (
    <section className="redaction-demo" aria-labelledby={labelId}>
      <div className="demo-card__header">
        <div>
          <p className="eyebrow">Synthetic preview</p>
          <h2 id={labelId}>See the share-safe version first</h2>
        </div>
        <div className="demo-toggle" role="group" aria-label="Choose preview state">
          <button
            type="button"
            className={mode === 'before' ? 'is-active' : undefined}
            aria-pressed={mode === 'before'}
            onClick={() => setMode('before')}
          >
            Before
          </button>
          <button
            type="button"
            className={mode === 'after' ? 'is-active' : undefined}
            aria-pressed={mode === 'after'}
            onClick={() => setMode('after')}
          >
            After
          </button>
        </div>
      </div>

      <div
        className="browser-frame"
        aria-label={`${isAfter ? 'Redacted' : 'Unredacted'} synthetic screenshot`}
      >
        <div className="browser-chrome" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="synthetic-window">
          <div className="window-sidebar" aria-hidden="true">
            <strong>Shield</strong>
            <span className="nav-pill is-current">Incident brief</span>
            <span className="nav-pill">Exports</span>
            <span className="nav-pill">Review</span>
          </div>
          <div className="window-content">
            <div className="window-title-row">
              <span>Launch support packet</span>
              <span className="status-chip">Local draft</span>
            </div>
            <div className="data-table" aria-hidden="true">
              {syntheticRows.map((row) => (
                <div className="data-row" key={row.label}>
                  <span>{row.label}</span>
                  <span
                    className={
                      'sensitive' in row && row.sensitive && isAfter ? 'redacted-value' : undefined
                    }
                  >
                    {'sensitive' in row && row.sensitive && isAfter ? 'Redacted' : row.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="demo-annotation">
              <span className="scan-line" />
              <p>
                {isAfter
                  ? 'Opaque marks replace sensitive regions in the preview and export.'
                  : 'Sensitive text remains visible until you review suggestions and add regions.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
