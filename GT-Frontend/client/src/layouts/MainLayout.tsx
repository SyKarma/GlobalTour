import {
  useState,
} from 'react';

import {
  NavLink,
  Outlet,
} from 'react-router-dom';

import {
  useAuth,
} from '../hooks/useAuth';

import CurrencySelector from '../components/currency/CurrencySelector';

const navigation = [
  {
    label: 'Explorar',
    path: '/',
    end: true,
  },
  {
    label: 'Vuelos',
    path: '/flights',
  },
  {
    label: 'Hospedaje',
    path: '/hotels',
  },
  {
    label: 'Restaurantes',
    path: '/restaurants',
  },
  {
    label: 'Rent a Car',
    path: '/cars',
  },
  {
    label: 'Dashboard',
    path: '/dashboard',
  },
];

function MainLayout() {
  const {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  } = useAuth();

  const [
    isUserMenuOpen,
    setIsUserMenuOpen,
  ] = useState(false);

  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  ] = useState(false);

  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const handleLogout =
    async () => {
      try {
        await logout();

        closeMenus();
      } catch (error) {
        console.error(
          'Error al cerrar sesión:',
          error,
        );
      }
    };

  return (
    <div className="gt-app-shell">

      {/* =========================================
          NAVBAR
      ========================================== */}

      <header className="gt-header">
        <div className="gt-navbar">

          {/* BRAND */}

          <NavLink
            to="/"
            className="gt-brand"
            onClick={closeMenus}
          >
            <span className="gt-brand-symbol">
              <GlobeIcon />
            </span>

            <span className="gt-brand-text">
              Global
              <strong>
                Tour
              </strong>
            </span>
          </NavLink>

          {/* DESKTOP NAVIGATION */}

          <nav className="gt-desktop-nav">
            {navigation.map(
              (item) => (
                <NavLink
                  key={
                    item.path
                  }
                  to={
                    item.path
                  }
                  end={
                    item.end
                  }
                  className={({
                    isActive,
                  }) =>
                    isActive
                      ? 'gt-nav-link gt-nav-link-active'
                      : 'gt-nav-link'
                  }
                >
                  {
                    item.label
                  }
                </NavLink>
              ),
            )}
          </nav>

          {/* DESKTOP ACTIONS */}

          <div className="gt-nav-actions">
            <div className="gt-currency-wrapper">
              <CurrencySelector />
            </div>

            {isLoading ? (
              <div className="gt-auth-loading">
                Cargando...
              </div>
            ) : isAuthenticated &&
              user ? (
              <div className="gt-user-menu">
                <button
                  type="button"
                  className="gt-user-trigger"
                  onClick={() =>
                    setIsUserMenuOpen(
                      (
                        current,
                      ) =>
                        !current,
                    )
                  }
                  aria-expanded={
                    isUserMenuOpen
                  }
                >
                  {user.avatarUrl ? (
                    <img
                      src={
                        user.avatarUrl
                      }
                      alt={
                        user.displayName
                      }
                      className="gt-user-avatar"
                    />
                  ) : (
                    <span className="gt-user-avatar gt-user-avatar-fallback">
                      {user.displayName
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}

                  <span className="gt-user-text">
                    <small>
                      Hola
                    </small>

                    <strong>
                      {
                        user.displayName
                      }
                    </strong>
                  </span>

                  <ChevronIcon />
                </button>

                {isUserMenuOpen && (
                  <div className="gt-user-dropdown">
                    <div className="gt-user-dropdown-header">
                      {user.avatarUrl ? (
                        <img
                          src={
                            user.avatarUrl
                          }
                          alt={
                            user.displayName
                          }
                        />
                      ) : (
                        <span className="gt-user-dropdown-avatar">
                          {user.displayName
                            .charAt(
                              0,
                            )
                            .toUpperCase()}
                        </span>
                      )}

                      <div>
                        <strong>
                          {
                            user.displayName
                          }
                        </strong>

                        <span>
                          {
                            user.email
                          }
                        </span>
                      </div>
                    </div>

                    <div className="gt-dropdown-divider" />

                    <NavLink
                      to="/dashboard"
                      className="gt-dropdown-link"
                      onClick={
                        closeMenus
                      }
                    >
                      <DashboardIcon />

                      Mi Dashboard
                    </NavLink>

                    <button
                      type="button"
                      className="gt-dropdown-link gt-dropdown-logout"
                      onClick={
                        handleLogout
                      }
                    >
                      <LogoutIcon />

                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="gt-login-button"
                onClick={
                  login
                }
              >
                <GoogleIcon />

                <span>
                  Continuar con Google
                </span>
              </button>
            )}
          </div>

          {/* MOBILE BUTTON */}

          <button
            type="button"
            className="gt-mobile-menu-button"
            onClick={() =>
              setIsMobileMenuOpen(
                (
                  current,
                ) =>
                  !current,
              )
            }
            aria-label="Abrir menú"
            aria-expanded={
              isMobileMenuOpen
            }
          >
            {isMobileMenuOpen ? (
              <CloseIcon />
            ) : (
              <MenuIcon />
            )}
          </button>
        </div>

        {/* =========================================
            MOBILE NAVIGATION
        ========================================== */}

        {isMobileMenuOpen && (
          <div className="gt-mobile-panel">
            <nav className="gt-mobile-navigation">
              {navigation.map(
                (item) => (
                  <NavLink
                    key={
                      item.path
                    }
                    to={
                      item.path
                    }
                    end={
                      item.end
                    }
                    onClick={
                      closeMenus
                    }
                    className={({
                      isActive,
                    }) =>
                      isActive
                        ? 'gt-mobile-link gt-mobile-link-active'
                        : 'gt-mobile-link'
                    }
                  >
                    {
                      item.label
                    }

                    <ArrowIcon />
                  </NavLink>
                ),
              )}
            </nav>

            <div className="gt-mobile-controls">
              <div className="gt-mobile-currency">
                <span>
                  Moneda
                </span>

                <CurrencySelector />
              </div>

              {!isLoading &&
                (isAuthenticated &&
                user ? (
                  <div className="gt-mobile-user">
                    <div className="gt-mobile-user-info">
                      {user.avatarUrl ? (
                        <img
                          src={
                            user.avatarUrl
                          }
                          alt={
                            user.displayName
                          }
                        />
                      ) : (
                        <span>
                          {user.displayName
                            .charAt(
                              0,
                            )
                            .toUpperCase()}
                        </span>
                      )}

                      <div>
                        <strong>
                          {
                            user.displayName
                          }
                        </strong>

                        <small>
                          {
                            user.email
                          }
                        </small>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="gt-mobile-logout"
                      onClick={
                        handleLogout
                      }
                    >
                      Cerrar sesión
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="gt-mobile-login"
                    onClick={
                      login
                    }
                  >
                    <GoogleIcon />

                    Continuar con Google
                  </button>
                ))}
            </div>
          </div>
        )}
      </header>

      {/* =========================================
          PAGE
      ========================================== */}

      <div className="page-container gt-page-container">
        <Outlet />
      </div>

      {/* =========================================
          GLOBAL FOOTER
      ========================================== */}

      <footer className="gt-footer">
        <div className="gt-footer-inner">
          <div className="gt-footer-brand">
            <NavLink
              to="/"
              className="gt-brand gt-footer-logo"
            >
              <span className="gt-brand-symbol">
                <GlobeIcon />
              </span>

              <span className="gt-brand-text">
                Global
                <strong>
                  Tour
                </strong>
              </span>
            </NavLink>

            <p>
              Tu viaje completo en un solo lugar.
              Compara, descubre y organiza mejores
              experiencias.
            </p>
          </div>

          <div className="gt-footer-column">
            <strong>
              Explorar
            </strong>

            <NavLink to="/flights">
              Vuelos
            </NavLink>

            <NavLink to="/hotels">
              Hospedaje
            </NavLink>

            <NavLink to="/restaurants">
              Restaurantes
            </NavLink>

            <NavLink to="/cars">
              Rent a Car
            </NavLink>
          </div>

          <div className="gt-footer-column">
            <strong>
              GlobalTour
            </strong>

            <NavLink to="/">
              Inicio
            </NavLink>

            <NavLink to="/dashboard">
              Dashboard
            </NavLink>
          </div>
        </div>

        <div className="gt-footer-bottom">
          <span>
            © 2026 GlobalTour
          </span>

          <span>
            Diseñado para viajeros que quieren
            comparar mejor.
          </span>
        </div>
      </footer>
    </div>
  );
}

/*
 * =========================================
 * ICONS
 * =========================================
 */

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M3 12h18" />

      <path d="M12 3c2.5 2.7 3.8 5.7 3.8 9S14.5 18.3 12 21" />

      <path d="M12 3C9.5 5.7 8.2 8.7 8.2 12S9.5 18.3 12 21" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="gt-chevron"
    >
      <path d="m8 10 4 4 4-4" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
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

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />

      <path d="m14 8 4 4-4 4" />

      <path d="M18 12H9" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M21 12.2c0-.7-.1-1.4-.2-2H12v3.7h5a4.3 4.3 0 0 1-1.9 2.8v2.4h3.1c1.8-1.7 2.8-4.1 2.8-6.9Z" />

      <path d="M12 21c2.5 0 4.7-.8 6.2-2.2l-3.1-2.4c-.8.6-1.9.9-3.1.9-2.4 0-4.5-1.6-5.3-3.8H3.5v2.5A9.4 9.4 0 0 0 12 21Z" />

      <path d="M6.7 13.5a5.6 5.6 0 0 1 0-3.5V7.5H3.5a9.1 9.1 0 0 0 0 9l3.2-3Z" />

      <path d="M12 6.7c1.4 0 2.6.5 3.6 1.4l2.7-2.7A9 9 0 0 0 3.5 7.5l3.2 2.5A5.6 5.6 0 0 1 12 6.7Z" />
    </svg>
  );
}

export default MainLayout;