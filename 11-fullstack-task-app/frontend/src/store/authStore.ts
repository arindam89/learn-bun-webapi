/**
 * Authentication Store using Zustand
 * Manages user authentication state and operations
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiService } from '@/services/api';
import type { User, AuthRequest, RegisterRequest, ApiResponse, AuthResponse } from '@/types';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (credentials: AuthRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      // Login action
      login: async (credentials: AuthRequest) => {
        set({ isLoading: true });

        try {
          const response: ApiResponse<AuthResponse> = await ApiService.post('/api/auth/login', credentials);

          if (response.success && response.data) {
            const { user, token } = response.data;

            // Store in Zustand state
            set({
              user,
              token,
              isLoading: false,
              isAuthenticated: true,
            });

            // Store in localStorage for persistence
            localStorage.setItem('taskflow_token', token);

            // Set default authorization header
            ApiService.apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            console.log('✅ Login successful', { user: user.name, email: user.email });
          } else {
            throw new Error(response.error || 'Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          console.error('❌ Login error:', error);
          throw error;
        }
      },

      // Register action
      register: async (userData: RegisterRequest) => {
        set({ isLoading: true });

        try {
          const response: ApiResponse<AuthResponse> = await ApiService.post('/api/auth/register', userData);

          if (response.success && response.data) {
            const { user, token } = response.data;

            // Store in Zustand state
            set({
              user,
              token,
              isLoading: false,
              isAuthenticated: true,
            });

            // Store in localStorage
            localStorage.setItem('taskflow_token', token);

            // Set default authorization header
            ApiService.apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            console.log('✅ Registration successful', { user: user.name, email: user.email });
          } else {
            throw new Error(response.error || 'Registration failed');
          }
        } catch (error) {
          set({ isLoading: false });
          console.error('❌ Registration error:', error);
          throw error;
        }
      },

      // Logout action
      logout: () => {
        const { user } = get();

        // Clear state
        set({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });

        // Clear localStorage
        localStorage.removeItem('taskflow_token');

        // Clear authorization header
        delete ApiService.apiClient.defaults.headers.common['Authorization'];

        console.log('👋 User logged out', user?.name || 'Unknown user');
      },

      // Set user action
      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      // Set token action
      setToken: (token: string) => {
        set({ token });
        localStorage.setItem('taskflow_token', token);
        ApiService.apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },

      // Clear authentication
      clearAuth: () => {
        set({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });

        localStorage.removeItem('taskflow_token');
        delete ApiService.apiClient.defaults.headers.common['Authorization'];
      },

      // Update profile action
      updateProfile: async (userData: Partial<User>) => {
        const { user } = get();

        if (!user) {
          throw new Error('No user logged in');
        }

        set({ isLoading: true });

        try {
          const response: ApiResponse<User> = await ApiService.put('/api/auth/profile', userData);

          if (response.success && response.data) {
            set({
              user: response.data,
              isLoading: false,
            });

            console.log('✅ Profile updated successfully');
          } else {
            throw new Error(response.error || 'Profile update failed');
          }
        } catch (error) {
          set({ isLoading: false });
          console.error('❌ Profile update error:', error);
          throw error;
        }
      },

      // Check authentication status
      checkAuth: async () => {
        const { token, clearAuth } = get();

        if (!token) {
          clearAuth();
          return;
        }

        set({ isLoading: true });

        try {
          // Set authorization header
          ApiService.apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          const response: ApiResponse<User> = await ApiService.get('/api/auth/me');

          if (response.success && response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Token is invalid, clear auth
            clearAuth();
          }
        } catch (error) {
          console.error('❌ Auth check error:', error);
          clearAuth();
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'taskflow-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Export selector functions for optimized re-renders
export const useAuth = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  register: state.register,
  logout: state.logout,
  updateProfile: state.updateProfile,
  checkAuth: state.checkAuth,
}));