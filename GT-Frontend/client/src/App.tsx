import { useMemo, useState, type FormEvent } from 'react'
import './App.css'

type TravelForm = {
  origin: string
  destination: string
  departureAt: string
  returnAt: string
  currency: string
}

type FlightOffer = {
  origin: string
  destination: string
  price: number
  currency: string
  airlineName: string | null
  departureAt: string | null
}

type Destination = {
  cityName: string
  countryCode: string
}

type HotelSummary = {
  id: string
  name: string
  city: string | null
  country: string | null
  starRating: number | null
}

type ApiListResponse<T> = {
  data: T[]
}

type ApiItemResponse<T> = {
  data: T
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')

async function fetchJson<T>(path: string, params?: URLSearchParams): Promise<T> {
  const query = params?.toString()
  const url = query ? `${API_BASE_URL}/${path}?${query}` : `${API_BASE_URL}/${path}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }

  return (await response.json()) as T
}

function App() {
  const [form, setForm] = useState<TravelForm>({
    origin: 'MAD',
    destination: 'BCN',
    departureAt: '',
    returnAt: '',
    currency: 'USD',
  })
  const [flights, setFlights] = useState<FlightOffer[]>([])
  const [hotels, setHotels] = useState<HotelSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasResults = flights.length > 0 || hotels.length > 0
  const selectedRoute = useMemo(
    () => `${form.origin.toUpperCase()} → ${form.destination.toUpperCase()}`,
    [form.origin, form.destination],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const origin = form.origin.trim().toUpperCase()
    const destination = form.destination.trim().toUpperCase()
    const currency = form.currency.trim().toUpperCase() || 'USD'
    const departureAt = form.departureAt.trim()
    const returnAt = form.returnAt.trim()

    const flightParams = new URLSearchParams({
      origin,
      destination,
      currency,
      limit: '5',
    })

    if (departureAt) {
      flightParams.set('departureAt', departureAt)
    }
    if (returnAt) {
      flightParams.set('returnAt', returnAt)
    }

    try {
      const [flightResult, destinationResult] = await Promise.allSettled([
        fetchJson<ApiListResponse<FlightOffer>>('flights/search', flightParams),
        fetchJson<ApiItemResponse<Destination>>(`destinations/${destination}`),
      ])

      if (flightResult.status === 'rejected') {
        throw flightResult.reason
      }

      setFlights(flightResult.value.data ?? [])

      if (destinationResult.status === 'fulfilled') {
        const hotelParams = new URLSearchParams({
          countryCode: destinationResult.value.data.countryCode,
          cityName: destinationResult.value.data.cityName,
          limit: '5',
        })
        const hotelsResponse = await fetchJson<ApiListResponse<HotelSummary>>(
          'hotels/search',
          hotelParams,
        )
        setHotels(hotelsResponse.data ?? [])
      } else {
        setHotels([])
      }
    } catch {
      setFlights([])
      setHotels([])
      setError('No se pudo cargar el plan de viaje. Verifica que el backend esté activo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="dashboard">
      <header>
        <h1>Dashboard de plan de viaje</h1>
        <p>Compara vuelos y hoteles para la ruta seleccionada.</p>
      </header>

      <form className="planner-form" onSubmit={handleSubmit}>
        <label>
          Origen (IATA)
          <input
            required
            maxLength={3}
            value={form.origin}
            onChange={(event) => setForm((current) => ({ ...current, origin: event.target.value }))}
          />
        </label>
        <label>
          Destino (IATA)
          <input
            required
            maxLength={3}
            value={form.destination}
            onChange={(event) =>
              setForm((current) => ({ ...current, destination: event.target.value }))
            }
          />
        </label>
        <label>
          Salida
          <input
            type="date"
            value={form.departureAt}
            onChange={(event) =>
              setForm((current) => ({ ...current, departureAt: event.target.value }))
            }
          />
        </label>
        <label>
          Regreso
          <input
            type="date"
            value={form.returnAt}
            onChange={(event) => setForm((current) => ({ ...current, returnAt: event.target.value }))}
          />
        </label>
        <label>
          Moneda
          <input
            maxLength={3}
            value={form.currency}
            onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Buscando...' : 'Actualizar plan'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <section className="results-grid">
        <div className="panel">
          <h2>Vuelos ({selectedRoute})</h2>
          {!loading && flights.length === 0 && <p>Sin resultados de vuelos.</p>}
          <ul>
            {flights.map((flight) => (
              <li key={`${flight.airlineName ?? 'airline'}-${flight.departureAt ?? 'date'}-${flight.price}`}>
                <strong>{flight.airlineName ?? 'Aerolínea no disponible'}</strong>
                <span>
                  {flight.price} {flight.currency}
                </span>
                <small>{flight.departureAt ? new Date(flight.departureAt).toLocaleString() : 'Sin fecha'}</small>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <h2>Hoteles destino</h2>
          {!loading && hotels.length === 0 && <p>Sin resultados de hoteles.</p>}
          <ul>
            {hotels.map((hotel) => (
              <li key={hotel.id}>
                <strong>{hotel.name}</strong>
                <span>
                  {[hotel.city, hotel.country].filter(Boolean).join(', ') || 'Ubicación no disponible'}
                </span>
                <small>
                  {hotel.starRating != null ? `${hotel.starRating}★` : 'Categoría no disponible'}
                </small>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {!loading && !hasResults && !error && (
        <p className="empty-state">Completa el formulario para generar tu plan de viaje.</p>
      )}
    </main>
  )
}

export default App
