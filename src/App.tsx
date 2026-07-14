import { useCallback, useEffect, useRef, useState } from 'react';

import { ScreenshotEditor } from './editor/ScreenshotEditor';
import {
  applicationCopy,
  buildLocaleHref,
  buildRouteSearch,
  isCanonicalExplicitLocale,
  isInstalledLocaleResolver,
  LocaleNavigation,
  MarketingLanding,
  parseRoute,
  readInstalledLocale,
  runtimeMetadata,
  toPublicLocale,
  type Locale,
  type ParsedRoute,
  writeInstalledLocale,
} from './marketing';

type RouteResolution = {
  readonly route: ParsedRoute;
  readonly hash: string;
  readonly shouldWritePreference: boolean;
  readonly wasNormalized: boolean;
};

function replaceCurrentSearch(search: string): void {
  window.history.replaceState(
    window.history.state,
    '',
    `${window.location.pathname}${search}${window.location.hash}`,
  );
}

let normalizedInitialRoute: RouteResolution | null = null;

function resolveCurrentRoute(): RouteResolution {
  if (typeof window === 'undefined') {
    return {
      route: parseRoute(''),
      hash: '',
      shouldWritePreference: false,
      wasNormalized: false,
    };
  }

  const sourceRoute = parseRoute(window.location.search);

  if (isInstalledLocaleResolver(sourceRoute)) {
    const search = buildRouteSearch({
      mode: 'editor',
      installed: true,
      localeTag: readInstalledLocale(),
    });
    replaceCurrentSearch(search);
    return {
      route: parseRoute(search),
      hash: window.location.hash,
      shouldWritePreference: false,
      wasNormalized: true,
    };
  }

  if (sourceRoute.needsCanonicalization) {
    replaceCurrentSearch(sourceRoute.canonicalSearch);
  }

  return {
    route: sourceRoute.needsCanonicalization
      ? parseRoute(sourceRoute.canonicalSearch)
      : sourceRoute,
    hash: window.location.hash,
    shouldWritePreference: sourceRoute.mode !== 'embed' && isCanonicalExplicitLocale(sourceRoute),
    wasNormalized: sourceRoute.needsCanonicalization,
  };
}

function resolveInitialRoute(): RouteResolution {
  if (normalizedInitialRoute) return normalizedInitialRoute;

  const resolution = resolveCurrentRoute();
  if (resolution.wasNormalized) {
    normalizedInitialRoute = resolution;
    queueMicrotask(() => {
      normalizedInitialRoute = null;
    });
  }

  return resolution;
}

export default function App() {
  const editorRef = useRef<HTMLElement | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [resolution, setResolution] = useState<RouteResolution>(resolveInitialRoute);
  const { route, hash, shouldWritePreference } = resolution;

  const focusEditorHeading = useCallback((preventScroll = true) => {
    const focus = () => {
      const heading = editorRef.current?.querySelector<HTMLElement>('#editor-title');
      if (!heading) return;
      heading.tabIndex = -1;
      heading.focus({ preventScroll });
    };

    if (typeof window === 'undefined') return;
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(focus);
      return;
    }
    focus();
  }, []);

  const openEditorFromLanding = useCallback(() => {
    setEditorOpen(true);
    focusEditorHeading();
  }, [focusEditorHeading]);
  const openEditorFromSkipLink = useCallback(() => {
    setEditorOpen(true);
    focusEditorHeading(false);
  }, [focusEditorHeading]);

  const localeHref = useCallback(
    (locale: Locale) => buildLocaleHref(route, locale, hash),
    [hash, route],
  );

  const navigateLocale = useCallback(
    (locale: Locale) => {
      if (typeof window === 'undefined' || route.mode === 'embed') return;

      writeInstalledLocale(locale);

      const href = buildLocaleHref(route, locale, window.location.hash);
      window.history.pushState(window.history.state, '', `${window.location.pathname}${href}`);
      setResolution({
        route: parseRoute(window.location.search),
        hash: window.location.hash,
        shouldWritePreference: false,
        wasNormalized: false,
      });
    },
    [route],
  );

  useEffect(() => {
    if (!shouldWritePreference) return;
    writeInstalledLocale(route.locale);
  }, [route.locale, shouldWritePreference]);

  useEffect(() => {
    const metadata = runtimeMetadata[route.locale];
    document.documentElement.lang = toPublicLocale(route.locale);
    document.title = metadata.title;
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute('content', metadata.description);
  }, [route.locale]);

  useEffect(() => {
    const reparse = () => setResolution(resolveCurrentRoute());
    const updateHash = () =>
      setResolution((current) => ({
        ...current,
        hash: window.location.hash,
        shouldWritePreference: false,
      }));

    window.addEventListener('popstate', reparse);
    window.addEventListener('hashchange', updateHash);
    return () => {
      window.removeEventListener('popstate', reparse);
      window.removeEventListener('hashchange', updateHash);
    };
  }, []);

  useEffect(() => {
    if (route.mode !== 'marketing') focusEditorHeading();
  }, [focusEditorHeading, route.locale, route.mode]);

  if (route.mode === 'embed') {
    return (
      <div className="app-shell app-shell--embedded">
        <main ref={editorRef} id="editor-app">
          <ScreenshotEditor locale={route.locale} />
        </main>
      </div>
    );
  }

  if (route.mode === 'editor') {
    return (
      <div className="app-shell">
        <LocaleNavigation
          locale={route.locale}
          localeHref={localeHref}
          onLocaleChange={navigateLocale}
        />
        <main ref={editorRef} id="editor-app">
          <ScreenshotEditor locale={route.locale} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#editor-app"
        onClick={(event) => {
          event.preventDefault();
          openEditorFromSkipLink();
        }}
      >
        {applicationCopy[route.locale].skipToEditor}
      </a>
      <MarketingLanding
        locale={route.locale}
        localeHref={localeHref}
        onLocaleChange={navigateLocale}
        onStartEditing={openEditorFromLanding}
      />
      <main ref={editorRef} id="editor-app" hidden={!editorOpen}>
        <ScreenshotEditor locale={route.locale} />
      </main>
    </div>
  );
}
