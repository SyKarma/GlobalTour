import { NavLink, Outlet } from 'react-router-dom';

function MainLayout() {
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
        </div>
      </header>

      <div className="page-container">
        <Outlet />
      </div>
    </div>
  );
}

export default MainLayout;