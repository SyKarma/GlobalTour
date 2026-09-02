import {
  Route,
  Routes,
} from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';

import HomePage from '../pages/HomePage';
import FlightsPage from '../pages/FlightsPage';
import HotelsPage from '../pages/HotelsPage';
import HotelDetailPage from '../pages/HotelDetailPage';
import CarsPage from '../pages/CarsPage';
import DashboardPage from '../pages/DashboardPage';
import NotFoundPage from '../pages/NotFoundPage';
import RestaurantsPage from '../pages/RestaurantsPage';
import RestaurantDetailPage from '../pages/RestaurantDetailPage';
import CarDetailPage from '../pages/CarDetailPage';

function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
  path="/restaurants"
  element={<RestaurantsPage />}
/>

        <Route
          path="/restaurants/:id"
          element={<RestaurantDetailPage />}
        />

        <Route
          path="/flights"
          element={<FlightsPage />}
        />

        <Route
          path="/hotels"
          element={<HotelsPage />}
        />

        <Route
          path="/hotels/:id"
          element={<HotelDetailPage />}
        />

        <Route
          path="/cars"
          element={<CarsPage />}
        />

        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/cars/:id"
          element={<CarDetailPage />}
        />

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Route>
    </Routes>
  );
}

export default AppRouter;