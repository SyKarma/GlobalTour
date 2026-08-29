import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';

import FlightSearchEditor from '../components/flights/FlightSearchEditor';

import { searchFlights } from '../services/flights.service';
import { useCurrency } from '../hooks/useCurrency';

import type {
  FlightOffer,
  FlightResponseMeta,
} from '../types/flight.types';

type StopsFilter =
  | 'all'
  | 'direct'
  | 'stops';

type SortOption =
  | 'price-asc'
  | 'price-desc'
  | 'duration-asc';

function formatTime(
  date: string | null,
) {
  if (!date) {
    return '--:--';
  }

  const match = date.match(
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
    Number(hourString);

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
  date: string | null,
) {
  if (!date) {
    return '';
  }

  const match = date.match(
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
      Number(month) - 1
    ]
  } ${year}`;
}

function formatDuration(
  minutes: number | null,
) {
  if (minutes === null) {
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
  transfers: number,
) {
  if (transfers === 0) {
    return 'Directo';
  }

  if (transfers === 1) {
    return '1 escala';
  }

  return `${transfers} escalas`;
}

function formatAirlineName(
  name: string | null,
) {
  if (!name) {
    return 'Aerolínea';
  }

  return name
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function formatFallbackPeriod(
  period?: string,
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

  if (dayMatch) {
    const [
      ,
      year,
      month,
      day,
    ] = dayMatch;

    return `${day} de ${
      monthNames[
        Number(month) - 1
      ]
    } de ${year}`;
  }

  const monthMatch =
    period.match(
      /^(\d{4})-(\d{2})$/,
    );

  if (monthMatch) {
    const [
      ,
      year,
      month,
    ] = monthMatch;

    return `${
      monthNames[
        Number(month) - 1
      ]
    } de ${year}`;
  }

  return period;
}

function getFallbackMessage(
  meta: FlightResponseMeta | null,
) {
  if (!meta?.fallback) {
    return null;
  }

  const period =
    formatFallbackPeriod(
      meta.fallbackPeriod,
    );

  switch (meta.fallback) {
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

function FlightsPage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const {
    selectedCurrency,
  } = useCurrency();

  const [
    flights,
    setFlights,
  ] =
    useState<FlightOffer[]>(
      [],
    );

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
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

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
    useState('all');

  const [
    sortOption,
    setSortOption,
  ] =
    useState<SortOption>(
      'price-asc',
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
        replace: true,
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
          setError(
            'Debes seleccionar un origen y un destino.',
          );

          setFlights([]);
          setMeta(null);
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

                limit: 30,
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
            'price-asc',
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

          setFlights(
            [],
          );

          setMeta(
            null,
          );

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

  const airlines =
    useMemo(() => {
      const airlineMap =
        new Map<
          string,
          string
        >();

      flights.forEach(
        (flight) => {
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
        (a, b) =>
          a[1].localeCompare(
            b[1],
          ),
      );
    }, [flights]);

  const filteredFlights =
    useMemo(() => {
      let result = [
        ...flights,
      ];

      if (
        stopsFilter ===
        'direct'
      ) {
        result =
          result.filter(
            (flight) =>
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
            (flight) =>
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
            (flight) =>
              flight.airline ===
              selectedAirline,
          );
      }

      result.sort(
        (a, b) => {
          switch (
            sortOption
          ) {
            case 'price-desc':
              return (
                b.price -
                a.price
              );

            case 'duration-asc':
              return (
                (
                  a.durationMinutes ??
                  Number.MAX_SAFE_INTEGER
                ) -
                (
                  b.durationMinutes ??
                  Number.MAX_SAFE_INTEGER
                )
              );

            case 'price-asc':
            default:
              return (
                a.price -
                b.price
              );
          }
        },
      );

      return result;
    }, [
      flights,
      stopsFilter,
      selectedAirline,
      sortOption,
    ]);

  const fallbackMessage =
    getFallbackMessage(
      meta,
    );

  return (
    <main className="flights-page">
      <section className="flights-header">
        <p className="flights-eyebrow">
          RESULTADOS DE VUELOS
        </p>

        <h1>
          {origin &&
          destination
            ? `${origin} → ${destination}`
            : 'Vuelos'}
        </h1>

        {departureAt && (
          <p className="flights-search-summary">
            {departureAt}

            {returnAt &&
              ` — ${returnAt}`}

            {' · '}

            {currency}
          </p>
        )}
      </section>

      {origin &&
        destination && (
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
        )}

      {!isLoading &&
        !error &&
        fallbackMessage && (
          <section className="flight-fallback-notice">
            <div className="flight-fallback-icon">
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

      {isLoading && (
        <section className="flights-status">
          <h2>
            Buscando las mejores opciones...
          </h2>

          <p>
            Estamos comparando vuelos disponibles para tu viaje.
          </p>
        </section>
      )}

      {!isLoading &&
        error && (
          <section className="flights-status flights-error">
            <h2>
              No pudimos realizar la búsqueda
            </h2>

            <p>
              {error}
            </p>
          </section>
        )}

      {!isLoading &&
        !error &&
        flights.length ===
          0 && (
          <section className="flights-status">
            <h2>
              No encontramos vuelos
            </h2>

            <p>
              Intenta cambiar las fechas o seleccionar otra ruta.
            </p>
          </section>
        )}

      {!isLoading &&
        !error &&
        flights.length >
          0 && (
          <>
            <section className="flights-results-heading">
              <div>
                <h2>
                  {
                    filteredFlights.length
                  }{' '}
                  de{' '}
                  {
                    flights.length
                  }{' '}
                  {flights.length ===
                  1
                    ? 'opción'
                    : 'opciones'}
                </h2>

                <p>
                  Filtra y ordena los resultados según tus preferencias.
                </p>
              </div>

              {meta?.stale && (
                <span className="flight-cache-warning">
                  Datos almacenados temporalmente
                </span>
              )}
            </section>

            <section className="flight-filters">
              <div className="flight-filter-group">
                <span className="flight-filter-label">
                  Escalas
                </span>

                <div className="flight-filter-buttons">
                  <button
                    type="button"
                    className={
                      stopsFilter ===
                      'all'
                        ? 'flight-filter-button active'
                        : 'flight-filter-button'
                    }
                    onClick={() =>
                      setStopsFilter(
                        'all',
                      )
                    }
                  >
                    Todos
                  </button>

                  <button
                    type="button"
                    className={
                      stopsFilter ===
                      'direct'
                        ? 'flight-filter-button active'
                        : 'flight-filter-button'
                    }
                    onClick={() =>
                      setStopsFilter(
                        'direct',
                      )
                    }
                  >
                    Directos
                  </button>

                  <button
                    type="button"
                    className={
                      stopsFilter ===
                      'stops'
                        ? 'flight-filter-button active'
                        : 'flight-filter-button'
                    }
                    onClick={() =>
                      setStopsFilter(
                        'stops',
                      )
                    }
                  >
                    Con escalas
                  </button>
                </div>
              </div>

              <label className="flight-filter-select">
                <span>
                  Aerolínea
                </span>

                <select
                  value={
                    selectedAirline
                  }
                  onChange={(event) =>
                    setSelectedAirline(
                      event.target.value,
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

              <label className="flight-filter-select">
                <span>
                  Ordenar por
                </span>

                <select
                  value={
                    sortOption
                  }
                  onChange={(event) =>
                    setSortOption(
                      event.target
                        .value as SortOption,
                    )
                  }
                >
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
            </section>

            {filteredFlights.length ===
            0 ? (
              <section className="flights-status">
                <h2>
                  No hay vuelos con estos filtros
                </h2>

                <p>
                  Prueba seleccionando otra aerolínea o cambiando el filtro de escalas.
                </p>
              </section>
            ) : (
              <section className="flight-results-list">
                {filteredFlights.map(
                  (
                    flight,
                    index,
                  ) => (
                    <article
                      className="flight-card"
                      key={`${flight.airline}-${flight.flightNumber}-${flight.departureAt}-${index}`}
                    >
                      <div className="flight-airline">
                        <div className="airline-code">
                          {flight.airline ||
                            '—'}
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

                      <div className="flight-route">
                        <div className="flight-route-point">
                          <small className="flight-route-label">
                            Salida
                          </small>

                          <strong>
                            {formatTime(
                              flight.departureAt,
                            )}
                          </strong>

                          <span>
                            {flight.originAirport ||
                              flight.origin}
                          </span>

                          <small>
                            {formatDate(
                              flight.departureAt,
                            )}
                          </small>
                        </div>

                        <div className="flight-route-middle">
                          <span>
                            {formatDuration(
                              flight.durationMinutes,
                            )}
                          </span>

                          <div className="flight-route-line" />

                          <strong>
                            {formatTransfers(
                              flight.transfers,
                            )}
                          </strong>
                        </div>

                        <div className="flight-route-point">
                          <small className="flight-route-label">
                            Destino
                          </small>

                          <strong>
                            {flight.destinationAirport ||
                              flight.destination}
                          </strong>

                          {flight.returnAt && (
                            <small className="flight-return">
                              Regreso:{' '}
                              {formatDate(
                                flight.returnAt,
                              )}
                            </small>
                          )}
                        </div>
                      </div>

                      <div className="flight-price">
                        <span>
                          Desde
                        </span>

                        <strong>
                          {new Intl.NumberFormat(
                            'en-US',
                            {
                              style:
                                'currency',

                              currency:
                                flight.currency,

                              maximumFractionDigits:
                                0,
                            },
                          ).format(
                            flight.price,
                          )}
                        </strong>

                        {flight.deeplink ? (
                          <a
                            href={
                              flight.deeplink
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flight-offer-button"
                          >
                            Ver oferta
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="flight-offer-button"
                            disabled
                          >
                            Oferta no disponible
                          </button>
                        )}
                      </div>
                    </article>
                  ),
                )}
              </section>
            )}

            {meta?.disclaimer && (
              <p className="flight-disclaimer">
                {
                  meta.disclaimer
                }
              </p>
            )}
          </>
        )}
    </main>
  );
}

export default FlightsPage;