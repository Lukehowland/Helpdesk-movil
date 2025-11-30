import { create } from 'zustand';
import { CompanyExploreItem, CompanyDetail, CompanyExploreFilters, Industry } from '../types/company';
import { client } from '../services/api/client';

interface CompanyState {
    // Lista
    companies: CompanyExploreItem[];
    companiesLoading: boolean;
    companiesError: string | null;
    filters: {
        search: string;
        industryId: string | null;
        followedByMe: boolean;
    };
    pagination: {
        currentPage: number;
        lastPage: number;
        total: number;
    };

    // Detalle
    selectedCompany: CompanyDetail | null;
    selectedCompanyLoading: boolean;
    selectedCompanyError: string | null;

    // Data auxiliar
    industries: Industry[];

    // Acciones
    fetchCompanies: (page?: number) => Promise<void>;
    fetchCompanyDetail: (id: string) => Promise<void>;
    fetchIndustries: () => Promise<void>;
    followCompany: (id: string) => Promise<void>;
    unfollowCompany: (id: string) => Promise<void>;
    setFilter: (key: keyof CompanyState['filters'], value: any) => void;
    setMultipleFilters: (filters: Partial<CompanyState['filters']>) => void;
    clearFilters: () => void;

    // Optimistic updates
    updateCompanyFollowStatus: (id: string, isFollowing: boolean) => void;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
    companies: [],
    companiesLoading: false,
    companiesError: null,
    filters: {
        search: '',
        industryId: null,
        followedByMe: false,
    },
    pagination: {
        currentPage: 1,
        lastPage: 1,
        total: 0,
    },

    selectedCompany: null,
    selectedCompanyLoading: false,
    selectedCompanyError: null,

    industries: [],

    fetchCompanies: async (page = 1) => {
        set({ companiesLoading: true, companiesError: null });
        const { filters } = get();

        try {
            const params: any = {
                page,
                per_page: 20, // Default per page
            };

            if (filters.search) params.search = filters.search;
            if (filters.industryId) params.industry_id = filters.industryId;
            if (filters.followedByMe) params.followed_by_me = true;

            const response = await client.get('/api/companies/explore', { params });

            set({
                companies: page === 1 ? response.data.data : [...get().companies, ...response.data.data],
                companiesLoading: false,
                pagination: {
                    currentPage: response.data.meta.current_page,
                    lastPage: response.data.meta.last_page,
                    total: response.data.meta.total,
                },
            });
        } catch (error) {
            set({ companiesLoading: false, companiesError: 'Error al cargar empresas' });
            console.error(error);
        }
    },

    fetchCompanyDetail: async (id: string) => {
        const state = get();

        // 1. Prevent duplicate requests if already loading the same company
        if (state.selectedCompanyLoading && state.selectedCompany?.id === id) {
            console.log(`🚫 fetchCompanyDetail(${id}): Already loading this company, skipping duplicate request`);
            return;
        }

        // 2. Use cached data if we already have this company loaded
        if (state.selectedCompany?.id === id && !state.selectedCompanyError) {
            console.log(`✅ fetchCompanyDetail(${id}): Using cached data`);
            return;
        }

        console.log(`🔄 fetchCompanyDetail(${id}): Fetching from API...`);
        set({ selectedCompanyLoading: true, selectedCompanyError: null });

        try {
            const response = await client.get(`/api/companies/${id}`);
            set({ selectedCompany: response.data.data, selectedCompanyLoading: false });
            console.log(`✅ fetchCompanyDetail(${id}): Success`);
        } catch (error) {
            set({ selectedCompanyLoading: false, selectedCompanyError: 'Error al cargar detalle de empresa' });
            console.error(`❌ fetchCompanyDetail(${id}): Error`, error);
        }
    },

    fetchIndustries: async () => {
        try {
            const response = await client.get('/api/company-industries');
            set({ industries: response.data.data });
        } catch (error) {
            console.error(error);
        }
    },

    followCompany: async (id: string) => {
        // Optimistic update
        get().updateCompanyFollowStatus(id, true);

        try {
            await client.post(`/api/companies/${id}/follow`);
        } catch (error: any) {
            // Revert if error (unless it's 409 - already following)
            if (error.response?.status !== 409) {
                get().updateCompanyFollowStatus(id, false);
                throw error;
            }
        }
    },

    unfollowCompany: async (id: string) => {
        // Optimistic update
        get().updateCompanyFollowStatus(id, false);

        try {
            await client.delete(`/api/companies/${id}/unfollow`);
        } catch (error: any) {
            // Revert if error (unless it's 409 - not following)
            if (error.response?.status !== 409) {
                get().updateCompanyFollowStatus(id, true);
                throw error;
            }
        }
    },

    setFilter: (key, value) => {
        set((state) => ({
            filters: { ...state.filters, [key]: value },
            // Reset pagination when filter changes
            pagination: { ...state.pagination, currentPage: 1 }
        }));
    },

    setMultipleFilters: (newFilters) => {
        set((state) => ({
            filters: { ...state.filters, ...newFilters },
            // Reset pagination when filter changes
            pagination: { ...state.pagination, currentPage: 1 }
        }));
    },

    clearFilters: () => {
        set({
            filters: {
                search: '',
                industryId: null,
                followedByMe: false,
            },
            pagination: {
                currentPage: 1,
                lastPage: 1,
                total: 0,
            }
        });
    },

    updateCompanyFollowStatus: (id: string, isFollowing: boolean) => {
        set((state) => {
            // Update in list
            const updatedCompanies = state.companies.map((c) => {
                if (c.id === id) {
                    return {
                        ...c,
                        isFollowedByMe: isFollowing,
                        followersCount: isFollowing ? c.followersCount + 1 : Math.max(0, c.followersCount - 1)
                    };
                }
                return c;
            });

            // Update in detail if selected
            let updatedSelectedCompany = state.selectedCompany;
            if (state.selectedCompany && state.selectedCompany.id === id) {
                updatedSelectedCompany = {
                    ...state.selectedCompany,
                    isFollowedByMe: isFollowing,
                    followersCount: isFollowing ? state.selectedCompany.followersCount + 1 : Math.max(0, state.selectedCompany.followersCount - 1)
                };
            }

            return {
                companies: updatedCompanies,
                selectedCompany: updatedSelectedCompany
            };
        });
    }
}));
