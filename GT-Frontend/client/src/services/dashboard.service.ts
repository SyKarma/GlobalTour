import { apiClient } from '../api/client';

import type {
  DashboardParams,
  DashboardResponse,
} from '../types/dashboard.types';

export const getDashboardAnalytics = async (
  params: DashboardParams = {},
): Promise<DashboardResponse> => {
  const response =
    await apiClient.get<DashboardResponse>(
      '/api/dashboard',
      {
        params,
      },
    );

  return response.data;
};