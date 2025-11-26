import { create } from 'zustand';
import { Article, ArticleCategory, ArticleFilters } from '../types/article';
import { client } from '../services/api/client';

interface ArticleState {
    articles: Article[];
    currentArticle: Article | null;
    categories: ArticleCategory[];
    popularArticles: Article[];
    isLoading: boolean;
    error: string | null;

    fetchCategories: () => Promise<void>;
    fetchArticles: (filters?: ArticleFilters) => Promise<void>;
    getArticleById: (id: string) => Promise<Article>;
    fetchPopularArticles: () => Promise<void>;
}

export const useArticleStore = create<ArticleState>((set) => ({
    articles: [],
    currentArticle: null,
    categories: [],
    popularArticles: [],
    isLoading: false,
    error: null,

    fetchCategories: async () => {
        // Hardcoded categories for now based on prompt, or fetch from API if available
        // The prompt implies these are global categories: 
        // ACCOUNT_PROFILE, SECURITY_PRIVACY, BILLING_PAYMENTS, TECHNICAL_SUPPORT
        // But also mentions GET /api/help-center/categories

        set({ isLoading: true, error: null });
        try {
            const response = await client.get('/api/help-center/categories');
            set({ categories: response.data.data, isLoading: false });
        } catch (error: any) {
            console.warn('Failed to fetch categories, using defaults if needed');
            // Fallback or error handling
            set({ isLoading: false, error: error.message });
        }
    },

    fetchArticles: async (filters = {}) => {
        set({ isLoading: true, error: null });
        try {
            const response = await client.get('/api/help-center/articles', { params: filters });
            set({ articles: response.data.data, isLoading: false });
        } catch (error: any) {
            set({ isLoading: false, error: error.message || 'Failed to fetch articles' });
            throw error;
        }
    },

    getArticleById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await client.get(`/api/help-center/articles/${id}`);
            set({ currentArticle: response.data.data, isLoading: false });
            return response.data.data;
        } catch (error: any) {
            set({ isLoading: false, error: error.message || 'Failed to fetch article' });
            throw error;
        }
    },

    fetchPopularArticles: async () => {
        // Assuming there's a way to get popular articles, maybe sort=views
        try {
            const response = await client.get('/api/help-center/articles', {
                params: { sort: 'views', per_page: 5 }
            });
            set({ popularArticles: response.data.data });
        } catch (error) {
            console.error('Failed to fetch popular articles', error);
        }
    },
}));
