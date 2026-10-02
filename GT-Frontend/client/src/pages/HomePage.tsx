import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  Link,
  useLocation,
} from 'react-router-dom';

import {
  useTranslation,
} from 'react-i18next';

import TripSearchForm from '../components/trip/TripSearchForm';
import HotelSearchForm from '../components/hotels/HotelSearchForm';

type SearchTab =
  | 'flights'
  | 'hotels'
  | 'restaurants'
  | 'cars';

interface PopularDestination {
  city: string;
  countryKey: string;
  iata: string;
  price: string;
  image: string;
}

const popularDestinations: PopularDestination[] = [
  {
    city: 'Miami',
    countryKey:
      'home.destinations.countries.unitedStates',
    iata: 'MIA',
    price: '$295',
    image:
      'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=1200&q=85',
  },
  {
    city: 'Madrid',
    countryKey:
      'home.destinations.countries.spain',
    iata: 'MAD',
    price: '$620',
    image:
      'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=85',
  },
  {
    city: 'Cancún',
    countryKey:
      'home.destinations.countries.mexico',
    iata: 'CUN',
    price: '$340',
    image:
      'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?auto=format&fit=crop&w=1200&q=85',
  },
  {
    city: 'Bogotá',
    countryKey:
      'home.destinations.countries.colombia',
    iata: 'BOG',
    price: '$280',
    image:
      'https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?auto=format&fit=crop&w=1200&q=85',
  },
];

function HomePage() {
  const location =
    useLocation();

  const {
    t,
  } =
    useTranslation();

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<SearchTab>(
      'flights',
    );

  const [
    recommendedDestinationIata,
    setRecommendedDestinationIata,
  ] =
    useState<
      string | null
    >(null);

  const experiences: ExperienceItem[] = [
    {
      title:
        t(
          'home.experiences.items.flights.title',
        ),
      description:
        t(
          'home.experiences.items.flights.description',
        ),
      route:
        '/flights',
      eyebrow:
        t(
          'home.experiences.items.flights.eyebrow',
        ),
      icon:
        '✈',
      className:
        'gt-experience-flight',
    },
    {
      title:
        t(
          'home.experiences.items.hotels.title',
        ),
      description:
        t(
          'home.experiences.items.hotels.description',
        ),
      route:
        '/hotels',
      eyebrow:
        t(
          'home.experiences.items.hotels.eyebrow',
        ),
      icon:
        '⌂',
      className:
        'gt-experience-hotel',
    },
    {
      title:
        t(
          'home.experiences.items.restaurants.title',
        ),
      description:
        t(
          'home.experiences.items.restaurants.description',
        ),
      route:
        '/restaurants',
      eyebrow:
        t(
          'home.experiences.items.restaurants.eyebrow',
        ),
      icon:
        '◉',
      className:
        'gt-experience-food',
    },
    {
      title:
        t(
          'home.experiences.items.cars.title',
        ),
      description:
        t(
          'home.experiences.items.cars.description',
        ),
      route:
        '/cars',
      eyebrow:
        t(
          'home.experiences.items.cars.eyebrow',
        ),
      icon:
        '→',
      className:
        'gt-experience-car',
    },
  ];

  /*
   * =========================================
   * HASH NAVIGATION
   * =========================================
   */

  useEffect(() => {
    if (
      location.hash !==
      '#home-flight-search'
    ) {
      return;
    }

    const timeout =
      window.setTimeout(
        () => {
          document
            .getElementById(
              'home-flight-search',
            )
            ?.scrollIntoView({
              behavior:
                'smooth',
              block:
                'center',
            });
        },
        100,
      );

    return () => {
      window.clearTimeout(
        timeout,
      );
    };
  }, [
    location.hash,
  ]);

  /*
   * =========================================
   * FLIGHT SEARCH NAVIGATION
   * =========================================
   */

  const scrollToFlightSearch =
    () => {
      window.setTimeout(
        () => {
          document
            .getElementById(
              'home-flight-search',
            )
            ?.scrollIntoView({
              behavior:
                'smooth',
              block:
                'center',
            });
        },
        70,
      );
    };

  const handleExploreFlights =
    () => {
      setRecommendedDestinationIata(
        null,
      );

      setActiveTab(
        'flights',
      );

      scrollToFlightSearch();
    };

  const handleDestinationExplore =
    (
      iata: string,
    ) => {
      setRecommendedDestinationIata(
        iata,
      );

      setActiveTab(
        'flights',
      );

      scrollToFlightSearch();
    };

  return (
    <main className="gt-home">

      {/* =========================================
          HERO
      ========================================== */}

      <section className="gt-home-hero">
        <div className="gt-home-hero-background" />

        <div className="gt-home-hero-glow gt-glow-one" />

        <div className="gt-home-hero-glow gt-glow-two" />

        <div className="gt-home-hero-inner">

          <div className="gt-home-copy">

            <div className="gt-home-badge">
              <span className="gt-home-badge-dot" />

              {t(
                'home.hero.badge',
              )}
            </div>

            <h1>
              {t(
                'home.hero.titlePrimary',
              )}

              <span>
                {t(
                  'home.hero.titleAccent',
                )}
              </span>
            </h1>

            <p>
              {t(
                'home.hero.description',
              )}
            </p>

            <div className="gt-home-proof">

              <div>
                <strong>
                  4
                </strong>

                <span>
                  {t(
                    'home.hero.servicesConnected',
                  )}
                </span>
              </div>

              <div className="gt-proof-divider" />

              <div>
                <strong>
                  1
                </strong>

                <span>
                  {t(
                    'home.hero.platform',
                  )}
                </span>
              </div>

              <div className="gt-proof-divider" />

              <div>
                <strong>
                  24/7
                </strong>

                <span>
                  {t(
                    'home.hero.availableToExplore',
                  )}
                </span>
              </div>

            </div>
          </div>

          <div className="gt-hero-visual">

            <div className="gt-hero-image-card">
              <div className="gt-hero-image-overlay" />

              <div className="gt-hero-image-content">

                <span>
                  {t(
                    'home.hero.recommended',
                  )}
                </span>

                <div>
                  <strong>
                    Madrid
                  </strong>

                  <small>
                    {t(
                      'home.destinations.countries.spain',
                    )}{' '}
                    · MAD
                  </small>
                </div>

              </div>
            </div>

            <div className="gt-floating-card gt-floating-flight">

              <span className="gt-floating-icon">
                ✈
              </span>

              <div>
                <small>
                  {t(
                    'home.hero.nextFlight',
                  )}
                </small>

                <strong>
                  SJO → MAD
                </strong>
              </div>

            </div>

            <div className="gt-floating-card gt-floating-saving">

              <small>
                {t(
                  'home.hero.exploreMore',
                )}
              </small>

              <strong>
                {t(
                  'home.hero.allInOnePlace',
                )}
              </strong>

            </div>

          </div>
        </div>

        {/* =========================================
            SEARCH
        ========================================== */}

        <div
          className="gt-home-search-wrapper"
          id="home-flight-search"
        >
          <div className="gt-home-search-shell">

            <div className="gt-home-search-tabs">

              <button
                type="button"
                className={
                  activeTab ===
                  'flights'
                    ? 'gt-home-search-tab gt-home-search-tab-active'
                    : 'gt-home-search-tab'
                }
                onClick={() =>
                  setActiveTab(
                    'flights',
                  )
                }
              >
                <PlaneIcon />

                {t(
                  'nav.flights',
                )}
              </button>

              <button
                type="button"
                className={
                  activeTab ===
                  'hotels'
                    ? 'gt-home-search-tab gt-home-search-tab-active'
                    : 'gt-home-search-tab'
                }
                onClick={() =>
                  setActiveTab(
                    'hotels',
                  )
                }
              >
                <HotelIcon />

                {t(
                  'nav.hotels',
                )}
              </button>

              <button
                type="button"
                className={
                  activeTab ===
                  'restaurants'
                    ? 'gt-home-search-tab gt-home-search-tab-active'
                    : 'gt-home-search-tab'
                }
                onClick={() =>
                  setActiveTab(
                    'restaurants',
                  )
                }
              >
                <RestaurantIcon />

                {t(
                  'nav.restaurants',
                )}
              </button>

              <button
                type="button"
                className={
                  activeTab ===
                  'cars'
                    ? 'gt-home-search-tab gt-home-search-tab-active'
                    : 'gt-home-search-tab'
                }
                onClick={() =>
                  setActiveTab(
                    'cars',
                  )
                }
              >
                <CarIcon />

                {t(
                  'nav.cars',
                )}
              </button>

            </div>

            <div className="gt-home-search-content">

              {activeTab ===
                'flights' && (
                <TripSearchForm
                  initialDestinationIata={
                    recommendedDestinationIata
                  }
                />
              )}

              {activeTab ===
                'hotels' && (
                <HotelSearchForm />
              )}

              {activeTab ===
                'restaurants' && (
                <ModuleSearchShortcut
                  eyebrow={t(
                    'home.search.restaurants.eyebrow',
                  )}
                  title={t(
                    'home.search.restaurants.title',
                  )}
                  description={t(
                    'home.search.restaurants.description',
                  )}
                  route="/restaurants"
                  buttonText={t(
                    'home.search.restaurants.button',
                  )}
                  icon={
                    <RestaurantIcon />
                  }
                />
              )}

              {activeTab ===
                'cars' && (
                <ModuleSearchShortcut
                  eyebrow={t(
                    'home.search.cars.eyebrow',
                  )}
                  title={t(
                    'home.search.cars.title',
                  )}
                  description={t(
                    'home.search.cars.description',
                  )}
                  route="/cars"
                  buttonText={t(
                    'home.search.cars.button',
                  )}
                  icon={
                    <CarIcon />
                  }
                />
              )}

            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          DESTINATIONS
      ========================================== */}

      <section className="gt-home-section gt-destinations-section">

        <div className="gt-section-heading">

          <div>
            <span className="gt-section-eyebrow">
              {t(
                'home.destinations.eyebrow',
              )}
            </span>

            <h2>
              {t(
                'home.destinations.title',
              )}
            </h2>
          </div>

          <div className="gt-section-heading-side">

            <p>
              {t(
                'home.destinations.description',
              )}
            </p>

            <button
              type="button"
              className="gt-text-link gt-text-link-button"
              onClick={
                handleExploreFlights
              }
            >
              {t(
                'home.destinations.exploreFlights',
              )}

              <ArrowIcon />
            </button>

          </div>
        </div>

        <div className="gt-destination-grid">

          {popularDestinations.map(
            (
              destination,
              index,
            ) => (
              <button
                type="button"
                className={
                  index === 0
                    ? 'gt-destination-card gt-destination-card-large'
                    : 'gt-destination-card'
                }
                key={
                  destination.iata
                }
                style={{
                  backgroundImage:
                    `url("${destination.image}")`,
                }}
                onClick={() =>
                  handleDestinationExplore(
                    destination.iata,
                  )
                }
              >

                <div className="gt-destination-overlay" />

                <div className="gt-destination-top">

                  <span className="gt-destination-iata">
                    {
                      destination.iata
                    }
                  </span>

                  <span className="gt-destination-price">
                    {t(
                      'home.destinations.from',
                    )}{' '}
                    {
                      destination.price
                    }
                  </span>

                </div>

                <div className="gt-destination-content">

                  <span>
                    {t(
                      destination.countryKey,
                    )}
                  </span>

                  <h3>
                    {
                      destination.city
                    }
                  </h3>

                  <div className="gt-destination-cta">

                    {t(
                      'home.destinations.exploreDestination',
                    )}

                    <ArrowIcon />

                  </div>

                </div>
              </button>
            ),
          )}

        </div>
      </section>

      {/* =========================================
          EXPERIENCES
      ========================================== */}

      <section className="gt-home-section gt-experience-section">

        <div className="gt-section-heading">

          <div>
            <span className="gt-section-eyebrow">
              {t(
                'home.experiences.eyebrow',
              )}
            </span>

            <h2>
              {t(
                'home.experiences.title',
              )}
            </h2>
          </div>

          <p>
            {t(
              'home.experiences.description',
            )}
          </p>

        </div>

        <div className="gt-experience-grid">

          {experiences.map(
            (
              experience,
            ) => {
              if (
                experience.route ===
                '/flights'
              ) {
                return (
                  <button
                    type="button"
                    key={
                      experience.route
                    }
                    className={`gt-experience-card ${experience.className}`}
                    onClick={
                      handleExploreFlights
                    }
                  >
                    <ExperienceContent
                      experience={
                        experience
                      }
                    />
                  </button>
                );
              }

              return (
                <Link
                  to={
                    experience.route
                  }
                  key={
                    experience.route
                  }
                  className={`gt-experience-card ${experience.className}`}
                >
                  <ExperienceContent
                    experience={
                      experience
                    }
                  />
                </Link>
              );
            },
          )}

        </div>
      </section>

      {/* =========================================
          VALUE
      ========================================== */}

      <section className="gt-home-section">

        <div className="gt-value-banner">

          <div className="gt-value-banner-copy">

            <span className="gt-section-eyebrow gt-section-eyebrow-light">
              {t(
                'home.value.eyebrow',
              )}
            </span>

            <h2>
              {t(
                'home.value.titleLine1',
              )}

              <br />

              {t(
                'home.value.titleLine2',
              )}
            </h2>

            <p>
              {t(
                'home.value.description',
              )}
            </p>

            <Link
              to="/dashboard"
              className="gt-light-button"
            >
              {t(
                'home.value.dashboardButton',
              )}

              <ArrowIcon />
            </Link>

          </div>

          <div className="gt-value-features">

            <ValueFeature
              number="01"
              title={t(
                'home.value.features.centralized.title',
              )}
              description={t(
                'home.value.features.centralized.description',
              )}
            />

            <ValueFeature
              number="02"
              title={t(
                'home.value.features.context.title',
              )}
              description={t(
                'home.value.features.context.description',
              )}
            />

            <ValueFeature
              number="03"
              title={t(
                'home.value.features.activity.title',
              )}
              description={t(
                'home.value.features.activity.description',
              )}
            />

          </div>

        </div>
      </section>

    </main>
  );
}

/*
 * =========================================
 * EXPERIENCE
 * =========================================
 */

interface ExperienceItem {
  title: string;
  description: string;
  route: string;
  eyebrow: string;
  icon: string;
  className: string;
}

function ExperienceContent({
  experience,
}: {
  experience:
    ExperienceItem;
}) {
  return (
    <>
      <div className="gt-experience-icon">
        {
          experience.icon
        }
      </div>

      <span>
        {
          experience.eyebrow
        }
      </span>

      <h3>
        {
          experience.title
        }
      </h3>

      <p>
        {
          experience.description
        }
      </p>

      <div className="gt-experience-arrow">
        <ArrowIcon />
      </div>
    </>
  );
}

/*
 * =========================================
 * SHORTCUT
 * =========================================
 */

interface ModuleSearchShortcutProps {
  eyebrow: string;
  title: string;
  description: string;
  route: string;
  buttonText: string;
  icon: ReactNode;
}

function ModuleSearchShortcut({
  eyebrow,
  title,
  description,
  route,
  buttonText,
  icon,
}: ModuleSearchShortcutProps) {
  return (
    <div className="gt-module-shortcut">

      <div className="gt-module-shortcut-icon">
        {icon}
      </div>

      <div className="gt-module-shortcut-copy">

        <span>
          {eyebrow}
        </span>

        <h3>
          {title}
        </h3>

        <p>
          {description}
        </p>

      </div>

      <Link
        to={route}
        className="gt-primary-action"
      >
        {buttonText}

        <ArrowIcon />
      </Link>

    </div>
  );
}

/*
 * =========================================
 * VALUE
 * =========================================
 */

interface ValueFeatureProps {
  number: string;
  title: string;
  description: string;
}

function ValueFeature({
  number,
  title,
  description,
}: ValueFeatureProps) {
  return (
    <div className="gt-value-feature">

      <span>
        {number}
      </span>

      <div>
        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>
      </div>

    </div>
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

function RestaurantIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10" />
      <path d="M17 3c-2 2-3 5-3 8 0 2 1 3 3 3v7M17 3v11" />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m5 16-1-4 2-5h12l2 5-1 4" />
      <path d="M4 16h16v3H4z" />

      <circle
        cx="7"
        cy="17"
        r="1"
      />

      <circle
        cx="17"
        cy="17"
        r="1"
      />
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

export default HomePage;