import { useEffect, useState } from 'react';

import '../styles/marketing.css';
import { type Locale, detectInitialLocale, localeOptions, marketingCopy } from './i18n';
import { RedactionDemo } from './RedactionDemo';

export type MarketingLandingProps = {
  readonly onStartEditing: () => void;
  readonly appReady?: boolean;
};

export function MarketingLanding({ onStartEditing, appReady = true }: MarketingLandingProps) {
  const [locale, setLocale] = useState<Locale>(detectInitialLocale);
  const copy = marketingCopy[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <div className="marketing-shell" id="top">
      <nav className="lang-switcher" aria-label="Language / 언어 / 语言">
        {localeOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={locale === opt.value ? 'lang-btn lang-btn--active' : 'lang-btn'}
            aria-pressed={locale === opt.value}
            onClick={() => setLocale(opt.value)}
          >
            {opt.shortLabel}
          </button>
        ))}
      </nav>

      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">{copy.heroEyebrow}</p>
          <h1 id="hero-title">{copy.heroHeadline}</h1>
          <p className="hero-lede">{copy.heroLede}</p>
          <div className="hero-actions" aria-label="Primary actions">
            <button
              type="button"
              className="primary-cta"
              onClick={onStartEditing}
              disabled={!appReady}
            >
              {appReady ? copy.ctaPrimary : copy.ctaLoading}
            </button>
            <a className="secondary-link" href="#privacy-proof">
              {copy.ctaSecondary}
            </a>
          </div>
          <ul className="trust-strip" aria-label="Product safeguards">
            {copy.trust.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <RedactionDemo locale={locale} copy={copy} />
      </section>

      <section className="proof-panel" id="privacy-proof" aria-labelledby="privacy-title">
        <div>
          <p className="eyebrow">{copy.proofEyebrow}</p>
          <h2 id="privacy-title">{copy.proofHeadline}</h2>
        </div>
        <div className="proof-grid">
          {copy.proofItems.map((item) => (
            <article key={item.num}>
              <span className="proof-icon" aria-hidden="true">
                {item.num}
              </span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-section" aria-labelledby="workflow-title">
        <p className="eyebrow">{copy.workflowEyebrow}</p>
        <h2 id="workflow-title">{copy.workflowHeadline}</h2>
        <div className="step-list">
          {copy.workflowSteps.map((step, index) => (
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
          <p className="eyebrow">{copy.detectorsEyebrow}</p>
          <h2 id="detectors-title">{copy.detectorsHeadline}</h2>
          <p>{copy.detectorsLede}</p>
        </div>
        <div className="detector-grid">
          {copy.detectorItems.map((detector) => (
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
          <p className="eyebrow">{copy.limitsEyebrow}</p>
          <h2 id="limits-title">{copy.limitsHeadline}</h2>
        </div>
        <ul className="limits-list">
          {copy.limits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="faq-section" aria-labelledby="faq-title">
        <p className="eyebrow">{copy.faqEyebrow}</p>
        <h2 id="faq-title">{copy.faqHeadline}</h2>
        <div className="faq-list">
          {copy.faqItems.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-cta" aria-labelledby="final-cta-title">
        <div>
          <p className="eyebrow">{copy.finalEyebrow}</p>
          <h2 id="final-cta-title">{copy.finalHeadline}</h2>
        </div>
        <button
          type="button"
          className="primary-cta primary-cta--light"
          onClick={onStartEditing}
          disabled={!appReady}
        >
          {copy.finalCta}
        </button>
      </section>
    </div>
  );
}
