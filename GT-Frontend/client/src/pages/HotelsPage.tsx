import {
  useEffect,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';

import HotelSearchForm from '../components/hotels/HotelSearchForm';

import { searchHotels } from '../services/hotels.service';

import { useCurrency } from '../hooks/useCurrency';

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

  const roundedStars = Math.min(
    5,
    Math.max(
      1,
      Math.round(stars),
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
  ] = useSearchParams();

  const {
    selectedCurrency,
  } = useCurrency();

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
    useState(false);

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

  /**
   * Mantiene la moneda de la URL
   * sincronizada con el selector global.
   *
   * Solo se ejecuta cuando ya existe
   * una búsqueda de hotel.
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

  /**
   * Carga los hoteles.
   *
   * La moneda NO se incluye aquí
   * porque /api/hotels/search
   * solamente utiliza ciudad y país.
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

  return (
    <main className="hotels-page">
      <section className="hotels-header">
        <p className="hotels-eyebrow">
          HOSPEDAJE
        </p>

        <h1>
          {cityName
            ? `Alojamientos en ${cityName}`
            : 'Encuentra tu hospedaje'}
        </h1>

        <p>
          Busca y compara alojamientos para tu próximo viaje.
        </p>
      </section>

      <section className="hotels-search-section">
        <HotelSearchForm />
      </section>

      {!hasSearch && (
        <section className="hotels-empty-start">
          <h2>
            ¿Dónde quieres hospedarte?
          </h2>

          <p>
            Selecciona un destino, las fechas de tu estadía y la cantidad de huéspedes para comenzar.
          </p>
        </section>
      )}

      {hasSearch &&
        isLoading && (
          <section className="hotels-status">
            <h2>
              Buscando alojamientos...
            </h2>

            <p>
              Estamos consultando opciones disponibles en{' '}
              {cityName}.
            </p>
          </section>
        )}

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
              Prueba con otro destino o vuelve a intentarlo más tarde.
            </p>
          </section>
        )}

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
                      {checkin}{' '}
                      —{' '}
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
                (hotel) => (
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
                          href={buildHotelDetailUrl(
                            hotel.id,
                          )}
                          className="hotel-detail-button"
                        >
                          Ver disponibilidad
                        </a>
                      </div>
                    </div>
                  </article>
                ),
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

export default HotelsPage;