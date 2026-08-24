import { Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/HomePage';
import FlightsPage from '../pages/FlightsPage';
import HotelsPage from '../pages/HotelsPage';
import CarsPage from '../pages/CarsPage';
import NotFoundPage from '../pages/NotFoundPage';

function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/flights" element={<FlightsPage />} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/cars" element={<CarsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRouter;