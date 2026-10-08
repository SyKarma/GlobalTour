import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useSearchParams,
} from 'react-router-dom';

import {
  useTranslation,
} from 'react-i18next';

import i18n from '../i18n';

import FlightSearchEditor from '../components/flights/FlightSearchEditor';
import WishlistHeart from '../components/wishlist/WishlistHeart';

import {
  searchFlights,
} from '../services/flights.service';

import {
  useCurrency,
} from '../hooks/useCurrency';

import flightHeroImage from '../assets/visuals/flight-hero.png';

import type {
  FlightOffer,
  FlightResponseMeta,
} from '../types/flight.types';

type StopsFilter =
  | 'all'
  | 'direct'
  | 'stops';

type SortOption =
  | 'recommended'
  | 'price-asc'
  | 'price-desc'
  | 'duration-asc';

function getLocale() {
  const language = (
    i18n.resolvedLanguage ??
    i18n.language ??
    'es'
  ).split('-')[0];

  if (
    language ===
    'en'
  ) {
    return 'en-US';
  }

  if (
    language ===
    'pt'
  ) {
    return 'pt-BR';
  }

  return 'es-CR';
}

function formatTime(
  date:
    | string
    | null,
) {
  if (!date) {
    return '--:--';
  }

  const match =
    date.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/,
    );

  if (!match) {
    return '--:--';
  }

  const [
    ,
    ,
    ,
    ,
    hourString,
    minuteString,
  ] = match;

  const dateValue =
    new Date(
      Date.UTC(
        2000,
        0,
        1,
        Number(
          hourString,
        ),
        Number(
          minuteString,
        ),
      ),
    );

  return new Intl.DateTimeFormat(
    getLocale(),
    {
      hour:
        '2-digit',

      minute:
        '2-digit',

      timeZone:
        'UTC',
    },
  ).format(
    dateValue,
  );
}

function formatDate(
  date:
    | string
    | null,
) {
  if (!date) {
    return '';
  }

  const match =
    date.match(
      /^(\d{4})-(\d{2})-(\d{2})/,
    );

  if (!match) {
    return '';
  }

  const [
    ,
    year,
    month,
    day,
  ] = match;

  const dateValue =
    new Date(
      Date.UTC(
        Number(year),
        Number(month) -
          1,
        Number(day),
      ),
    );

  return new Intl.DateTimeFormat(
    getLocale(),
    {
      day:
        '2-digit',

      month:
        'short',

      year:
        'numeric',

      timeZone:
        'UTC',
    },
  ).format(
    dateValue,
  );
}

function formatDuration(
  minutes:
    | number
    | null,
) {
  if (
    minutes ===
    null
  ) {
    return i18n.t(
      'flights.format.durationUnavailable',
    );
  }

  const hours =
    Math.floor(
      minutes /
        60,
    );

  const remainingMinutes =
    minutes %
    60;

  return `${hours}h ${remainingMinutes}min`;
}

function formatTransfers(
  transfers:
    number,
) {
  if (
    transfers ===
    0
  ) {
    return i18n.t(
      'flights.format.direct',
    );
  }

  if (
    transfers ===
    1
  ) {
    return i18n.t(
      'flights.format.oneStop',
    );
  }

  return i18n.t(
    'flights.format.multipleStops',
    {
      count:
        transfers,
    },
  );
}

function formatAirlineName(
  name:
    | string
    | null,
) {
  if (!name) {
    return i18n.t(
      'flights.format.airline',
    );
  }

  return name
    .toLowerCase()
    .replace(
      /\b\w/g,
      (
        letter,
      ) =>
        letter.toUpperCase(),
    );
}

function formatPrice(
  price:
    number,
  currency:
    string,
) {
  try {
    return new Intl.NumberFormat(
      getLocale(),
      {
        style:
          'currency',

        currency,

        maximumFractionDigits:
          0,
      },
    ).format(
      price,
    );
  } catch {
    return `${currency} ${Math.round(
      price,
    )}`;
  }
}

function formatFallbackPeriod(
  period?:
    string,
) {
  if (!period) {
    return '';
  }

  const dayMatch =
    period.match(
      /^(\d{4})-(\d{2})-(\d{2})$/,
    );

  if (
    dayMatch
  ) {
    const [
      ,
      year,
      month,
      day,
    ] =
      dayMatch;

    const dateValue =
      new Date(
        Date.UTC(
          Number(year),
          Number(month) -
            1,
          Number(day),
        ),
      );

    return new Intl.DateTimeFormat(
      getLocale(),
      {
        day:
          'numeric',

        month:
          'long',

        year:
          'numeric',

        timeZone:
          'UTC',
      },
    ).format(
      dateValue,
    );
  }

  const monthMatch =
    period.match(
      /^(\d{4})-(\d{2})$/,
    );

  if (
    monthMatch
  ) {
    const [
      ,
      year,
      month,
    ] =
      monthMatch;

    const dateValue =
      new Date(
        Date.UTC(
          Number(year),
          Number(month) -
            1,
          1,
        ),
      );

    return new Intl.DateTimeFormat(
      getLocale(),
      {
        month:
          'long',

        year:
          'numeric',

        timeZone:
          'UTC',
      },
    ).format(
      dateValue,
    );
  }

  return period;
}

function getFallbackMessage(
  meta:
    | FlightResponseMeta
    | null,
) {
  if (
    !meta?.fallback
  ) {
    return null;
  }

  const period =
    formatFallbackPeriod(
      meta.fallbackPeriod,
    );

  switch (
    meta.fallback
  ) {
    case 'one_way':
      return {
        title:
          i18n.t(
            'flights.fallback.oneWay.title',
          ),

        description:
          period
            ? i18n.t(
                'flights.fallback.oneWay.withPeriod',
                {
                  period,
                },
              )
            : i18n.t(
                'flights.fallback.oneWay.default',
              ),
      };

    case 'one_way_month':
      return {
        title:
          i18n.t(
            'flights.fallback.oneWayMonth.title',
          ),

        description:
          period
            ? i18n.t(
                'flights.fallback.oneWayMonth.withPeriod',
                {
                  period,
                },
              )
            : i18n.t(
                'flights.fallback.oneWayMonth.default',
              ),
      };

    case 'calendar':
      return {
        title:
          i18n.t(
            'flights.fallback.calendar.title',
          ),

        description:
          period
            ? i18n.t(
                'flights.fallback.calendar.withPeriod',
                {
                  period,
                },
              )
            : i18n.t(
                'flights.fallback.calendar.default',
              ),
      };

    default:
      return null;
  }
}

function FlightsPage() {
  const {
    t,
  } =
    useTranslation();

  const [
    searchParams,
    setSearchParams,
  ] =
    useSearchParams();

  const {
    selectedCurrency,
  } =
    useCurrency();

  const [
    flights,
    setFlights,
  ] =
    useState<
      FlightOffer[]
    >([]);

  const [
    meta,
    setMeta,
  ] =
    useState<
      FlightResponseMeta | null
    >(null);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      true,
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    stopsFilter,
    setStopsFilter,
  ] =
    useState<
      StopsFilter
    >(
      'all',
    );

  const [
    selectedAirline,
    setSelectedAirline,
  ] =
    useState(
      'all',
    );

  const [
    sortOption,
    setSortOption,
  ] =
    useState<
      SortOption
    >(
      'recommended',
    );

  const origin =
    searchParams.get(
      'origin',
    );

  const destination =
    searchParams.get(
      'destination',
    );

  const departureAt =
    searchParams.get(
      'departureAt',
    );

  const returnAt =
    searchParams.get(
      'returnAt',
    );

  const currency =
    selectedCurrency;

  const hasRoute =
    Boolean(
      origin &&
        destination,
    );

  useEffect(() => {
    const urlCurrency =
      searchParams.get(
        'currency',
      );

    if (
      urlCurrency ===
      selectedCurrency
    ) {
      return;
    }

    const updatedParams =
      new URLSearchParams(
        searchParams,
      );

    updatedParams.set(
      'currency',
      selectedCurrency,
    );

    setSearchParams(
      updatedParams,
      {
        replace:
          true,
      },
    );
  }, [
    searchParams,
    selectedCurrency,
    setSearchParams,
  ]);

  useEffect(() => {
    let isCancelled =
      false;

    const loadFlights =
      async () => {
        if (
          !origin ||
          !destination
        ) {
          setFlights(
            [],
          );

          setMeta(
            null,
          );

          setError(
            null,
          );

          setIsLoading(
            false,
          );

          return;
        }

        try {
          setIsLoading(
            true,
          );

          setError(
            null,
          );

          const response =
            await searchFlights(
              {
                origin,

                destination,

                departureAt:
                  departureAt ||
                  undefined,

                returnAt:
                  returnAt ||
                  undefined,

                currency,

                limit:
                  30,
              },
            );

          if (
            isCancelled
          ) {
            return;
          }

          setFlights(
            response.data,
          );

          setMeta(
            response.meta,
          );

          setStopsFilter(
            'all',
          );

          setSelectedAirline(
            'all',
          );

          setSortOption(
            'recommended',
          );
        } catch (
          requestError
        ) {
          if (
            isCancelled
          ) {
            return;
          }

          console.error(
            'Error searching flights:',
            requestError,
          );

          setFlights(
            [],
          );

          setMeta(
            null,
          );

          setError(
            'flights.errors.loadMessage',
          );
        } finally {
          if (
            !isCancelled
          ) {
            setIsLoading(
              false,
            );
          }
        }
      };

    void loadFlights();

    return () => {
      isCancelled =
        true;
    };
  }, [
    origin,
    destination,
    departureAt,
    returnAt,
    currency,
  ]);

  const airlines =
    useMemo(() => {
      const airlineMap =
        new Map<
          string,
          string
        >();

      flights.forEach(
        (
          flight,
        ) => {
          if (
            !flight.airline
          ) {
            return;
          }

          airlineMap.set(
            flight.airline,
            formatAirlineName(
              flight.airlineName,
            ),
          );
        },
      );

      return Array.from(
        airlineMap.entries(),
      ).sort(
        (
          a,
          b,
        ) =>
          a[1].localeCompare(
            b[1],
          ),
      );
    }, [
      flights,
    ]);

  const filteredFlights =
    useMemo(() => {
      let result =
        [
          ...flights,
        ];

      if (
        stopsFilter ===
        'direct'
      ) {
        result =
          result.filter(
            (
              flight,
            ) =>
              flight.transfers ===
              0,
          );
      }

      if (
        stopsFilter ===
        'stops'
      ) {
        result =
          result.filter(
            (
              flight,
            ) =>
              flight.transfers >
              0,
          );
      }

      if (
        selectedAirline !==
        'all'
      ) {
        result =
          result.filter(
            (
              flight,
            ) =>
              flight.airline ===
              selectedAirline,
          );
      }

      if (
        sortOption ===
        'price-asc'
      ) {
        result.sort(
          (
            a,
            b,
          ) =>
            a.price -
            b.price,
        );
      }

      if (
        sortOption ===
        'price-desc'
      ) {
        result.sort(
          (
            a,
            b,
          ) =>
            b.price -
            a.price,
        );
      }

      if (
        sortOption ===
        'duration-asc'
      ) {
        result.sort(
          (
            a,
            b,
          ) =>
            (
              a.durationMinutes ??
              Number.MAX_SAFE_INTEGER
            ) -
            (
              b.durationMinutes ??
              Number.MAX_SAFE_INTEGER
            ),
        );
      }

      return result;
    }, [
      flights,
      stopsFilter,
      selectedAirline,
      sortOption,
    ]);

  const lowestPrice =
    useMemo(() => {
      if (
        flights.length ===
        0
      ) {
        return null;
      }

      return Math.min(
        ...flights.map(
          (
            flight,
          ) =>
            flight.price,
        ),
      );
    }, [
      flights,
    ]);

  const shortestDuration =
    useMemo(() => {
      const durations =
        flights
          .map(
            (
              flight,
            ) =>
              flight.durationMinutes,
          )
          .filter(
            (
              duration,
            ):
              duration is number =>
                duration !==
                null,
          );

      if (
        durations.length ===
        0
      ) {
        return null;
      }

      return Math.min(
        ...durations,
      );
    }, [
      flights,
    ]);

  const directFlights =
    useMemo(
      () =>
        flights.filter(
          (
            flight,
          ) =>
            flight.transfers ===
            0,
        ).length,
      [
        flights,
      ],
    );

  const activeFilters =
    (
      stopsFilter !==
      'all'
        ? 1
        : 0
    ) +
    (
      selectedAirline !==
      'all'
        ? 1
        : 0
    );

  const clearFilters =
    () => {
      setStopsFilter(
        'all',
      );

      setSelectedAirline(
        'all',
      );
    };

  const fallbackMessage =
    getFallbackMessage(
      meta,
    );

  return (
    <main className="gt-flights-page">

      <section className="gt-flight-split-hero">

        <div className="gt-flight-split-copy">

          <span className="gt-flights-eyebrow">
            {t(
              'flights.hero.eyebrow',
            )}
          </span>

          <h1>
            {hasRoute
              ? `${origin} → ${destination}`
              : t(
                  'flights.hero.title',
                )}
          </h1>

          <p>
            {hasRoute
              ? t(
                  'flights.hero.routeDescription',
                )
              : t(
                  'flights.hero.exploreDescription',
                )}
          </p>

          {hasRoute && (
            <div className="gt-flight-trip-meta">

              {departureAt && (
                <span>
                  <CalendarIcon />

                  {formatDate(
                    departureAt,
                  )}
                </span>
              )}

              {returnAt && (
                <span>
                  <ReturnIcon />

                  {t(
                    'flights.common.return',
                  )}{' '}

                  {formatDate(
                    returnAt,
                  )}
                </span>
              )}

              <span>
                <CurrencyIcon />

                {currency}
              </span>

            </div>
          )}

          <div className="gt-flight-split-route">

            <span>
              {origin ||
                'SJO'}
            </span>

            <div className="gt-flight-split-line">

              <span />

              <div>
                <PlaneIcon />
              </div>

              <span />

            </div>

            <span>
              {destination ||
                'MAD'}
            </span>

          </div>

        </div>

        <div className="gt-flight-split-image">

          <img
            src={
              flightHeroImage
            }
            alt={t(
              'flights.hero.imageAlt',
            )}
          />

          <div className="gt-flight-image-overlay" />

        </div>

      </section>

      {origin &&
        destination && (
          <section className="gt-flight-editor-section">

            <div className="gt-flight-search-shell">

              <div className="gt-flight-search-shell-heading">

                <div>

                  <span>
                    {t(
                      'flights.editor.eyebrow',
                    )}
                  </span>

                  <strong>
                    {t(
                      'flights.editor.title',
                    )}
                  </strong>

                </div>

              </div>

              <FlightSearchEditor
                key={`${origin}-${destination}-${departureAt}-${returnAt}`}
                initialOriginIata={
                  origin
                }
                initialDestinationIata={
                  destination
                }
                initialDepartureAt={
                  departureAt
                }
                initialReturnAt={
                  returnAt
                }
              />

            </div>

          </section>
        )}

      <div className="gt-flights-content">

        {!hasRoute && (
          <section className="gt-flight-start-state">

            <div className="gt-flight-start-icon">
              <PlaneIcon />
            </div>

            <span>
              {t(
                'flights.start.eyebrow',
              )}
            </span>

            <h2>
              {t(
                'flights.start.title',
              )}
            </h2>

            <p>
              {t(
                'flights.start.description',
              )}
            </p>

            <Link
              to="/#home-flight-search"
              className="gt-flight-primary-button"
            >
              {t(
                'flights.start.search',
              )}

              <ArrowIcon />
            </Link>

            <div className="gt-flight-start-features">

              <div>
                <strong>
                  {t(
                    'flights.start.compareTitle',
                  )}
                </strong>

                <span>
                  {t(
                    'flights.start.compareText',
                  )}
                </span>
              </div>

              <div>
                <strong>
                  {t(
                    'flights.start.filterTitle',
                  )}
                </strong>

                <span>
                  {t(
                    'flights.start.filterText',
                  )}
                </span>
              </div>

              <div>
                <strong>
                  {t(
                    'flights.start.chooseTitle',
                  )}
                </strong>

                <span>
                  {t(
                    'flights.start.chooseText',
                  )}
                </span>
              </div>

            </div>

          </section>
        )}

        {hasRoute &&
          !isLoading &&
          !error &&
          fallbackMessage && (
            <section className="gt-flight-notice">

              <div className="gt-flight-notice-icon">
                !
              </div>

              <div>
                <strong>
                  {
                    fallbackMessage.title
                  }
                </strong>

                <p>
                  {
                    fallbackMessage.description
                  }
                </p>
              </div>

            </section>
          )}

        {hasRoute &&
          isLoading && (
            <section className="gt-flight-loading">

              <div className="gt-flight-loading-heading">

                <div className="gt-flight-loader" />

                <div>

                  <h2>
                    {t(
                      'flights.loading.title',
                    )}
                  </h2>

                  <p>
                    {t(
                      'flights.loading.description',
                    )}
                  </p>

                </div>

              </div>

              <div className="gt-flight-skeleton-list">

                {[
                  1,
                  2,
                  3,
                ].map(
                  (
                    item,
                  ) => (
                    <div
                      className="gt-flight-skeleton"
                      key={
                        item
                      }
                    >
                      <div />
                      <div />
                      <div />
                    </div>
                  ),
                )}

              </div>

            </section>
          )}

        {hasRoute &&
          !isLoading &&
          error && (
            <section className="gt-flight-error-state">

              <div className="gt-flight-error-icon">
                !
              </div>

              <h2>
                {t(
                  'flights.errors.loadTitle',
                )}
              </h2>

              <p>
                {t(
                  error,
                )}
              </p>

              <Link
                to="/#home-flight-search"
                className="gt-flight-secondary-button"
              >
                {t(
                  'flights.errors.otherSearch',
                )}
              </Link>

            </section>
          )}

        {hasRoute &&
          !isLoading &&
          !error &&
          flights.length ===
            0 && (
            <section className="gt-flight-error-state">

              <div className="gt-flight-empty-icon">
                <SearchIcon />
              </div>

              <h2>
                {t(
                  'flights.empty.title',
                )}
              </h2>

              <p>
                {t(
                  'flights.empty.description',
                )}
              </p>

              <Link
                to="/#home-flight-search"
                className="gt-flight-secondary-button"
              >
                {t(
                  'flights.empty.otherRoute',
                )}
              </Link>

            </section>
          )}

        {hasRoute &&
          !isLoading &&
          !error &&
          flights.length >
            0 && (
            <>

              <section className="gt-flight-summary">

                <div className="gt-flight-summary-heading">

                  <div>

                    <span className="gt-flight-section-eyebrow">
                      {t(
                        'flights.results.eyebrow',
                      )}
                    </span>

                    <h2>
                      {t(
                        'flights.results.title',
                      )}
                    </h2>

                    <p>
                      {
                        flights.length
                      }{' '}

                      {flights.length ===
                      1
                        ? t(
                            'flights.results.optionFoundOne',
                          )
                        : t(
                            'flights.results.optionFoundMany',
                          )}
                    </p>

                  </div>

                  {meta?.stale && (
                    <span className="gt-flight-cache-badge">
                      {t(
                        'flights.results.cached',
                      )}
                    </span>
                  )}

                </div>

                <div className="gt-flight-insight-grid">

                  <div className="gt-flight-insight-card">

                    <span>
                      {t(
                        'flights.results.from',
                      )}
                    </span>

                    <strong>
                      {lowestPrice !==
                      null
                        ? formatPrice(
                            lowestPrice,
                            currency,
                          )
                        : '—'}
                    </strong>

                    <small>
                      {t(
                        'flights.results.bestPriceFound',
                      )}
                    </small>

                  </div>

                  <div className="gt-flight-insight-card">

                    <span>
                      {t(
                        'flights.results.directFlights',
                      )}
                    </span>

                    <strong>
                      {
                        directFlights
                      }
                    </strong>

                    <small>
                      {t(
                        'flights.results.nonstop',
                      )}
                    </small>

                  </div>

                  <div className="gt-flight-insight-card">

                    <span>
                      {t(
                        'flights.results.fastest',
                      )}
                    </span>

                    <strong>
                      {shortestDuration !==
                      null
                        ? formatDuration(
                            shortestDuration,
                          )
                        : '—'}
                    </strong>

                    <small>
                      {t(
                        'flights.results.shortestDuration',
                      )}
                    </small>

                  </div>

                </div>

              </section>

              <section className="gt-flight-toolbar">

                <div className="gt-flight-quick-sort">

                  <button
                    type="button"
                    className={
                      sortOption ===
                      'recommended'
                        ? 'gt-flight-sort-chip gt-flight-sort-chip-active'
                        : 'gt-flight-sort-chip'
                    }
                    onClick={() =>
                      setSortOption(
                        'recommended',
                      )
                    }
                  >
                    {t(
                      'flights.sort.recommended',
                    )}
                  </button>

                  <button
                    type="button"
                    className={
                      sortOption ===
                      'price-asc'
                        ? 'gt-flight-sort-chip gt-flight-sort-chip-active'
                        : 'gt-flight-sort-chip'
                    }
                    onClick={() =>
                      setSortOption(
                        'price-asc',
                      )
                    }
                  >
                    {t(
                      'flights.sort.cheapest',
                    )}
                  </button>

                  <button
                    type="button"
                    className={
                      sortOption ===
                      'duration-asc'
                        ? 'gt-flight-sort-chip gt-flight-sort-chip-active'
                        : 'gt-flight-sort-chip'
                    }
                    onClick={() =>
                      setSortOption(
                        'duration-asc',
                      )
                    }
                  >
                    {t(
                      'flights.sort.fastest',
                    )}
                  </button>

                </div>

                <span>
                  {
                    filteredFlights.length
                  }{' '}

                  {t(
                    'flights.results.visibleResults',
                  )}
                </span>

              </section>

              <section className="gt-flight-results-layout">

                <aside className="gt-flight-filter-panel">

                  <div className="gt-flight-filter-header">

                    <div>

                      <span>
                        {t(
                          'flights.filters.eyebrow',
                        )}
                      </span>

                      <strong>
                        {t(
                          'flights.filters.title',
                        )}
                      </strong>

                    </div>

                    {activeFilters >
                      0 && (
                      <button
                        type="button"
                        onClick={
                          clearFilters
                        }
                      >
                        {t(
                          'flights.filters.clear',
                        )}
                      </button>
                    )}

                  </div>

                  <div className="gt-flight-filter-section">

                    <strong>
                      {t(
                        'flights.filters.stops',
                      )}
                    </strong>

                    <label className="gt-flight-radio-option">

                      <input
                        type="radio"
                        name="stops"
                        checked={
                          stopsFilter ===
                          'all'
                        }
                        onChange={() =>
                          setStopsFilter(
                            'all',
                          )
                        }
                      />

                      <span>
                        {t(
                          'flights.filters.allFlights',
                        )}
                      </span>

                    </label>

                    <label className="gt-flight-radio-option">

                      <input
                        type="radio"
                        name="stops"
                        checked={
                          stopsFilter ===
                          'direct'
                        }
                        onChange={() =>
                          setStopsFilter(
                            'direct',
                          )
                        }
                      />

                      <span>
                        {t(
                          'flights.filters.directOnly',
                        )}
                      </span>

                    </label>

                    <label className="gt-flight-radio-option">

                      <input
                        type="radio"
                        name="stops"
                        checked={
                          stopsFilter ===
                          'stops'
                        }
                        onChange={() =>
                          setStopsFilter(
                            'stops',
                          )
                        }
                      />

                      <span>
                        {t(
                          'flights.filters.withStops',
                        )}
                      </span>

                    </label>

                  </div>

                  <div className="gt-flight-filter-section">

                    <label>

                      <strong>
                        {t(
                          'flights.filters.airline',
                        )}
                      </strong>

                      <select
                        value={
                          selectedAirline
                        }
                        onChange={(
                          event,
                        ) =>
                          setSelectedAirline(
                            event.target
                              .value,
                          )
                        }
                      >

                        <option value="all">
                          {t(
                            'flights.filters.allAirlines',
                          )}
                        </option>

                        {airlines.map(
                          ([
                            code,
                            name,
                          ]) => (
                            <option
                              key={
                                code
                              }
                              value={
                                code
                              }
                            >
                              {
                                name
                              }
                            </option>
                          ),
                        )}

                      </select>

                    </label>

                  </div>

                  <div className="gt-flight-filter-section">

                    <label>

                      <strong>
                        {t(
                          'flights.filters.sortBy',
                        )}
                      </strong>

                      <select
                        value={
                          sortOption
                        }
                        onChange={(
                          event,
                        ) =>
                          setSortOption(
                            event.target
                              .value as SortOption,
                          )
                        }
                      >

                        <option value="recommended">
                          {t(
                            'flights.sort.recommended',
                          )}
                        </option>

                        <option value="price-asc">
                          {t(
                            'flights.sort.lowestPrice',
                          )}
                        </option>

                        <option value="price-desc">
                          {t(
                            'flights.sort.highestPrice',
                          )}
                        </option>

                        <option value="duration-asc">
                          {t(
                            'flights.sort.shortestDuration',
                          )}
                        </option>

                      </select>

                    </label>

                  </div>

                  <div className="gt-flight-filter-info">

                    <ShieldIcon />

                    <div>

                      <strong>
                        {t(
                          'flights.filters.trustTitle',
                        )}
                      </strong>

                      <span>
                        {t(
                          'flights.filters.trustDescription',
                        )}
                      </span>

                    </div>

                  </div>

                </aside>

                <div className="gt-flight-results-column">

                  {filteredFlights.length ===
                  0 ? (
                    <section className="gt-flight-no-filter-results">

                      <SearchIcon />

                      <h3>
                        {t(
                          'flights.filters.noResultsTitle',
                        )}
                      </h3>

                      <p>
                        {t(
                          'flights.filters.noResultsDescription',
                        )}
                      </p>

                      <button
                        type="button"
                        onClick={
                          clearFilters
                        }
                      >
                        {t(
                          'flights.filters.clearFilters',
                        )}
                      </button>

                    </section>
                  ) : (
                    <div className="gt-flight-results-list">

                      {filteredFlights.map(
                        (
                          flight,
                          index,
                        ) => {
                          const isBestPrice =
                            lowestPrice !==
                              null &&
                            flight.price ===
                              lowestPrice;

                          const isFastest =
                            shortestDuration !==
                              null &&
                            flight.durationMinutes ===
                              shortestDuration;

                          const flightWishlistKey =
                            [
                              'flight',

                              flight.airline ||
                                'airline',

                              flight.flightNumber ||
                                'flight',

                              flight.origin,

                              flight.destination,

                              flight.departureAt ||
                                'departure',

                              flight.returnAt ||
                                'one-way',
                            ].join(
                              ':',
                            );

                          return (
                            <article
                              className="gt-flight-card"
                              key={`${flight.airline}-${flight.flightNumber}-${flight.departureAt}-${index}`}
                            >

                              <div className="gt-flight-card-top">

                                <div className="gt-flight-badges">

                                  {isBestPrice && (
                                    <span className="gt-flight-badge gt-flight-badge-price">
                                      {t(
                                        'flights.card.bestPrice',
                                      )}
                                    </span>
                                  )}

                                  {isFastest && (
                                    <span className="gt-flight-badge gt-flight-badge-fast">
                                      {t(
                                        'flights.results.fastest',
                                      )}
                                    </span>
                                  )}

                                  {flight.transfers ===
                                    0 && (
                                    <span className="gt-flight-badge gt-flight-badge-direct">
                                      {t(
                                        'flights.card.direct',
                                      )}
                                    </span>
                                  )}

                                </div>

                                <div className="gt-flight-card-top-actions">

                                  <span className="gt-flight-result-index">
                                    {t(
                                      'flights.card.option',
                                    )}{' '}
                                    {
                                      index +
                                      1
                                    }
                                  </span>

                                  <WishlistHeart
                                    className="gt-flight-wishlist-heart"
                                    item={{
                                      key:
                                        flightWishlistKey,

                                      type:
                                        'flight',

                                      title:
                                        `${flight.origin} → ${flight.destination}`,

                                      subtitle:
                                        formatAirlineName(
                                          flight.airlineName,
                                        ),

                                      href:
                                        `/flights?${searchParams.toString()}`,

                                      metadata: {
                                        airline:
                                          formatAirlineName(
                                            flight.airlineName,
                                          ),

                                        flightNumber:
                                          flight.flightNumber ??
                                          null,

                                        departure:
                                          formatDate(
                                            flight.departureAt,
                                          ) ||
                                          null,

                                        duration:
                                          formatDuration(
                                            flight.durationMinutes,
                                          ),

                                        stops:
                                          formatTransfers(
                                            flight.transfers,
                                          ),

                                        price:
                                          formatPrice(
                                            flight.price,
                                            flight.currency,
                                          ),
                                      },
                                    }}
                                  />

                                </div>

                              </div>

                              <div className="gt-flight-card-main">

                                <div className="gt-flight-airline">

                                  <div className="gt-airline-logo">
                                    {flight.airline
                                      ?.slice(
                                        0,
                                        2,
                                      )
                                      .toUpperCase() ||
                                      'GT'}
                                  </div>

                                  <div>

                                    <strong>
                                      {formatAirlineName(
                                        flight.airlineName,
                                      )}
                                    </strong>

                                    {flight.flightNumber && (
                                      <span>
                                        {t(
                                          'flights.card.flight',
                                        )}{' '}
                                        {
                                          flight.flightNumber
                                        }
                                      </span>
                                    )}

                                  </div>

                                </div>

                                <div className="gt-flight-route">

                                  <div className="gt-flight-route-point">

                                    <span>
                                      {
                                        origin
                                      }
                                    </span>

                                    <strong>
                                      {formatTime(
                                        flight.departureAt,
                                      )}
                                    </strong>

                                    <small>
                                      {flight.originAirport ||
                                        flight.origin}
                                    </small>

                                    <small>
                                      {formatDate(
                                        flight.departureAt,
                                      )}
                                    </small>

                                  </div>

                                  <div className="gt-flight-route-middle">

                                    <span>
                                      {formatDuration(
                                        flight.durationMinutes,
                                      )}
                                    </span>

                                    <div className="gt-flight-route-track">

                                      <span className="gt-flight-route-dot" />

                                      <div />

                                      <PlaneIcon />

                                      <div />

                                      <span className="gt-flight-route-dot" />

                                    </div>

                                    <strong>
                                      {formatTransfers(
                                        flight.transfers,
                                      )}
                                    </strong>

                                  </div>

                                  <div className="gt-flight-route-point gt-flight-route-destination">

                                    <span>
                                      {
                                        destination
                                      }
                                    </span>

                                    <strong>
                                      {
                                        destination
                                      }
                                    </strong>

                                    <small>
                                      {flight.destinationAirport ||
                                        flight.destination}
                                    </small>

                                    {flight.returnAt && (
                                      <small>
                                        {t(
                                          'flights.common.return',
                                        )}{' '}

                                        {formatDate(
                                          flight.returnAt,
                                        )}
                                      </small>
                                    )}

                                  </div>

                                </div>

                                <div className="gt-flight-price">

                                  <span>
                                    {t(
                                      'flights.results.from',
                                    )}
                                  </span>

                                  <strong>
                                    {formatPrice(
                                      flight.price,
                                      flight.currency,
                                    )}
                                  </strong>

                                  <small>
                                    {t(
                                      'flights.card.perTraveler',
                                    )}
                                  </small>

                                  {flight.deeplink ? (
                                    <a
                                      href={
                                        flight.deeplink
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="gt-flight-offer-button"
                                    >
                                      {t(
                                        'flights.card.viewOffer',
                                      )}

                                      <ArrowIcon />
                                    </a>
                                  ) : (
                                    <button
                                      type="button"
                                      className="gt-flight-offer-button"
                                      disabled
                                    >
                                      {t(
                                        'flights.card.unavailable',
                                      )}
                                    </button>
                                  )}

                                </div>

                              </div>

                              <div className="gt-flight-card-footer">

                                <span>
                                  <InfoIcon />

                                  {t(
                                    'flights.card.priceDisclaimer',
                                  )}
                                </span>

                              </div>

                            </article>
                          );
                        },
                      )}

                    </div>
                  )}

                </div>

              </section>

              {meta?.disclaimer && (
                <p className="gt-flight-disclaimer">
                  {
                    meta.disclaimer
                  }
                </p>
              )}

            </>
          )}

      </div>

    </main>
  );
}

function PlaneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m3 11 18-7-7 18-3-8-8-3Z" />
      <path d="m11 14 3-3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
      />

      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function ReturnIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M9 7 4 12l5 5" />
      <path d="M4 12h10a6 6 0 0 1 6 6" />
    </svg>
  );
}

function CurrencyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M16 8.5c-.8-.7-2-1-3.2-1-1.8 0-3.3.8-3.3 2.1 0 3.2 7 1.2 7 4.7 0 1.4-1.5 2.3-3.6 2.3-1.5 0-2.8-.4-3.8-1.2M12.8 5v14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 3 5 6v5c0 4.6 2.8 8.2 7 10 4.2-1.8 7-5.4 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

export default FlightsPage;