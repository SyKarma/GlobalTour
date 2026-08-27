import { useEffect, useState } from 'react';
import {
  Link,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import {
  getHotelById,
  getHotelRates,
} from '../services/hotels.service';

import type {
  HotelDetail,
  HotelDetailMeta,
  HotelRate,
  HotelRatesMeta,
} from '../types/hotel.types';

function renderStars(stars: number | null) {
  if (!stars) {
    return null;
  }

  const roundedStars = Math.min(
    5,
    Math.max(1, Math.round(stars)),
  );

  return '★'.repeat(roundedStars);
}

function formatPrice(
  price: number,
  currency: string,
) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(price);
}

function htmlToPlainText(html: string) {
  const parser = new DOMParser();

  const document = parser.parseFromString(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n'),
    'text/html',
  );

  return (
    document.body.textContent
      ?.replace(/\n{3,}/g, '\n\n')
      .trim() ?? ''
  );
}

function hasValidChain(chain: string | null) {
  if (!chain) {
    return false;
  }

  const normalized = chain
    .trim()
    .toLowerCase();

  return ![
    'not available',
    'n/a',
    'na',
    'unknown',
    'none',
  ].includes(normalized);
}

function HotelDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const [hotel, setHotel] =
    useState<HotelDetail | null>(null);

  const [hotelMeta, setHotelMeta] =
    useState<HotelDetailMeta | null>(null);

  const [rates, setRates] =
    useState<HotelRate[]>([]);

  const [ratesMeta, setRatesMeta] =
    useState<HotelRatesMeta | null>(null);

  const [isLoadingHotel, setIsLoadingHotel] =
    useState(true);

  const [isLoadingRates, setIsLoadingRates] =
    useState(false);

  const [hotelError, setHotelError] =
    useState<string | null>(null);

  const [ratesError, setRatesError] =
    useState<string | null>(null);

  const checkin =
    searchParams.get('checkin');

  const checkout =
    searchParams.get('checkout');

  const adults = Number(
    searchParams.get('adults') || '2',
  );

  const currency =
    searchParams.get('currency') || 'USD';

  const hasStayDates =
    Boolean(checkin && checkout);

  useEffect(() => {
    let isCancelled = false;

    const loadHotel = async () => {
      if (!id) {
        setHotelError(
          'No se encontró el identificador del hotel.',
        );

        setIsLoadingHotel(false);

        return;
      }

      try {
        setIsLoadingHotel(true);
        setHotelError(null);

        const response =
          await getHotelById(id);

        if (isCancelled) {
          return;
        }

        setHotel(response.data);
        setHotelMeta(response.meta);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error(
          'Error al cargar el hotel:',
          error,
        );

        setHotel(null);

        setHotelError(
          'No pudimos obtener la información del alojamiento.',
        );
      } finally {
        if (!isCancelled) {
          setIsLoadingHotel(false);
        }
      }
    };

    void loadHotel();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let isCancelled = false;

    const loadRates = async () => {
      if (
        !id ||
        !checkin ||
        !checkout
      ) {
        setRates([]);
        setRatesMeta(null);
        setRatesError(null);

        return;
      }

      try {
        setIsLoadingRates(true);
        setRatesError(null);

        const response =
          await getHotelRates(id, {
            checkin,
            checkout,
            adults,
            currency,
          });

        if (isCancelled) {
          return;
        }

        setRates(response.data.rates);
        setRatesMeta(response.meta);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error(
          'Error al cargar tarifas:',
          error,
        );

        setRates([]);
        setRatesMeta(null);

        setRatesError(
          'No pudimos obtener las tarifas para estas fechas.',
        );
      } finally {
        if (!isCancelled) {
          setIsLoadingRates(false);
        }
      }
    };

    void loadRates();

    return () => {
      isCancelled = true;
    };
  }, [
    id,
    checkin,
    checkout,
    adults,
    currency,
  ]);

  if (isLoadingHotel) {
    return (
      <main className="hotel-detail-page">
        <section className="hotel-detail-status">
          <h2>
            Cargando alojamiento...
          </h2>

          <p>
            Estamos obteniendo la información del hotel.
          </p>
        </section>
      </main>
    );
  }

  if (hotelError || !hotel) {
    return (
      <main className="hotel-detail-page">
        <Link
          to="/hotels"
          className="hotel-back-link"
        >
          ← Volver a hospedaje
        </Link>

        <section className="hotel-detail-status hotel-detail-error">
          <h2>
            No pudimos cargar el alojamiento
          </h2>

          <p>
            {hotelError ||
              'El alojamiento no está disponible.'}
          </p>
        </section>
      </main>
    );
  }

  const mainImage =
    hotel.mainPhoto ||
    hotel.images[0]?.url ||
    hotel.thumbnail;

  const galleryImages = hotel.images
    .filter(
      (image) =>
        image.url !== mainImage,
    )
    .slice(0, 4);

  const cleanDescription =
    hotel.description
      ? htmlToPlainText(
          hotel.description,
        )
      : null;

  return (
    <main className="hotel-detail-page">
      <Link
        to="/hotels"
        className="hotel-back-link"
      >
        ← Volver a hospedaje
      </Link>

      <section className="hotel-detail-heading">
        <div>
          {hotel.starRating && (
            <span className="hotel-detail-stars">
              {renderStars(
                hotel.starRating,
              )}
            </span>
          )}

          <h1>{hotel.name}</h1>

          <p>
            {[
              hotel.address,
              hotel.city,
              hotel.country,
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>

        <div className="hotel-detail-heading-actions">
          {hotel.rating !== null && (
            <div className="hotel-detail-rating">
              <strong>
                {hotel.rating.toFixed(1)}
              </strong>

              <span>
                {hotel.reviewCount !== null
                  ? `${hotel.reviewCount} reseñas`
                  : 'Valoración'}
              </span>
            </div>
          )}

          {hotel.links.map && (
            <a
              href={hotel.links.map}
              target="_blank"
              rel="noopener noreferrer"
              className="hotel-detail-map-button"
            >
              Ver en mapa
            </a>
          )}
        </div>
      </section>

      {hotelMeta?.stale && (
        <div className="hotel-detail-warning">
          Mostrando información almacenada temporalmente.
        </div>
      )}

      <section className="hotel-gallery">
        <div className="hotel-gallery-main">
          {mainImage ? (
            <img
              src={mainImage}
              alt={hotel.name}
            />
          ) : (
            <div className="hotel-gallery-placeholder">
              Sin imagen disponible
            </div>
          )}
        </div>

        {galleryImages.length > 0 && (
          <div className="hotel-gallery-side">
            {galleryImages.map(
              (image, index) => (
                <div
                  className="hotel-gallery-small"
                  key={`${image.url}-${index}`}
                >
                  <img
                    src={image.url}
                    alt={
                      image.caption ||
                      `${hotel.name} ${index + 1}`
                    }
                    loading="lazy"
                  />
                </div>
              ),
            )}
          </div>
        )}
      </section>

      <section className="hotel-detail-layout">
        <div className="hotel-detail-main-content">
          <section className="hotel-detail-section">
            <h2>
              Sobre el alojamiento
            </h2>

            {cleanDescription ? (
              <p className="hotel-description">
                {cleanDescription}
              </p>
            ) : (
              <p className="hotel-detail-muted">
                No hay descripción disponible.
              </p>
            )}

            {hasValidChain(hotel.chain) && (
              <p className="hotel-chain">
                Cadena:{' '}
                <strong>
                  {hotel.chain}
                </strong>
              </p>
            )}
          </section>

          <section className="hotel-detail-section">
            <h2>
              Servicios y comodidades
            </h2>

            {hotel.amenities.length > 0 ? (
              <div className="hotel-amenities">
                {hotel.amenities.map(
                  (amenity) => (
                    <span
                      className="hotel-amenity"
                      key={amenity}
                    >
                      {amenity}
                    </span>
                  ),
                )}
              </div>
            ) : (
              <p className="hotel-detail-muted">
                No hay información de servicios disponible.
              </p>
            )}
          </section>
        </div>

        <aside className="hotel-stay-summary">
          <h2>
            Tu estadía
          </h2>

          {hasStayDates ? (
            <>
              <div className="hotel-stay-row">
                <span>Check-in</span>

                <strong>
                  {checkin}
                </strong>
              </div>

              <div className="hotel-stay-row">
                <span>Check-out</span>

                <strong>
                  {checkout}
                </strong>
              </div>

              <div className="hotel-stay-row">
                <span>Huéspedes</span>

                <strong>
                  {adults}{' '}
                  {adults === 1
                    ? 'adulto'
                    : 'adultos'}
                </strong>
              </div>

              <div className="hotel-stay-row">
                <span>Moneda</span>

                <strong>
                  {currency}
                </strong>
              </div>
            </>
          ) : (
            <p>
              Realiza una búsqueda con fechas para consultar
              disponibilidad y precios.
            </p>
          )}
        </aside>
      </section>

      <section className="hotel-rates-section">
        <div className="hotel-rates-heading">
          <div>
            <span>
              DISPONIBILIDAD
            </span>

            <h2>
              Habitaciones y tarifas
            </h2>
          </div>

          {ratesMeta?.stale && (
            <span className="hotel-cache-warning">
              Tarifas almacenadas temporalmente
            </span>
          )}
        </div>

        {!hasStayDates && (
          <div className="hotel-rates-status">
            <h3>
              Selecciona tus fechas
            </h3>

            <p>
              Vuelve a Hospedaje y realiza una búsqueda con
              check-in y check-out para consultar tarifas.
            </p>
          </div>
        )}

        {hasStayDates &&
          isLoadingRates && (
            <div className="hotel-rates-status">
              <h3>
                Consultando disponibilidad...
              </h3>

              <p>
                Estamos buscando habitaciones para las fechas
                seleccionadas.
              </p>
            </div>
          )}

        {hasStayDates &&
          !isLoadingRates &&
          ratesError && (
            <div className="hotel-rates-status hotel-detail-error">
              <h3>
                No pudimos obtener las tarifas
              </h3>

              <p>{ratesError}</p>
            </div>
          )}

        {hasStayDates &&
          !isLoadingRates &&
          !ratesError &&
          rates.length === 0 && (
            <div className="hotel-rates-status">
              <h3>
                Sin disponibilidad
              </h3>

              <p>
                No encontramos habitaciones disponibles para
                estas fechas.
              </p>
            </div>
          )}

        {hasStayDates &&
          !isLoadingRates &&
          !ratesError &&
          rates.length > 0 && (
            <div className="hotel-rates-list">
              {rates.map(
                (rate, index) => (
                  <article
                    className="hotel-rate-card"
                    key={`${rate.name}-${rate.board}-${rate.price}-${index}`}
                  >
                    <div className="hotel-rate-info">
                      <h3>
                        {rate.name ||
                          'Habitación'}
                      </h3>

                      {rate.board && (
                        <span>
                          {rate.board}
                        </span>
                      )}

                      {rate.maxOccupancy !== null && (
                        <p>
                          Hasta{' '}
                          {rate.maxOccupancy}{' '}
                          {rate.maxOccupancy === 1
                            ? 'persona'
                            : 'personas'}
                        </p>
                      )}
                    </div>

                    <div className="hotel-rate-price">
                      <span>
                        Precio indicativo
                      </span>

                      <strong>
                        {formatPrice(
                          rate.price,
                          rate.currency,
                        )}
                      </strong>

                      <small>
                        {rate.currency}
                      </small>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}

        {ratesMeta?.disclaimer && (
          <p className="hotel-disclaimer">
            {ratesMeta.disclaimer}
          </p>
        )}
      </section>
    </main>
  );
}

export default HotelDetailPage;