export type DestinationAirport = {
  iata: string;
  name: string;
};

export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

export function isIataQuery(value: string): boolean {
  return /^[A-Z]{3}$/i.test(value.trim());
}

export function rankSearchResults<
  T extends { cityName: string; countryName: string; cityIata: string },
>(rows: T[], query: string | undefined, featuredIatas: string[]): T[] {
  const raw = query?.trim() ?? '';
  const lower = raw.toLowerCase();
  const iata = raw.toUpperCase();
  const featured = new Set(featuredIatas);

  if (!raw) {
    return [...rows].sort((left, right) => {
      const leftIndex = featuredIatas.indexOf(left.cityIata);
      const rightIndex = featuredIatas.indexOf(right.cityIata);
      const leftRank = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
      const rightRank =
        rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }
      return left.cityName.localeCompare(right.cityName);
    });
  }

  const score = (row: T): [number, number, string] => {
    const name = row.cityName.toLowerCase();
    const country = row.countryName.toLowerCase();
    let relevance = 50;

    if (raw && row.cityIata === iata) {
      relevance = 0;
    } else if (raw && name === lower) {
      relevance = 1;
    } else if (raw && name.startsWith(lower)) {
      relevance = 2;
    } else if (raw && name.includes(lower)) {
      relevance = 3;
    } else if (raw && country.includes(lower)) {
      relevance = 4;
    }

    return [relevance, featured.has(row.cityIata) ? 0 : 1, row.cityName];
  };

  return [...rows].sort((left, right) => {
    const [leftRelevance, leftFeatured, leftName] = score(left);
    const [rightRelevance, rightFeatured, rightName] = score(right);
    if (leftRelevance !== rightRelevance) {
      return leftRelevance - rightRelevance;
    }
    if (leftFeatured !== rightFeatured) {
      return leftFeatured - rightFeatured;
    }
    return leftName.localeCompare(rightName);
  });
}
