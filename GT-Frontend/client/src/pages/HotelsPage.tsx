import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useSearchParams,
} from 'react-router-dom';

import {
  useTranslation,
} from 'react-i18next';

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

function getLocale(
  language:
    | string
    | undefined,
) {
  const normalized =
    language
      ?.split('-')[0] ??
    'es';

  if (
    normalized ===
    'en'
  ) {
    return 'en-US';
  }

  if (
    normalized ===
    'pt'
  ) {
    return 'pt-BR';
  }

  return 'es-CR';
}

function formatStayDate(
  value: string,
  locale: string,
) {
  const match =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/,
    );

  if (!match) {
    return value;
  }

  const [
    ,
    year,
    month,
    day,
  ] = match;

  const date =
    new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
      ),
    );

  return new Intl.DateTimeFormat(
    locale,
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
    date,
  );
}

function HotelsPage() {
  const {
    t,
    i18n,
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

  const locale =
    getLocale(
      i18n.resolvedLanguage ??
        i18n.language,
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
            'Error searching hotels:',
            requestError,
          );

          setHotels(
            [],
          );

          setMeta(
            null,
          );

          setError(
            'hotels.list.errors.loadMessage',
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
            {t(
              'hotels.list.hero.eyebrow',
            )}
          </span>

          <h1>
            {cityName
              ? t(
                  'hotels.list.hero.cityTitle',
                  {
                    city:
                      cityName,
                  },
                )
              : t(
                  'hotels.list.hero.title',
                )}
          </h1>

          <p>
            {t(
              'hotels.list.hero.description',
            )}
          </p>

          <div className="gt-hotel-hero-badges">

            <span>
              {t(
                'hotels.list.hero.badges.stays',
              )}
            </span>

            <span>
              {t(
                'hotels.list.hero.badges.destinations',
              )}
            </span>

            <span>
              {t(
                'hotels.list.hero.badges.explore',
              )}
            </span>

          </div>

        </div>
      </section>

      <section className="hotels-search-section">
        <HotelSearchForm />
      </section>

      {!hasSearch && (
        <section className="hotels-empty-start">

          <span className="gt-hotel-empty-eyebrow">
            {t(
              'hotels.list.start.eyebrow',
            )}
          </span>

          <h2>
            {t(
              'hotels.list.start.title',
            )}
          </h2>

          <p>
            {t(
              'hotels.list.start.description',
            )}
          </p>

        </section>
      )}

      {hasSearch &&
        isLoading && (
          <section className="hotels-status">

            <div className="gt-hotel-loader" />

            <h2>
              {t(
                'hotels.list.loading.title',
              )}
            </h2>

            <p>
              {t(
                'hotels.list.loading.description',
                {
                  city:
                    cityName,
                },
              )}
            </p>

          </section>
        )}

      {hasSearch &&
        !isLoading &&
        error && (
          <section className="hotels-status hotels-error">

            <h2>
              {t(
                'hotels.list.errors.title',
              )}
            </h2>

            <p>
              {t(
                error,
              )}
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
              {t(
                'hotels.list.empty.title',
              )}
            </h2>

            <p>
              {t(
                'hotels.list.empty.description',
              )}
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

                <span className="gt-hotel-results-eyebrow">
                  {t(
                    'hotels.list.results.eyebrow',
                  )}
                </span>

                <h2>
                  {
                    hotels.length
                  }{' '}

                  {hotels.length ===
                  1
                    ? t(
                        'hotels.list.results.oneFound',
                      )
                    : t(
                        'hotels.list.results.manyFound',
                      )}
                </h2>

                {checkin &&
                  checkout && (
                    <p>
                      {formatStayDate(
                        checkin,
                        locale,
                      )}

                      {' — '}

                      {formatStayDate(
                        checkout,
                        locale,
                      )}

                      {' · '}

                      {adults}{' '}

                      {adults ===
                      '1'
                        ? t(
                            'hotels.list.results.adult',
                          )
                        : t(
                            'hotels.list.results.adults',
                          )}

                      {' · '}

                      {
                        currency
                      }
                    </p>
                  )}

              </div>

              {meta?.stale && (
                <span className="hotel-cache-warning">
                  {t(
                    'hotels.list.results.cached',
                  )}
                </span>
              )}

            </section>

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
                              {t(
                                'hotels.list.card.noImage',
                              )}
                            </span>
                          </div>
                        )}

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
                              city:
                                hotel.city ??
                                null,

                              country:
                                hotel.country ??
                                null,

                              stars:
                                hotel.starRating ??
                                null,

                              rating:
                                hotel.rating ??
                                null,

                              chain:
                                hotel.chain ??
                                null,
                            },
                          }}
                        />

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
                                  ? t(
                                      'hotels.list.card.review',
                                    )
                                  : t(
                                      'hotels.list.card.reviews',
                                    )}
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

                          {hotel.links.map && (
                            <a
                              href={
                                hotel.links.map
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hotel-map-link"
                            >
                              {t(
                                'hotels.list.card.viewMap',
                              )}
                            </a>
                          )}

                          <Link
                            to={
                              detailUrl
                            }
                            className="hotel-detail-button"
                          >
                            {t(
                              'hotels.list.card.viewDetails',
                            )}
                          </Link>

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

export default HotelsPage;