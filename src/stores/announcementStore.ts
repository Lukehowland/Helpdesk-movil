import { create } from 'zustand';
import { Announcement, AnnouncementType } from '../types/announcement';
import { client } from '../services/api/client';

interface AnnouncementFilters {
    type?: AnnouncementType;
    search?: string;
    company_id?: string;
    sort?: string;
}

interface AnnouncementState {
    announcements: Announcement[];
    currentAnnouncement: Announcement | null;
    isLoading: boolean;
    error: string | null;

    fetchAnnouncements: (filters?: AnnouncementFilters) => Promise<void>;
    getAnnouncementById: (id: string) => Promise<Announcement>;
}

export const useAnnouncementStore = create<AnnouncementState>((set) => ({
    announcements: [],
    currentAnnouncement: null,
    isLoading: false,
    error: null,

    fetchAnnouncements: async (filters = {}) => {
        set({ isLoading: true, error: null });
        try {
            const response = await client.get('/api/announcements', { params: filters });
            const mappedAnnouncements = response.data.data.map(mapAnnouncementFromApi);
            set({ announcements: mappedAnnouncements, isLoading: false });
        } catch (error: any) {
            set({ isLoading: false, error: error.message || 'Failed to fetch announcements' });
            throw error;
        }
    },

    getAnnouncementById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await client.get(`/api/announcements/${id}`);
            const mappedAnnouncement = mapAnnouncementFromApi(response.data.data);
            set({ currentAnnouncement: mappedAnnouncement, isLoading: false });
            return mappedAnnouncement;
        } catch (error: any) {
            set({ isLoading: false, error: error.message || 'Failed to fetch announcement' });
            throw error;
        }
    },
}));

const mapAnnouncementFromApi = (data: any): Announcement => {
    const base = {
        id: data.id,
        type: data.type,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || data.content.substring(0, 100) + '...',
        company: {
            id: data.company_id,
            name: data.company_name,
            logoUrl: null, // API doesn't return logo yet
        },
        publishedAt: data.published_at,
        status: data.status,
    };

    // Map metadata keys from snake_case to camelCase
    const metadata = data.metadata ? mapKeysToCamelCase(data.metadata) : {};

    return {
        ...base,
        metadata,
    } as Announcement;
};

const mapKeysToCamelCase = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(mapKeysToCamelCase);

    return Object.keys(obj).reduce((acc, key) => {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        acc[camelKey] = mapKeysToCamelCase(obj[key]);
        return acc;
    }, {} as any);
};
