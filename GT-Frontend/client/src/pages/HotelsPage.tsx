import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useSearchParams,
} from 'react-router-dom';

import HotelSearchForm from '../components/hotels/HotelSearchForm';
import WishlistHeart from '../components/wishlist/WishlistHeart';

import {
  searchHotels,
} from '../services/hotels.service';

import {
  useCurrency,
} from '../hooks/useCurrency';

import hotelHeroImage from '../assets/visuals/hotel.jpg';

import type {
  HotelSearchMeta,
  HotelSummary,
} from '../types/hotel.types';

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
    useState<
      HotelSearchMeta | null
    >(null);

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

  /*
   * =========================================
   * URL PARAMS
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
        replace:
          true,
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
                limit:
                  20,
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
   * DETAIL URL
   * =========================================
   */

  const buildHotelDetailUrl = (
    hotelId:
      string,
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
    <main className="hotels-page">

      {/* =====================================
          HERO
      ====================================== */}

      <section
        className="gt-hotel-photo-hero"
        style={{
          backgroundImage:
            `url(${hotelHeroImage})`,
        }}
      >
        <div className="gt-hotel-photo-overlay" />

        <div className="gt-hotel-photo-glow" />

        <div className="gt-hotel-photo-content">
          <span className="gt-hotel-photo-eyebrow">
            GLOBALTOUR · HOSPEDAJE
          </span>

          <h1>
            {cityName
              ? `Encuentra hospedaje en ${cityName}`
              : 'Encuentra tu hospedaje'}
          </h1>

          <p>
            Busca y compara alojamientos
            para encontrar el lugar ideal
            para tu próximo viaje.
          </p>

          <div className="gt-hotel-hero-badges">
            <span>
              Hospedajes
            </span>

            <span>
              Destinos
            </span>

            <span>
              Explora opciones
            </span>
          </div>
        </div>
      </section>

      {/* =====================================
          SEARCH
      ====================================== */}

      <section className="hotels-search-section">
        <HotelSearchForm />
      </section>

      {/* =====================================
          START
      ====================================== */}

      {!hasSearch && (
        <section className="hotels-empty-start">
          <span className="gt-hotel-empty-eyebrow">
            PLANEA TU ESTADÍA
          </span>

          <h2>
            ¿Dónde quieres hospedarte?
          </h2>

          <p>
            Selecciona un destino,
            las fechas de tu estadía y
            la cantidad de huéspedes
            para comenzar.
          </p>
        </section>
      )}

      {/* =====================================
          LOADING
      ====================================== */}

      {hasSearch &&
        isLoading && (
          <section className="hotels-status">
            <div className="gt-hotel-loader" />

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
                <span className="gt-hotel-results-eyebrow">
                  HOSPEDAJES ENCONTRADOS
                </span>

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

            {/* =================================
                HOTEL GRID
            ================================== */}

            <section className="hotel-results-grid">
              {hotels.map(
                (
                  hotel,
                ) => {
                  const detailUrl =
                    buildHotelDetailUrl(
                      hotel.id,
                    );

                  return (
                    <article
                      className="hotel-card"
                      key={
                        hotel.id
                      }
                    >

                      {/* =========================
                          IMAGE
                      ========================== */}

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
                            <span>
                              Sin imagen disponible
                            </span>
                          </div>
                        )}

                        {/* =========================
                            WISHLIST
                        ========================== */}

                        <WishlistHeart
                          item={{
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
                              detailUrl,

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
                          }}
                        />
                      </div>

                      {/* =========================
                          CONTENT
                      ========================== */}

                      <div className="hotel-card-content">
                        <div className="hotel-card-main">

                          {/* STARS */}

                          {hotel.starRating && (
                            <span className="hotel-stars">
                              {renderStars(
                                hotel.starRating,
                              )}
                            </span>
                          )}

                          {/* NAME */}

                          <h3>
                            {
                              hotel.name
                            }
                          </h3>

                          {/* LOCATION */}

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

                          {/* ADDRESS */}

                          {hotel.address && (
                            <p className="hotel-address">
                              {
                                hotel.address
                              }
                            </p>
                          )}

                          {/* META */}

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

                        {/* =========================
                            ACTIONS
                        ========================== */}

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

                          <Link
                            to={
                              detailUrl
                            }
                            className="hotel-detail-button"
                          >
                            Ver detalles
                          </Link>

                        </div>
                      </div>

                    </article>
                  );
                },
              )}
            </section>

            {/* =================================
                DISCLAIMER
            ================================== */}

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

export default HotelsPage;