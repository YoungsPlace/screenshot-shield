import { type MouseEvent } from 'react';

import '../styles/marketing.css';
import { type Locale, localeOptions, marketingCopy } from './i18n';
import { RedactionDemo } from './RedactionDemo';

type LocaleNavigationProps = {
  readonly locale: Locale;
  readonly localeHref: (locale: Locale) => string;
  readonly onLocaleChange: (locale: Locale) => void;
  readonly launchStory?: string;
};

export type MarketingLandingProps = {
  readonly locale: Locale;
  readonly localeHref: (locale: Locale) => string;
  readonly onLocaleChange: (locale: Locale) => void;
  readonly onStartEditing: () => void;
  readonly appReady?: boolean;
};

function isUnmodifiedPrimaryClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.button === 0 &&
    !event.defaultPrevented &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
}

export function LocaleNavigation({
  locale,
  localeHref,
  onLocaleChange,
  launchStory,
}: LocaleNavigationProps) {
  return (
    <nav className="lang-switcher" aria-label="Language / 언어 / 语言">
      {launchStory ? (
        <a className="story-link" href="./launch.html">
          {launchStory}
        </a>
      ) : null}
      {localeOptions.map((option) => (
        <a
          key={option.value}
          className={locale === option.value ? 'lang-btn lang-btn--active' : 'lang-btn'}
          href={localeHref(option.value)}
          aria-current={locale === option.value ? 'page' : undefined}
          aria-label={option.label}
          onClick={(event) => {
            if (!isUnmodifiedPrimaryClick(event)) return;
            event.preventDefault();
            onLocaleChange(option.value);
          }}
        >
          {option.shortLabel}
        </a>
      ))}
    </nav>
  );
}

export function MarketingLanding({
  locale,
  localeHref,
  onLocaleChange,
  onStartEditing,
  appReady = true,
}: MarketingLandingProps) {
  const copy = marketingCopy[locale];

  return (
    <div className="marketing-shell" id="top">
      <LocaleNavigation
        locale={locale}
        localeHref={localeHref}
        onLocaleChange={onLocaleChange}
        launchStory={copy.hero.launchStory}
      />

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
