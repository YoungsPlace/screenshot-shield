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
        <a className="story-link" href="./launch.html">
          {copy.hero.launchStory}
        </a>
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
          <p className="eyebrow">{copy.hero.eyebrow}</p>
          <h1 id="hero-title">{copy.hero.title}</h1>
          <p className="hero-lede">{copy.hero.lede}</p>
          <div className="hero-actions" aria-label="Primary actions">
            <button
              type="button"
              className="primary-cta"
              onClick={onStartEditing}
              disabled={!appReady}
            >
              {appReady ? copy.hero.primaryCta : copy.hero.primaryCtaLoading}
            </button>
            <a className="secondary-link" href="#privacy-proof">
              {copy.hero.secondaryLink}
            </a>
          </div>
          <ul className="trust-strip" aria-label="Product safeguards">
            {copy.hero.trustBadges.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <RedactionDemo locale={locale} copy={copy.demo} />
      </section>

      <section className="proof-panel" id="privacy-proof" aria-labelledby="privacy-title">
        <div>
          <p className="eyebrow">{copy.proof.eyebrow}</p>
          <h2 id="privacy-title">{copy.proof.heading}</h2>
        </div>
        <div className="proof-grid">
          {copy.proof.items.map((item) => (
            <article key={item.step}>
              <span className="proof-icon" aria-hidden="true">
                {item.step}
              </span>
              <h3>{item.heading}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-section" aria-labelledby="workflow-title">
        <p className="eyebrow">{copy.workflow.eyebrow}</p>
        <h2 id="workflow-title">{copy.workflow.heading}</h2>
        <div className="step-list">
          {copy.workflow.steps.map((step, index) => (
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
          <p className="eyebrow">{copy.detectors.eyebrow}</p>
          <h2 id="detectors-title">{copy.detectors.heading}</h2>
          <p>{copy.detectors.intro}</p>
        </div>
        <div className="detector-grid">
          {copy.detectors.items.map((detector) => (
            <article className="detector-card" key={detector.label}>
              <h3>{detector.label}</h3>
              <code>{detector.example}</code>
              <span className="sr-only">{detector.note}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="limitations-section" aria-labelledby="limits-title">
        <div>
          <p className="eyebrow">{copy.limitations.eyebrow}</p>
          <h2 id="limits-title">{copy.limitations.heading}</h2>
        </div>
        <ul className="limits-list">
          {copy.limitations.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="faq-section" aria-labelledby="faq-title">
        <p className="eyebrow">{copy.faq.eyebrow}</p>
        <h2 id="faq-title">{copy.faq.heading}</h2>
        <div className="faq-list">
          {copy.faq.items.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-cta" aria-labelledby="final-cta-title">
        <div>
          <p className="eyebrow">{copy.finalCta.eyebrow}</p>
          <h2 id="final-cta-title">{copy.finalCta.heading}</h2>
        </div>
        <button
          type="button"
          className="primary-cta primary-cta--light"
          onClick={onStartEditing}
          disabled={!appReady}
        >
          {copy.finalCta.button}
        </button>
      </section>
    </div>
  );
}
