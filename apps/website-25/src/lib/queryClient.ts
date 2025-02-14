import { initQueryClient } from '@ts-rest/react-query';
import { ApiFetcherArgs, tsRestFetchApi } from '@ts-rest/core';
import { contract } from '@bluedot/backend-contract';
import { useAuthStore } from './authStore';

export const client = initQueryClient(contract, {
  baseUrl: 'http://localhost:8080',
  baseHeaders: {},
  credentials: 'omit',
  api: async (args: ApiFetcherArgs) => {
    return tsRestFetchApi({
      ...args,
      headers: {
        ...args.headers,
        authorization: `Bearer ${useAuthStore.getState().auth?.token}`,
      },
    });
  },
});
