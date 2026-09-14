import { useState } from 'react';

import TravelPlanSearchForm from '../components/travelplan/TravelPlanSearchForm';

import { searchFlights } from '../services/flights.service';
import { searchHotels } from '../services/hotels.service';
import { getDestinationByIata } from '../services/destinations.service';

import type { FlightOffer } from '../types/flight.types';
import type { Restaurant } from '../types/restaurant.types';
import type { CarSummary } from '../types/car.types';

import type { TravelPlanSearchParams } from '../components/travelplan/TravelPlanSearchForm';

function TravelPlanPage() {
  const [flights, setFlights] = useState<FlightOffer[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [restaurants, setRestaurants] =
    useState<Restaurant[]>([]);
  const [cars, setCars] =
    useState<CarSummary[]>([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [hasSearched, setHasSearched] =
    useState(false);

  const [selectedFlight, setSelectedFlight] =
    useState<FlightOffer | null>(null);

  const handleSearch = async (
    params: TravelPlanSearchParams,
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      setFlights([]);
      setHotels([]);
      setRestaurants([]);
      setCars([]);
      setSelectedFlight(null);

      /*
       * Primero obtenemos la información
       * del destino usando su código IATA.
       */
      const destination =
        await getDestinationByIata(
          params.destination,
        );

      const destinationCity =
        destination.cityName;

      const destinationCountry =
        destination.countryCode;

      /*
       * Buscamos vuelos y hospedajes
       * automáticamente al mismo tiempo.
       */
      const [
        flightsResponse,
        hotelsResponse,
      ] = await Promise.all([
        searchFlights({
          origin: params.origin,
          destination: params.destination,
          departureAt: params.departureAt,
          returnAt: params.returnAt,
          currency: params.currency,
          limit: 10,
        }),

        searchHotels({
          cityName: destinationCity,
          countryCode: destinationCountry,
          limit: 6,
        }),
      ]);

      /*
       * Guardamos los resultados.
       */
      setFlights(
        flightsResponse.data,
      );

      setHotels(
        hotelsResponse.data,
      );

      /*
       * Restaurantes y Rent a Car
       * todavía no tienen endpoints
       * disponibles en el backend actual.
       *
       * Los dejamos vacíos para que
       * sus secciones puedan mostrarse
       * sin generar errores 404.
       */
      setRestaurants([]);
      setCars([]);

    } catch (searchError) {
      console.error(
        'Error buscando el plan de viaje:',
        searchError,
      );

      setError(
        'No fue posible cargar la información del viaje. Intenta nuevamente.',
      );

      setFlights([]);
      setHotels([]);
      setRestaurants([]);
      setCars([]);

    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFlight = (
    flight: FlightOffer,
  ) => {
    setSelectedFlight(flight);
  };

  return (
    <main className="travel-plan-page">

      {/* =================================
          BUSCADOR
      ================================== */}

      <TravelPlanSearchForm
        onSearch={handleSearch}
      />

      {/* =================================
          CARGANDO
      ================================== */}

      {isLoading && (
        <section className="travel-plan-status">

          <h2>
            Estamos preparando tu viaje...
          </h2>

          <p>
            Buscando vuelos y hospedajes
            para tu destino.
          </p>

        </section>
      )}

      {/* =================================
          ERROR
      ================================== */}

      {error && (
        <section className="travel-plan-status">

          <h2>
            Ocurrió un problema
          </h2>

          <p>
            {error}
          </p>

        </section>
      )}

      {/* =================================
          RESULTADOS
      ================================== */}

      {!isLoading &&
        !error &&
        hasSearched && (

          <section className="travel-plan-content">

            {/* =================================
                VUELOS
            ================================== */}

            <section className="travel-plan-results">

              <div className="travel-plan-results-heading">

                <span>
                  01 · VUELOS
                </span>

                <h2>
                  Vuelos disponibles
                </h2>

                <p>
                  Elige la opción que mejor
                  se adapte a tu viaje.
                </p>

              </div>

              {flights.length === 0 ? (

                <div className="travel-plan-empty">

                  <p>
                    No encontramos vuelos
                    para esta búsqueda.
                  </p>

                </div>

              ) : (

                <div className="travel-plan-flight-list">

                  {flights.map(
                    (
                      flight,
                      index,
                    ) => (

                      <article
                        key={`${flight.flightNumber ?? 'flight'}-${index}`}
                        className={
                          selectedFlight === flight
                            ? 'gt-travel-plan-flight-card selected'
                            : 'gt-travel-plan-flight-card'
                        }
                      >

                        {/* AEROLÍNEA */}

                        <div className="gt-travel-plan-flight-label">

                          <span>
                            {flight.airlineName ||
                              flight.airline ||
                              'Aerolínea'}
                          </span>

                          {flight.flightNumber && (
                            <small>
                              Vuelo{' '}
                              {flight.flightNumber}
                            </small>
                          )}

                        </div>

                        {/* RUTA */}

                        <div className="gt-travel-plan-route">

                          <div>

                            <small>
                              Salida
                            </small>

                            <strong>
                              {flight.origin}
                            </strong>

                            <span>
                              {flight.departureAt ||
                                'Fecha no disponible'}
                            </span>

                          </div>

                          <div>

                            <small>
                              Destino
                            </small>

                            <strong>
                              {flight.destination}
                            </strong>

                            {flight.returnAt && (
                              <span>
                                Regreso:{' '}
                                {flight.returnAt}
                              </span>
                            )}

                          </div>

                        </div>

                        {/* PRECIO */}

                        <div className="gt-travel-plan-price">

                          <span>
                            Desde
                          </span>

                          <strong>
                            {flight.currency}{' '}
                            {flight.price}
                          </strong>

                          <button
                            type="button"
                            className="gt-travel-plan-select"
                            onClick={() =>
                              handleSelectFlight(
                                flight,
                              )
                            }
                          >
                            {selectedFlight ===
                            flight
                              ? 'Seleccionado'
                              : 'Seleccionar'}
                          </button>

                        </div>

                      </article>
                    ),
                  )}

                </div>
              )}

            </section>

            {/* =================================
                HOSPEDAJE
            ================================== */}

            <section className="travel-plan-service-section">

              <div className="travel-plan-results-heading">

                <span>
                  02 · HOSPEDAJE
                </span>

                <h2>
                  Hospedajes para tu viaje
                </h2>

                <p>
                  Opciones disponibles en
                  tu destino.
                </p>

              </div>

              {hotels.length === 0 ? (

                <div className="travel-plan-empty">

                  <p>
                    No encontramos hospedajes
                    para este destino.
                  </p>

                </div>

              ) : (

                <div className="travel-plan-card-grid">

                  {hotels.map(
                    (hotel) => (

                      <article
                        className="travel-plan-service-card"
                        key={hotel.id}
                      >

                        {hotel.thumbnail && (
                          <img
                            src={hotel.thumbnail}
                            alt=""
                          />
                        )}

                        <div>

                          <span>
                            Hospedaje
                          </span>

                          <h3>
                            {hotel.name}
                          </h3>

                          <p>
                            {hotel.city}

                            {hotel.country
                              ? `, ${hotel.country}`
                              : ''}
                          </p>

                          {hotel.rating && (
                            <strong>
                              ★{' '}
                              {hotel.rating}
                            </strong>
                          )}

                        </div>

                      </article>
                    ),
                  )}

                </div>
              )}

            </section>

            {/* =================================
                RESTAURANTES
            ================================== */}

            <section className="travel-plan-service-section">

              <div className="travel-plan-results-heading">

                <span>
                  03 · RESTAURANTES
                </span>

                <h2>
                  Lugares para comer
                </h2>

                <p>
                  Restaurantes disponibles
                  en tu destino.
                </p>

              </div>

              <div className="travel-plan-empty">

                <p>
                  La información de restaurantes
                  no está disponible actualmente.
                </p>

              </div>

            </section>

            {/* =================================
                RENT A CAR
            ================================== */}

            <section className="travel-plan-service-section">

              <div className="travel-plan-results-heading">

                <span>
                  04 · RENT A CAR
                </span>

                <h2>
                  Movilidad en tu destino
                </h2>

                <p>
                  Opciones de alquiler de
                  vehículos.
                </p>

              </div>

              <div className="travel-plan-empty">

                <p>
                  La información de Rent a Car
                  no está disponible actualmente.
                </p>

              </div>

            </section>

            {/* =================================
                RESUMEN
            ================================== */}

            <section className="travel-plan-summary">

              <div className="travel-plan-results-heading">

                <span>
                  05 · RESUMEN
                </span>

                <h2>
                  Tu plan de viaje
                </h2>

                <p>
                  Todo lo encontrado para
                  organizar tu viaje desde
                  un solo lugar.
                </p>

              </div>

              <div className="travel-plan-summary-grid">

                {/* VUELO */}

                <div>

                  <span>
                    Vuelo
                  </span>

                  <strong>
                    {selectedFlight
                      ? `${selectedFlight.origin} → ${selectedFlight.destination}`
                      : 'No seleccionado'}
                  </strong>

                </div>

                {/* HOSPEDAJES */}

                <div>

                  <span>
                    Hospedajes
                  </span>

                  <strong>
                    {hotels.length}
                  </strong>

                </div>

                {/* RESTAURANTES */}

                <div>

                  <span>
                    Restaurantes
                  </span>

                  <strong>
                    No disponibles
                  </strong>

                </div>

                {/* RENT A CAR */}

                <div>

                  <span>
                    Rent a Car
                  </span>

                  <strong>
                    No disponible
                  </strong>

                </div>

              </div>

            </section>

          </section>
        )}

    </main>
  );
}

export default TravelPlanPage;