import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useSearchParams,
} from 'react-router-dom';

import FlightSearchEditor from '../components/flights/FlightSearchEditor';

import {
  searchFlights,
} from '../services/flights.service';

import {
  useCurrency,
} from '../hooks/useCurrency';

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

/*
 * =========================================
 * FORMATTERS
 * =========================================
 */

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
    minute,
  ] = match;

  const hour =
    Number(
      hourString,
    );

  const period =
    hour >= 12
      ? 'p. m.'
      : 'a. m.';

  const normalizedHour =
    hour % 12 || 12;

  return `${normalizedHour
    .toString()
    .padStart(
      2,
      '0',
    )}:${minute} ${period}`;
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

  const months = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sept',
    'oct',
    'nov',
    'dic',
  ];

  return `${day} ${
    months[
      Number(
        month,
      ) - 1
    ]
  } ${year}`;
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
    return 'Duración no disponible';
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  const remainingMinutes =
    minutes % 60;

  return `${hours}h ${remainingMinutes}min`;
}

function formatTransfers(
  transfers:
    number,
) {
  if (
    transfers === 0
  ) {
    return 'Directo';
  }

  if (
    transfers === 1
  ) {
    return '1 escala';
  }

  return `${transfers} escalas`;
}

function formatAirlineName(
  name:
    | string
    | null,
) {
  if (!name) {
    return 'Aerolínea';
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
      'en-US',
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

  const monthNames = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];

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

    return `${day} de ${
      monthNames[
        Number(
          month,
        ) - 1
      ]
    } de ${year}`;
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

    return `${
      monthNames[
        Number(
          month,
        ) - 1
      ]
    } de ${year}`;
  }

  return period;
}

function getFallbackMessage(
  meta:
    FlightResponseMeta | null,
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
          'No encontramos el viaje de ida y vuelta exacto.',

        description:
          period
            ? `Mostrando opciones disponibles de solo ida para el ${period}.`
            : 'Mostrando opciones disponibles de solo ida.',
      };

    case 'one_way_month':
      return {
        title:
          'No encontramos disponibilidad exacta para el viaje solicitado.',

        description:
          period
            ? `Mostrando opciones de solo ida disponibles durante ${period}.`
            : 'Mostrando opciones alternativas de solo ida.',
      };

    case 'calendar':
      return {
        title:
          'No encontramos vuelos para las fechas exactas.',

        description:
          period
            ? `Mostrando opciones disponibles durante ${period}.`
            : 'Mostrando opciones disponibles en fechas cercanas.',
      };

    default:
      return null;
  }
}

/*
 * =========================================
 * PAGE
 * =========================================
 */

function FlightsPage() {
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
    useState<FlightResponseMeta | null>(
      null,
    );

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
    useState<StopsFilter>(
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
    useState<SortOption>(
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

  /*
   * =========================================
   * CURRENCY SYNC
   * =========================================
   */

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

  /*
   * =========================================
   * LOAD FLIGHTS
   * =========================================
   */

  useEffect(() => {
    let isCancelled =
      false;

    const loadFlights =
      async () => {
        if (
          !origin ||
          !destination
        ) {
          setFlights([]);
          setMeta(null);
          setError(null);

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
            'Error al buscar vuelos:',
            requestError,
          );

          setFlights([]);

          setMeta(null);

          setError(
            'No pudimos obtener los vuelos en este momento.',
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

  /*
   * =========================================
   * AIRLINES
   * =========================================
   */

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

  /*
   * =========================================
   * FILTERING
   * =========================================
   */

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

  /*
   * =========================================
   * INSIGHTS
   * =========================================
   */

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

      {/* =====================================
          HERO
      ====================================== */}

      <section className="gt-flights-hero">
        <div className="gt-flights-hero-inner">
          <div>
            <span className="gt-flights-eyebrow">
              GLOBALTOUR · VUELOS
            </span>

            <h1>
              {hasRoute
                ? `${origin} → ${destination}`
                : 'Encuentra tu próximo vuelo'}
            </h1>

            <p>
              {hasRoute
                ? 'Compara opciones, duración, escalas y precios para elegir el vuelo que mejor se adapte a tu viaje.'
                : 'Busca rutas, compara alternativas y encuentra la mejor forma de llegar a tu próximo destino.'}
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

                    Regreso{' '}

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
          </div>

          <div className="gt-flight-hero-art">
            <div className="gt-flight-hero-route">
              <span>
                {origin ||
                  'SJO'}
              </span>

              <div>
                <PlaneIcon />
              </div>

              <span>
                {destination ||
                  'MAD'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          EDITOR
      ====================================== */}

      {origin &&
        destination && (
          <section className="gt-flight-editor-section">
            <div className="gt-flight-search-shell">
              <div className="gt-flight-search-shell-heading">
                <div>
                  <span>
                    Modifica tu viaje
                  </span>

                  <strong>
                    Busca otra ruta o cambia las fechas
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

        {/* =====================================
            NO SEARCH
        ====================================== */}

        {!hasRoute && (
          <section className="gt-flight-start-state">
            <div className="gt-flight-start-icon">
              <PlaneIcon />
            </div>

            <span>
              PLANEA TU RUTA
            </span>

            <h2>
              ¿A dónde quieres viajar?
            </h2>

            <p>
              Selecciona un origen,
              un destino y tus fechas
              para comenzar a comparar
              vuelos.
            </p>

            <Link
              to="/#home-flight-search"
              className="gt-flight-primary-button"
            >
              Buscar vuelos

              <ArrowIcon />
            </Link>

            <div className="gt-flight-start-features">
              <div>
                <strong>
                  Compara
                </strong>

                <span>
                  distintas opciones
                </span>
              </div>

              <div>
                <strong>
                  Filtra
                </strong>

                <span>
                  por escalas y aerolínea
                </span>
              </div>

              <div>
                <strong>
                  Elige
                </strong>

                <span>
                  la opción que prefieras
                </span>
              </div>
            </div>
          </section>
        )}

        {/* =====================================
            FALLBACK
        ====================================== */}

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

        {/* =====================================
            LOADING
        ====================================== */}

        {hasRoute &&
          isLoading && (
            <section className="gt-flight-loading">
              <div className="gt-flight-loading-heading">
                <div className="gt-flight-loader" />

                <div>
                  <h2>
                    Buscando las mejores opciones
                  </h2>

                  <p>
                    Estamos comparando vuelos disponibles para tu viaje.
                  </p>
                </div>
              </div>

              <div className="gt-flight-skeleton-list">
                {[1, 2, 3].map(
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

        {/* =====================================
            ERROR
        ====================================== */}

        {hasRoute &&
          !isLoading &&
          error && (
            <section className="gt-flight-error-state">
              <div className="gt-flight-error-icon">
                !
              </div>

              <h2>
                No pudimos cargar los vuelos
              </h2>

              <p>
                {error}
              </p>

              <Link
                to="/#home-flight-search"
                className="gt-flight-secondary-button"
              >
                Realizar otra búsqueda
              </Link>
            </section>
          )}

        {/* =====================================
            EMPTY
        ====================================== */}

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
                No encontramos vuelos
              </h2>

              <p>
                Intenta cambiar las fechas o seleccionar otra ruta.
              </p>

              <Link
                to="/#home-flight-search"
                className="gt-flight-secondary-button"
              >
                Buscar otra ruta
              </Link>
            </section>
          )}

        {/* =====================================
            RESULTS
        ====================================== */}

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
                      OPCIONES DISPONIBLES
                    </span>

                    <h2>
                      Encuentra el vuelo que mejor se adapte a ti
                    </h2>

                    <p>
                      {
                        flights.length
                      }{' '}

                      {flights.length ===
                      1
                        ? 'opción encontrada'
                        : 'opciones encontradas'}
                    </p>
                  </div>

                  {meta?.stale && (
                    <span className="gt-flight-cache-badge">
                      Datos almacenados temporalmente
                    </span>
                  )}
                </div>

                <div className="gt-flight-insight-grid">
                  <div className="gt-flight-insight-card">
                    <span>
                      Desde
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
                      Mejor precio encontrado
                    </small>
                  </div>

                  <div className="gt-flight-insight-card">
                    <span>
                      Vuelos directos
                    </span>

                    <strong>
                      {
                        directFlights
                      }
                    </strong>

                    <small>
                      Sin escalas
                    </small>
                  </div>

                  <div className="gt-flight-insight-card">
                    <span>
                      Más rápido
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
                      Menor duración disponible
                    </small>
                  </div>
                </div>
              </section>

              {/* QUICK SORT */}

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
                    Recomendados
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
                    Más baratos
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
                    Más rápidos
                  </button>
                </div>

                <span>
                  {
                    filteredFlights.length
                  }{' '}
                  resultados visibles
                </span>
              </section>

              {/* RESULTS + FILTERS */}

              <section className="gt-flight-results-layout">
                <aside className="gt-flight-filter-panel">
                  <div className="gt-flight-filter-header">
                    <div>
                      <span>
                        FILTROS
                      </span>

                      <strong>
                        Personaliza tu búsqueda
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
                        Limpiar
                      </button>
                    )}
                  </div>

                  <div className="gt-flight-filter-section">
                    <strong>
                      Escalas
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
                        Todos los vuelos
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
                        Solo directos
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
                        Con escalas
                      </span>
                    </label>
                  </div>

                  <div className="gt-flight-filter-section">
                    <label>
                      <strong>
                        Aerolínea
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
                          Todas las aerolíneas
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
                        Ordenar por
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
                          Recomendados
                        </option>

                        <option value="price-asc">
                          Menor precio
                        </option>

                        <option value="price-desc">
                          Mayor precio
                        </option>

                        <option value="duration-asc">
                          Menor duración
                        </option>
                      </select>
                    </label>
                  </div>

                  <div className="gt-flight-filter-info">
                    <ShieldIcon />

                    <div>
                      <strong>
                        Compara con confianza
                      </strong>

                      <span>
                        GlobalTour centraliza opciones para ayudarte a decidir.
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
                        No hay vuelos con estos filtros
                      </h3>

                      <p>
                        Cambia la aerolínea o el filtro de escalas.
                      </p>

                      <button
                        type="button"
                        onClick={
                          clearFilters
                        }
                      >
                        Limpiar filtros
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

                          return (
                            <article
                              className="gt-flight-card"
                              key={`${flight.airline}-${flight.flightNumber}-${flight.departureAt}-${index}`}
                            >
                              <div className="gt-flight-card-top">
                                <div className="gt-flight-badges">
                                  {isBestPrice && (
                                    <span className="gt-flight-badge gt-flight-badge-price">
                                      Mejor precio
                                    </span>
                                  )}

                                  {isFastest && (
                                    <span className="gt-flight-badge gt-flight-badge-fast">
                                      Más rápido
                                    </span>
                                  )}

                                  {flight.transfers ===
                                    0 && (
                                    <span className="gt-flight-badge gt-flight-badge-direct">
                                      Directo
                                    </span>
                                  )}
                                </div>

                                <span className="gt-flight-result-index">
                                  Opción{' '}
                                  {
                                    index +
                                    1
                                  }
                                </span>
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
                                        Vuelo{' '}
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
                                        Regreso{' '}
                                        {formatDate(
                                          flight.returnAt,
                                        )}
                                      </small>
                                    )}
                                  </div>
                                </div>

                                <div className="gt-flight-price">
                                  <span>
                                    Desde
                                  </span>

                                  <strong>
                                    {formatPrice(
                                      flight.price,
                                      flight.currency,
                                    )}
                                  </strong>

                                  <small>
                                    por viajero
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
                                      Ver oferta

                                      <ArrowIcon />
                                    </a>
                                  ) : (
                                    <button
                                      type="button"
                                      className="gt-flight-offer-button"
                                      disabled
                                    >
                                      No disponible
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="gt-flight-card-footer">
                                <span>
                                  <InfoIcon />

                                  Precio sujeto a disponibilidad del proveedor
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

/*
 * =========================================
 * ICONS
 * =========================================
 */

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