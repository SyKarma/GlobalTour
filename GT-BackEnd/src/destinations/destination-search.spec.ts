import { describe, expect, it } from '@jest/globals';
import {
  escapeLikePattern,
  isIataQuery,
  rankSearchResults,
} from './destination-search';

describe('destination search helpers', () => {
  it('detects a typed IATA code', () => {
    expect(isIataQuery('sjo')).toBe(true);
    expect(isIataQuery('San Jose')).toBe(false);
  });

  it('escapes LIKE wildcards from user input', () => {
    expect(escapeLikePattern('100%_off')).toBe('100\\%\\_off');
  });

  it('ranks the principal city first when the user types a city name', () => {
    const ranked = rankSearchResults(
      [
        {
          cityIata: 'SJC',
          cityName: 'San Jose',
          countryName: 'United States',
        },
        {
          cityIata: 'SJO',
          cityName: 'San Jose',
          countryName: 'Costa Rica',
        },
        {
          cityIata: 'SJD',
          cityName: 'San Jose Del Cabo',
          countryName: 'Mexico',
        },
        {
          cityIata: 'SJI',
          cityName: 'San Jose',
          countryName: 'Philippines',
        },
      ],
      'san jose',
      ['SJO'],
    );

    expect(ranked.map((row) => row.cityIata)).toEqual([
      'SJO',
      'SJC',
      'SJI',
      'SJD',
    ]);
  });

  it('keeps the featured city list order when the query is empty', () => {
    const ranked = rankSearchResults(
      [
        {
          cityIata: 'SJO',
          cityName: 'San Jose',
          countryName: 'Costa Rica',
        },
        {
          cityIata: 'NYC',
          cityName: 'New York',
          countryName: 'United States',
        },
      ],
      undefined,
      ['NYC', 'SJO'],
    );

    expect(ranked.map((row) => row.cityIata)).toEqual(['NYC', 'SJO']);
  });

  it('puts an exact IATA typed by the user at the top', () => {
    const ranked = rankSearchResults(
      [
        {
          cityIata: 'SJO',
          cityName: 'San Jose',
          countryName: 'Costa Rica',
        },
        {
          cityIata: 'SYQ',
          cityName: 'San Jose',
          countryName: 'Costa Rica',
        },
      ],
      'SYQ',
      ['SJO'],
    );

    expect(ranked[0]?.cityIata).toBe('SYQ');
  });
});
