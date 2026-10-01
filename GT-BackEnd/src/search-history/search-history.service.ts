import { randomUUID } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConvertQueryDto } from '../currency/dto/convert-query.dto';
import { Destination } from '../database/entities/destination.entity';
import { SearchHistory } from '../database/entities/search-history.entity';
import { SearchType } from '../database/enums';
import { SearchDestinationsDto } from '../destinations/dto/search-destinations.dto';
import { SearchFlightsDto } from '../flights/dto/search-flights.dto';
import { SearchHotelsDto } from '../hotels/dto/search-hotels.dto';
import { SearchRestaurantsDto } from '../restaurants/dto/search-restaurants.dto';
import { SearchCarsDto } from '../cars/dto/search-cars.dto';

const IATA = /^[A-Z]{3}$/;
const YEAR_MONTH = /^\d{4}-\d{2}/;

export type RecordSearchInput = {
  searchType: SearchType;
  originIata?: string | null;
  destinationIata?: string | null;
  travelMonth?: string | null;
  queryJson: Record<string, unknown>;
};

@Injectable()
export class SearchHistoryService {
  private readonly logger = new Logger(SearchHistoryService.name);

  constructor(
    @InjectRepository(SearchHistory)
    private readonly searches: Repository<SearchHistory>,
    @InjectRepository(Destination)
    private readonly destinations: Repository<Destination>,
  ) {}

  recordFlight(query: SearchFlightsDto): void {
    this.enqueue({
      searchType: SearchType.FLIGHT,
      originIata: query.origin,
      destinationIata: query.destination,
      travelMonth: travelMonthOf(query.departureAt),
      queryJson: {
        origin: query.origin,
        destination: query.destination,
        departureAt: query.departureAt ?? null,
        returnAt: query.returnAt ?? null,
        currency: query.currency ?? 'USD',
        direct: query.direct ?? false,
      },
    });
  }

  recordHotel(query: SearchHotelsDto): void {
    void this.recordHotelAsync(query);
  }

  recordDestination(
    query: SearchDestinationsDto,
    firstMatchIata?: string | null,
  ): void {
    const q = query.q?.trim().toUpperCase();
    const destinationIata =
      q && IATA.test(q) ? q : (firstMatchIata?.toUpperCase() ?? null);

    this.enqueue({
      searchType: SearchType.DESTINATION,
      destinationIata,
      queryJson: {
        q: query.q ?? null,
        country: query.country ?? null,
      },
    });
  }

  recordCurrency(query: ConvertQueryDto): void {
    this.enqueue({
      searchType: SearchType.CURRENCY,
      queryJson: {
        from: query.from ?? 'USD',
        to: query.to,
      },
    });
  }

  recordRestaurant(
    query: SearchRestaurantsDto,
    destinationIata?: string | null,
  ): void {
    this.enqueue({
      searchType: SearchType.RESTAURANT,
      destinationIata,
      queryJson: {
        cityName: query.cityName,
        countryCode: query.countryCode ?? null,
        radius: query.radius ?? 4000,
        limit: query.limit ?? 20,
        type: query.type ?? null,
        cuisine: query.cuisine ?? null,
        q: query.q ?? null,
        hasWebsite: query.hasWebsite === true,
      },
    });
  }

  recordCar(query: SearchCarsDto, destinationIata?: string | null): void {
    this.enqueue({
      searchType: SearchType.CAR,
      destinationIata,
      queryJson: {
        cityName: query.cityName,
        countryCode: query.countryCode ?? null,
        radius: query.radius ?? 8000,
        limit: query.limit ?? 20,
        type: query.type ?? null,
        q: query.q ?? null,
        hasWebsite: query.hasWebsite === true,
      },
    });
  }

  private async recordHotelAsync(query: SearchHotelsDto): Promise<void> {
    const destinationIata = await this.findCityIata(
      query.cityName,
      query.countryCode,
    );

    await this.insert({
      searchType: SearchType.HOTEL,
      destinationIata,
      queryJson: {
        cityName: query.cityName,
        countryCode: query.countryCode,
      },
    });
  }

  private enqueue(input: RecordSearchInput): void {
    void this.insert(input);
  }

  private async insert(input: RecordSearchInput): Promise<void> {
    try {
      const row = this.searches.create({
        id: randomUUID(),
        userId: null,
        searchType: input.searchType,
        originIata: normalizeIata(input.originIata),
        destinationIata: normalizeIata(input.destinationIata),
        travelMonth: input.travelMonth ?? null,
        queryJson: input.queryJson,
      });
      await this.searches.save(row);
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to record ${input.searchType} search: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async findCityIata(
    cityName: string,
    countryCode: string,
  ): Promise<string | null> {
    try {
      const row = await this.destinations
        .createQueryBuilder('destination')
        .where('LOWER(destination.cityName) = LOWER(:cityName)', { cityName })
        .andWhere('destination.countryCode = :countryCode', { countryCode })
        .getOne();

      return row?.cityIata ?? null;
    } catch (error: unknown) {
      this.logger.warn(
        `Hotel city lookup failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }
}

function normalizeIata(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const code = value.toUpperCase();
  return IATA.test(code) ? code : null;
}

function travelMonthOf(departureAt?: string): string | null {
  if (!departureAt || !YEAR_MONTH.test(departureAt)) {
    return null;
  }
  return departureAt.slice(0, 7);
}
