import type { AxiosInstance } from 'axios';

/**
 * Counts the requests that are still waiting for an answer so the app can
 * show one shared "loading" indicator (see GlobalLoadingIndicator).
 */

type Listener = (pending: number, message: string | null) => void;

let pending = 0;
let message: string | null = null;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener(pending, message));
}

export function startLoading(customMessage?: string) {
  pending += 1;
  if (customMessage) {
    message = customMessage;
  }
  notify();

  let finished = false;
  return () => {
    if (finished) {
      return;
    }
    finished = true;
    pending = Math.max(0, pending - 1);
    if (pending === 0) {
      message = null;
    }
    notify();
  };
}

export function subscribeLoading(listener: Listener) {
  listeners.add(listener);
  listener(pending, message);
  return () => {
    listeners.delete(listener);
  };
}

const STOP = Symbol('gt-loading-stop');

type TrackedConfig = { [STOP]?: () => void };

export function trackRequests(client: AxiosInstance) {
  client.interceptors.request.use((config) => {
    (config as TrackedConfig)[STOP] = startLoading();
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      (response.config as TrackedConfig)[STOP]?.();
      return response;
    },
    (error: { config?: TrackedConfig }) => {
      error?.config?.[STOP]?.();
      return Promise.reject(error);
    },
  );
}
