import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getDashboardAnalytics,
} from '../services/dashboard.service';

import type {
  DashboardData,
  DashboardFilterCount,
  DashboardTypeCount,
} from '../types/dashboard.types';

const SEARCH_TYPE_LABELS: Record<
  string,
  string
> = {
  flight: 'Vuelos',
  hotel: 'Hospedaje',
  currency: 'Divisas',
  destination: 'Destinos',
  restaurant: 'Restaurantes',
  car: 'Rent a Car',
};

const CHART_COLORS = [
  '#2563eb',
  '#0ea5e9',
  '#6366f1',
  '#14b8a6',
  '#f59e0b',
  '#8b5cf6',
];

function DashboardPage() {
  const [
    dashboard,
    setDashboard,
  ] = useState<DashboardData | null>(
    null,
  );

  const [days, setDays] =
    useState(30);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard =
      async () => {
        try {
          const response =
            await getDashboardAnalytics({
              days,
              limit: 10,
            });

          if (!cancelled) {
            setDashboard(
              response.data,
            );

            setError(null);
          }
        } catch (requestError) {
          console.error(
            'Error loading dashboard:',
            requestError,
          );

          if (!cancelled) {
            setError(
              'No fue posible cargar la información del dashboard.',
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [days]);

  const handlePeriodChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setIsLoading(true);
    setError(null);

    setDays(
      Number(event.target.value),
    );
  };

  /*
   * =========================================
   * CHART DATA
   * =========================================
   */

  const searchTypes =
    useMemo(() => {
      if (!dashboard) {
        return [];
      }

      return dashboard.summary.byType.map(
        (
          item: DashboardTypeCount,
        ) => ({
          ...item,

          name:
            SEARCH_TYPE_LABELS[
              item.searchType
            ] ?? item.searchType,
        }),
      );
    }, [dashboard]);

  const destinationData =
    useMemo(() => {
      if (!dashboard) {
        return [];
      }

      return dashboard.topDestinations.map(
        (destination) => ({
          name:
            destination.cityName ??
            destination.iata,

          iata:
            destination.iata,

          count:
            destination.count,
        }),
      );
    }, [dashboard]);

  const volumeData =
    useMemo(() => {
      if (!dashboard) {
        return [];
      }

      return dashboard.volumeByDay.map(
        (item) => ({
          ...item,

          label:
            formatShortDate(
              item.date,
            ),
        }),
      );
    }, [dashboard]);

  const restaurantCityData =
    useMemo(() => {
      if (!dashboard) {
        return [];
      }

      return dashboard.topRestaurantCities.map(
        (item) => ({
          name: item.iata
            ? `${item.cityName} (${item.iata})`
            : item.cityName,

          count: item.count,
        }),
      );
    }, [dashboard]);

  const carCityData =
    useMemo(() => {
      if (!dashboard) {
        return [];
      }

      return dashboard.topCarCities.map(
        (item) => ({
          name: item.iata
            ? `${item.cityName} (${item.iata})`
            : item.cityName,

          count: item.count,
        }),
      );
    }, [dashboard]);

  const routeData =
    useMemo(() => {
      if (!dashboard) {
        return [];
      }

      return dashboard.topRoutes.map(
        (route) => ({
          name:
            `${route.originIata} → ${route.destinationIata}`,

          count: route.count,
        }),
      );
    }, [dashboard]);

  const countryData =
    useMemo(() => {
      if (!dashboard) {
        return [];
      }

      return dashboard.topCountries.map(
        (country) => ({
          name:
            country.countryName ??
            country.countryCode,

          count: country.count,
        }),
      );
    }, [dashboard]);

  const mainRoute =
    dashboard?.topRoutes[0];

  const restaurantSearches =
    getSearchTypeCount(
      dashboard,
      'restaurant',
    );

  const carSearches =
    getSearchTypeCount(
      dashboard,
      'car',
    );

  /*
   * =========================================
   * STATES
   * =========================================
   */

  if (
    isLoading &&
    !dashboard
  ) {
    return (
      <main className="analytics-page">
        <div className="dashboard-loading">
          <div className="dashboard-loading-spinner" />

          <p>
            Cargando dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (
    error &&
    !dashboard
  ) {
    return (
      <main className="analytics-page">
        <div className="dashboard-error">
          <h2>
            No pudimos cargar el
            dashboard
          </h2>

          <p>
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <main className="analytics-page">
      <div className="analytics-layout">
        {/* =====================================
            SIDEBAR
        ====================================== */}

        <aside className="analytics-sidebar">
          <div className="analytics-sidebar-heading">
            Analítica
          </div>

          <nav className="analytics-sidebar-nav">
            <a
              href="#dashboard-summary"
              className="analytics-sidebar-link analytics-sidebar-link-active"
            >
              <DashboardIcon />

              Dashboard
            </a>

            <a
              href="#search-types"
              className="analytics-sidebar-link"
            >
              <SearchIcon />

              Búsquedas
            </a>

            <a
              href="#popular-destinations"
              className="analytics-sidebar-link"
            >
              <LocationIcon />

              Destinos
            </a>

            <a
              href="#service-analytics"
              className="analytics-sidebar-link"
            >
              <ServicesIcon />

              Servicios
            </a>

            <a
              href="#popular-routes"
              className="analytics-sidebar-link"
            >
              <PlaneIcon />

              Rutas
            </a>

            <a
              href="#search-trend"
              className="analytics-sidebar-link"
            >
              <TrendIcon />

              Tendencias
            </a>
          </nav>

          <div className="analytics-sidebar-info">
            <span>
              Período actual
            </span>

            <strong>
              Últimos{' '}
              {dashboard.period.days}{' '}
              días
            </strong>

            <small>
              {dashboard.period.from}
              {' → '}
              {dashboard.period.to}
            </small>
          </div>
        </aside>

        {/* =====================================
            CONTENT
        ====================================== */}

        <section className="analytics-content">
          {/* HEADER */}

          <header
            className="dashboard-header"
            id="dashboard-summary"
          >
            <div>
              <span className="dashboard-eyebrow">
                GlobalTour Analytics
              </span>

              <h1>
                Dashboard
              </h1>

              <p>
                Comportamiento y
                tendencias de búsqueda
                dentro de GlobalTour.
              </p>
            </div>

            <div className="dashboard-period-control">
              <label htmlFor="dashboard-period">
                Período
              </label>

              <select
                id="dashboard-period"
                value={days}
                onChange={
                  handlePeriodChange
                }
                disabled={
                  isLoading
                }
              >
                <option value={7}>
                  Últimos 7 días
                </option>

                <option value={30}>
                  Últimos 30 días
                </option>

                <option value={90}>
                  Últimos 90 días
                </option>
              </select>
            </div>
          </header>

          {error && (
            <div className="dashboard-inline-error">
              {error}
            </div>
          )}

          {/* =====================================
              KPIs
          ====================================== */}

          <section className="dashboard-kpi-grid">
            <article className="dashboard-kpi-card dashboard-kpi-primary">
              <div className="dashboard-kpi-heading">
                <span className="dashboard-kpi-icon">
                  <SearchIcon />
                </span>

                <span>
                  Búsquedas totales
                </span>
              </div>

              <strong>
                {
                  dashboard.summary
                    .totalSearches
                }
              </strong>

              <span className="dashboard-kpi-caption">
                En el período
                seleccionado
              </span>
            </article>

            <article className="dashboard-kpi-card dashboard-kpi-secondary">
              <div className="dashboard-kpi-heading">
                <span className="dashboard-kpi-icon">
                  <PlaneIcon />
                </span>

                <span>
                  Orígenes únicos
                </span>
              </div>

              <strong>
                {
                  dashboard.summary
                    .uniqueOrigins
                }
              </strong>

              <span className="dashboard-kpi-caption">
                Ciudades de salida
                buscadas
              </span>
            </article>

            <article className="dashboard-kpi-card dashboard-kpi-tertiary">
              <div className="dashboard-kpi-heading">
                <span className="dashboard-kpi-icon">
                  <LocationIcon />
                </span>

                <span>
                  Destinos únicos
                </span>
              </div>

              <strong>
                {
                  dashboard.summary
                    .uniqueDestinations
                }
              </strong>

              <span className="dashboard-kpi-caption">
                Destinos diferentes
                consultados
              </span>
            </article>

            <article className="dashboard-kpi-card dashboard-kpi-route">
              <div className="dashboard-kpi-heading">
                <span className="dashboard-kpi-icon">
                  <RouteIcon />
                </span>

                <span>
                  Ruta principal
                </span>
              </div>

              <strong className="dashboard-route-value">
                {mainRoute
                  ? `${mainRoute.originIata} → ${mainRoute.destinationIata}`
                  : 'Sin datos'}
              </strong>

              <span className="dashboard-kpi-caption">
                {mainRoute
                  ? `${mainRoute.count} búsquedas`
                  : 'Aún no hay rutas registradas'}
              </span>
            </article>
          </section>

          {/* =====================================
              MAIN CHARTS
          ====================================== */}

          <section className="dashboard-chart-grid">
            {/* SEARCH TYPES */}

            <article
              className="dashboard-panel"
              id="search-types"
            >
              <div className="dashboard-panel-header">
                <div>
                  <h2>
                    Búsquedas por tipo
                  </h2>

                  <p>
                    Distribución del uso
                    de los módulos.
                  </p>
                </div>
              </div>

              <div className="dashboard-chart-container">
                {searchTypes.length >
                0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >
                    <PieChart>
                      <Pie
                        data={
                          searchTypes
                        }
                        dataKey="count"
                        nameKey="name"
                        innerRadius={72}
                        outerRadius={108}
                        paddingAngle={3}
                      >
                        {searchTypes.map(
                          (
                            _,
                            index,
                          ) => (
                            <Cell
                              key={`type-${index}`}
                              fill={
                                CHART_COLORS[
                                  index %
                                    CHART_COLORS.length
                                ]
                              }
                            />
                          ),
                        )}
                      </Pie>

                      <Tooltip />

                      <Legend
                        verticalAlign="bottom"
                        height={36}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </div>
            </article>

            {/* DESTINATIONS */}

            <article
              className="dashboard-panel"
              id="popular-destinations"
            >
              <div className="dashboard-panel-header">
                <div>
                  <h2>
                    Destinos más
                    buscados
                  </h2>

                  <p>
                    Ciudades con mayor
                    interés de los
                    usuarios.
                  </p>
                </div>
              </div>

              <div className="dashboard-chart-container">
                {destinationData.length >
                0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >
                    <BarChart
                      data={
                        destinationData
                      }
                      margin={{
                        top: 12,
                        right: 10,
                        left: -20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={
                          false
                        }
                      />

                      <XAxis
                        dataKey="iata"
                        tickLine={
                          false
                        }
                        axisLine={
                          false
                        }
                      />

                      <YAxis
                        allowDecimals={
                          false
                        }
                        tickLine={
                          false
                        }
                        axisLine={
                          false
                        }
                      />

                      <Tooltip />

                      <Bar
                        dataKey="count"
                        name="Búsquedas"
                        fill="#2563eb"
                        radius={[
                          8,
                          8,
                          0,
                          0,
                        ]}
                        maxBarSize={
                          54
                        }
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </div>
            </article>
          </section>

          {/* =====================================
              SEARCH TREND
          ====================================== */}

          <section
            className="dashboard-panel dashboard-panel-wide"
            id="search-trend"
          >
            <div className="dashboard-panel-header">
              <div>
                <h2>
                  Evolución de
                  búsquedas
                </h2>

                <p>
                  Cantidad de búsquedas
                  realizadas por día.
                </p>
              </div>

              <span className="dashboard-panel-badge">
                {
                  dashboard.summary
                    .totalSearches
                }{' '}
                búsquedas
              </span>
            </div>

            <div className="dashboard-chart-container dashboard-line-chart">
              <ResponsiveContainer
                width="100%"
                height={330}
              >
                <LineChart
                  data={volumeData}
                  margin={{
                    top: 10,
                    right: 15,
                    left: -20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />

                  <YAxis
                    allowDecimals={
                      false
                    }
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Búsquedas"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{
                      r: 3,
                      fill:
                        '#2563eb',
                    }}
                    activeDot={{
                      r: 6,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* =====================================
              RESTAURANTS + CARS CHARTS
          ====================================== */}

          <section
            className="dashboard-bottom-grid"
            id="service-analytics"
          >
            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2>
                    Restaurantes por ciudad
                  </h2>

                  <p>
                    {restaurantSearches}{' '}
                    búsquedas de restaurantes
                    registradas.
                  </p>
                </div>
              </div>

              <RankingBarChart
                data={
                  restaurantCityData
                }
                label="Búsquedas"
              />
            </article>

            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2>
                    Rent a Car por ciudad
                  </h2>

                  <p>
                    {carSearches}{' '}
                    búsquedas de Rent a Car
                    registradas.
                  </p>
                </div>
              </div>

              <RankingBarChart
                data={
                  carCityData
                }
                label="Búsquedas"
              />
            </article>
          </section>

          {/* =====================================
              FILTER ANALYTICS
          ====================================== */}

          {(dashboard
            .topRestaurantCuisines
            .length > 0 ||
            dashboard
              .topRestaurantTypes
              .length > 0 ||
            dashboard
              .topCarTypes
              .length > 0) && (
            <section className="dashboard-bottom-grid">
              {dashboard
                .topRestaurantCuisines
                .length > 0 && (
                <FilterBarChartPanel
                  title="Cocinas más buscadas"
                  description="Preferencias gastronómicas utilizadas como filtro."
                  items={
                    dashboard
                      .topRestaurantCuisines
                  }
                  formatter={
                    formatFilterLabel
                  }
                />
              )}

              {dashboard
                .topRestaurantTypes
                .length > 0 && (
                <FilterBarChartPanel
                  title="Tipos de restaurante"
                  description="Tipos de establecimientos gastronómicos más consultados."
                  items={
                    dashboard
                      .topRestaurantTypes
                  }
                  formatter={
                    formatRestaurantFilter
                  }
                />
              )}

              {dashboard
                .topCarTypes
                .length > 0 && (
                <FilterBarChartPanel
                  title="Tipos de movilidad"
                  description="Filtros más utilizados en Rent a Car."
                  items={
                    dashboard
                      .topCarTypes
                  }
                  formatter={
                    formatCarFilter
                  }
                />
              )}
            </section>
          )}

          {/* =====================================
              ROUTES + COUNTRIES
          ====================================== */}

          <section className="dashboard-bottom-grid">
            <article
              className="dashboard-panel"
              id="popular-routes"
            >
              <div className="dashboard-panel-header">
                <div>
                  <h2>
                    Rutas populares
                  </h2>

                  <p>
                    Trayectos con mayor
                    cantidad de consultas.
                  </p>
                </div>
              </div>

              <RankingBarChart
                data={routeData}
                label="Búsquedas"
              />
            </article>

            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2>
                    Países más buscados
                  </h2>

                  <p>
                    Países que concentran
                    mayor interés.
                  </p>
                </div>
              </div>

              <RankingBarChart
                data={countryData}
                label="Búsquedas"
              />
            </article>
          </section>
        </section>
      </div>
    </main>
  );
}

/*
 * =========================================
 * REUSABLE RANKING BAR CHART
 * =========================================
 */

interface RankingBarChartProps {
  data: {
    name: string;
    count: number;
  }[];

  label: string;
}

function RankingBarChart({
  data,
  label,
}: RankingBarChartProps) {
  if (data.length === 0) {
    return <EmptyChart />;
  }

  const chartHeight =
    Math.max(
      260,
      data.length * 58,
    );

  return (
    <div className="dashboard-ranking-chart">
      <ResponsiveContainer
        width="100%"
        height={chartHeight}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 10,
            right: 32,
            left: 10,
            bottom: 8,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
          />

          <XAxis
            type="number"
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            type="category"
            dataKey="name"
            width={145}
            tickLine={false}
            axisLine={false}
          />

          <Tooltip />

          <Bar
            dataKey="count"
            name={label}
            fill="#2563eb"
            radius={[
              0,
              8,
              8,
              0,
            ]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/*
 * =========================================
 * FILTER CHART
 * =========================================
 */

interface FilterBarChartPanelProps {
  title: string;

  description: string;

  items: DashboardFilterCount[];

  formatter?: (
    value: string,
  ) => string;
}

function FilterBarChartPanel({
  title,
  description,
  items,
  formatter = formatFilterLabel,
}: FilterBarChartPanelProps) {
  const data = items.map(
    (item) => ({
      name:
        formatter(
          item.value,
        ),

      count:
        item.count,
    }),
  );

  return (
    <article className="dashboard-panel">
      <div className="dashboard-panel-header">
        <div>
          <h2>
            {title}
          </h2>

          <p>
            {description}
          </p>
        </div>
      </div>

      <RankingBarChart
        data={data}
        label="Búsquedas"
      />
    </article>
  );
}

/*
 * =========================================
 * EMPTY STATES
 * =========================================
 */

function EmptyChart() {
  return (
    <div className="dashboard-empty">
      <span>
        Sin datos suficientes
      </span>

      <p>
        Los gráficos aparecerán
        cuando se registren
        búsquedas.
      </p>
    </div>
  );
}

/*
 * =========================================
 * HELPERS
 * =========================================
 */

function getSearchTypeCount(
  dashboard: DashboardData | null,
  type: string,
) {
  return (
    dashboard?.summary.byType.find(
      (item) =>
        item.searchType === type,
    )?.count ?? 0
  );
}

function formatRestaurantFilter(
  value: string,
) {
  if (
    value ===
    'restaurant'
  ) {
    return 'Restaurante';
  }

  if (
    value ===
    'cafe'
  ) {
    return 'Café';
  }

  if (
    value ===
    'fast_food'
  ) {
    return 'Comida rápida';
  }

  return formatFilterLabel(
    value,
  );
}

function formatCarFilter(
  value: string,
) {
  if (
    value ===
    'car_rental'
  ) {
    return 'Rent a Car';
  }

  if (
    value ===
    'car_sharing'
  ) {
    return 'Car sharing';
  }

  return formatFilterLabel(
    value,
  );
}

function formatFilterLabel(
  value: string,
) {
  return value
    .replace(
      /_/g,
      ' ',
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function formatShortDate(
  date: string,
) {
  const [
    ,
    month,
    day,
  ] = date.split('-');

  return `${day}/${month}`;
}

/*
 * =========================================
 * ICONS
 * =========================================
 */

function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="2"
      />

      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="2"
      />

      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="2"
      />

      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="2"
      />
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

function PlaneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m3 11 18-7-7 18-3-8-8-3Z" />

      <path d="m11 14 4-4" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M3 17 9 11l4 4 8-9" />

      <path d="M16 6h5v5" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="6"
        cy="18"
        r="2"
      />

      <circle
        cx="18"
        cy="6"
        r="2"
      />

      <path d="M8 18h3a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3" />
    </svg>
  );
}

function ServicesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="7"
        cy="7"
        r="3"
      />

      <circle
        cx="17"
        cy="7"
        r="3"
      />

      <circle
        cx="7"
        cy="17"
        r="3"
      />

      <circle
        cx="17"
        cy="17"
        r="3"
      />
    </svg>
  );
}

export default DashboardPage;