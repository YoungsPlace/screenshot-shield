import { useId, useState } from 'react';

import type { Locale, MarketingCopy } from './i18n';

type DemoMode = 'before' | 'after';

type DemoCopy = MarketingCopy['demo'];

export type RedactionDemoProps = {
  readonly locale: Locale;
  readonly copy: DemoCopy;
};

export function RedactionDemo({ locale, copy }: RedactionDemoProps) {
  const [mode, setMode] = useState<DemoMode>('after');
  const labelId = useId();
  const isAfter = mode === 'after';

  return (
    <section className="redaction-demo" aria-labelledby={labelId} lang={locale}>
      <div className="demo-card__header">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id={labelId}>{copy.heading}</h2>
        </div>
        <div className="demo-toggle" role="group" aria-label={copy.previewGroupLabel}>
          <button
            type="button"
            className={mode === 'before' ? 'is-active' : undefined}
            aria-pressed={mode === 'before'}
            onClick={() => setMode('before')}
          >
            {copy.toggleBefore}
          </button>
          <button
            type="button"
            className={mode === 'after' ? 'is-active' : undefined}
            aria-pressed={mode === 'after'}
            onClick={() => setMode('after')}
          >
            {copy.toggleAfter}
          </button>
        </div>
      </div>

      <div
        className="browser-frame"
        aria-label={`${isAfter ? copy.toggleAfter : copy.toggleBefore} ${copy.screenshotLabel}`}
      >
        <div className="browser-chrome" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="synthetic-window">
          <div className="window-sidebar" aria-hidden="true">
            <strong>Shield</strong>
            {copy.sidebarItems.map((item, index) => (
              <span className={index === 0 ? 'nav-pill is-current' : 'nav-pill'} key={item}>
                {item}
              </span>
            ))}
          </div>
          <div className="window-content">
            <div className="window-title-row">
              <span>{copy.documentTitle}</span>
              <span className="status-chip">{copy.status}</span>
            </div>
            <div className="data-table" aria-hidden="true">
              {copy.rows.map((row) => (
                <div className="data-row" key={row.label}>
                  <span>{row.label}</span>
                  <span className={row.sensitive && isAfter ? 'redacted-value' : undefined}>
                    {row.sensitive && isAfter ? copy.redactedValue : row.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="demo-annotation">
              <span className="scan-line" />
              <p>{isAfter ? copy.annotationAfter : copy.annotationBefore}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
