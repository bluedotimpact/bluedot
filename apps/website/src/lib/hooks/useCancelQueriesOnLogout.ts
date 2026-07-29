import { useAuthStore } from '@bluedot/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * `httpBatchLink` resolves its `headers` callback at request time, so a query scheduled while
 * authenticated would otherwise be dispatched with an empty `authorization` header, and every
 * protected procedure in the batch rejects with UNAUTHORIZED.
 */
export const useCancelQueriesOnLogout = () => {
  const queryClient = useQueryClient();

  useEffect(() => useAuthStore.subscribe((state, prevState) => {
    if (prevState.auth && !state.auth) {
      void queryClient.cancelQueries();
    }
  }), [queryClient]);
};
