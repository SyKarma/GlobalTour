import { Route, Routes } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import FlightsPage from '../pages/FlightsPage';
import HotelsPage from '../pages/HotelsPage';
import CarsPage from '../pages/CarsPage';
import NotFoundPage from '../pages/NotFoundPage';

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/flights" element={<FlightsPage />} />
      <Route path="/hotels" element={<HotelsPage />} />
      <Route path="/cars" element={<CarsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRouter;