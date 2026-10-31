import axios from 'axios';

import { trackRequests } from '../services/loadingTracker';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Every request shows the shared loading indicator while it is running.
trackRequests(apiClient);
