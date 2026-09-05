import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  Link,
  useLocation,
} from 'react-router-dom';

import TripSearchForm from '../components/trip/TripSearchForm';

import HotelSearchForm from '../components/hotels/HotelSearchForm';

type SearchTab =
  | 'flights'
  | 'hotels'
  | 'restaurants'
  | 'cars';

const popularDestinations = [
  {
    city: 'Miami',
    country: 'Estados Unidos',
    iata: 'MIA',
    price: '$295',
    image:
      'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=1200&q=85',
  },
  {
    city: 'Madrid',
    country: 'España',
    iata: 'MAD',
    price: '$620',
    image:
      'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=85',
  },
  {
    city: 'Cancún',
    country: 'México',
    iata: 'CUN',
    price: '$340',
    image:
      'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?auto=format&fit=crop&w=1200&q=85',
  },
  {
    city: 'Bogotá',
    country: 'Colombia',
    iata: 'BOG',
    price: '$280',
    image:
      'https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?auto=format&fit=crop&w=1200&q=85',
  },
];

const experiences = [
  {
    title: 'Vuelos',
    description:
      'Encuentra rutas y compara opciones para tu próximo destino.',
    route: '/flights',
    eyebrow: 'Explora el mundo',
    icon: '✈',
    className:
      'gt-experience-flight',
  },
  {
    title: 'Hospedaje',
    description:
      'Encuentra dónde quedarte y organiza cada noche del viaje.',
    route: '/hotels',
    eyebrow: 'Descansa mejor',
    icon: '⌂',
    className:
      'gt-experience-hotel',
  },
  {
    title: 'Restaurantes',
    description:
      'Descubre lugares para comer cerca de tus destinos.',
    route: '/restaurants',
    eyebrow: 'Sabores locales',
    icon: '◉',
    className:
      'gt-experience-food',
  },
  {
    title: 'Rent a Car',
    description:
      'Encuentra opciones de movilidad y explora a tu ritmo.',
    route: '/cars',
    eyebrow: 'Muévete libremente',
    icon: '→',
    className:
      'gt-experience-car',
  },
];

function HomePage() {
  const location =
    useLocation();

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

              Todo tu viaje,
              en un solo lugar
            </div>

            <h1>
              Tu próxima historia

              <span>
                comienza aquí.
              </span>
            </h1>

            <p>
              Compara vuelos,
              encuentra hospedaje,
              descubre restaurantes
              y organiza tu transporte
              desde una sola
              experiencia.
            </p>

            <div className="gt-home-proof">
              <div>
                <strong>
                  4
                </strong>

                <span>
                  servicios conectados
                </span>
              </div>

              <div className="gt-proof-divider" />

              <div>
                <strong>
                  1
                </strong>

                <span>
                  plataforma
                </span>
              </div>

              <div className="gt-proof-divider" />

              <div>
                <strong>
                  24/7
                </strong>

                <span>
                  para explorar
                </span>
              </div>
            </div>
          </div>

          <div className="gt-hero-visual">
            <div className="gt-hero-image-card">
              <div className="gt-hero-image-overlay" />

              <div className="gt-hero-image-content">
                <span>
                  Recomendado
                </span>

                <div>
                  <strong>
                    Madrid
                  </strong>

                  <small>
                    España · MAD
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
                  Próximo vuelo
                </small>

                <strong>
                  SJO → MAD
                </strong>
              </div>
            </div>

            <div className="gt-floating-card gt-floating-saving">
              <small>
                Explora más
              </small>

              <strong>
                Todo en un lugar
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

                Vuelos
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

                Hospedaje
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

                Restaurantes
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

                Rent a Car
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
                  eyebrow="Descubre sabores"
                  title="¿Dónde quieres comer?"
                  description="Busca restaurantes por ciudad, tipo de cocina y ubicación."
                  route="/restaurants"
                  buttonText="Buscar restaurantes"
                  icon={
                    <RestaurantIcon />
                  }
                />
              )}

              {activeTab ===
                'cars' && (
                <ModuleSearchShortcut
                  eyebrow="Explora a tu ritmo"
                  title="Encuentra movilidad en tu destino"
                  description="Busca agencias y opciones de Rent a Car en la ciudad que visitarás."
                  route="/cars"
                  buttonText="Buscar Rent a Car"
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
              Inspiración
            </span>

            <h2>
              Destinos que vale
              la pena explorar
            </h2>
          </div>

          <div className="gt-section-heading-side">
            <p>
              Empieza por algunos
              de los destinos favoritos
              para planear tu próxima
              aventura.
            </p>

            <button
              type="button"
              className="gt-text-link gt-text-link-button"
              onClick={
                handleExploreFlights
              }
            >
              Explorar vuelos

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
                    desde{' '}
                    {
                      destination.price
                    }
                  </span>
                </div>

                <div className="gt-destination-content">
                  <span>
                    {
                      destination.country
                    }
                  </span>

                  <h3>
                    {
                      destination.city
                    }
                  </h3>

                  <div className="gt-destination-cta">
                    Explorar destino

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
              Una plataforma
            </span>

            <h2>
              Todo lo que necesitas
              para viajar
            </h2>
          </div>

          <p>
            Cada etapa del viaje
            conectada en una
            experiencia simple.
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
                      experience.title
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
                    experience.title
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
              Viajar puede ser más simple
            </span>

            <h2>
              Menos pestañas.
              <br />
              Más viaje.
            </h2>

            <p>
              GlobalTour reúne
              la información que
              necesitas para que
              puedas concentrarte
              en elegir, comparar
              y disfrutar.
            </p>

            <Link
              to="/dashboard"
              className="gt-light-button"
            >
              Ver mi Dashboard

              <ArrowIcon />
            </Link>
          </div>

          <div className="gt-value-features">
            <ValueFeature
              number="01"
              title="Centralizado"
              description="Vuelos, alojamiento, comida y movilidad desde un mismo lugar."
            />

            <ValueFeature
              number="02"
              title="Más contexto"
              description="Compara diferentes opciones antes de tomar una decisión."
            />

            <ValueFeature
              number="03"
              title="Tu actividad"
              description="Visualiza tendencias y búsquedas desde el Dashboard."
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