/**
 * TaskFlow Frontend Application
 * Built with Bun 1.3, React, and TypeScript
 *
 * Features demonstrated:
 * - Zero-config frontend development with Bun
 * - Modern React patterns with hooks and context
 * - Comprehensive API integration with error handling
 * - Real-time updates with Server-Sent Events
 * - State management with Zustand
 * - Responsive design with Tailwind CSS
 * - Authentication and authorization
 * - File upload and management
 * - Performance optimization
 */

import React, { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';

// App components
import App from './components/App';
import LoadingScreen from './components/LoadingScreen';
import ErrorFallback from './components/ErrorFallback';

// Services
import { apiClient } from './services/api';
import { setupSSE } from './services/realtime';
import { useAuthStore } from './store/authStore';

// Styles
import './styles/index.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Initialize application
async function initializeApp() {
  try {
    // Check for existing auth token
    const token = localStorage.getItem('taskflow_token');
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Verify token and get user data
      try {
        const response = await apiClient.get('/api/auth/me');
        if (response.data.success) {
          useAuthStore.getState().setUser(response.data.data);
          useAuthStore.getState().setToken(token);

          // Setup real-time connection
          setupSSE();
        }
      } catch (error) {
        // Token invalid, remove it
        localStorage.removeItem('taskflow_token');
        delete apiClient.defaults.headers.common['Authorization'];
      }
    }
  } catch (error) {
    console.error('App initialization error:', error);
  }
}

// Main App component
function Main() {
  return (
    <StrictMode>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Suspense fallback={<LoadingScreen />}>
              <App />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                  loading: {
                    duration: Infinity, // Keep loading toasts until manually dismissed
                  },
                }}
              />
            </Suspense>
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}

// Render the application
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}

const root = createRoot(container);

// Initialize app and render
initializeApp().then(() => {
  root.render(<Main />);
});

// Enable hot module replacement in development
if (import.meta.hot) {
  import.meta.hot.accept();
}

// Performance monitoring
if (typeof window !== 'undefined' && 'performance' in window) {
  // Report Web Vitals
  const reportWebVitals = (metric: any) => {
    console.log(`${metric.name}: ${metric.value}`);
    // You could send this to an analytics service
  };

  // Observe performance metrics
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          const loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
          reportWebVitals({ name: 'loadTime', value: loadTime });
        }
      });
    });
    observer.observe({ entryTypes: ['navigation'] });
  }
}

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}