import {
  useEffect,
  useState,
} from 'react';

import {
  useSearchParams,
} from 'react-router-dom';

import HotelSearchForm from '../components/hotels/HotelSearchForm';

import {
  searchHotels,
} from '../services/hotels.service';

import {
  useAuth,
} from '../hooks/useAuth';

import {
  useCurrency,
} from '../hooks/useCurrency';

import {
  useWishlist,
} from '../hooks/useWishlist';

import hotelHeroImage from '../assets/visuals/hotel-hero.png';

import type {
  HotelSearchMeta,
  HotelSummary,
} from '../types/hotel.types';

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

  const {
    isAuthenticated,
    login,
  } =
    useAuth();

  const {
    toggle,
    isSaved,
  } =
    useWishlist();

  const [
    hotels,
    setHotels,
  ] =
    useState<HotelSummary[]>(
      [],
    );

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
    useState<string | null>(
      null,
    );

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
            await searchHotels({
              cityName,
              countryCode,
              limit: 20,
            });

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

  const handleWishlist = (
    hotel: HotelSummary,
  ) => {
    if (!isAuthenticated) {
      login();

      return;
    }

    toggle({
      key:
        `hotel:${hotel.id}`,

      type:
        'hotel',

      title:
        hotel.name,

      subtitle:
        [
          hotel.city,
          hotel.country,
        ]
          .filter(
            Boolean,
          )
          .join(
            ', ',
          ),

      imageUrl:
        hotel.mainPhoto ||
        hotel.thumbnail ||
        null,

      href:
        buildHotelDetailUrl(
          hotel.id,
        ),

      metadata: {
        ciudad:
          hotel.city ??
          null,

        país:
          hotel.country ??
          null,

        estrellas:
          hotel.starRating ??
          null,

        valoración:
          hotel.rating ??
          null,

        cadena:
          hotel.chain ??
          null,
      },
    });
  };

  return (
    <main className="hotels-page">

      {/* =====================================
          HERO
      ====================================== */}

      <section
        className="hotels-header hotels-header-photo"
        style={{
          backgroundImage:
            `url(${hotelHeroImage})`,
        }}
      >
        <div className="hotels-header-overlay" />

        <div className="hotels-header-content">
          <p className="hotels-eyebrow">
            GLOBALTOUR · HOSPEDAJE
          </p>

          <h1>
            {cityName
              ? `Encuentra hospedaje en ${cityName}`
              : 'Encuentra tu hospedaje'}
          </h1>

          <p>
            Busca y compara alojamientos
            para tu próximo viaje.
          </p>
        </div>
      </section>

      {/* =====================================
          SEARCH
      ====================================== */}

      <section className="hotels-search-section">
        <HotelSearchForm />
      </section>

      {/* =====================================
          START STATE
      ====================================== */}

      {!hasSearch && (
        <section className="hotels-empty-start">
          <h2>
            ¿Dónde quieres hospedarte?
          </h2>

          <p>
            Selecciona un destino, las
            fechas de tu estadía y la
            cantidad de huéspedes para
            comenzar.
          </p>
        </section>
      )}

      {/* =====================================
          LOADING
      ====================================== */}

      {hasSearch &&
        isLoading && (
          <section className="hotels-status">
            <h2>
              Buscando alojamientos...
            </h2>

            <p>
              Estamos consultando opciones
              disponibles en{' '}
              {cityName}.
            </p>
          </section>
        )}

      {/* =====================================
          ERROR
      ====================================== */}

      {hasSearch &&
        !isLoading &&
        error && (
          <section className="hotels-status hotels-error">
            <h2>
              No pudimos realizar la búsqueda
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
          <section className="hotels-status">
            <h2>
              No encontramos alojamientos
            </h2>

            <p>
              Prueba con otro destino
              o vuelve a intentarlo más tarde.
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
            <section className="hotels-results-heading">
              <div>
                <h2>
                  {
                    hotels.length
                  }{' '}
                  {hotels.length ===
                  1
                    ? 'alojamiento encontrado'
                    : 'alojamientos encontrados'}
                </h2>

                {checkin &&
                  checkout && (
                    <p>
                      {checkin}
                      {' — '}
                      {checkout}
                      {' · '}
                      {adults}{' '}
                      {adults ===
                      '1'
                        ? 'adulto'
                        : 'adultos'}
                      {' · '}
                      {currency}
                    </p>
                  )}
              </div>

              {meta?.stale && (
                <span className="hotel-cache-warning">
                  Datos almacenados temporalmente
                </span>
              )}
            </section>

            <section className="hotel-results-grid">
              {hotels.map(
                (
                  hotel,
                ) => {
                  const wishlistKey =
                    `hotel:${hotel.id}`;

                  const saved =
                    isSaved(
                      wishlistKey,
                    );

                  return (
                    <article
                      className="hotel-card"
                      key={
                        hotel.id
                      }
                    >
                      <div className="hotel-card-image">

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
                          <div className="hotel-image-placeholder">
                            Sin imagen
                          </div>
                        )}

                        <button
                          type="button"
                          className={
                            saved
                              ? 'hotel-wishlist-button hotel-wishlist-button-active'
                              : 'hotel-wishlist-button'
                          }
                          onClick={() =>
                            handleWishlist(
                              hotel,
                            )
                          }
                          aria-label={
                            saved
                              ? `Eliminar ${hotel.name} de Wishlist`
                              : `Guardar ${hotel.name} en Wishlist`
                          }
                          title={
                            saved
                              ? 'Eliminar de Wishlist'
                              : 'Guardar en Wishlist'
                          }
                        >
                          <HeartIcon />
                        </button>
                      </div>

                      <div className="hotel-card-content">
                        <div className="hotel-card-main">

                          {hotel.starRating && (
                            <span className="hotel-stars">
                              {renderStars(
                                hotel.starRating,
                              )}
                            </span>
                          )}

                          <h3>
                            {
                              hotel.name
                            }
                          </h3>

                          <p className="hotel-location">
                            {[
                              hotel.city,
                              hotel.country,
                            ]
                              .filter(
                                Boolean,
                              )
                              .join(
                                ', ',
                              )}
                          </p>

                          {hotel.address && (
                            <p className="hotel-address">
                              {
                                hotel.address
                              }
                            </p>
                          )}

                          <div className="hotel-card-meta">

                            {hotel.rating !==
                              null && (
                              <span className="hotel-rating">
                                {hotel.rating.toFixed(
                                  1,
                                )}
                              </span>
                            )}

                            {hotel.reviewCount !==
                              null && (
                              <span>
                                {
                                  hotel.reviewCount
                                }{' '}
                                {hotel.reviewCount ===
                                1
                                  ? 'reseña'
                                  : 'reseñas'}
                              </span>
                            )}

                            {hotel.chain && (
                              <span>
                                {
                                  hotel.chain
                                }
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="hotel-card-actions">

                          {hotel.links
                            .map && (
                            <a
                              href={
                                hotel.links
                                  .map
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hotel-map-link"
                            >
                              Ver en mapa
                            </a>
                          )}

                          <a
                            href={
                              buildHotelDetailUrl(
                                hotel.id,
                              )
                            }
                            className="hotel-detail-button"
                          >
                            Ver disponibilidad
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </section>

            {meta?.disclaimer && (
              <p className="hotel-disclaimer">
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

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

export default HotelsPage;