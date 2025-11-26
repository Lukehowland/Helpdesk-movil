import { create } from 'zustand';
import { User } from '../types/user';
import { RegisterData, AuthResponse } from '../types/auth';
import { client } from '../services/api/client';
import { tokenStorage } from '../services/storage/tokenStorage';
import { router } from 'expo-router';

interface AuthState {
    accessToken: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: (everywhere?: boolean) => Promise<void>;
    refreshToken: () => Promise<boolean>;
    checkAuth: () => Promise<void>;
    invalidateToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    accessToken: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (email, password) => {
        set({ isLoading: true });
        try {
            // Capture device name (mock for now, use expo-device in real app)
            const deviceName = "Mobile Device";

            const response = await client.post<AuthResponse>('/api/auth/login', {
                email,
                password,
                deviceName,
            });

            console.log('LOGIN RESPONSE:', JSON.stringify(response.data, null, 2));

            if (!response.data || !response.data.accessToken) {
                throw new Error('Invalid response structure');
            }

            const { accessToken, user: rawUser } = response.data;

            // Normalize user data
            const user = (rawUser as any).profile
                ? { ...rawUser, ...(rawUser as any).profile }
                : rawUser;

            await tokenStorage.setAccessToken(accessToken);
            set({ accessToken, user, isAuthenticated: true });

            router.replace('/(tabs)/home');
        } catch (error: any) {
            console.log('LOGIN ERROR:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                headers: error.response?.headers
            });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    register: async (data) => {
        set({ isLoading: true });
        try {
            const payload = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
                passwordConfirmation: data.confirmPassword,
                acceptsTerms: data.termsAccepted,
                acceptsPrivacyPolicy: data.privacyAccepted,
            };
            await client.post('/api/auth/register', payload);
            // Usually redirect to verification or login
            // Prompt says: "Post-registro: Mostrar mensaje de verificación de email pendiente"
        } catch (error: any) {
            console.log('REGISTER ERROR:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                headers: error.response?.headers
            });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async (everywhere = false) => {
        set({ isLoading: true });
        try {
            await client.post('/api/auth/logout', { everywhere });
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            await tokenStorage.clearAccessToken();
            set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false });
            router.replace('/(auth)/login');
        }
    },

    refreshToken: async () => {
        try {
            const response = await client.post('/api/auth/refresh');
            const accessToken = response.data.data?.accessToken || response.data.accessToken;
            if (!accessToken) {
                throw new Error('No access token in refresh response');
            }
            await tokenStorage.setAccessToken(accessToken);
            set({ accessToken });
            return true;
        } catch (error) {
            return false;
        }
    },

    checkAuth: async () => {
        set({ isLoading: true });
        try {
            const token = await tokenStorage.getAccessToken();
            if (!token) {
                set({ isAuthenticated: false, isLoading: false });
                return;
            }

            // If status is good, maybe fetch user details if not included
            const userResponse = await client.get('/api/users/me');
            console.log('CHECK_AUTH USER RESPONSE:', JSON.stringify(userResponse.data, null, 2));

            // Handle both flat and nested structure
            const rawData = userResponse.data.data || userResponse.data;

            // Normalize user data: flatten profile if it exists
            const userData = (rawData as any).profile
                ? { ...rawData, ...(rawData as any).profile }
                : rawData;

            console.log('Normalized User Data:', JSON.stringify(userData, null, 2));

            set({
                accessToken: token,
                user: userData,
                isAuthenticated: true,
                isLoading: false
            });

            // Navigate to home if on splash/login
            // This logic might be better placed in the Splash Screen component
        } catch (error) {
            await tokenStorage.clearAccessToken();
            set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false });
        }
    },

    invalidateToken: async () => {
        // Use a valid token that has been revoked on the backend
        // This token should be obtained from the backend and already invalidated
        // It will trigger a 401, causing the interceptor to attempt a refresh
        const revokedToken = 'REPLACE_WITH_BACKEND_REVOKED_TOKEN';

        console.log('Testing auto-refresh with revoked token - any API request will trigger 401 and refresh flow');

        await tokenStorage.setAccessToken(revokedToken);
        set({ accessToken: revokedToken });
    },
}));
