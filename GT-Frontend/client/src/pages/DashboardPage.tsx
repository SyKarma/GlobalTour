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
import { useEffect, useMemo, useState } from 'react';

import { getDashboardAnalytics } from '../services/dashboard.service';

import type {
  DashboardData,
  DashboardTypeCount,
} from '../types/dashboard.types';

const SEARCH_TYPE_LABELS: Record<string, string> = {
  flight: 'Vuelos',
  hotel: 'Hospedaje',
  currency: 'Divisas',
  destination: 'Destinos',
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
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [days, setDays] = useState(30);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const response = await getDashboardAnalytics({
          days,
          limit: 10,
        });

        if (!cancelled) {
          setDashboard(response.data);
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
    setDays(Number(event.target.value));
  };

  const searchTypes = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return dashboard.summary.byType.map(
      (item: DashboardTypeCount) => ({
        ...item,
        name:
          SEARCH_TYPE_LABELS[item.searchType] ??
          item.searchType,
      }),
    );
  }, [dashboard]);

  const destinationData = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return dashboard.topDestinations.map(
      (destination) => ({
        name:
          destination.cityName ??
          destination.iata,
        iata: destination.iata,
        count: destination.count,
      }),
    );
  }, [dashboard]);

  const volumeData = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return dashboard.volumeByDay.map((item) => ({
      ...item,
      label: formatShortDate(item.date),
    }));
  }, [dashboard]);

  const mainRoute = dashboard?.topRoutes[0];

  if (isLoading && !dashboard) {
    return (
      <main className="analytics-page">
        <div className="dashboard-loading">
          <div className="dashboard-loading-spinner" />

          <p>Cargando dashboard...</p>
        </div>
      </main>
    );
  }

  if (error && !dashboard) {
    return (
      <main className="analytics-page">
        <div className="dashboard-error">
          <h2>No pudimos cargar el dashboard</h2>

          <p>{error}</p>
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
            <span>Período actual</span>

            <strong>
              Últimos {dashboard.period.days} días
            </strong>

            <small>
              {dashboard.period.from}
              {' → '}
              {dashboard.period.to}
            </small>
          </div>
        </aside>

        <section className="analytics-content">
          <header
            className="dashboard-header"
            id="dashboard-summary"
          >
            <div>
              <span className="dashboard-eyebrow">
                GlobalTour Analytics
              </span>

              <h1>Dashboard</h1>

              <p>
                Comportamiento y tendencias de búsqueda
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
                onChange={handlePeriodChange}
                disabled={isLoading}
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

          <section className="dashboard-kpi-grid">
            <article className="dashboard-kpi-card dashboard-kpi-primary">
              <div className="dashboard-kpi-heading">
                <span className="dashboard-kpi-icon">
                  <SearchIcon />
                </span>

                <span>Búsquedas totales</span>
              </div>

              <strong>
                {dashboard.summary.totalSearches}
              </strong>

              <span className="dashboard-kpi-caption">
                En el período seleccionado
              </span>
            </article>

            <article className="dashboard-kpi-card dashboard-kpi-secondary">
              <div className="dashboard-kpi-heading">
                <span className="dashboard-kpi-icon">
                  <PlaneIcon />
                </span>

                <span>Orígenes únicos</span>
              </div>

              <strong>
                {dashboard.summary.uniqueOrigins}
              </strong>

              <span className="dashboard-kpi-caption">
                Ciudades de salida buscadas
              </span>
            </article>

            <article className="dashboard-kpi-card dashboard-kpi-tertiary">
              <div className="dashboard-kpi-heading">
                <span className="dashboard-kpi-icon">
                  <LocationIcon />
                </span>

                <span>Destinos únicos</span>
              </div>

              <strong>
                {dashboard.summary.uniqueDestinations}
              </strong>

              <span className="dashboard-kpi-caption">
                Destinos diferentes consultados
              </span>
            </article>

            <article className="dashboard-kpi-card dashboard-kpi-route">
              <div className="dashboard-kpi-heading">
                <span className="dashboard-kpi-icon">
                  <RouteIcon />
                </span>

                <span>Ruta principal</span>
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

          <section className="dashboard-chart-grid">
            <article
              className="dashboard-panel"
              id="search-types"
            >
              <div className="dashboard-panel-header">
                <div>
                  <h2>Búsquedas por tipo</h2>

                  <p>
                    Distribución del uso de los módulos.
                  </p>
                </div>
              </div>

              <div className="dashboard-chart-container">
                {searchTypes.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >
                    <PieChart>
                      <Pie
                        data={searchTypes}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={72}
                        outerRadius={108}
                        paddingAngle={3}
                      >
                        {searchTypes.map(
                          (_, index) => (
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

            <article
              className="dashboard-panel"
              id="popular-destinations"
            >
              <div className="dashboard-panel-header">
                <div>
                  <h2>Destinos más buscados</h2>

                  <p>
                    Ciudades con mayor interés de los
                    usuarios.
                  </p>
                </div>
              </div>

              <div className="dashboard-chart-container">
                {destinationData.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >
                    <BarChart
                      data={destinationData}
                      margin={{
                        top: 12,
                        right: 10,
                        left: -20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="iata"
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="count"
                        name="Búsquedas"
                        fill="#2563eb"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={54}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </div>
            </article>
          </section>

          <section
            className="dashboard-panel dashboard-panel-wide"
            id="search-trend"
          >
            <div className="dashboard-panel-header">
              <div>
                <h2>Evolución de búsquedas</h2>

                <p>
                  Cantidad de búsquedas realizadas por día.
                </p>
              </div>

              <span className="dashboard-panel-badge">
                {dashboard.summary.totalSearches} búsquedas
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
                    allowDecimals={false}
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
                      fill: '#2563eb',
                    }}
                    activeDot={{
                      r: 6,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="dashboard-bottom-grid">
            <article
              className="dashboard-panel"
              id="popular-routes"
            >
              <div className="dashboard-panel-header">
                <div>
                  <h2>Rutas populares</h2>

                  <p>
                    Trayectos con mayor cantidad de
                    consultas.
                  </p>
                </div>
              </div>

              <div className="dashboard-ranking-list">
                {dashboard.topRoutes.length > 0 ? (
                  dashboard.topRoutes.map(
                    (route, index) => (
                      <div
                        key={`${route.originIata}-${route.destinationIata}`}
                        className="dashboard-ranking-item"
                      >
                        <span className="dashboard-ranking-position">
                          {index + 1}
                        </span>

                        <div className="dashboard-ranking-info">
                          <strong>
                            {route.originIata}
                            {' → '}
                            {route.destinationIata}
                          </strong>

                          <span>
                            {route.originCityName ??
                              route.originIata}
                            {' → '}
                            {route.destinationCityName ??
                              route.destinationIata}
                          </span>
                        </div>

                        <strong className="dashboard-ranking-count">
                          {route.count}
                        </strong>
                      </div>
                    ),
                  )
                ) : (
                  <EmptyList />
                )}
              </div>
            </article>

            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2>Países más buscados</h2>

                  <p>
                    Países que concentran mayor interés.
                  </p>
                </div>
              </div>

              <div className="dashboard-ranking-list">
                {dashboard.topCountries.length > 0 ? (
                  dashboard.topCountries.map(
                    (country, index) => (
                      <div
                        key={country.countryCode}
                        className="dashboard-ranking-item"
                      >
                        <span className="dashboard-ranking-position">
                          {index + 1}
                        </span>

                        <div className="dashboard-ranking-info">
                          <strong>
                            {country.countryName ??
                              country.countryCode}
                          </strong>

                          <span>
                            {country.countryCode}
                          </span>
                        </div>

                        <strong className="dashboard-ranking-count">
                          {country.count}
                        </strong>
                      </div>
                    ),
                  )
                ) : (
                  <EmptyList />
                )}
              </div>
            </article>
          </section>
        </section>
      </div>
    </main>
  );
}

function EmptyChart() {
  return (
    <div className="dashboard-empty">
      <span>Sin datos suficientes</span>

      <p>
        Los gráficos aparecerán cuando se registren
        búsquedas.
      </p>
    </div>
  );
}

function EmptyList() {
  return (
    <div className="dashboard-empty dashboard-empty-list">
      <span>Sin información todavía</span>

      <p>
        Realiza más búsquedas para generar estadísticas.
      </p>
    </div>
  );
}

function formatShortDate(date: string) {
  const [, month, day] = date.split('-');

  return `${day}/${month}`;
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
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

function PlaneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 11 18-7-7 18-3-8-8-3Z" />
      <path d="m11 14 4-4" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 17 9 11l4 4 8-9" />
      <path d="M16 6h5v5" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h3a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3" />
    </svg>
  );
}

export default DashboardPage;