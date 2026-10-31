import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Keeps the browser tab title, the page language and the description
 * meta tags in sync with the current page and the selected language.
 */

const PAGE_TITLE_KEYS: Array<[RegExp, string]> = [
  [/^\/flights\/?$/, 'nav.flights'],
  [/^\/hotels\/[^/]+/, 'meta.hotelDetail'],
  [/^\/hotels\/?$/, 'nav.hotels'],
  [/^\/restaurants\/[^/]+/, 'meta.restaurantDetail'],
  [/^\/restaurants\/?$/, 'nav.restaurants'],
  [/^\/cars\/[^/]+/, 'meta.carDetail'],
  [/^\/cars\/?$/, 'nav.cars'],
  [/^\/wishlist\/?$/, 'nav.wishlist'],
  [/^\/dashboard\/?$/, 'nav.dashboard'],
  [/^\/travel-plan\/?$/, 'nav.travelPlan'],
];

const OG_LOCALES: Record<string, string> = {
  es: 'es_CR',
  en: 'en_US',
  pt: 'pt_BR',
};

function setMeta(selector: string, content: string) {
  const element = document.head.querySelector<HTMLMetaElement>(selector);
  if (element) {
    element.setAttribute('content', content);
  }
}

function DocumentMeta() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? i18n.language ?? 'es').split(
    '-',
  )[0];

  useEffect(() => {
    const siteName = t('meta.siteName');
    const match = PAGE_TITLE_KEYS.find(([pattern]) => pattern.test(pathname));
    const isHome = pathname === '/' || pathname === '';

    let title: string;
    if (isHome) {
      title = `${siteName} | ${t('meta.tagline')}`;
    } else if (match) {
      title = `${t(match[1])} | ${siteName}`;
    } else {
      title = `${t('meta.notFound')} | ${siteName}`;
    }

    const description = t('meta.description');

    document.title = title;
    document.documentElement.lang = language;
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', window.location.href);
    setMeta('meta[property="og:locale"]', OG_LOCALES[language] ?? 'es_CR');
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
  }, [pathname, language, t]);

  return null;
}

export default DocumentMeta;
