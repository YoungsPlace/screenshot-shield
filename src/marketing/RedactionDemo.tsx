import { useId, useState } from 'react';

import type { Locale, MarketingCopy } from './i18n';

type DemoMode = 'before' | 'after';

type DemoCopy = Pick<
  MarketingCopy,
  | 'demoEyebrow'
  | 'demoTitle'
  | 'demoBefore'
  | 'demoAfter'
  | 'demoAnnotationBefore'
  | 'demoAnnotationAfter'
>;

export type RedactionDemoProps = {
  readonly locale: Locale;
  readonly copy: DemoCopy;
};

const syntheticRows = [
  { label: 'Owner', value: 'Mina Park' },
  { label: 'Email', value: 'mina.park@example.test', sensitive: true },
  { label: 'Phone', value: '+1 (415) 555-0198', sensitive: true },
  { label: 'Deploy URL', value: 'console.example.test/run?token=demo-secret', sensitive: true },
  { label: 'Public note', value: 'Share launch crop with design review' },
] as const;

export function RedactionDemo({ locale: _locale, copy }: RedactionDemoProps) {
  const [mode, setMode] = useState<DemoMode>('after');
  const labelId = useId();
  const isAfter = mode === 'after';

  return (
    <section className="redaction-demo" aria-labelledby={labelId}>
      <div className="demo-card__header">
        <div>
          <p className="eyebrow">{copy.demoEyebrow}</p>
          <h2 id={labelId}>{copy.demoTitle}</h2>
        </div>
        <div className="demo-toggle" role="group" aria-label="Choose preview state">
          <button
            type="button"
            className={mode === 'before' ? 'is-active' : undefined}
            aria-pressed={mode === 'before'}
            onClick={() => setMode('before')}
          >
            {copy.demoBefore}
          </button>
          <button
            type="button"
            className={mode === 'after' ? 'is-active' : undefined}
            aria-pressed={mode === 'after'}
            onClick={() => setMode('after')}
          >
            {copy.demoAfter}
          </button>
        </div>
      </div>

      <div
        className="browser-frame"
        aria-label={`${isAfter ? copy.demoAfter : copy.demoBefore} synthetic screenshot`}
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
              <p>{isAfter ? copy.demoAnnotationAfter : copy.demoAnnotationBefore}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
