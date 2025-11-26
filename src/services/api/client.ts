import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../storage/tokenStorage';
import { router } from 'expo-router';
import { logger } from '../../utils/logger';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // For HttpOnly cookies (refresh token)
});

// Request Interceptor
client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await tokenStorage.getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            headers: config.headers,
            data: config.data,
            params: config.params
        }, 'API');

        return config;
    },
    (error) => {
        logger.error(`API Request Error`, error, 'API');
        return Promise.reject(error);
    }
);

// Response Interceptor
interface RetryQueueItem {
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
    config: InternalAxiosRequestConfig;
}

let isRefreshing = false;
let failedQueue: RetryQueueItem[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            if (token) {
                prom.config.headers.Authorization = `Bearer ${token}`;
            }
            client(prom.config)
                .then(prom.resolve)
                .catch(prom.reject);
        }
    });
    failedQueue = [];
};

client.interceptors.response.use(
    (response) => {
        logger.debug(`API Response: ${response.status} ${response.config.url}`, {
            data: response.data
        }, 'API');
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        logger.error(`API Error: ${error.response?.status || 'Network'} ${originalRequest?.url}`, {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        }, 'API');

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject, config: originalRequest });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {}, {
                    withCredentials: true,
                });

                const { data } = response.data;
                const newAccessToken = data?.accessToken;

                if (newAccessToken) {
                    await tokenStorage.setAccessToken(newAccessToken);
                    client.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                    processQueue(null, newAccessToken);
                    return client(originalRequest);
                } else {
                    throw new Error("No access token in refresh response");
                }

            } catch (refreshError) {
                processQueue(refreshError, null);
                await tokenStorage.clearAccessToken();
                router.replace('/(auth)/login');
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
