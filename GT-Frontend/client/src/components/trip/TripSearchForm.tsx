import { useState, type FormEvent } from 'react';

function TripSearchForm() {
  const [tripType, setTripType] = useState<'round-trip' | 'one-way'>(
    'round-trip',
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <form className="trip-search" onSubmit={handleSubmit}>
      <div className="trip-type-selector">
        <button
          type="button"
          className={tripType === 'round-trip' ? 'trip-type active' : 'trip-type'}
          onClick={() => setTripType('round-trip')}
        >
          Ida y vuelta
        </button>

        <button
          type="button"
          className={tripType === 'one-way' ? 'trip-type active' : 'trip-type'}
          onClick={() => setTripType('one-way')}
        >
          Solo ida
        </button>
      </div>

      <div className="trip-search-grid">
        <label className="search-field">
          <span>Origen</span>
          <input
            type="text"
            placeholder="San José, Costa Rica"
            aria-label="Origen"
          />
        </label>

        <label className="search-field">
          <span>Destino</span>
          <input
            type="text"
            placeholder="Miami, Estados Unidos"
            aria-label="Destino"
          />
        </label>

        <label className="search-field">
          <span>Salida</span>
          <input type="date" aria-label="Fecha de salida" />
        </label>

        {tripType === 'round-trip' && (
          <label className="search-field">
            <span>Regreso</span>
            <input type="date" aria-label="Fecha de regreso" />
          </label>
        )}

        <label className="search-field">
          <span>Viajeros</span>
          <select defaultValue="1" aria-label="Cantidad de viajeros">
            <option value="1">1 viajero</option>
            <option value="2">2 viajeros</option>
            <option value="3">3 viajeros</option>
            <option value="4">4 viajeros</option>
            <option value="5">5 viajeros</option>
          </select>
        </label>

        <button className="search-button" type="submit">
          Buscar viaje
        </button>
      </div>
    </form>
  );
}

export default TripSearchForm;