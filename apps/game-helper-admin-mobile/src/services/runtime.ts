import type { MobileBffClient } from '@mobile-frame/mobile-bff';
import type { RealtimeClient, WebSocketLike } from '@mobile-frame/realtime';

import {
  configureAdminMobileBffClient,
  resetAdminMobileBffClient,
  type AdminMobileBffClientOptions
} from './mobile-bff';
import { configureAdminRealtimeClient, resetAdminRealtimeClient, type AdminRealtimeClientOptions } from './realtime';

export type AdminMobileRuntimeOptions = {
  bff?: AdminMobileBffClientOptions;
  realtime?: Omit<AdminRealtimeClientOptions, 'pollingClient'> & {
    pollingClient?: AdminRealtimeClientOptions['pollingClient'] | 'mobile-bff';
  };
};

export type AdminMobileRuntimeServices = {
  bff: MobileBffClient;
  realtime: RealtimeClient;
};

export function configureAdminMobileRuntime(options: AdminMobileRuntimeOptions = {}): AdminMobileRuntimeServices {
  const bff = options.bff ? configureAdminMobileBffClient(options.bff) : resetAdminMobileBffClient();
  const realtime = options.realtime
    ? configureAdminRealtimeClient({
        ...options.realtime,
        pollingClient: options.realtime.pollingClient === 'mobile-bff' || options.realtime.pollingClient === undefined ? bff : options.realtime.pollingClient
      })
    : configureAdminRealtimeClient({ mode: 'fixture' });

  return { bff, realtime };
}

export function configureAdminMobileHttpRuntime({
  baseUrl,
  createSocket,
  fetch,
  getAccessToken,
  headers,
  pollingIntervalMs,
  reconnect,
  websocketUrl
}: {
  baseUrl: string;
  createSocket?: (url: string) => WebSocketLike;
  fetch: NonNullable<AdminMobileBffClientOptions['fetch']>;
  getAccessToken?: AdminMobileBffClientOptions['getAccessToken'];
  headers?: AdminMobileBffClientOptions['headers'];
  pollingIntervalMs?: number;
  reconnect?: AdminRealtimeClientOptions['reconnect'];
  websocketUrl?: string;
}): AdminMobileRuntimeServices {
  return configureAdminMobileRuntime({
    bff: {
      baseUrl,
      fetch,
      getAccessToken,
      headers,
      mode: 'http'
    },
    realtime:
      websocketUrl && createSocket
        ? {
            createSocket,
            mode: 'websocket',
            pollingClient: 'mobile-bff',
            pollingIntervalMs,
            reconnect,
            websocketUrl
          }
        : { mode: 'fixture' }
  });
}

export function resetAdminMobileRuntime(): AdminMobileRuntimeServices {
  const bff = resetAdminMobileBffClient();
  const realtime = resetAdminRealtimeClient();

  return { bff, realtime };
}
