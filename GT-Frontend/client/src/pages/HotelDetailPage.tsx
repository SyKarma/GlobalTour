import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import {
  getHotelById,
  getHotelRates,
} from '../services/hotels.service';

import {
  useCurrency,
} from '../hooks/useCurrency';

import type {
  HotelDetail,
  HotelDetailMeta,
  HotelRate,
  HotelRatesMeta,
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

function formatPrice(
  price: number,
  currency: string,
) {
  return new Intl.NumberFormat(
    'es-CR',
    {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    },
  ).format(
    price,
  );
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return 'No definida';
  }

  const date =
    new Date(
      `${value}T12:00:00`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'es-CR',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(
    date,
  );
}

function htmlToPlainText(
  html: string,
) {
  const parser =
    new DOMParser();

  const document =
    parser.parseFromString(
      html
        .replace(
          /<br\s*\/?>/gi,
          '\n',
        )
        .replace(
          /<\/p>/gi,
          '\n\n',
        ),
      'text/html',
    );

  return (
    document.body.textContent
      ?.replace(
        /\n{3,}/g,
        '\n\n',
      )
      .trim() ??
    ''
  );
}

function hasValidChain(
  chain:
    string | null,
) {
  if (!chain) {
    return false;
  }

  const normalized =
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
    normalized,
  );
}

/*
 * =========================================
 * PAGE
 * =========================================
 */

function HotelDetailPage() {
  const navigate =
    useNavigate();

  const {
    id,
  } =
    useParams();

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
    hotel,
    setHotel,
  ] =
    useState<HotelDetail | null>(
      null,
    );

  const [
    hotelMeta,
    setHotelMeta,
  ] =
    useState<HotelDetailMeta | null>(
      null,
    );

  const [
    rates,
    setRates,
  ] =
    useState<HotelRate[]>(
      [],
    );

  const [
    ratesMeta,
    setRatesMeta,
  ] =
    useState<HotelRatesMeta | null>(
      null,
    );

  const [
    isLoadingHotel,
    setIsLoadingHotel,
  ] =
    useState(
      true,
    );

  const [
    isLoadingRates,
    setIsLoadingRates,
  ] =
    useState(
      false,
    );

  const [
    hotelError,
    setHotelError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    ratesError,
    setRatesError,
  ] =
    useState<string | null>(
      null,
    );

  const checkin =
    searchParams.get(
      'checkin',
    );

  const checkout =
    searchParams.get(
      'checkout',
    );

  const rawAdults =
    Number(
      searchParams.get(
        'adults',
      ) || '2',
    );

  const adults =
    Number.isFinite(
      rawAdults,
    )
      ? Math.min(
          8,
          Math.max(
            1,
            rawAdults,
          ),
        )
      : 2;

  const currency =
    selectedCurrency;

  const hasStayDates =
    Boolean(
      checkin &&
      checkout,
    );

  const handleBack = () => {
    if (
      window.history.length >
      1
    ) {
      navigate(
        -1,
      );

      return;
    }

    navigate(
      '/hotels',
    );
  };

  /*
   * =========================================
   * CURRENCY
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
        replace: true,
      },
    );
  }, [
    searchParams,
    selectedCurrency,
    setSearchParams,
  ]);

  /*
   * =========================================
   * HOTEL
   * =========================================
   */

  useEffect(() => {
    let cancelled =
      false;

    const loadHotel =
      async () => {
        if (!id) {
          setHotelError(
            'No se encontró el identificador del hotel.',
          );

          setIsLoadingHotel(
            false,
          );

          return;
        }

        try {
          setIsLoadingHotel(
            true,
          );

          setHotelError(
            null,
          );

          const response =
            await getHotelById(
              id,
            );

          if (
            cancelled
          ) {
            return;
          }

          setHotel(
            response.data,
          );

          setHotelMeta(
            response.meta,
          );
        } catch (
          error
        ) {
          if (
            cancelled
          ) {
            return;
          }

          console.error(
            'Error al cargar el hotel:',
            error,
          );

          setHotel(
            null,
          );

          setHotelError(
            'No pudimos obtener la información del alojamiento.',
          );
        } finally {
          if (
            !cancelled
          ) {
            setIsLoadingHotel(
              false,
            );
          }
        }
      };

    void loadHotel();

    return () => {
      cancelled =
        true;
    };
  }, [
    id,
  ]);

  /*
   * =========================================
   * RATES
   * =========================================
   */

  useEffect(() => {
    let cancelled =
      false;

    const loadRates =
      async () => {
        if (
          !id ||
          !checkin ||
          !checkout
        ) {
          setRates(
            [],
          );

          setRatesMeta(
            null,
          );

          setRatesError(
            null,
          );

          return;
        }

        try {
          setIsLoadingRates(
            true,
          );

          setRatesError(
            null,
          );

          const response =
            await getHotelRates(
              id,
              {
                checkin,
                checkout,
                adults,
                currency,
              },
            );

          if (
            cancelled
          ) {
            return;
          }

          setRates(
            response.data.rates ??
              [],
          );

          setRatesMeta(
            response.meta,
          );
        } catch (
          error
        ) {
          if (
            cancelled
          ) {
            return;
          }

          console.error(
            'Error al cargar tarifas:',
            error,
          );

          setRates(
            [],
          );

          setRatesMeta(
            null,
          );

          setRatesError(
            'No pudimos obtener tarifas para las fechas seleccionadas.',
          );
        } finally {
          if (
            !cancelled
          ) {
            setIsLoadingRates(
              false,
            );
          }
        }
      };

    void loadRates();

    return () => {
      cancelled =
        true;
    };
  }, [
    id,
    checkin,
    checkout,
    adults,
    currency,
  ]);

  /*
   * =========================================
   * LOADING
   * =========================================
   */

  if (
    isLoadingHotel
  ) {
    return (
      <main className="gt-hotel-detail-page">
        <div className="gt-detail-loading-shell">
          <div className="gt-detail-loading-hero" />

          <div className="gt-detail-loading-grid">
            <div />
            <div />
          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================================
   * ERROR
   * =========================================
   */

  if (
    hotelError ||
    !hotel
  ) {
    return (
      <main className="gt-hotel-detail-page">
        <section className="gt-detail-error-state">
          <div className="gt-detail-error-icon">
            <HotelIcon />
          </div>

          <span>
            HOSPEDAJE
          </span>

          <h1>
            No pudimos cargar este alojamiento
          </h1>

          <p>
            {hotelError ??
              'El alojamiento solicitado no está disponible.'}
          </p>

          <button
            type="button"
            onClick={
              handleBack
            }
          >
            <ArrowLeftIcon />

            Volver a resultados
          </button>
        </section>
      </main>
    );
  }

  const hotelImages =
    hotel.images ??
    [];

  const amenities =
    hotel.amenities ??
    [];

  const mainImage =
    hotel.mainPhoto ??
    hotelImages[0]?.url ??
    hotel.thumbnail ??
    null;

  const galleryImages =
    hotelImages
      .filter(
        (
          image,
        ) =>
          Boolean(
            image.url,
          ) &&
          image.url !==
            mainImage,
      )
      .slice(
        0,
        4,
      );

  const cleanDescription =
    hotel.description
      ? htmlToPlainText(
          hotel.description,
        )
      : '';

  const mapUrl =
    hotel.links?.map ??
    null;

  const hasRating =
    typeof hotel.rating ===
    'number';

  return (
    <main className="gt-hotel-detail-page">

      {/* =====================================
          HERO
      ====================================== */}

      <section className="gt-hotel-detail-hero">
        {mainImage ? (
          <img
            src={
              mainImage
            }
            alt={
              hotel.name
            }
          />
        ) : (
          <div className="gt-hotel-detail-hero-placeholder" />
        )}

        <div className="gt-hotel-detail-hero-overlay" />

        <div className="gt-hotel-detail-hero-content">
          <button
            type="button"
            className="gt-detail-back-button gt-detail-back-light"
            onClick={
              handleBack
            }
          >
            <ArrowLeftIcon />

            Volver a resultados
          </button>

          <div className="gt-hotel-detail-hero-bottom">
            <div>
              <span className="gt-hotel-detail-eyebrow">
                GLOBALTOUR · HOSPEDAJE
              </span>

              {hotel.starRating && (
                <div className="gt-hotel-detail-stars">
                  {renderStars(
                    hotel.starRating,
                  )}
                </div>
              )}

              <h1>
                {hotel.name}
              </h1>

              <p>
                <LocationIcon />

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
                  ) ||
                  'Ubicación no disponible'}
              </p>
            </div>

            <div className="gt-hotel-detail-hero-actions">
              {hasRating && (
                <div className="gt-hotel-detail-rating">
                  <span>
                    Valoración
                  </span>

                  <strong>
                    {hotel.rating?.toFixed(
                      1,
                    )}
                  </strong>

                  {typeof hotel.reviewCount ===
                    'number' && (
                    <small>
                      {hotel.reviewCount}{' '}
                      {hotel.reviewCount ===
                      1
                        ? 'reseña'
                        : 'reseñas'}
                    </small>
                  )}
                </div>
              )}

              {mapUrl && (
                <a
                  href={
                    mapUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gt-detail-outline-light"
                >
                  <MapIcon />

                  Ver mapa
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          BODY
      ====================================== */}

      <div className="gt-detail-content-shell">

        {hotelMeta?.stale && (
          <div className="gt-detail-cache-notice">
            <InfoIcon />

            Mostrando información almacenada temporalmente.
          </div>
        )}

        {/* GALLERY */}

        {galleryImages.length >
          0 && (
          <section className="gt-hotel-detail-gallery">
            {galleryImages.map(
              (
                image,
                index,
              ) => (
              <figure
                key={`${image.url}-${index}`}
              >
                <img
                  src={
                    image.url
                  }
                  alt={
                    image.caption ??
                    `${hotel.name} ${index + 1}`
                  }
                  loading="lazy"
                />

                {image.caption && (
                  <figcaption>
                    {image.caption}
                  </figcaption>
                )}
              </figure>
              ),
            )}
          </section>
        )}

        {/* MAIN GRID */}

        <section className="gt-hotel-detail-layout">
          <div className="gt-detail-main-column">

            <article className="gt-detail-panel">
              <span className="gt-detail-panel-eyebrow">
                EL ALOJAMIENTO
              </span>

              <h2>
                Sobre {hotel.name}
              </h2>

              {cleanDescription ? (
                <p className="gt-detail-description">
                  {cleanDescription}
                </p>
              ) : (
                <p className="gt-detail-muted">
                  Este alojamiento no tiene una descripción disponible.
                </p>
              )}

              {hasValidChain(
                hotel.chain,
              ) && (
                <div className="gt-hotel-chain-card">
                  <BuildingIcon />

                  <div>
                    <span>
                      Cadena hotelera
                    </span>

                    <strong>
                      {hotel.chain}
                    </strong>
                  </div>
                </div>
              )}
            </article>

            <article className="gt-detail-panel">
              <span className="gt-detail-panel-eyebrow">
                COMODIDADES
              </span>

              <h2>
                Servicios del alojamiento
              </h2>

              {amenities.length >
                0 ? (
                <div className="gt-hotel-amenities-grid">
                  {amenities.map(
                    (
                      amenity,
                      index,
                    ) => (
                    <div
                      key={`${amenity}-${index}`}
                    >
                      <CheckIcon />

                      <span>
                        {amenity}
                      </span>
                    </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="gt-detail-muted">
                  No hay información de servicios disponible.
                </p>
              )}
            </article>
          </div>

          {/* STAY */}

          <aside className="gt-hotel-stay-card">
            <span className="gt-detail-panel-eyebrow">
              TU ESTADÍA
            </span>

            <h2>
              Resumen del viaje
            </h2>

            <div className="gt-hotel-stay-detail">
              <CalendarIcon />

              <div>
                <span>
                  Check-in
                </span>

                <strong>
                  {formatDate(
                    checkin,
                  )}
                </strong>
              </div>
            </div>

            <div className="gt-hotel-stay-detail">
              <CalendarIcon />

              <div>
                <span>
                  Check-out
                </span>

                <strong>
                  {formatDate(
                    checkout,
                  )}
                </strong>
              </div>
            </div>

            <div className="gt-hotel-stay-detail">
              <GuestsIcon />

              <div>
                <span>
                  Huéspedes
                </span>

                <strong>
                  {adults}{' '}
                  {adults ===
                  1
                    ? 'adulto'
                    : 'adultos'}
                </strong>
              </div>
            </div>

            <div className="gt-hotel-stay-detail">
              <CurrencyIcon />

              <div>
                <span>
                  Moneda
                </span>

                <strong>
                  {currency}
                </strong>
              </div>
            </div>

            {!hasStayDates && (
              <p className="gt-hotel-stay-warning">
                Realiza una búsqueda con fechas para consultar tarifas.
              </p>
            )}
          </aside>
        </section>

        {/* =====================================
            RATES
        ====================================== */}

        <section className="gt-hotel-rates-section">
          <div className="gt-detail-section-heading">
            <div>
              <span className="gt-detail-panel-eyebrow">
                DISPONIBILIDAD
              </span>

              <h2>
                Habitaciones y tarifas
              </h2>

              <p>
                Consulta las opciones disponibles para las fechas seleccionadas.
              </p>
            </div>

            {ratesMeta?.stale && (
              <span className="gt-detail-cache-badge">
                Tarifas en caché
              </span>
            )}
          </div>

          {!hasStayDates && (
            <DetailMessage
              icon={
                <CalendarIcon />
              }
              title="Selecciona tus fechas"
              text="Vuelve a Hospedaje y realiza una búsqueda con check-in y check-out."
            />
          )}

          {hasStayDates &&
            isLoadingRates && (
            <div className="gt-hotel-rate-loading">
              {[1, 2, 3].map(
                (
                  item,
                ) => (
                <div
                  key={
                    item
                  }
                />
                ),
              )}
            </div>
          )}

          {hasStayDates &&
            !isLoadingRates &&
            ratesError && (
            <DetailMessage
              icon={
                <InfoIcon />
              }
              title="No pudimos consultar las tarifas"
              text={
                ratesError
              }
            />
          )}

          {hasStayDates &&
            !isLoadingRates &&
            !ratesError &&
            rates.length ===
              0 && (
            <DetailMessage
              icon={
                <HotelIcon />
              }
              title="Sin disponibilidad"
              text="No encontramos habitaciones disponibles para estas fechas."
            />
          )}

          {hasStayDates &&
            !isLoadingRates &&
            !ratesError &&
            rates.length >
              0 && (
            <div className="gt-hotel-rate-list">
              {rates.map(
                (
                  rate,
                  index,
                ) => (
                <article
                  className="gt-hotel-rate-card"
                  key={`${rate.name}-${rate.board}-${rate.price}-${index}`}
                >
                  <div className="gt-hotel-rate-icon">
                    <BedIcon />
                  </div>

                  <div className="gt-hotel-rate-copy">
                    <span>
                      HABITACIÓN
                    </span>

                    <h3>
                      {rate.name ??
                        'Habitación'}
                    </h3>

                    <div className="gt-hotel-rate-meta">
                      {rate.board && (
                        <span>
                          <FoodIcon />

                          {rate.board}
                        </span>
                      )}

                      {typeof rate.maxOccupancy ===
                        'number' && (
                        <span>
                          <GuestsIcon />

                          Hasta{' '}
                          {rate.maxOccupancy}{' '}
                          {rate.maxOccupancy ===
                          1
                            ? 'persona'
                            : 'personas'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="gt-hotel-rate-price">
                    <span>
                      Precio indicativo
                    </span>

                    <strong>
                      {formatPrice(
                        rate.price,
                        rate.currency ||
                          currency,
                      )}
                    </strong>

                    <small>
                      {rate.currency ||
                        currency}
                    </small>
                  </div>
                </article>
                ),
              )}
            </div>
          )}

          {ratesMeta?.disclaimer && (
            <div className="gt-detail-disclaimer">
              <InfoIcon />

              {ratesMeta.disclaimer}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/*
 * =========================================
 * MESSAGE
 * =========================================
 */

interface DetailMessageProps {
  icon:
    React.ReactNode;

  title:
    string;

  text:
    string;
}

function DetailMessage({
  icon,
  title,
  text,
}: DetailMessageProps) {
  return (
    <div className="gt-detail-message">
      <div>
        {icon}
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>
    </div>
  );
}

/*
 * =========================================
 * ICONS
 * =========================================
 */

function HotelIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13M2 20h20M8 9h2M14 9h2M8 13h2M14 13h2" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15M15 6v15" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7h.01" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 21V5h10v16M14 9h6v12M2 21h20M8 9h2M8 13h2M8 17h2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 12 4 4 8-8" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function GuestsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3" />
      <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  );
}

function CurrencyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v12M16 8.5c-.8-.7-2-1-3.2-1-1.8 0-3.3.8-3.3 2.1 0 3.2 7 1.2 7 4.7 0 1.4-1.5 2.3-3.6 2.3-1.5 0-2.8-.4-3.8-1.2" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 18V8M21 18v-6a2 2 0 0 0-2-2H8a3 3 0 0 0-3 3v5M3 15h18M7 10V7h5v3" />
    </svg>
  );
}

function FoodIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3v18" />
    </svg>
  );
}

export default HotelDetailPage;