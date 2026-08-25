import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import FlightSearchEditor from '../components/flights/FlightSearchEditor';
import { searchFlights } from '../services/flights.service';

import type {
  FlightOffer,
  FlightResponseMeta,
} from '../types/flight.types';

type StopsFilter = 'all' | 'direct' | 'stops';

type SortOption =
  | 'price-asc'
  | 'price-desc'
  | 'duration-asc';

function formatTime(date: string | null) {
  if (!date) {
    return '--:--';
  }

  return new Intl.DateTimeFormat('es-CR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function formatDate(date: string | null) {
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function formatDuration(minutes: number | null) {
  if (minutes === null) {
    return 'Duración no disponible';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}min`;
}

function formatTransfers(transfers: number) {
  if (transfers === 0) {
    return 'Directo';
  }

  if (transfers === 1) {
    return '1 escala';
  }

  return `${transfers} escalas`;
}

function formatAirlineName(name: string | null) {
  if (!name) {
    return 'Aerolínea';
  }

  return name
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function FlightsPage() {
  const [searchParams] = useSearchParams();

  const [flights, setFlights] = useState<FlightOffer[]>([]);

  const [meta, setMeta] =
    useState<FlightResponseMeta | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [stopsFilter, setStopsFilter] =
    useState<StopsFilter>('all');

  const [selectedAirline, setSelectedAirline] =
    useState('all');

  const [sortOption, setSortOption] =
    useState<SortOption>('price-asc');

  const origin = searchParams.get('origin');

  const destination =
    searchParams.get('destination');

  const departureAt =
    searchParams.get('departureAt');

  const returnAt =
    searchParams.get('returnAt');

  const currency =
    searchParams.get('currency') || 'USD';

  useEffect(() => {
    let isCancelled = false;

    const loadFlights = async () => {
      if (!origin || !destination) {
        setError(
          'Debes seleccionar un origen y un destino.',
        );

        setIsLoading(false);

        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await searchFlights({
          origin,
          destination,
          departureAt:
            departureAt || undefined,
          returnAt:
            returnAt || undefined,
          currency,
          limit: 30,
        });

        if (isCancelled) {
          return;
        }

        setFlights(response.data);
        setMeta(response.meta);
      } catch (requestError) {
        if (isCancelled) {
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
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadFlights();

    return () => {
      isCancelled = true;
    };
  }, [
    origin,
    destination,
    departureAt,
    returnAt,
    currency,
  ]);

  const airlines = useMemo(() => {
    const airlineMap =
      new Map<string, string>();

    flights.forEach((flight) => {
      if (!flight.airline) {
        return;
      }

      airlineMap.set(
        flight.airline,
        formatAirlineName(
          flight.airlineName,
        ),
      );
    });

    return Array.from(
      airlineMap.entries(),
    ).sort((a, b) =>
      a[1].localeCompare(b[1]),
    );
  }, [flights]);

  const filteredFlights = useMemo(() => {
    let result = [...flights];

    if (stopsFilter === 'direct') {
      result = result.filter(
        (flight) =>
          flight.transfers === 0,
      );
    }

    if (stopsFilter === 'stops') {
      result = result.filter(
        (flight) =>
          flight.transfers > 0,
      );
    }

    if (selectedAirline !== 'all') {
      result = result.filter(
        (flight) =>
          flight.airline ===
          selectedAirline,
      );
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case 'price-desc':
          return b.price - a.price;

        case 'duration-asc':
          return (
            (a.durationMinutes ??
              Number.MAX_SAFE_INTEGER) -
            (b.durationMinutes ??
              Number.MAX_SAFE_INTEGER)
          );

        case 'price-asc':
        default:
          return a.price - b.price;
      }
    });

    return result;
  }, [
    flights,
    stopsFilter,
    selectedAirline,
    sortOption,
  ]);

  return (
    <main className="flights-page">
      <section className="flights-header">
        <p className="flights-eyebrow">
          RESULTADOS DE VUELOS
        </p>

        <h1>
          {origin && destination
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

      {origin && destination && (
        <FlightSearchEditor
          key={`${origin}-${destination}-${departureAt}-${returnAt}`}
          initialOriginIata={origin}
          initialDestinationIata={
            destination
          }
          initialDepartureAt={
            departureAt
          }
          initialReturnAt={returnAt}
          currency={currency}
        />
      )}

      {isLoading && (
        <section className="flights-status">
          <h2>
            Buscando las mejores opciones...
          </h2>

          <p>
            Estamos comparando vuelos
            disponibles para tu viaje.
          </p>
        </section>
      )}

      {!isLoading && error && (
        <section className="flights-status flights-error">
          <h2>
            No pudimos realizar la búsqueda
          </h2>

          <p>{error}</p>
        </section>
      )}

      {!isLoading &&
        !error &&
        flights.length === 0 && (
          <section className="flights-status">
            <h2>
              No encontramos vuelos
            </h2>

            <p>
              Intenta cambiar las fechas o
              seleccionar otra ruta.
            </p>
          </section>
        )}

      {!isLoading &&
        !error &&
        flights.length > 0 && (
          <>
            <section className="flights-results-heading">
              <div>
                <h2>
                  {filteredFlights.length}{' '}
                  de {flights.length}{' '}
                  {flights.length === 1
                    ? 'opción'
                    : 'opciones'}
                </h2>

                <p>
                  Filtra y ordena los
                  resultados según tus
                  preferencias.
                </p>
              </div>

              {meta?.stale && (
                <span className="flight-cache-warning">
                  Datos almacenados
                  temporalmente
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
                      stopsFilter === 'all'
                        ? 'flight-filter-button active'
                        : 'flight-filter-button'
                    }
                    onClick={() =>
                      setStopsFilter('all')
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
                  value={selectedAirline}
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
                    ([code, name]) => (
                      <option
                        key={code}
                        value={code}
                      >
                        {name}
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
                  value={sortOption}
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
                  No hay vuelos con estos
                  filtros
                </h2>

                <p>
                  Prueba seleccionando otra
                  aerolínea o cambiando el
                  filtro de escalas.
                </p>
              </section>
            ) : (
              <section className="flight-results-list">
                {filteredFlights.map(
                  (flight, index) => (
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
                              maximumFractionDigits: 0,
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
                            Oferta no
                            disponible
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
                {meta.disclaimer}
              </p>
            )}
          </>
        )}
    </main>
  );
}

export default FlightsPage;