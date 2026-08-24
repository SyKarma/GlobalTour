export type FrankfurterLatestResponse = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

export type FrankfurterHistoryResponse = {
  amount: number;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
};

export type FrankfurterCurrenciesResponse = Record<string, string>;

export type FrankfurterV2Rate = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

export type FrankfurterV2Currency = {
  iso_code: string;
  name: string;
  symbol?: string;
};
