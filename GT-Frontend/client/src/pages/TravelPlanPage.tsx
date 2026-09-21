import { useState } from 'react';
import { Link } from 'react-router-dom';

import TravelPlanSearchForm from '../components/travelplan/TravelPlanSearchForm';
import WishlistHeart from '../components/wishlist/WishlistHeart';

import { useAuth } from '../hooks/useAuth';
import { useWishlist } from '../hooks/useWishlist';

import { searchFlights } from '../services/flights.service';
import { searchHotels } from '../services/hotels.service';
import { searchRestaurants } from '../services/restaurants.service';
import { searchCars } from '../services/cars.service';
import { getDestinationByIata } from '../services/destinations.service';

import type { FlightOffer } from '../types/flight.types';

import type {
  HotelSummary,
  HotelSearchMeta,
} from '../types/hotel.types';

import type { Restaurant } from '../types/restaurant.types';
import type { CarSummary } from '../types/car.types';

import type {
  TravelPlanSearchParams,
} from '../components/travelplan/TravelPlanSearchForm';


/* =========================================================
   FUNCIONES PARA VUELOS
   ========================================================= */

function formatTime(
  value: string | null,
) {
  if (!value) {
    return '--:--';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString(
    'es-CR',
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  );
}


function formatDate(
  value: string | null,
) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    'es-CR',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  );
}


function formatDuration(
  minutes: number | null,
) {
  if (minutes === null) {
    return 'Duración no disponible';
  }

  const hours = Math.floor(
    minutes / 60,
  );

  const remainingMinutes =
    minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  return `${hours}h ${remainingMinutes}min`;
}


function formatTransfers(
  transfers: number,
) {
  if (transfers === 0) {
    return 'Directo';
  }

  if (transfers === 1) {
    return '1 escala';
  }

  return `${transfers} escalas`;
}


function formatAirlineName(
  name: string | null,
) {
  return (
    name?.trim() ||
    'Aerolínea'
  );
}


/*
 * Se mantiene el formato visual:
 * $95
 */
function formatPrice(
  price: number,
) {
  return `$${Math.round(price)}`;
}


/* =========================================================
   ESTRELLAS DE HOTEL
   ========================================================= */

function renderStars(
  stars: number | null,
) {
  if (!stars) {
    return null;
  }

  const roundedStars =
    Math.min(
      5,
      Math.max(
        1,
        Math.round(stars),
      ),
    );

  return '★'.repeat(
    roundedStars,
  );
}


/* =========================================================
   RESTAURANTES
   ========================================================= */

function formatRestaurantType(
  value: string | null,
) {
  if (!value) {
    return 'Gastronomía';
  }

  switch (
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
  ) {
    case 'restaurant':
      return 'Restaurante';

    case 'cafe':
      return 'Café';

    case 'fast_food':
      return 'Comida rápida';

    default:
      return value;
  }
}


function formatCuisine(
  value: string,
) {
  return value
    .replace(/_/g, ' ')
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}


function getRestaurantCuisines(
  restaurant: Restaurant,
) {
  return restaurant.cuisine ?? [];
}


/* =========================================================
   TARJETA DE RESTAURANTE
   ========================================================= */

interface RestaurantCardProps {
  restaurant: Restaurant;
  index: number;
}


function RestaurantCard({
  restaurant,
  index,
}: RestaurantCardProps) {

  const cuisines =
    getRestaurantCuisines(
      restaurant,
    )
      .slice(0, 3)
      .map(formatCuisine);

  const visualClasses = [
    'gt-restaurant-visual-blue',
    'gt-restaurant-visual-orange',
    'gt-restaurant-visual-purple',
    'gt-restaurant-visual-green',
  ];

  const visualClass =
    visualClasses[
      index % visualClasses.length
    ];

  const websiteUrl =
    restaurant.links?.website;

  const mapsUrl =
    restaurant.links?.maps;

  const typeLabel =
    formatRestaurantType(
      restaurant.primaryType,
    );

  return (
    <article className="gt-restaurant-card">

      {/* =================================================
          PARTE VISUAL
          ================================================= */}

      <div
        className={`gt-restaurant-card-visual ${visualClass}`}
      >

        <div className="gt-restaurant-visual-pattern" />


        <WishlistHeart
          item={{
            key:
              `restaurant:${restaurant.id}`,

            type:
              'restaurant',

            title:
              restaurant.name,

            subtitle:
              restaurant.address ||
              'Ubicación disponible en el mapa',

            href:
              `/restaurants/${restaurant.id}`,

            metadata: {

              tipo:
                typeLabel,

              cocina:
                cuisines.length > 0
                  ? cuisines.join(', ')
                  : null,

              sitioWeb:
                Boolean(websiteUrl),

              mapa:
                Boolean(mapsUrl),

            },

          }}
        />


        <RestaurantIcon />


        <span>
          {typeLabel}
        </span>


        {websiteUrl && (
          <div className="gt-restaurant-web-badge">
            Sitio web
          </div>
        )}

      </div>


      {/* =================================================
          CUERPO DE LA TARJETA
          ================================================= */}

      <div className="gt-restaurant-card-body">

        <div className="gt-restaurant-card-heading">

          <span>
            {typeLabel}
          </span>

          <h3>
            {restaurant.name}
          </h3>

        </div>


        {/* =================================================
            COCINAS
            ================================================= */}

        {cuisines.length > 0 && (

          <div className="gt-restaurant-cuisine-chips">

            {cuisines.map(
              (cuisineName) => (

                <span
                  key={cuisineName}
                >
                  {cuisineName}
                </span>

              ),
            )}

          </div>

        )}


        {/* =================================================
            DIRECCIÓN
            ================================================= */}

        <div className="gt-restaurant-address">

          <LocationIcon />

          <span>
            {restaurant.address ||
              'Ubicación disponible en el mapa'}
          </span>

        </div>


        <div className="gt-restaurant-card-spacer" />


        {/* =================================================
            ACCIONES
            ================================================= */}

        <div className="gt-restaurant-card-actions">

          <Link
            to={`/restaurants/${restaurant.id}`}
            className="gt-restaurant-detail-button"
          >

            Ver detalles

            <ArrowIcon />

          </Link>


          {mapsUrl && (

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="gt-restaurant-icon-button"
              aria-label="Ver en mapa"
            >

              <MapIcon />

            </a>

          )}


          {websiteUrl && (

            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="gt-restaurant-icon-button"
              aria-label="Abrir sitio web"
            >

              <ExternalIcon />

            </a>

          )}

        </div>

      </div>

    </article>
  );
}


/* =========================================================
   RENT A CAR
   ========================================================= */

function formatCarType(
  value: string | null | undefined,
) {
  if (!value) {
    return 'Movilidad';
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ');

  if (normalized === 'car rental') {
    return 'Rent a Car';
  }

  if (normalized === 'car sharing') {
    return 'Car sharing';
  }

  return value;
}

function normalize(
  value: string,
) {
  return value
    .trim()
    .toLowerCase();
}

function getCarTypes(
  car: CarSummary,
) {
  return car.types ?? [];
}


/* =========================================================
   TARJETA DE RENT A CAR
   ========================================================= */

interface CarPlanCardProps {
  car: CarSummary;
  index: number;
}

function CarPlanCard({
  car,
  index,
}: CarPlanCardProps) {
  const brand =
    car.brand?.trim() ??
    '';

  const name =
    car.name?.trim() ||
    'Servicio de movilidad';

  const showBrand =
    Boolean(brand) &&
    normalize(brand) !==
      normalize(name);

  const mapsUrl =
    car.links?.maps ??
    null;

  const websiteUrl =
    car.links?.website ??
    null;

  const address =
    car.address?.trim() ||
    'Dirección no disponible';

  const typeLabel =
    formatCarType(
      car.primaryType,
    );

  const visualClasses = [
    'gt-car-visual-blue',
    'gt-car-visual-teal',
    'gt-car-visual-indigo',
    'gt-car-visual-cyan',
  ];

  const visualClass =
    visualClasses[
      index %
        visualClasses.length
    ];

  return (
    <article className="gt-car-result-card">

      <div
        className={`gt-car-result-visual ${visualClass}`}
      >
        <WishlistHeart
          item={{
            key:
              `car:${car.id}`,

            type:
              'car',

            title:
              name,

            subtitle:
              address,

            href:
              `/cars/${car.id}`,

            metadata: {
              tipo:
                typeLabel,

              marca:
                showBrand
                  ? brand
                  : null,

              sitioWeb:
                Boolean(
                  websiteUrl,
                ),

              mapa:
                Boolean(
                  mapsUrl,
                ),
            },
          }}
        />

        <div className="gt-car-visual-road">
          <span />
          <span />
          <span />
        </div>

        <CarIcon />

        <span>
          {typeLabel}
        </span>
      </div>

      <div className="gt-car-result-content">

        <div className="gt-car-result-copy">

          <span className="gt-car-result-type">
            {typeLabel}
          </span>

          <h3>
            {name}
          </h3>

          {showBrand && (
            <p className="gt-car-result-brand">
              <BuildingIcon />
              {brand}
            </p>
          )}

          <div className="gt-car-result-location">
            <LocationIcon />

            <span>
              {address}
            </span>
          </div>

          <div className="gt-car-result-tags">

            {websiteUrl && (
              <span>
                <GlobeIcon />
                Sitio web
              </span>
            )}

            {mapsUrl && (
              <span>
                <MapIcon />
                Ubicación
              </span>
            )}

            {getCarTypes(car).map(
              (carType) => (
                <span
                  key={carType}
                >
                  {formatCarType(
                    carType,
                  )}
                </span>
              ),
            )}

          </div>
        </div>

        <div className="gt-car-result-actions">

          <span className="gt-car-result-action-label">
            Más información
          </span>

          <strong>
            Consulta el proveedor
          </strong>

          <Link
            to={`/cars/${car.id}`}
            className="gt-car-detail-button"
          >
            Ver detalles
            <ArrowIcon />
          </Link>

          <div className="gt-car-external-actions">

            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ver ubicación en el mapa"
              >
                <MapIcon />
                Mapa
              </a>
            )}

            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir sitio web"
              >
                <ExternalIcon />
                Web
              </a>
            )}

          </div>

        </div>

      </div>

    </article>
  );
}


/* =========================================================
   PÁGINA
   ========================================================= */

function TravelPlanPage() {

  const [flights, setFlights] =
    useState<FlightOffer[]>([]);

  const [hotels, setHotels] =
    useState<HotelSummary[]>([]);

  const [restaurants, setRestaurants] =
    useState<Restaurant[]>([]);

  const [cars, setCars] =
    useState<CarSummary[]>([]);


  /* =====================================================
     AUTENTICACIÓN / WISHLIST
     ===================================================== */

  const {
    isAuthenticated,
    login,
  } = useAuth();

  const {
    toggle,
    isSaved,
  } = useWishlist();


  /* =====================================================
     ESTADOS DE CARGA
     ===================================================== */

  const [isLoading, setIsLoading] =
    useState(false);

  const [isLoadingFlights, setIsLoadingFlights] =
    useState(false);

  const [isLoadingHotels, setIsLoadingHotels] =
    useState(false);

  const [isLoadingRestaurants, setIsLoadingRestaurants] =
    useState(false);

  const [isLoadingCars, setIsLoadingCars] =
    useState(false);


  /* =====================================================
     ESTADOS GENERALES
     ===================================================== */

  const [error, setError] =
    useState<string | null>(null);

  const [hasSearched, setHasSearched] =
    useState(false);


  /*
   * Se conserva porque ya forma parte
   * de la lógica actual.
   */

  const [selectedFlight, setSelectedFlight] =
    useState<FlightOffer | null>(null);


  /* =====================================================
     INFORMACIÓN DE HOTELES
     ===================================================== */

  const [hotelMeta, setHotelMeta] =
    useState<HotelSearchMeta | null>(
      null,
    );


  const [
    hotelSearchContext,
    setHotelSearchContext,
  ] = useState<{
    checkin: string;
    checkout?: string;
    adults: string;
    currency: string;
  } | null>(null);


  /* =====================================================
     MEJOR PRECIO / MÁS RÁPIDO
     ===================================================== */

  const lowestPrice =
    flights.length > 0
      ? Math.min(
          ...flights.map(
            (flight) =>
              flight.price,
          ),
        )
      : null;


  const durationValues =
    flights
      .map(
        (flight) =>
          flight.durationMinutes,
      )
      .filter(
        (
          duration,
        ): duration is number =>
          duration !== null,
      );


  const shortestDuration =
    durationValues.length > 0
      ? Math.min(
          ...durationValues,
        )
      : null;


  /* =====================================================
     BUSCAR PLAN DE VIAJE
     ===================================================== */

  const handleSearch = async (
    params: TravelPlanSearchParams,
  ) => {

    try {

      /* -----------------------------------------------
         INICIO
         ----------------------------------------------- */

      setIsLoading(true);

      setError(null);

      setHasSearched(true);


      /* Limpiar resultados anteriores */

      setFlights([]);

      setHotels([]);

      setRestaurants([]);

      setCars([]);

      setSelectedFlight(null);

      setHotelMeta(null);


      /* Activar estados de carga */

      setIsLoadingFlights(true);

      setIsLoadingHotels(true);

      setIsLoadingRestaurants(true);

      setIsLoadingCars(true);


      /* -----------------------------------------------
         GUARDAR DATOS PARA HOTELES
         ----------------------------------------------- */

      setHotelSearchContext({

        checkin:
          params.departureAt,

        checkout:
          params.returnAt,

        adults:
          '2',

        currency:
          params.currency,

      });


      /* -----------------------------------------------
         OBTENER DESTINO
         ----------------------------------------------- */

      const destination =
        await getDestinationByIata(
          params.destination,
        );


      const destinationCity =
        destination.cityName;


      const destinationCountry =
        destination.countryCode;


      /*
       * Ya conocemos el destino.
       * Las búsquedas empiezan
       * independientemente.
       */

      setIsLoading(false);


      /* =================================================
         VUELOS
         ================================================= */

      searchFlights({

        origin:
          params.origin,

        destination:
          params.destination,

        departureAt:
          params.departureAt,

        returnAt:
          params.returnAt,

        currency:
          params.currency,

        limit:
          10,

      })
        .then(
          (
            flightsResponse,
          ) => {

            setFlights(
              flightsResponse.data,
            );

          },
        )
        .catch(
          (
            flightError,
          ) => {

            console.error(
              'Error buscando vuelos:',
              flightError,
            );

            setFlights([]);

          },
        )
        .finally(() => {

          setIsLoadingFlights(
            false,
          );

        });


      /* =================================================
         HOTELES
         ================================================= */

      searchHotels({

        cityName:
          destinationCity,

        countryCode:
          destinationCountry,

        limit:
          6,

      })
        .then(
          (
            hotelsResponse,
          ) => {

            setHotels(
              hotelsResponse.data,
            );

            setHotelMeta(
              hotelsResponse.meta,
            );

          },
        )
        .catch(
          (
            hotelError,
          ) => {

            console.error(
              'Error buscando hoteles:',
              hotelError,
            );

            setHotels([]);

          },
        )
        .finally(() => {

          setIsLoadingHotels(
            false,
          );

        });


      /* =================================================
         RESTAURANTES
         ================================================= */

      searchRestaurants({

        cityName:
          destinationCity,

        countryCode:
          destinationCountry,

        limit:
          6,

        type:
          'restaurant',

      })
        .then(
          (
            restaurantsResponse,
          ) => {

            setRestaurants(
              restaurantsResponse.data,
            );

          },
        )
        .catch(
          (
            restaurantError,
          ) => {

            console.error(
              'Error buscando restaurantes:',
              restaurantError,
            );

            setRestaurants([]);

          },
        )
        .finally(() => {

          setIsLoadingRestaurants(
            false,
          );

        });


      /* =================================================
         RENT A CAR
         ================================================= */

      searchCars({

        cityName:
          destinationCity,

        countryCode:
          destinationCountry,

        limit:
          6,

        type:
          'car_rental',

      })
        .then(
          (
            carsResponse,
          ) => {

            setCars(
              carsResponse.data,
            );

          },
        )
        .catch(
          (
            carError,
          ) => {

            console.error(
              'Error buscando Rent a Car:',
              carError,
            );

            setCars([]);

          },
        )
        .finally(() => {

          setIsLoadingCars(
            false,
          );

        });


    } catch (searchError) {

      console.error(
        'Error obteniendo el destino:',
        searchError,
      );


      setError(
        'No fue posible obtener el destino seleccionado. Intenta nuevamente.',
      );


      setFlights([]);

      setHotels([]);

      setRestaurants([]);

      setCars([]);

      setSelectedFlight(null);

      setIsLoading(false);

      setIsLoadingFlights(false);

      setIsLoadingHotels(false);

      setIsLoadingRestaurants(false);

      setIsLoadingCars(false);

    }
  };


  /* =====================================================
     URL DEL DETALLE DEL HOTEL
     ===================================================== */

  const buildHotelDetailUrl = (
    hotelId: string,
  ) => {

    const params =
      new URLSearchParams();


    if (
      hotelSearchContext?.checkin
    ) {

      params.set(
        'checkin',
        hotelSearchContext.checkin,
      );

    }


    if (
      hotelSearchContext?.checkout
    ) {

      params.set(
        'checkout',
        hotelSearchContext.checkout,
      );

    }


    params.set(
      'adults',
      hotelSearchContext?.adults ||
        '2',
    );


    params.set(
      'currency',
      hotelSearchContext?.currency ||
        'USD',
    );


    return `/hotels/${hotelId}?${params.toString()}`;
  };


  /* =====================================================
     WISHLIST HOTEL
     ===================================================== */

  const handleWishlist = (
    hotel: HotelSummary,
  ) => {

    if (!isAuthenticated) {

      login();

      return;
    }


    toggle({

      key:
        `hotel:${hotel.id}`,

      type:
        'hotel',

      title:
        hotel.name,

      subtitle:
        [
          hotel.city,
          hotel.country,
        ]
          .filter(Boolean)
          .join(', '),

      imageUrl:
        hotel.mainPhoto ||
        hotel.thumbnail ||
        null,

      href:
        buildHotelDetailUrl(
          hotel.id,
        ),

      metadata: {

        ciudad:
          hotel.city ??
          null,

        país:
          hotel.country ??
          null,

        estrellas:
          hotel.starRating ??
          null,

        valoración:
          hotel.rating ??
          null,

        cadena:
          hotel.chain ??
          null,

      },

    });
  };


  return (
    <main className="travel-plan-page">

      {/* =================================================
          BUSCADOR
          ================================================= */}

      <TravelPlanSearchForm
        onSearch={
          handleSearch
        }
      />


      {/* =================================================
          CARGANDO DESTINO
          ================================================= */}

      {isLoading && (

        <section className="travel-plan-status">

          <h2>
            Estamos preparando tu viaje...
          </h2>

          <p>
            Estamos identificando tu destino
            y preparando las búsquedas.
          </p>

        </section>

      )}


      {/* =================================================
          ERROR
          ================================================= */}

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


      {/* =================================================
          RESULTADOS
          ================================================= */}

      {!error &&
        hasSearched &&
        !isLoading && (

        <section className="travel-plan-content">


          {/* =================================================
              01 · VUELOS
              ================================================= */}

          <section className="travel-plan-results">

            <div className="travel-plan-results-heading">

              <h2>
                Vuelos disponibles
              </h2>

              <p>
                Elige la opción que mejor
                se adapte a tu viaje.
              </p>

            </div>


            {isLoadingFlights ? (

              <div className="travel-plan-empty">

                <p>
                  Buscando vuelos...
                </p>

              </div>

            ) : flights.length === 0 ? (

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
                  ) => {

                    const isBestPrice =
                      lowestPrice !==
                        null &&
                      flight.price ===
                        lowestPrice;


                    const isFastest =
                      shortestDuration !==
                        null &&
                      flight.durationMinutes !==
                        null &&
                      flight.durationMinutes ===
                        shortestDuration;


                    const flightWishlistKey =
                      `flight:${flight.origin}-${flight.destination}-${flight.departureAt}-${flight.flightNumber ?? index}`;


                    return (

                      <article
                        key={`${flight.flightNumber ?? 'flight'}-${index}`}
                        className={
                          selectedFlight ===
                          flight
                            ? 'gt-flight-card selected'
                            : 'gt-flight-card'
                        }
                      >

                        <div className="gt-flight-card-top">

                          <div className="gt-flight-badges">

                            {isBestPrice && (

                              <span className="gt-flight-badge gt-flight-badge-price">
                                Mejor precio
                              </span>

                            )}


                            {isFastest && (

                              <span className="gt-flight-badge gt-flight-badge-fast">
                                Más rápido
                              </span>

                            )}


                            {flight.transfers ===
                              0 && (

                              <span className="gt-flight-badge gt-flight-badge-direct">
                                Directo
                              </span>

                            )}

                          </div>


                          <div className="gt-flight-card-top-actions">

                            <span className="gt-flight-result-index">
                              Opción{' '}
                              {index + 1}
                            </span>


                            <WishlistHeart

                              className="gt-flight-wishlist-heart"

                              item={{

                                key:
                                  flightWishlistKey,

                                type:
                                  'flight',

                                title:
                                  `${flight.origin} → ${flight.destination}`,

                                subtitle:
                                  formatAirlineName(
                                    flight.airlineName,
                                  ),

                                href:
                                  '/flights',

                                metadata: {

                                  aerolínea:
                                    formatAirlineName(
                                      flight.airlineName,
                                    ),

                                  vuelo:
                                    flight.flightNumber ??
                                    null,

                                  salida:
                                    formatDate(
                                      flight.departureAt,
                                    ) ||
                                    null,

                                  duración:
                                    formatDuration(
                                      flight.durationMinutes,
                                    ),

                                  escalas:
                                    formatTransfers(
                                      flight.transfers,
                                    ),

                                  precio:
                                    formatPrice(
                                      flight.price,
                                    ),

                                },

                              }}

                            />

                          </div>

                        </div>


                        <div className="gt-flight-card-main">


                          <div className="gt-flight-airline">

                            <div className="gt-airline-logo">

                              {flight.airline
                                ?.slice(
                                  0,
                                  2,
                                )
                                .toUpperCase() ||
                                'GT'}

                            </div>


                            <div>

                              <strong>

                                {formatAirlineName(
                                  flight.airlineName,
                                )}

                              </strong>


                              {flight.flightNumber && (

                                <span>

                                  Vuelo{' '}
                                  {
                                    flight.flightNumber
                                  }

                                </span>

                              )}

                            </div>

                          </div>


                          <div className="gt-flight-route">


                            <div className="gt-flight-route-point">

                              <span>
                                {flight.origin}
                              </span>

                              <strong>

                                {formatTime(
                                  flight.departureAt,
                                )}

                              </strong>

                              <small>

                                {flight.originAirport ||
                                  flight.origin}

                              </small>

                              <small>

                                {formatDate(
                                  flight.departureAt,
                                )}

                              </small>

                            </div>


                            <div className="gt-flight-route-middle">

                              <span>

                                {formatDuration(
                                  flight.durationMinutes,
                                )}

                              </span>


                              <div className="gt-flight-route-track">

                                <span className="gt-flight-route-dot" />

                                <div />

                                <PlaneIcon />

                                <div />

                                <span className="gt-flight-route-dot" />

                              </div>


                              <strong>

                                {formatTransfers(
                                  flight.transfers,
                                )}

                              </strong>

                            </div>


                            <div className="gt-flight-route-point gt-flight-route-destination">

                              <span>
                                {flight.destination}
                              </span>

                              <strong>
                                {flight.destination}
                              </strong>

                              <small>

                                {flight.destinationAirport ||
                                  flight.destination}

                              </small>


                              {flight.returnAt && (

                                <small>

                                  Regreso{' '}

                                  {formatDate(
                                    flight.returnAt,
                                  )}

                                </small>

                              )}

                            </div>

                          </div>


                          <div className="gt-flight-price">

                            <span>
                              Desde
                            </span>

                            <strong>

                              {formatPrice(
                                flight.price,
                              )}

                            </strong>

                            <small>
                              por viajero
                            </small>


                            {flight.deeplink ? (

                              <a
                                href={
                                  flight.deeplink
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="gt-flight-offer-button"
                              >

                                Ver oferta

                                <ArrowIcon />

                              </a>

                            ) : (

                              <button
                                type="button"
                                className="gt-flight-offer-button"
                                disabled
                              >

                                No disponible

                              </button>

                            )}

                          </div>

                        </div>


                        <div className="gt-flight-card-footer">

                          <span>

                            <InfoIcon />

                            Precio sujeto a disponibilidad del proveedor

                          </span>

                        </div>

                      </article>

                    );

                  },
                )}

              </div>

            )}

          </section>


          {/* =================================================
              02 · HOSPEDAJE
              ================================================= */}

          <section className="travel-plan-service-section">

            <div className="travel-plan-results-heading">

              <h2>
                Hospedajes para tu viaje
              </h2>

              <p>

                {hotels.length}{' '}

                {hotels.length === 1
                  ? 'alojamiento encontrado'
                  : 'alojamientos encontrados'}

              </p>

            </div>


            {isLoadingHotels ? (

              <div className="travel-plan-empty">

                <p>
                  Buscando hospedajes...
                </p>

              </div>

            ) : hotels.length === 0 ? (

              <div className="travel-plan-empty">

                <p>
                  No encontramos hospedajes
                  para este destino.
                </p>

              </div>

            ) : (

              <div className="hotel-results-grid">

                {hotels.map(
                  (hotel) => {

                    const wishlistKey =
                      `hotel:${hotel.id}`;

                    const saved =
                      isSaved(
                        wishlistKey,
                      );


                    return (

                      <article
                        className="hotel-card"
                        key={hotel.id}
                      >

                        <div className="hotel-card-image">

                          {hotel.mainPhoto ||
                          hotel.thumbnail ? (

                            <img
                              src={
                                hotel.mainPhoto ||
                                hotel.thumbnail ||
                                ''
                              }
                              alt={
                                hotel.name
                              }
                              loading="lazy"
                            />

                          ) : (

                            <div className="hotel-image-placeholder">
                              Sin imagen
                            </div>

                          )}


                          <button
                            type="button"
                            className={
                              saved
                                ? 'hotel-wishlist-button hotel-wishlist-button-active'
                                : 'hotel-wishlist-button'
                            }
                            onClick={() =>
                              handleWishlist(
                                hotel,
                              )
                            }
                            aria-label={
                              saved
                                ? `Eliminar ${hotel.name} de Wishlist`
                                : `Guardar ${hotel.name} en Wishlist`
                            }
                            title={
                              saved
                                ? 'Eliminar de Wishlist'
                                : 'Guardar en Wishlist'
                            }
                          >

                            <HeartIcon />

                          </button>

                        </div>


                        <div className="hotel-card-content">

                          <div className="hotel-card-main">


                            {hotel.starRating && (

                              <span className="hotel-stars">

                                {renderStars(
                                  hotel.starRating,
                                )}

                              </span>

                            )}


                            <h3>
                              {hotel.name}
                            </h3>


                            <p className="hotel-location">

                              {[
                                hotel.city,
                                hotel.country,
                              ]
                                .filter(Boolean)
                                .join(', ')}

                            </p>


                            {hotel.address && (

                              <p className="hotel-address">

                                {hotel.address}

                              </p>

                            )}


                            <div className="hotel-card-meta">

                              {hotel.rating !==
                                null && (

                                <span className="hotel-rating">

                                  {hotel.rating.toFixed(
                                    1,
                                  )}

                                </span>

                              )}


                              {hotel.reviewCount !==
                                null && (

                                <span>

                                  {
                                    hotel.reviewCount
                                  }{' '}

                                  {hotel.reviewCount ===
                                    1
                                    ? 'reseña'
                                    : 'reseñas'}

                                </span>

                              )}


                              {hotel.chain && (

                                <span>
                                  {hotel.chain}
                                </span>

                              )}

                            </div>

                          </div>


                          <div className="hotel-card-actions">

                            {hotel.links.map && (

                              <a
                                href={
                                  hotel.links.map
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hotel-map-link"
                              >

                                Ver en mapa

                              </a>

                            )}


                            <a
                              href={
                                buildHotelDetailUrl(
                                  hotel.id,
                                )
                              }
                              className="hotel-detail-button"
                            >

                              Ver disponibilidad

                            </a>

                          </div>

                        </div>

                      </article>

                    );

                  },
                )}

              </div>

            )}


            {hotelMeta?.disclaimer && (

              <p className="hotel-disclaimer">

                {hotelMeta.disclaimer}

              </p>

            )}

          </section>


          {/* =================================================
              03 · RESTAURANTES
              ================================================= */}

          <section className="travel-plan-service-section">

            <div className="travel-plan-results-heading">

            
              <h2>
                Lugares para comer
              </h2>

              <p>
                Descubre restaurantes y opciones gastronómicas
                disponibles en tu destino.
              </p>

            </div>


            {isLoadingRestaurants ? (

              <div className="travel-plan-empty">

                <p>
                  Buscando restaurantes...
                </p>

              </div>

            ) : restaurants.length === 0 ? (

              <div className="travel-plan-empty">

                <p>
                  No encontramos restaurantes
                  para este destino.
                </p>

              </div>

            ) : (

              <div className="gt-restaurants-grid">

                {restaurants.map(
                  (
                    restaurant,
                    index,
                  ) => (

                    <RestaurantCard
                      key={
                        restaurant.id
                      }
                      restaurant={
                        restaurant
                      }
                      index={
                        index
                      }
                    />

                  ),
                )}

              </div>

            )}

          </section>


          {/* =================================================
              04 · RENT A CAR
              ================================================= */}

          <section className="travel-plan-service-section">

            <div className="travel-plan-results-heading">


              <h2>
                Movilidad en tu destino
              </h2>

              <p>
                Opciones de alquiler de
                vehículos.
              </p>

            </div>


            {isLoadingCars ? (

              <div className="travel-plan-empty">

                <p>
                  Buscando opciones de transporte...
                </p>

              </div>

            ) : cars.length === 0 ? (

              <div className="travel-plan-empty">

                <p>
                  No encontramos opciones de
                  Rent a Car para este destino.
                </p>

              </div>

            ) : (

              <div className="gt-cars-results-list">

                {cars.map(
                  (
                    car,
                    index,
                  ) => (

                    <CarPlanCard
                      key={car.id}
                      car={car}
                      index={index}
                    />

                  ),
                )}

              </div>

            )}

          </section>


          {/* =================================================
              05 · RESUMEN
              ================================================= */}

          <section className="travel-plan-summary">

            <div className="travel-plan-results-heading">

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

                  {isLoadingHotels
                    ? 'Buscando...'
                    : hotels.length}

                </strong>

              </div>


              {/* RESTAURANTES */}

              <div>

                <span>
                  Restaurantes
                </span>

                <strong>

                  {isLoadingRestaurants
                    ? 'Buscando...'
                    : restaurants.length}

                </strong>

              </div>


              {/* RENT A CAR */}

              <div>

                <span>
                  Rent a Car
                </span>

                <strong>

                  {isLoadingCars
                    ? 'Buscando...'
                    : cars.length}

                </strong>

              </div>

            </div>

          </section>

        </section>

      )}

    </main>
  );
}


/* =========================================================
   ICONOS
   ========================================================= */

function PlaneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M2 12h20" />
      <path d="m13 5 7 7-7 7" />
      <path d="M5 8h5l3-5" />
      <path d="M5 16h5l3 3" />
    </svg>
  );
}


function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}


function InfoIcon() {
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

      <path d="M12 11v6" />

      <path d="M12 7h.01" />
    </svg>
  );
}


function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}


/* =========================================================
   ICONOS DE RESTAURANTES
   ========================================================= */

function CarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 17h14l1-5-2-5H6l-2 5 1 5Z" />
      <path d="M7 17v2M17 17v2M4 12h16" />
      <circle
        cx="8"
        cy="14"
        r="1"
      />
      <circle
        cx="16"
        cy="14"
        r="1"
      />
    </svg>
  );
}


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

      <path d="M3 12h18M12 3c3 3 4 6 4 9s-1 6-4 9M12 3c-3 3-4 6-4 9s1 6 4 9" />
    </svg>
  );
}


function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 21V5h10v16M14 9h6v12M2 21h20" />

      <path d="M8 9h2M8 13h2M8 17h2M17 13h1M17 17h1" />
    </svg>
  );
}


function RestaurantIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M7 3v7" />

      <path d="M4 3v7a3 3 0 0 0 6 0V3" />

      <path d="M7 10v11" />

      <path d="M17 3v18" />

      <path d="M17 3c-2 1.5-3 3.5-3 6h3" />
    </svg>
  );
}


function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 21s7-6.1 7-12a7 7 0 0 0-14 0c0 5.9 7 12 7 12Z" />

      <circle
        cx="12"
        cy="9"
        r="2.5"
      />
    </svg>
  );
}


function MapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />

      <path d="M9 3v15" />

      <path d="M15 6v15" />
    </svg>
  );
}


function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M14 5h5v5" />

      <path d="M10 14 19 5" />

      <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </svg>
  );
}


export default TravelPlanPage;