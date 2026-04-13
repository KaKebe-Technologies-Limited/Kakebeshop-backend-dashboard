import { Toaster } from '@/components/ui/toaster'
import { AppRouter } from '@/router'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { RealtimeProvider } from '@/components/RealtimeProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 30000, // Auto-refetch every 30 seconds for real-time updates
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider>
          <AppRouter />
        </RealtimeProvider>
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
