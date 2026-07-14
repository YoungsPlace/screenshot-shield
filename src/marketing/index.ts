export { LocaleNavigation, MarketingLanding } from './MarketingLanding';
export type { MarketingLandingProps } from './MarketingLanding';
export { MarketingShell } from './MarketingShell';
export type { MarketingShellProps } from './MarketingShell';
export { RedactionDemo } from './RedactionDemo';

// i18n contract — consume these in Lane A components and in tests
export type {
  DetectorItem,
  FaqItem,
  Locale,
  LocaleSource,
  MarketingCopy,
  ParsedRoute,
  ProofItem,
  PublicLocale,
  RouteBuildOptions,
  RouteMode,
  WorkflowStep,
} from './i18n';
export {
  applicationCopy,
  buildLocaleHref,
  buildRouteSearch,
  detectInitialLocale,
  fromPublicLocale,
  installedLocaleStorageKey,
  isCanonicalExplicitLocale,
  isInstalledLocaleResolver,
  isPublicLocale,
  localeOptions,
  marketingCopy,
  parseRoute,
  normalizeRouteSearch,
  readInstalledLocale,
  runtimeMetadata,
  toPublicLocale,
  writeInstalledLocale,
} from './i18n';

// Backward-compatible English-default named exports (proxied through content.ts → i18n.ts)
export { detectorItems, faqItems, workflowSteps } from './content';
