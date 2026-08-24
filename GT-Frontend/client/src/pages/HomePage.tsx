import TripSearchForm from '../components/trip/TripSearchForm';

function HomePage() {
  return (
    <main>
      <section className="home-hero">
        <div className="hero-content">
          <span className="hero-eyebrow">Tu próximo viaje comienza aquí</span>

          <h1>
            Planea tu viaje
            <span> en un solo lugar.</span>
          </h1>

          <p>
            Compara vuelos, hospedaje y transporte para estructurar tu próxima
            aventura de forma simple.
          </p>
        </div>

        <TripSearchForm />
      </section>

      <section className="service-section">
        <div className="section-heading">
          <span>Todo lo que necesitas</span>
          <h2>Organiza cada parte de tu viaje</h2>
          <p>
            GlobalTour reúne diferentes opciones para ayudarte a tomar mejores
            decisiones antes de viajar.
          </p>
        </div>

        <div className="service-grid">
          <article className="service-card">
            <span className="service-number">01</span>
            <h3>Vuelos</h3>
            <p>
              Compara alternativas de vuelo según destino, fecha, aerolínea y
              precio.
            </p>
          </article>

          <article className="service-card">
            <span className="service-number">02</span>
            <h3>Hospedaje</h3>
            <p>
              Explora diferentes opciones de alojamiento disponibles para tu
              destino.
            </p>
          </article>

          <article className="service-card">
            <span className="service-number">03</span>
            <h3>Rent a Car</h3>
            <p>
              Complementa tu viaje encontrando opciones de transporte en el
              destino.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

export default HomePage;