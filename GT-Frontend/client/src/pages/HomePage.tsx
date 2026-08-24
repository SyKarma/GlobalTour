import { NavLink } from 'react-router-dom';
import TripSearchForm from '../components/trip/TripSearchForm';

const popularDestinations = [
  {
    city: 'Miami',
    country: 'Estados Unidos',
    iata: 'MIA',
    price: '$295',
  },
  {
    city: 'Madrid',
    country: 'España',
    iata: 'MAD',
    price: '$620',
  },
  {
    city: 'Cancún',
    country: 'México',
    iata: 'CUN',
    price: '$340',
  },
  {
    city: 'Bogotá',
    country: 'Colombia',
    iata: 'BOG',
    price: '$280',
  },
];

function HomePage() {
  return (
    <main className="home-page">
      <section className="search-hero">
        <div className="hero-heading">
          <span className="hero-kicker">Compara. Organiza. Viaja.</span>

          <h1>Encuentra tu próximo viaje.</h1>

          <p>
            Compara vuelos, hospedaje y transporte desde un solo lugar.
          </p>
        </div>

        <div className="travel-tabs">
          <NavLink to="/" end className="travel-tab active">
            Vuelos
          </NavLink>

          <NavLink to="/hotels" className="travel-tab">
            Hospedaje
          </NavLink>

          <NavLink to="/cars" className="travel-tab">
            Rent a Car
          </NavLink>
        </div>

        <TripSearchForm />
      </section>

      <section className="explore-section">
        <div className="explore-heading">
          <div>
            <span>Inspiración para tu viaje</span>
            <h2>Explora destinos populares</h2>
          </div>

          <p>
            Descubre algunas rutas que podrías considerar para tu próxima
            aventura.
          </p>
        </div>

        <div className="destination-grid">
          {popularDestinations.map((destination) => (
            <article
              className="destination-card"
              key={destination.iata}
            >
              <div className="destination-card-top">
                <span className="destination-iata">
                  {destination.iata}
                </span>

                <span className="destination-price">
                  desde {destination.price}
                </span>
              </div>

              <div>
                <h3>{destination.city}</h3>
                <p>{destination.country}</p>
              </div>

              <span className="destination-action">
                Explorar
              </span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default HomePage;