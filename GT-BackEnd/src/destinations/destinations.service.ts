import { randomUUID } from 'crypto';
import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { Destination } from '../database/entities/destination.entity';
import { TravelpayoutsClient } from '../travelpayouts/travelpayouts.client';
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
    if (count === 0) {
      this.logger.log('Destinations table is empty; seeding from TravelPayouts');
      await this.syncFromTravelpayouts().catch((error: unknown) => {
        this.logger.error(
          `Destination seed failed: ${error instanceof Error ? error.message : error}`,
        );
      });
    }
  }

  async search(query: SearchDestinationsDto) {
    const limit = query.limit ?? 20;

    if (!query.q && !query.country) {
      const featured = await this.destinations
        .createQueryBuilder('destination')
        .where('destination.cityIata IN (:...codes)', { codes: FEATURED_IATAS })
        .take(limit)
        .getMany();

      return {
        data: featured.map((row) => this.toDto(row)),
        meta: { count: featured.length, featured: true },
      };
    }

    const where: FindOptionsWhere<Destination>[] = [];
    const country = query.country;
    const q = query.q?.trim();

    if (q) {
      const like = `%${q}%`;
      where.push(
        country
          ? { cityName: Like(like), countryCode: country }
          : { cityName: Like(like) },
        country
          ? { countryName: Like(like), countryCode: country }
          : { countryName: Like(like) },
        country
          ? { cityIata: Like(`%${q.toUpperCase()}%`), countryCode: country }
          : { cityIata: Like(`%${q.toUpperCase()}%`) },
      );
    } else if (country) {
      where.push({ countryCode: country });
    }

    const rows = await this.destinations.find({
      where,
      take: limit,
      order: { cityName: 'ASC' },
    });

    return {
      data: rows.map((row) => this.toDto(row)),
      meta: { count: rows.length, featured: false },
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

  async syncFromTravelpayouts() {
    if (this.seeding) {
      return { data: { status: 'already_running' } };
    }

    this.seeding = true;
    try {
      const [cities, countries] = await Promise.all([
        this.travelpayouts.getCities(),
        this.travelpayouts.getCountries(),
      ]);

      const countryNames = new Map(
        countries
          .filter((country) => country.code && country.name)
          .map((country) => [country.code!.toUpperCase(), country.name!]),
      );

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
            ],
            ['city_iata'],
          )
          .execute();
      }

      const count = await this.destinations.count();
      this.logger.log(`Synced ${count} destinations from TravelPayouts`);
      return { data: { status: 'ok', count } };
    } finally {
      this.seeding = false;
    }
  }

  private toDto(destination: Destination) {
    return {
      id: destination.id,
      cityName: destination.cityName,
      countryName: destination.countryName,
      countryCode: destination.countryCode,
      cityIata: destination.cityIata,
      latitude: destination.latitude ? Number(destination.latitude) : null,
      longitude: destination.longitude ? Number(destination.longitude) : null,
      timezone: destination.timezone,
    };
  }
}
