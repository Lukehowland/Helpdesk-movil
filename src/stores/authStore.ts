import { create } from 'zustand';
import { User } from '../types/user';
import { RegisterData, AuthResponse } from '../types/auth';
import { client } from '../services/api/client';
import { tokenStorage } from '../services/storage/tokenStorage';
import { router } from 'expo-router';
import * as Device from 'expo-device';

interface AuthState {
    accessToken: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isUploadingAvatar: boolean;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: (everywhere?: boolean) => Promise<void>;
    refreshToken: () => Promise<boolean>;
    checkAuth: () => Promise<void>;
    invalidateToken: () => Promise<void>;
    updateAvatar: (uri: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    accessToken: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isUploadingAvatar: false,

    login: async (email, password) => {
        set({ isLoading: true });
        try {
            // Capture device name - OS info is handled by backend user agent parsing
            const deviceName = Device.deviceName || Device.modelName || 'Unknown Device';

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
            const userRaw = (rawUser as any).profile
                ? { ...rawUser, ...(rawUser as any).profile }
                : rawUser;

            const user = mapUser(userRaw);

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
            console.log('🔄 Manual refresh token attempt...');
            const response = await client.post('/api/auth/refresh');
            console.log('🔄 Refresh response:', JSON.stringify(response.data, null, 2));

            const { data } = response.data;
            const accessToken = data?.accessToken || response.data.accessToken;

            if (!accessToken) {
                console.error('❌ No access token in refresh response:', response.data);
                throw new Error('No access token in refresh response');
            }

            await tokenStorage.setAccessToken(accessToken);
            client.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            set({ accessToken });
            console.log('✅ Token refreshed successfully');
            return true;
        } catch (error: any) {
            console.error('❌ Refresh token error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
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

            const mappedUser = mapUser(userData);

            console.log('Normalized User Data:', JSON.stringify(mappedUser, null, 2));

            set({
                accessToken: token,
                user: mappedUser,
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
        // Expired access token from backend testing command
        // Refresh token in HttpOnly cookie is still valid
        // This will trigger 401 → refresh flow → retry ✅
        const expiredAccessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJoZWxwZGVzay1hcGkiLCJhdWQiOiJoZWxwZGVzay1mcm9udGVuZCIsImlhdCI6MTc2NDE0NDA3OCwiZXhwIjoxNzY0MTQ3Njc4LCJzdWIiOiJjMTUyZDJiMC02YTA1LTQ5MjctYTk5Mi0yZWY1MTcyMTVjNjkiLCJ1c2VyX2lkIjoiYzE1MmQyYjAtNmEwNS00OTI3LWE5OTItMmVmNTE3MjE1YzY5IiwiZW1haWwiOiJkbHFtQGdtYWlsLmNvbSIsInNlc3Npb25faWQiOiI0NGNhZDcyMS1jY2IzLTQ5MDAtYTNiMy01ZjRjYzg5YWMzYjAiLCJyb2xlcyI6W3siY29kZSI6IlVTRVIiLCJjb21wYW55X2lkIjpudWxsfV19.1gke4jE_lf_tbAFWg82mgMDNS4x8rmqVseHocreEkcw';

        console.log('Testing auto-refresh with expired access token - refresh token in cookie is still valid');
    },

    updateAvatar: async (uri: string) => {
        set({ isUploadingAvatar: true });
        try {
            const formData = new FormData();

            // Extract filename from URI
            const filename = uri.split('/').pop() || 'avatar.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('avatar', {
                uri,
                name: filename,
                type,
            } as any);

            const response = await client.post('/api/users/me/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const newAvatarUrl = response.data.data.avatarUrl;

            set((state) => ({
                user: state.user ? { ...state.user, avatarUrl: newAvatarUrl } : null
            }));

        } catch (error: any) {
            console.error('AVATAR UPLOAD ERROR:', error);
            throw error;
        } finally {
            set({ isUploadingAvatar: false });
        }
    },
}));

const mapUser = (data: any): User => ({
    id: data.id,
    userCode: data.user_code || data.userCode,
    email: data.email,
    status: data.status,
    emailVerified: data.email_verified || data.emailVerified,
    emailVerifiedAt: data.email_verified_at || data.emailVerifiedAt,
    lastLoginAt: data.last_login_at || data.lastLoginAt,
    createdAt: data.created_at || data.createdAt,
    firstName: data.first_name || data.firstName,
    lastName: data.last_name || data.lastName,
    displayName: data.display_name || data.displayName,
    phoneNumber: data.phone_number || data.phoneNumber,
    avatarUrl: data.avatar_url || data.avatarUrl,
    theme: data.theme,
    language: data.language,
    timezone: data.timezone,
    pushWebNotifications: data.push_web_notifications || data.pushWebNotifications,
    notificationsTickets: data.notifications_tickets || data.notificationsTickets,
    roleContext: data.role_context || data.roleContext || [],
    ticketsCount: data.tickets_count || data.ticketsCount || 0,
    resolvedTicketsCount: data.resolved_tickets_count || data.resolvedTicketsCount || 0,
});
