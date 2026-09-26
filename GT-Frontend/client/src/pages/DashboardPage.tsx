import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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
  type ChangeEvent,
} from 'react';

import {
  useTranslation,
} from 'react-i18next';

import i18n from '../i18n';

import {
  getDashboardAnalytics,
} from '../services/dashboard.service';

import type {
  DashboardData,
  DashboardFilterCount,
  DashboardTypeCount,
} from '../types/dashboard.types';

const CHART_COLORS = [
  '#2563eb',
  '#0ea5e9',
  '#6366f1',
  '#14b8a6',
  '#f59e0b',
  '#8b5cf6',
];

function DashboardPage() {
  const {
    t,
    i18n: i18nInstance,
  } = useTranslation();

  const locale =
    getLocale(
      i18nInstance.resolvedLanguage ??
        i18nInstance.language,
    );

  const [
    dashboard,
    setDashboard,
  ] =
    useState<DashboardData | null>(
      null,
    );

  const [
    days,
    setDays,
  ] =
    useState(
      30,
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      true,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    let cancelled =
      false;

    const loadDashboard =
      async () => {
        try {
          const response =
            await getDashboardAnalytics(
              {
                days,
                limit: 10,
              },
            );

          if (
            cancelled
          ) {
            return;
          }

          setDashboard(
            response.data,
          );

          setError(
            null,
          );
        } catch (
          requestError
        ) {
          console.error(
            'Error loading dashboard:',
            requestError,
          );

          if (
            !cancelled
          ) {
            setError(
              'dashboard.errors.loadMessage',
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setIsLoading(
              false,
            );
          }
        }
      };

    void loadDashboard();

    return () => {
      cancelled =
        true;
    };
  }, [
    days,
  ]);

  const handlePeriodChange = (
    event:
      ChangeEvent<HTMLSelectElement>,
  ) => {
    setIsLoading(
      true,
    );

    setError(
      null,
    );

    setDays(
      Number(
        event.target.value,
      ),
    );
  };

  /*
   * No usamos useMemo aquí porque las
   * etiquetas cambian con el idioma.
   * El array es pequeño y se puede
   * recalcular sin problema.
   */
  const searchTypes =
    dashboard
      ? dashboard
          .summary
          .byType
          .map(
            (
              item:
                DashboardTypeCount,
            ) => ({
              ...item,

              name:
                getSearchTypeLabel(
                  item.searchType,
                ),
            }),
          )
      : [];

  const destinationData =
    useMemo(() => {
      if (
        !dashboard
      ) {
        return [];
      }

      return dashboard
        .topDestinations
        .map(
          (
            destination,
          ) => ({
            name:
              destination
                .cityName ??
              destination.iata,

            iata:
              destination.iata,

            count:
              destination.count,
          }),
        );
    }, [
      dashboard,
    ]);

  const volumeData =
    useMemo(() => {
      if (
        !dashboard
      ) {
        return [];
      }

      return dashboard
        .volumeByDay
        .map(
          (
            item,
          ) => ({
            ...item,

            label:
              formatShortDate(
                item.date,
                locale,
              ),
          }),
        );
    }, [
      dashboard,
      locale,
    ]);

  const restaurantCityData =
    useMemo(() => {
      if (
        !dashboard
      ) {
        return [];
      }

      return dashboard
        .topRestaurantCities
        .map(
          (
            item,
          ) => ({
            name:
              item.iata
                ? `${item.cityName} (${item.iata})`
                : item.cityName,

            count:
              item.count,
          }),
        );
    }, [
      dashboard,
    ]);

  const carCityData =
    useMemo(() => {
      if (
        !dashboard
      ) {
        return [];
      }

      return dashboard
        .topCarCities
        .map(
          (
            item,
          ) => ({
            name:
              item.iata
                ? `${item.cityName} (${item.iata})`
                : item.cityName,

            count:
              item.count,
          }),
        );
    }, [
      dashboard,
    ]);

  const routeData =
    useMemo(() => {
      if (
        !dashboard
      ) {
        return [];
      }

      return dashboard
        .topRoutes
        .map(
          (
            route,
          ) => ({
            name:
              `${route.originIata} → ${route.destinationIata}`,

            count:
              route.count,
          }),
        );
    }, [
      dashboard,
    ]);

  const countryData =
    useMemo(() => {
      if (
        !dashboard
      ) {
        return [];
      }

      return dashboard
        .topCountries
        .map(
          (
            country,
          ) => ({
            name:
              country
                .countryName ??
              country
                .countryCode,

            count:
              country.count,
          }),
        );
    }, [
      dashboard,
    ]);

  const mainRoute =
    dashboard
      ?.topRoutes[0];

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

  if (
    isLoading &&
    !dashboard
  ) {
    return (
      <main className="analytics-page">

        <div className="dashboard-loading">

          <div className="dashboard-loading-spinner" />

          <p>
            {t(
              'dashboard.loading',
            )}
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
            {t(
              'dashboard.errors.title',
            )}
          </h2>

          <p>
            {t(
              error,
            )}
          </p>

        </div>

      </main>
    );
  }

  if (
    !dashboard
  ) {
    return null;
  }

  return (
    <main className="analytics-page">

      <div className="analytics-layout">

        <aside className="analytics-sidebar">

          <div className="analytics-sidebar-heading">
            {t(
              'dashboard.sidebar.analytics',
            )}
          </div>

          <nav className="analytics-sidebar-nav">

            <a
              href="#dashboard-summary"
              className="analytics-sidebar-link analytics-sidebar-link-active"
            >
              <DashboardIcon />

              {t(
                'dashboard.sidebar.dashboard',
              )}
            </a>

            <a
              href="#search-types"
              className="analytics-sidebar-link"
            >
              <SearchIcon />

              {t(
                'dashboard.sidebar.searches',
              )}
            </a>

            <a
              href="#popular-destinations"
              className="analytics-sidebar-link"
            >
              <LocationIcon />

              {t(
                'dashboard.sidebar.destinations',
              )}
            </a>

            <a
              href="#service-analytics"
              className="analytics-sidebar-link"
            >
              <ServicesIcon />

              {t(
                'dashboard.sidebar.services',
              )}
            </a>

            <a
              href="#popular-routes"
              className="analytics-sidebar-link"
            >
              <PlaneIcon />

              {t(
                'dashboard.sidebar.routes',
              )}
            </a>

            <a
              href="#search-trend"
              className="analytics-sidebar-link"
            >
              <TrendIcon />

              {t(
                'dashboard.sidebar.trends',
              )}
            </a>

          </nav>

          <div className="analytics-sidebar-info">

            <span>
              {t(
                'dashboard.period.current',
              )}
            </span>

            <strong>
              {t(
                'dashboard.period.lastDays',
                {
                  count:
                    dashboard
                      .period
                      .days,
                },
              )}
            </strong>

            <small>
              {formatPeriodDate(
                dashboard
                  .period
                  .from,
                locale,
              )}

              {' → '}

              {formatPeriodDate(
                dashboard
                  .period
                  .to,
                locale,
              )}
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

              <h1>
                {t(
                  'dashboard.header.title',
                )}
              </h1>

              <p>
                {t(
                  'dashboard.header.description',
                )}
              </p>

            </div>

            <div className="dashboard-period-control">

              <label
                htmlFor="dashboard-period"
              >
                {t(
                  'dashboard.period.label',
                )}
              </label>

              <select
                id="dashboard-period"
                value={
                  days
                }
                onChange={
                  handlePeriodChange
                }
                disabled={
                  isLoading
                }
              >
                <option value={7}>
                  {t(
                    'dashboard.period.last7',
                  )}
                </option>

                <option value={30}>
                  {t(
                    'dashboard.period.last30',
                  )}
                </option>

                <option value={90}>
                  {t(
                    'dashboard.period.last90',
                  )}
                </option>
              </select>

            </div>

          </header>

          {error && (
            <div className="dashboard-inline-error">
              {t(
                error,
              )}
            </div>
          )}

          <section className="dashboard-kpi-grid">

            <article className="dashboard-kpi-card dashboard-kpi-primary">

              <div className="dashboard-kpi-heading">

                <span className="dashboard-kpi-icon">
                  <SearchIcon />
                </span>

                <span>
                  {t(
                    'dashboard.kpis.totalSearches',
                  )}
                </span>

              </div>

              <strong>
                {
                  dashboard
                    .summary
                    .totalSearches
                }
              </strong>

              <span className="dashboard-kpi-caption">
                {t(
                  'dashboard.kpis.selectedPeriod',
                )}
              </span>

            </article>

            <article className="dashboard-kpi-card dashboard-kpi-secondary">

              <div className="dashboard-kpi-heading">

                <span className="dashboard-kpi-icon">
                  <PlaneIcon />
                </span>

                <span>
                  {t(
                    'dashboard.kpis.uniqueOrigins',
                  )}
                </span>

              </div>

              <strong>
                {
                  dashboard
                    .summary
                    .uniqueOrigins
                }
              </strong>

              <span className="dashboard-kpi-caption">
                {t(
                  'dashboard.kpis.originCities',
                )}
              </span>

            </article>

            <article className="dashboard-kpi-card dashboard-kpi-tertiary">

              <div className="dashboard-kpi-heading">

                <span className="dashboard-kpi-icon">
                  <LocationIcon />
                </span>

                <span>
                  {t(
                    'dashboard.kpis.uniqueDestinations',
                  )}
                </span>

              </div>

              <strong>
                {
                  dashboard
                    .summary
                    .uniqueDestinations
                }
              </strong>

              <span className="dashboard-kpi-caption">
                {t(
                  'dashboard.kpis.differentDestinations',
                )}
              </span>

            </article>

            <article className="dashboard-kpi-card dashboard-kpi-route">

              <div className="dashboard-kpi-heading">

                <span className="dashboard-kpi-icon">
                  <RouteIcon />
                </span>

                <span>
                  {t(
                    'dashboard.kpis.mainRoute',
                  )}
                </span>

              </div>

              <strong className="dashboard-route-value">
                {mainRoute
                  ? `${mainRoute.originIata} → ${mainRoute.destinationIata}`
                  : t(
                      'dashboard.common.noData',
                    )}
              </strong>

              <span className="dashboard-kpi-caption">
                {mainRoute
                  ? t(
                      'dashboard.kpis.routeSearches',
                      {
                        count:
                          mainRoute
                            .count,
                      },
                    )
                  : t(
                      'dashboard.kpis.noRoutes',
                    )}
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

                  <h2>
                    {t(
                      'dashboard.charts.searchTypes.title',
                    )}
                  </h2>

                  <p>
                    {t(
                      'dashboard.charts.searchTypes.description',
                    )}
                  </p>

                </div>

              </div>

              <div className="dashboard-chart-container">

                {searchTypes.length >
                0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={
                      320
                    }
                  >
                    <PieChart>

                      <Pie
                        data={
                          searchTypes
                        }
                        dataKey="count"
                        nameKey="name"
                        innerRadius={
                          72
                        }
                        outerRadius={
                          108
                        }
                        paddingAngle={
                          3
                        }
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
                        height={
                          36
                        }
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

                  <h2>
                    {t(
                      'dashboard.charts.destinations.title',
                    )}
                  </h2>

                  <p>
                    {t(
                      'dashboard.charts.destinations.description',
                    )}
                  </p>

                </div>

              </div>

              <div className="dashboard-chart-container">

                {destinationData.length >
                0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={
                      320
                    }
                  >
                    <BarChart
                      data={
                        destinationData
                      }
                      margin={{
                        top:
                          12,

                        right:
                          10,

                        left:
                          -20,

                        bottom:
                          5,
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
                        name={t(
                          'dashboard.common.searches',
                        )}
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

          <section
            className="dashboard-panel dashboard-panel-wide"
            id="search-trend"
          >

            <div className="dashboard-panel-header">

              <div>

                <h2>
                  {t(
                    'dashboard.charts.trend.title',
                  )}
                </h2>

                <p>
                  {t(
                    'dashboard.charts.trend.description',
                  )}
                </p>

              </div>

              <span className="dashboard-panel-badge">
                {
                  dashboard
                    .summary
                    .totalSearches
                }{' '}

                {t(
                  'dashboard.common.searches',
                )}
              </span>

            </div>

            <div className="dashboard-chart-container dashboard-line-chart">

              <ResponsiveContainer
                width="100%"
                height={
                  330
                }
              >
                <LineChart
                  data={
                    volumeData
                  }
                  margin={{
                    top:
                      10,

                    right:
                      15,

                    left:
                      -20,

                    bottom:
                      5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={
                      false
                    }
                  />

                  <XAxis
                    dataKey="label"
                    tickLine={
                      false
                    }
                    axisLine={
                      false
                    }
                    minTickGap={
                      24
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

                  <Line
                    type="monotone"
                    dataKey="count"
                    name={t(
                      'dashboard.common.searches',
                    )}
                    stroke="#2563eb"
                    strokeWidth={
                      3
                    }
                    dot={{
                      r:
                        3,

                      fill:
                        '#2563eb',
                    }}
                    activeDot={{
                      r:
                        6,
                    }}
                  />

                </LineChart>
              </ResponsiveContainer>

            </div>

          </section>

          <section
            className="dashboard-bottom-grid"
            id="service-analytics"
          >

            <article className="dashboard-panel">

              <div className="dashboard-panel-header">

                <div>

                  <h2>
                    {t(
                      'dashboard.charts.restaurantCities.title',
                    )}
                  </h2>

                  <p>
                    {t(
                      'dashboard.charts.restaurantCities.description',
                      {
                        count:
                          restaurantSearches,
                      },
                    )}
                  </p>

                </div>

              </div>

              <RankingBarChart
                data={
                  restaurantCityData
                }
                label={t(
                  'dashboard.common.searches',
                )}
              />

            </article>

            <article className="dashboard-panel">

              <div className="dashboard-panel-header">

                <div>

                  <h2>
                    {t(
                      'dashboard.charts.carCities.title',
                    )}
                  </h2>

                  <p>
                    {t(
                      'dashboard.charts.carCities.description',
                      {
                        count:
                          carSearches,
                      },
                    )}
                  </p>

                </div>

              </div>

              <RankingBarChart
                data={
                  carCityData
                }
                label={t(
                  'dashboard.common.searches',
                )}
              />

            </article>

          </section>

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
                .length >
                0 && (
                <FilterBarChartPanel
                  title={t(
                    'dashboard.filters.cuisines.title',
                  )}
                  description={t(
                    'dashboard.filters.cuisines.description',
                  )}
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
                .length >
                0 && (
                <FilterBarChartPanel
                  title={t(
                    'dashboard.filters.restaurantTypes.title',
                  )}
                  description={t(
                    'dashboard.filters.restaurantTypes.description',
                  )}
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
                .length >
                0 && (
                <FilterBarChartPanel
                  title={t(
                    'dashboard.filters.carTypes.title',
                  )}
                  description={t(
                    'dashboard.filters.carTypes.description',
                  )}
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

          <section className="dashboard-bottom-grid">

            <article
              className="dashboard-panel"
              id="popular-routes"
            >

              <div className="dashboard-panel-header">

                <div>

                  <h2>
                    {t(
                      'dashboard.charts.routes.title',
                    )}
                  </h2>

                  <p>
                    {t(
                      'dashboard.charts.routes.description',
                    )}
                  </p>

                </div>

              </div>

              <RankingBarChart
                data={
                  routeData
                }
                label={t(
                  'dashboard.common.searches',
                )}
              />

            </article>

            <article className="dashboard-panel">

              <div className="dashboard-panel-header">

                <div>

                  <h2>
                    {t(
                      'dashboard.charts.countries.title',
                    )}
                  </h2>

                  <p>
                    {t(
                      'dashboard.charts.countries.description',
                    )}
                  </p>

                </div>

              </div>

              <RankingBarChart
                data={
                  countryData
                }
                label={t(
                  'dashboard.common.searches',
                )}
              />

            </article>

          </section>

        </section>

      </div>

    </main>
  );
}

interface RankingBarChartProps {
  data: {
    name:
      string;

    count:
      number;
  }[];

  label:
    string;
}

function RankingBarChart({
  data,
  label,
}: RankingBarChartProps) {
  if (
    data.length ===
    0
  ) {
    return (
      <EmptyChart />
    );
  }

  const sortedData = [
    ...data,
  ].sort(
    (
      a,
      b,
    ) =>
      b.count -
      a.count,
  );

  const chartHeight =
    Math.max(
      170,
      sortedData.length *
        58,
    );

  const maxValue =
    Math.max(
      ...sortedData.map(
        (
          item,
        ) =>
          item.count,
      ),
      1,
    );

  const domainMax =
    Math.max(
      2,
      Math.ceil(
        maxValue *
          1.2,
      ),
    );

  return (
    <div className="dashboard-ranking-chart">

      <ResponsiveContainer
        width="100%"
        height={
          chartHeight
        }
      >
        <BarChart
          data={
            sortedData
          }
          layout="vertical"
          margin={{
            top:
              12,

            right:
              58,

            left:
              12,

            bottom:
              8,
          }}
          barCategoryGap="24%"
        >

          <defs>

            <linearGradient
              id="rankingGradientFirst"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="#1746d1"
              />

              <stop
                offset="55%"
                stopColor="#2563eb"
              />

              <stop
                offset="100%"
                stopColor="#4f7df3"
              />
            </linearGradient>

            <linearGradient
              id="rankingGradientSecond"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="#2563eb"
              />

              <stop
                offset="100%"
                stopColor="#60a5fa"
              />
            </linearGradient>

            <linearGradient
              id="rankingGradientDefault"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="#3b82f6"
              />

              <stop
                offset="100%"
                stopColor="#93c5fd"
              />
            </linearGradient>

          </defs>

          <CartesianGrid
            strokeDasharray="4 5"
            horizontal={
              false
            }
            stroke="#e6edf7"
          />

          <XAxis
            type="number"
            domain={[
              0,
              domainMax,
            ]}
            allowDecimals={
              false
            }
            tickLine={
              false
            }
            axisLine={
              false
            }
            tick={{
              fill:
                '#98a2b3',

              fontSize:
                12,
            }}
          />

          <YAxis
            type="category"
            dataKey="name"
            width={
              165
            }
            tickLine={
              false
            }
            axisLine={
              false
            }
            tick={{
              fill:
                '#475467',

              fontSize:
                13,

              fontWeight:
                600,
            }}
          />

          <Tooltip
            cursor={{
              fill:
                'rgba(37, 99, 235, 0.045)',
            }}
            contentStyle={{
              borderRadius:
                '12px',

              border:
                '1px solid #e4e7ec',

              background:
                '#ffffff',

              boxShadow:
                '0 12px 30px rgba(15, 23, 42, 0.12)',

              padding:
                '10px 14px',

              fontSize:
                '0.85rem',
            }}
            labelStyle={{
              color:
                '#101828',

              fontWeight:
                700,

              marginBottom:
                '4px',
            }}
          />

          <Bar
            dataKey="count"
            name={
              label
            }
            radius={[
              0,
              10,
              10,
              0,
            ]}
            maxBarSize={
              34
            }
            minPointSize={
              8
            }
            animationDuration={
              750
            }
            background={{
              fill:
                '#f2f5fa',
            }}
          >

            {sortedData.map(
              (
                _item,
                index,
              ) => {
                let fill =
                  'url(#rankingGradientDefault)';

                if (
                  index ===
                  0
                ) {
                  fill =
                    'url(#rankingGradientFirst)';
                } else if (
                  index ===
                  1
                ) {
                  fill =
                    'url(#rankingGradientSecond)';
                }

                return (
                  <Cell
                    key={`ranking-bar-${index}`}
                    fill={
                      fill
                    }
                    className={
                      index ===
                      0
                        ? 'dashboard-ranking-cell dashboard-ranking-cell-first'
                        : 'dashboard-ranking-cell'
                    }
                  />
                );
              },
            )}

            <LabelList
              dataKey="count"
              position="right"
              className="dashboard-ranking-value"
            />

          </Bar>

        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}

interface FilterBarChartPanelProps {
  title:
    string;

  description:
    string;

  items:
    DashboardFilterCount[];

  formatter?: (
    value:
      string,
  ) => string;
}

function FilterBarChartPanel({
  title,
  description,
  items,
  formatter =
    formatFilterLabel,
}: FilterBarChartPanelProps) {
  const {
    t,
  } =
    useTranslation();

  const data =
    items.map(
      (
        item,
      ) => ({
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
        data={
          data
        }
        label={t(
          'dashboard.common.searches',
        )}
      />

    </article>
  );
}

function EmptyChart() {
  const {
    t,
  } =
    useTranslation();

  return (
    <div className="dashboard-empty">

      <span>
        {t(
          'dashboard.empty.title',
        )}
      </span>

      <p>
        {t(
          'dashboard.empty.description',
        )}
      </p>

    </div>
  );
}

function getSearchTypeCount(
  dashboard:
    DashboardData |
    null,

  type:
    string,
) {
  return (
    dashboard
      ?.summary
      .byType
      .find(
        (
          item,
        ) =>
          item.searchType ===
          type,
      )
      ?.count ??
    0
  );
}

function getSearchTypeLabel(
  value:
    string,
) {
  switch (
    value
  ) {
    case 'flight':
      return i18n.t(
        'dashboard.searchTypes.flights',
      );

    case 'hotel':
      return i18n.t(
        'dashboard.searchTypes.hotels',
      );

    case 'currency':
      return i18n.t(
        'dashboard.searchTypes.currency',
      );

    case 'destination':
      return i18n.t(
        'dashboard.searchTypes.destinations',
      );

    case 'restaurant':
      return i18n.t(
        'dashboard.searchTypes.restaurants',
      );

    case 'car':
      return i18n.t(
        'dashboard.searchTypes.cars',
      );

    default:
      return value;
  }
}

function formatRestaurantFilter(
  value:
    string,
) {
  if (
    value ===
    'restaurant'
  ) {
    return i18n.t(
      'restaurants.common.types.restaurant',
    );
  }

  if (
    value ===
    'cafe'
  ) {
    return i18n.t(
      'restaurants.common.types.cafe',
    );
  }

  if (
    value ===
    'fast_food'
  ) {
    return i18n.t(
      'restaurants.common.types.fastFood',
    );
  }

  return formatFilterLabel(
    value,
  );
}

function formatCarFilter(
  value:
    string,
) {
  if (
    value ===
    'car_rental'
  ) {
    return i18n.t(
      'cars.common.types.carRental',
    );
  }

  if (
    value ===
    'car_sharing'
  ) {
    return i18n.t(
      'cars.common.types.carSharing',
    );
  }

  return formatFilterLabel(
    value,
  );
}

function formatFilterLabel(
  value:
    string,
) {
  return value
    .replace(
      /_/g,
      ' ',
    )
    .replace(
      /\b\w/g,
      (
        letter,
      ) =>
        letter.toUpperCase(),
    );
}

function getLocale(
  language:
    string |
    undefined,
) {
  const normalized =
    language
      ?.split(
        '-',
      )[0] ??
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

function formatShortDate(
  value:
    string,

  locale:
    string,
) {
  const match =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/,
    );

  if (
    !match
  ) {
    return value;
  }

  const [
    ,
    year,
    month,
    day,
  ] =
    match;

  const date =
    new Date(
      Date.UTC(
        Number(
          year,
        ),
        Number(
          month,
        ) -
          1,
        Number(
          day,
        ),
      ),
    );

  return new Intl.DateTimeFormat(
    locale,
    {
      day:
        '2-digit',

      month:
        '2-digit',

      timeZone:
        'UTC',
    },
  ).format(
    date,
  );
}

function formatPeriodDate(
  value:
    string,

  locale:
    string,
) {
  const match =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})/,
    );

  if (
    !match
  ) {
    return value;
  }

  const [
    ,
    year,
    month,
    day,
  ] =
    match;

  const date =
    new Date(
      Date.UTC(
        Number(
          year,
        ),
        Number(
          month,
        ) -
          1,
        Number(
          day,
        ),
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

      <path d="m11 14 3-3" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 18 10 12l4 4 6-9" />

      <path d="M16 7h4v4" />
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