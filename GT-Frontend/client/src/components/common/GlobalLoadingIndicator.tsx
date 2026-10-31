import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { subscribeLoading } from '../../services/loadingTracker';

/** Wait this long before showing anything, so fast requests do not flash. */
const SHOW_AFTER_MS = 300;
/** After this long, tell the user it is taking more time than usual. */
const SLOW_AFTER_MS = 5000;

/**
 * A thin progress bar at the top of the page plus a small message while
 * any request is still loading. The message is also announced to screen
 * readers through a polite live region.
 */
function GlobalLoadingIndicator() {
  const { t } = useTranslation();
  const [pending, setPending] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(
    () =>
      subscribeLoading((count, customMessage) => {
        setPending(count);
        setMessage(customMessage);
      }),
    [],
  );

  useEffect(() => {
    if (pending === 0) {
      setVisible(false);
      setSlow(false);
      return;
    }

    const showTimer = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    const slowTimer = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(slowTimer);
    };
  }, [pending > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const text = message
    ? message
    : slow
      ? t('common.loadingSlow')
      : t('common.loading');

  return (
    <>
      <div
        className={`gt-global-progress${visible ? ' is-visible' : ''}`}
        aria-hidden="true"
      >
        <span />
      </div>

      <div className="gt-visually-hidden" role="status" aria-live="polite">
        {visible ? text : ''}
      </div>

      {visible && (slow || message) && (
        <div className="gt-global-loading-toast" aria-hidden="true">
          <span className="gt-global-loading-spinner" />
          {text}
        </div>
      )}
    </>
  );
}

export default GlobalLoadingIndicator;
