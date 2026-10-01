import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Destination } from '../database/entities/destination.entity';
import { TravelpayoutsAirport } from '../travelpayouts/travelpayouts.types';
import { TravelpayoutsClient } from '../travelpayouts/travelpayouts.client';
import {
  escapeLikePattern,
  isIataQuery,
  rankSearchResults,
} from './destination-search';
import { SearchDestinationsDto } from './dto/search-destinations.dto';

const FEATURED_IATAS = [
  'NYC',
  'LON',
  'PAR',
  'MAD',
  'BCN',
  'ROM',
  'BER',
  'AMS',
  'DXB',
  'TYO',
  'BKK',
  'SYD',
  'MEX',
  'GRU',
  'BUE',
  'SJO',
];

const IATA = /^[A-Z]{3}$/;
const CHUNK_SIZE = 400;
const SEARCH_CANDIDATE_LIMIT = 80;

@Injectable()
export class DestinationsService implements OnModuleInit {
  private readonly logger = new Logger(DestinationsService.name);
  private seeding = false;

  constructor(
    @InjectRepository(Destination)
    private readonly destinations: Repository<Destination>,
    private readonly travelpayouts: TravelpayoutsClient,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.JEST_WORKER_ID) {
      return;
    }

    const count = await this.destinations.count();
    const flightableCount = await this.destinations.count({
      where: { hasFlightableAirport: true },
    });

    if (count === 0 || flightableCount === 0) {
      this.logger.log(
        count === 0
          ? 'Destinations table is empty; seeding from TravelPayouts'
          : 'Destinations are missing flightable flags; re-syncing catalog',
      );
      await this.syncFromTravelpayouts().catch((error: unknown) => {
        this.logger.error(
          `Destination seed failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
    }
  }

  async search(query: SearchDestinationsDto) {
    const limit = query.limit ?? 20;

    if (!query.q && !query.country) {
      return this.featured(limit);
    }

    const q = query.q?.trim() ?? '';
    const country = query.country;
    const exactIata = isIataQuery(q) ? q.toUpperCase() : undefined;
    const likeValue = q ? escapeLikePattern(q) : '';
    const prefix = q ? `${likeValue}%` : '';
    const contains = q ? `%${likeValue}%` : '';
    const useContains = q.length >= 3;

    const qb = this.destinations.createQueryBuilder('destination').where(
      new Brackets((where) => {
        where.where('destination.hasFlightableAirport = :flightable', {
          flightable: true,
        });
        if (exactIata) {
          where.orWhere('destination.cityIata = :exactIata', { exactIata });
        }
      }),
    );

    if (country) {
      qb.andWhere('destination.countryCode = :country', { country });
    }

    if (q) {
      qb.andWhere(
        new Brackets((where) => {
          where.where('LOWER(destination.cityName) LIKE LOWER(:prefix)', {
            prefix,
          });
          if (useContains) {
            where.orWhere('LOWER(destination.cityName) LIKE LOWER(:contains)', {
              contains,
            });
            where.orWhere(
              'LOWER(destination.countryName) LIKE LOWER(:contains)',
              { contains },
            );
          }
          if (exactIata) {
            where.orWhere('destination.cityIata = :exactIata', { exactIata });
          }
        }),
      );
    }

    const rows = await qb.take(SEARCH_CANDIDATE_LIMIT).getMany();

    const visible = rows.filter(
      (row) =>
        row.hasFlightableAirport ||
        (exactIata !== undefined && row.cityIata === exactIata),
    );
    const ranked = rankSearchResults(visible, q || undefined, FEATURED_IATAS);
    const page = ranked.slice(0, limit);

    return {
      data: page.map((row) => this.toDto(row)),
      meta: {
        count: page.length,
        featured: false,
      },
    };
  }

  async getByIata(iata: string) {
    const cityIata = iata.toUpperCase();
    const destination = await this.destinations.findOne({
      where: { cityIata },
    });

    if (!destination) {
      throw new NotFoundException(`Destination ${cityIata} was not found`);
    }

    return { data: this.toDto(destination) };
  }

  async getByCity(cityName: string, countryCode?: string) {
    const name = cityName.trim();
    const country = countryCode?.trim().toUpperCase();
    const qb = this.destinations
      .createQueryBuilder('destination')
      .where('LOWER(destination.cityName) = LOWER(:cityName)', {
        cityName: name,
      });

    if (country) {
      qb.andWhere('destination.countryCode = :countryCode', {
        countryCode: country,
      });
    }

    const matches = await qb.getMany();
    if (matches.length === 0) {
      const label = country ? `${name}, ${country}` : name;
      throw new NotFoundException(`Destination ${label} was not found`);
    }

    const countries = [...new Set(matches.map((row) => row.countryCode))];
    if (!country && countries.length > 1) {
      throw new BadRequestException(
        `City ${name} matches ${countries.join(', ')}. Pass countryCode to disambiguate.`,
      );
    }

    const chosen = pickCityMatch(matches);
    return { data: this.toDto(chosen) };
  }

  async syncFromTravelpayouts() {
    if (this.seeding) {
      return { data: { status: 'already_running' } };
    }

    this.seeding = true;
    try {
      const [cities, countries, airports] = await Promise.all([
        this.travelpayouts.getCities(),
        this.travelpayouts.getCountries(),
        this.travelpayouts.getAirports(),
      ]);

      const countryNames = new Map(
        countries
          .filter((country) => country.code && country.name)
          .map((country) => [country.code!.toUpperCase(), country.name!]),
      );
      const airportsByCity = groupFlightableAirports(airports);

      const rows = cities
        .filter((city) => city.code && IATA.test(city.code.toUpperCase()))
        .map((city) => {
          const cityIata = city.code!.toUpperCase();
          const countryCode = (city.country_code ?? '').toUpperCase();
          return {
            id: randomUUID(),
            cityIata,
            cityName: city.name ?? cityIata,
            countryCode: countryCode.slice(0, 2) || 'XX',
            countryName: countryNames.get(countryCode) ?? countryCode,
            latitude: city.coordinates?.lat?.toString() ?? null,
            longitude: city.coordinates?.lon?.toString() ?? null,
            timezone: city.time_zone ?? null,
            hasFlightableAirport: Boolean(city.has_flightable_airport),
            airports: airportsByCity.get(cityIata) ?? [],
          };
        });

      for (let index = 0; index < rows.length; index += CHUNK_SIZE) {
        const chunk = rows.slice(index, index + CHUNK_SIZE);
        await this.destinations
          .createQueryBuilder()
          .insert()
          .into(Destination)
          .values(chunk)
          .orUpdate(
            [
              'city_name',
              'country_name',
              'country_code',
              'latitude',
              'longitude',
              'timezone',
              'has_flightable_airport',
              'airports',
            ],
            ['city_iata'],
          )
          .execute();
      }

      const count = await this.destinations.count();
      const flightableCount = await this.destinations.count({
        where: { hasFlightableAirport: true },
      });
      this.logger.log(
        `Synced ${count} destinations (${flightableCount} with flightable airports)`,
      );
      return { data: { status: 'ok', count, flightableCount } };
    } finally {
      this.seeding = false;
    }
  }

  private async featured(limit: number) {
    const featured = await this.destinations
      .createQueryBuilder('destination')
      .where('destination.cityIata IN (:...codes)', { codes: FEATURED_IATAS })
      .andWhere('destination.hasFlightableAirport = :flightable', {
        flightable: true,
      })
      .take(limit)
      .getMany();

    const ranked = rankSearchResults(featured, undefined, FEATURED_IATAS);

    return {
      data: ranked.map((row) => this.toDto(row)),
      meta: { count: ranked.length, featured: true },
    };
  }

  private toDto(destination: Destination) {
    const airports = Array.isArray(destination.airports)
      ? destination.airports
      : [];

    return {
      id: destination.id,
      cityName: destination.cityName,
      countryName: destination.countryName,
      countryCode: destination.countryCode,
      cityIata: destination.cityIata,
      hasFlightableAirport: Boolean(destination.hasFlightableAirport),
      airports,
      latitude: destination.latitude ? Number(destination.latitude) : null,
      longitude: destination.longitude ? Number(destination.longitude) : null,
      timezone: destination.timezone,
    };
  }
}

function groupFlightableAirports(
  airports: TravelpayoutsAirport[],
): Map<string, Array<{ iata: string; name: string }>> {
  const grouped = new Map<string, Array<{ iata: string; name: string }>>();

  for (const airport of airports) {
    const cityCode = airport.city_code?.toUpperCase();
    const iata = airport.code?.toUpperCase();
    if (
      !cityCode ||
      !iata ||
      !IATA.test(cityCode) ||
      !IATA.test(iata) ||
      airport.flightable !== true ||
      airport.iata_type !== 'airport'
    ) {
      continue;
    }

    const list = grouped.get(cityCode) ?? [];
    if (!list.some((item) => item.iata === iata)) {
      list.push({ iata, name: airport.name?.trim() || iata });
      grouped.set(cityCode, list);
    }
  }

  for (const list of grouped.values()) {
    list.sort((left, right) => left.iata.localeCompare(right.iata));
  }

  return grouped;
}

function pickCityMatch(matches: Destination[]): Destination {
  const withCoords = matches.filter(
    (row) => row.latitude != null && row.longitude != null,
  );
  const pool = withCoords.length > 0 ? withCoords : matches;
  return [...pool].sort((left, right) => {
    if (left.hasFlightableAirport !== right.hasFlightableAirport) {
      return left.hasFlightableAirport ? -1 : 1;
    }
    return left.cityIata.localeCompare(right.cityIata);
  })[0];
}
