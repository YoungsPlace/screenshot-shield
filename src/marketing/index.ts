export { MarketingLanding } from './MarketingLanding';
export type { MarketingLandingProps } from './MarketingLanding';
export { MarketingShell } from './MarketingShell';
export type { MarketingShellProps } from './MarketingShell';
export { RedactionDemo } from './RedactionDemo';

// i18n contract — consume these in Lane A components and in tests
export type { Locale, MarketingCopy, DetectorItem, FaqItem, WorkflowStep, ProofItem } from './i18n';
export { localeOptions, detectInitialLocale, marketingCopy } from './i18n';

// Backward-compatible English-default named exports (proxied through content.ts → i18n.ts)
export { detectorItems, faqItems, workflowSteps } from './content';
