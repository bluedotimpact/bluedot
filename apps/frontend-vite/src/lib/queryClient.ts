import { initQueryClient } from '@ts-rest/react-query';
import { tsRestFetchApi } from '@ts-rest/core';
import { contract } from '@bluedot/backend-contract';
import { useAuthStore } from './authStore';

export const client = initQueryClient(contract, {
  baseUrl: 'http://localhost:8001',
  baseHeaders: {},
  credentials: 'omit',
  api: (args) => {
    return tsRestFetchApi({
      ...args,
      headers: {
        ...args.headers,
        authorization: `Bearer ${useAuthStore.getState().auth?.token}`,
      },
    });
  },
});
