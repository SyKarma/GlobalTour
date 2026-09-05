import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useSearchParams,
} from 'react-router-dom';

import HotelSearchForm from '../components/hotels/HotelSearchForm';

import {
  searchHotels,
} from '../services/hotels.service';

import {
  useCurrency,
} from '../hooks/useCurrency';

import type {
  HotelSearchMeta,
  HotelSummary,
} from '../types/hotel.types';

type HotelSortOption =
  | 'recommended'
  | 'rating'
  | 'reviews'
  | 'stars';

type HotelStarsFilter =
  | 'all'
  | '4'
  | '5';

/*
 * =========================================
 * HELPERS
 * =========================================
 */

function renderStars(
  stars: number | null,
) {
  if (!stars) {
    return null;
  }

  const roundedStars =
    Math.min(
      5,
      Math.max(
        1,
        Math.round(
          stars,
        ),
      ),
    );

  return '★'.repeat(
    roundedStars,
  );
}

function hasValidChain(
  chain: string | null,
) {
  if (!chain) {
    return false;
  }

  const value =
    chain
      .trim()
      .toLowerCase();

  return ![
    'not available',
    'n/a',
    'na',
    'unknown',
    'none',
  ].includes(
    value,
  );
}

/*
 * =========================================
 * PAGE
 * =========================================
 */

function HotelsPage() {
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
    hotels,
    setHotels,
  ] =
    useState<
      HotelSummary[]
    >([]);

  const [
    meta,
    setMeta,
  ] =
    useState<HotelSearchMeta | null>(
      null,
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    sortOption,
    setSortOption,
  ] =
    useState<HotelSortOption>(
      'recommended',
    );

  const [
    starsFilter,
    setStarsFilter,
  ] =
    useState<HotelStarsFilter>(
      'all',
    );

  /*
   * =========================================
   * SEARCH PARAMS
   * =========================================
   */

  const cityName =
    searchParams.get(
      'cityName',
    );

  const countryCode =
    searchParams.get(
      'countryCode',
    );

  const checkin =
    searchParams.get(
      'checkin',
    );

  const checkout =
    searchParams.get(
      'checkout',
    );

  const adults =
    searchParams.get(
      'adults',
    ) || '2';

  const currency =
    selectedCurrency;

  const hasSearch =
    Boolean(
      cityName &&
      countryCode,
    );

  /*
   * =========================================
   * CURRENCY SYNC
   * =========================================
   */

  useEffect(() => {
    if (!hasSearch) {
      return;
    }

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
    hasSearch,
    searchParams,
    selectedCurrency,
    setSearchParams,
  ]);

  /*
   * =========================================
   * LOAD HOTELS
   * =========================================
   */

  useEffect(() => {
    let isCancelled =
      false;

    const loadHotels =
      async () => {
        if (
          !cityName ||
          !countryCode
        ) {
          setHotels(
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
            await searchHotels(
              {
                cityName,
                countryCode,
                limit: 20,
              },
            );

          if (
            isCancelled
          ) {
            return;
          }

          setHotels(
            response.data,
          );

          setMeta(
            response.meta,
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
            'Error al buscar hoteles:',
            requestError,
          );

          setHotels(
            [],
          );

          setMeta(
            null,
          );

          setError(
            'No pudimos obtener los alojamientos en este momento.',
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

    void loadHotels();

    return () => {
      isCancelled =
        true;
    };
  }, [
    cityName,
    countryCode,
  ]);

  /*
   * =========================================
   * FILTER + SORT
   * =========================================
   */

  const filteredHotels =
    useMemo(() => {
      let result =
        [
          ...hotels,
        ];

      if (
        starsFilter ===
        '4'
      ) {
        result =
          result.filter(
            (
              hotel,
            ) =>
              (
                hotel.starRating ??
                0
              ) >= 4,
          );
      }

      if (
        starsFilter ===
        '5'
      ) {
        result =
          result.filter(
            (
              hotel,
            ) =>
              Math.round(
                hotel.starRating ??
                  0,
              ) === 5,
          );
      }

      switch (
        sortOption
      ) {
        case 'rating':
          result.sort(
            (
              a,
              b,
            ) =>
              (
                b.rating ??
                -1
              ) -
              (
                a.rating ??
                -1
              ),
          );

          break;

        case 'reviews':
          result.sort(
            (
              a,
              b,
            ) =>
              (
                b.reviewCount ??
                -1
              ) -
              (
                a.reviewCount ??
                -1
              ),
          );

          break;

        case 'stars':
          result.sort(
            (
              a,
              b,
            ) =>
              (
                b.starRating ??
                -1
              ) -
              (
                a.starRating ??
                -1
              ),
          );

          break;

        case 'recommended':
        default:
          break;
      }

      return result;
    }, [
      hotels,
      sortOption,
      starsFilter,
    ]);

  /*
   * =========================================
   * INSIGHTS
   * =========================================
   */

  const bestRating =
    useMemo(() => {
      const values =
        hotels
          .map(
            (
              hotel,
            ) =>
              hotel.rating,
          )
          .filter(
            (
              value,
            ):
              value is number =>
                value !==
                null,
          );

      if (
        values.length ===
        0
      ) {
        return null;
      }

      return Math.max(
        ...values,
      );
    }, [
      hotels,
    ]);

  const hotelsWithReviews =
    useMemo(
      () =>
        hotels.filter(
          (
            hotel,
          ) =>
            (
              hotel.reviewCount ??
              0
            ) > 0,
        ).length,

      [
        hotels,
      ],
    );

  /*
   * =========================================
   * DETAIL URL
   * =========================================
   */

  const buildHotelDetailUrl = (
    hotelId: string,
  ) => {
    const params =
      new URLSearchParams();

    if (checkin) {
      params.set(
        'checkin',
        checkin,
      );
    }

    if (checkout) {
      params.set(
        'checkout',
        checkout,
      );
    }

    params.set(
      'adults',
      adults,
    );

    params.set(
      'currency',
      currency,
    );

    return `/hotels/${hotelId}?${params.toString()}`;
  };

  /*
   * =========================================
   * RENDER
   * =========================================
   */

  return (
    <main className="gt-hotels-page">

      {/* =====================================
          HERO
      ====================================== */}

      <section className="gt-hotels-hero">
        <div className="gt-hotels-hero-overlay" />

        <div className="gt-hotels-hero-inner">
          <span className="gt-hotels-eyebrow">
            GLOBALTOUR · HOSPEDAJE
          </span>

          <h1>
            {cityName
              ? `Encuentra tu lugar en ${cityName}`
              : 'Descubre dónde quedarte'}
          </h1>

          <p>
            Hoteles y alojamientos para cada forma
            de viajar. Busca, compara y encuentra
            una opción para tu próxima estadía.
          </p>
        </div>
      </section>

      {/* =====================================
          SEARCH
      ====================================== */}

      <section className="gt-hotels-search-section">
        <div className="gt-hotels-search-shell">
          <div className="gt-hotels-search-heading">
            <div>
              <span>
                BUSCAR HOSPEDAJE
              </span>

              <strong>
                ¿Dónde será tu próxima estadía?
              </strong>
            </div>
          </div>

          <HotelSearchForm
            key={`${cityName}-${countryCode}-${checkin}-${checkout}-${adults}`}
            initialValues={{
              cityName:
                cityName ??
                '',

              countryCode:
                countryCode ??
                '',

              checkin:
                checkin ??
                '',

              checkout:
                checkout ??
                '',

              adults,
            }}
          />
        </div>
      </section>

      <div className="gt-hotels-content">

        {/* =====================================
            START
        ====================================== */}

        {!hasSearch && (
          <section className="gt-hotels-start-state">
            <div className="gt-hotels-start-icon">
              <HotelIcon />
            </div>

            <span>
              TU PRÓXIMA ESTADÍA
            </span>

            <h2>
              Encuentra un lugar que se sienta parte del viaje
            </h2>

            <p>
              Escribe una ciudad, selecciona tus fechas
              y comienza a explorar alojamientos.
            </p>

            <div className="gt-hotels-start-grid">
              <div>
                <LocationIcon />

                <strong>
                  Explora por ciudad
                </strong>

                <span>
                  Busca hospedaje directamente en tu destino.
                </span>
              </div>

              <div>
                <CalendarIcon />

                <strong>
                  Define tu estadía
                </strong>

                <span>
                  Selecciona check-in y check-out.
                </span>
              </div>

              <div>
                <GuestsIcon />

                <strong>
                  Viaja acompañado
                </strong>

                <span>
                  Indica cuántas personas se hospedarán.
                </span>
              </div>
            </div>
          </section>
        )}

        {/* =====================================
            LOADING
        ====================================== */}

        {hasSearch &&
          isLoading && (
          <section className="gt-hotels-loading">
            <div className="gt-hotels-loading-heading">
              <div className="gt-hotels-loader" />

              <div>
                <h2>
                  Buscando alojamientos en {cityName}
                </h2>

                <p>
                  Estamos consultando las mejores opciones disponibles.
                </p>
              </div>
            </div>

            <div className="gt-hotel-skeleton-list">
              {[1, 2, 3].map(
                (
                  item,
                ) => (
                  <div
                    key={
                      item
                    }
                    className="gt-hotel-skeleton-card"
                  >
                    <div className="gt-hotel-skeleton-image" />

                    <div className="gt-hotel-skeleton-copy">
                      <div />
                      <div />
                      <div />
                    </div>

                    <div className="gt-hotel-skeleton-action" />
                  </div>
                ),
              )}
            </div>
          </section>
        )}

        {/* =====================================
            ERROR
        ====================================== */}

        {hasSearch &&
          !isLoading &&
          error && (
          <section className="gt-hotels-error-state">
            <div>
              !
            </div>

            <h2>
              No pudimos completar la búsqueda
            </h2>

            <p>
              {error}
            </p>
          </section>
        )}

        {/* =====================================
            EMPTY
        ====================================== */}

        {hasSearch &&
          !isLoading &&
          !error &&
          hotels.length ===
            0 && (
          <section className="gt-hotels-error-state">
            <div className="gt-hotels-empty-icon">
              <SearchIcon />
            </div>

            <h2>
              No encontramos alojamientos
            </h2>

            <p>
              Prueba con otra ciudad o vuelve a intentarlo más tarde.
            </p>
          </section>
        )}

        {/* =====================================
            RESULTS
        ====================================== */}

        {hasSearch &&
          !isLoading &&
          !error &&
          hotels.length >
            0 && (
          <>

            {/* =================================
                RESULTS TITLE
            ================================== */}

            <section className="gt-hotels-results-heading">
              <div>
                <span className="gt-hotels-section-eyebrow">
                  ALOJAMIENTOS ENCONTRADOS
                </span>

                <h2>
                  {cityName}
                  {countryCode
                    ? `, ${countryCode}`
                    : ''}
                </h2>

                <p>
                  {hotels.length}{' '}

                  {hotels.length ===
                  1
                    ? 'alojamiento disponible para explorar'
                    : 'alojamientos disponibles para explorar'}
                </p>
              </div>

              {meta?.stale && (
                <span className="gt-hotels-cache-badge">
                  Datos almacenados temporalmente
                </span>
              )}
            </section>

            {/* =================================
                STAY SUMMARY
            ================================== */}

            {checkin &&
              checkout && (
              <section className="gt-hotel-stay-strip">
                <div>
                  <CalendarIcon />

                  <span>
                    Check-in
                  </span>

                  <strong>
                    {checkin}
                  </strong>
                </div>

                <div>
                  <CalendarIcon />

                  <span>
                    Check-out
                  </span>

                  <strong>
                    {checkout}
                  </strong>
                </div>

                <div>
                  <GuestsIcon />

                  <span>
                    Huéspedes
                  </span>

                  <strong>
                    {adults}{' '}

                    {adults ===
                    '1'
                      ? 'adulto'
                      : 'adultos'}
                  </strong>
                </div>

                <div>
                  <CurrencyIcon />

                  <span>
                    Moneda
                  </span>

                  <strong>
                    {currency}
                  </strong>
                </div>
              </section>
            )}

            {/* =================================
                INSIGHTS
            ================================== */}

            <section className="gt-hotel-insight-grid">
              <article>
                <span>
                  Encontrados
                </span>

                <strong>
                  {hotels.length}
                </strong>

                <small>
                  alojamientos
                </small>
              </article>

              <article>
                <span>
                  Mejor valoración
                </span>

                <strong>
                  {bestRating !==
                  null
                    ? bestRating.toFixed(
                        1,
                      )
                    : '—'}
                </strong>

                <small>
                  según los datos disponibles
                </small>
              </article>

              <article>
                <span>
                  Con reseñas
                </span>

                <strong>
                  {hotelsWithReviews}
                </strong>

                <small>
                  opciones con opiniones
                </small>
              </article>
            </section>

            {/* =================================
                TOOLBAR
            ================================== */}

            <section className="gt-hotels-toolbar">
              <div className="gt-hotels-sort-chips">
                <button
                  type="button"
                  className={
                    sortOption ===
                    'recommended'
                      ? 'gt-hotels-sort-chip gt-hotels-sort-chip-active'
                      : 'gt-hotels-sort-chip'
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
                    'rating'
                      ? 'gt-hotels-sort-chip gt-hotels-sort-chip-active'
                      : 'gt-hotels-sort-chip'
                  }
                  onClick={() =>
                    setSortOption(
                      'rating',
                    )
                  }
                >
                  Mejor valorados
                </button>

                <button
                  type="button"
                  className={
                    sortOption ===
                    'reviews'
                      ? 'gt-hotels-sort-chip gt-hotels-sort-chip-active'
                      : 'gt-hotels-sort-chip'
                  }
                  onClick={() =>
                    setSortOption(
                      'reviews',
                    )
                  }
                >
                  Más reseñas
                </button>
              </div>

              <span>
                {filteredHotels.length}{' '}
                resultados visibles
              </span>
            </section>

            {/* =================================
                RESULTS LAYOUT
            ================================== */}

            <section className="gt-hotels-results-layout">

              {/* FILTERS */}

              <aside className="gt-hotels-filter-panel">
                <div className="gt-hotels-filter-heading">
                  <span>
                    FILTROS
                  </span>

                  <strong>
                    Personaliza los resultados
                  </strong>
                </div>

                <div className="gt-hotels-filter-section">
                  <strong>
                    Categoría
                  </strong>

                  <label>
                    <input
                      type="radio"
                      name="hotelStars"
                      checked={
                        starsFilter ===
                        'all'
                      }
                      onChange={() =>
                        setStarsFilter(
                          'all',
                        )
                      }
                    />

                    <span>
                      Todas
                    </span>
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="hotelStars"
                      checked={
                        starsFilter ===
                        '4'
                      }
                      onChange={() =>
                        setStarsFilter(
                          '4',
                        )
                      }
                    />

                    <span>
                      4 estrellas o más
                    </span>
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="hotelStars"
                      checked={
                        starsFilter ===
                        '5'
                      }
                      onChange={() =>
                        setStarsFilter(
                          '5',
                        )
                      }
                    />

                    <span>
                      5 estrellas
                    </span>
                  </label>
                </div>

                <div className="gt-hotels-filter-section">
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
                            .value as HotelSortOption,
                        )
                      }
                    >
                      <option value="recommended">
                        Recomendados
                      </option>

                      <option value="rating">
                        Mejor valoración
                      </option>

                      <option value="reviews">
                        Más reseñas
                      </option>

                      <option value="stars">
                        Más estrellas
                      </option>
                    </select>
                  </label>
                </div>

                <div className="gt-hotels-filter-tip">
                  <HotelIcon />

                  <div>
                    <strong>
                      Explora antes de reservar
                    </strong>

                    <span>
                      Entra al alojamiento para consultar habitaciones y tarifas.
                    </span>
                  </div>
                </div>
              </aside>

              {/* HOTEL RESULTS */}

              <div className="gt-hotel-results-list">
                {filteredHotels.length ===
                0 ? (
                  <div className="gt-hotels-filter-empty">
                    <SearchIcon />

                    <h3>
                      No hay alojamientos con este filtro
                    </h3>

                    <p>
                      Prueba mostrando todas las categorías.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setStarsFilter(
                          'all',
                        )
                      }
                    >
                      Limpiar filtro
                    </button>
                  </div>
                ) : (
                  filteredHotels.map(
                    (
                      hotel,
                    ) => (
                    <article
                      className="gt-hotel-result-card"
                      key={
                        hotel.id
                      }
                    >

                      {/* IMAGE */}

                      <div className="gt-hotel-result-image">
                        {hotel.mainPhoto ||
                        hotel.thumbnail ? (
                          <img
                            src={
                              hotel.mainPhoto ||
                              hotel.thumbnail ||
                              ''
                            }
                            alt={
                              hotel.name
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="gt-hotel-image-placeholder">
                            <HotelIcon />

                            <span>
                              Imagen no disponible
                            </span>
                          </div>
                        )}

                        {hotel.starRating && (
                          <span className="gt-hotel-image-stars">
                            {renderStars(
                              hotel.starRating,
                            )}
                          </span>
                        )}
                      </div>

                      {/* CONTENT */}

                      <div className="gt-hotel-result-content">
                        <div className="gt-hotel-result-copy">
                          <div className="gt-hotel-result-topline">
                            <span>
                              {hotel.city ||
                                cityName}
                            </span>

                            {hasValidChain(
                              hotel.chain,
                            ) && (
                              <span>
                                {hotel.chain}
                              </span>
                            )}
                          </div>

                          <h3>
                            {hotel.name}
                          </h3>

                          <p className="gt-hotel-result-location">
                            <LocationIcon />

                            <span>
                              {[
                                hotel.address,
                                hotel.city,
                                hotel.country,
                              ]
                                .filter(
                                  Boolean,
                                )
                                .join(
                                  ', ',
                                )}
                            </span>
                          </p>

                          <div className="gt-hotel-result-features">
                            <span>
                              <BedIcon />

                              Hospedaje
                            </span>

                            {hotel.links
                              .map && (
                              <a
                                href={
                                  hotel.links
                                    .map
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MapIcon />

                                Ver ubicación
                              </a>
                            )}
                          </div>
                        </div>

                        {/* ACTION */}

                        <div className="gt-hotel-result-action">
                          {hotel.rating !==
                            null && (
                            <div className="gt-hotel-rating-block">
                              <div>
                                <strong>
                                  Valoración
                                </strong>

                                {hotel.reviewCount !==
                                  null && (
                                  <span>
                                    {hotel.reviewCount}{' '}

                                    {hotel.reviewCount ===
                                    1
                                      ? 'reseña'
                                      : 'reseñas'}
                                  </span>
                                )}
                              </div>

                              <span>
                                {hotel.rating.toFixed(
                                  1,
                                )}
                              </span>
                            </div>
                          )}

                          <div className="gt-hotel-availability-copy">
                            <span>
                              Consulta
                            </span>

                            <strong>
                              habitaciones y tarifas
                            </strong>
                          </div>

                          <Link
                            to={buildHotelDetailUrl(
                              hotel.id,
                            )}
                            className="gt-hotel-detail-button"
                          >
                            Ver disponibilidad

                            <ArrowIcon />
                          </Link>
                        </div>
                      </div>
                    </article>
                    ),
                  )
                )}
              </div>
            </section>

            {meta?.disclaimer && (
              <p className="gt-hotels-disclaimer">
                {meta.disclaimer}
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

function HotelIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 20V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13" />

      <path d="M2 20h20" />

      <path d="M8 9h2M14 9h2M8 13h2M14 13h2" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
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

function GuestsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3"
      />

      <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
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

      <path d="M12 6v12M16 8.5c-.8-.7-2-1-3.2-1-1.8 0-3.3.8-3.3 2.1 0 3.2 7 1.2 7 4.7 0 1.4-1.5 2.3-3.6 2.3-1.5 0-2.8-.4-3.8-1.2" />
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

function BedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M3 18V8M21 18v-6a2 2 0 0 0-2-2H8a3 3 0 0 0-3 3v5M3 15h18M7 10V7h5v3" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />

      <path d="M9 3v15M15 6v15" />
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

export default HotelsPage;