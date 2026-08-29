import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CurrencySelector from '../components/currency/CurrencySelector';

function MainLayout() {
  const {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="app-shell">
      <header className="main-header">
        <div className="navbar">
          <NavLink to="/" className="brand">
            GlobalTour
          </NavLink>

          <nav className="nav-links">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              Inicio
            </NavLink>

            <NavLink
              to="/flights"
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              Vuelos
            </NavLink>

            <NavLink
              to="/hotels"
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              Hospedaje
            </NavLink>

            <NavLink
              to="/cars"
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              Rent a Car
            </NavLink>
          </nav>

          <div className="navbar-auth">
            <CurrencySelector />

            {isLoading ? (
              <div className="auth-loading">
                Cargando...
              </div>
            ) : isAuthenticated && user ? (
              <div className="user-menu">
                <button
                  type="button"
                  className="user-menu-trigger"
                  onClick={() =>
                    setIsUserMenuOpen((current) => !current)
                  }
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="user-avatar"
                    />
                  ) : (
                    <span className="user-avatar-fallback">
                      {user.displayName.charAt(0).toUpperCase()}
                    </span>
                  )}

                  <span className="user-name">
                    {user.displayName}
                  </span>

                  <span className="user-menu-arrow">
                    ⌄
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-info">
                      <strong>
                        {user.displayName}
                      </strong>

                      <span>
                        {user.email}
                      </span>
                    </div>

                    <div className="user-dropdown-divider" />

                    <button
                      type="button"
                      className="logout-button"
                      onClick={handleLogout}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="login-button"
                onClick={login}
              >
                Continuar con Google
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="page-container">
        <Outlet />
      </div>
    </div>
  );
}

export default MainLayout;