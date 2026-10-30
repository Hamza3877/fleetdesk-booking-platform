"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { makeStore } from "@/store";

/** Everything the app needs "around" it: theme, Redux, TanStack Query and toasts. */
export function Providers({ children }: { children: ReactNode }) {
  // useState with a function creates each object once per browser tab.
  const [store] = useState(makeStore);
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } }),
  );

  return (
    <ThemeProvider>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>{children}</ToastProvider>
        </QueryClientProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
