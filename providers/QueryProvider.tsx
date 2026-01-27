import React from 'react';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { AppState, AppStateStatus, Platform } from 'react-native';

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 1, // 1 minute
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
