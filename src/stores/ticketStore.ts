import { create } from 'zustand';
import { Ticket, TicketFilters, CreateTicketData, TicketResponse, TicketCategory } from '../types/ticket';
import { client } from '../services/api/client';

interface TicketState {
    tickets: Ticket[];
    currentTicket: Ticket | null;
    currentTicketResponses: TicketResponse[];
    categories: TicketCategory[];
    isLoading: boolean;
    isCreating: boolean;
    creationStatus: string;

    fetchTickets: (filters?: TicketFilters) => Promise<void>;
    fetchTicket: (ticketCode: string) => Promise<Ticket>;
    createTicket: (data: CreateTicketData, attachments?: any[]) => Promise<Ticket>;
    fetchTicketResponses: (ticketCode: string) => Promise<void>;
    createResponse: (ticketCode: string, content: string, attachments?: any[]) => Promise<void>;
    fetchCategories: (companyId: string) => Promise<void>;
    rateTicket: (ticketCode: string, rating: number, comment?: string) => Promise<void>;
    reopenTicket: (ticketCode: string) => Promise<void>;
}

export const useTicketStore = create<TicketState>((set, get) => ({
    tickets: [],
    currentTicket: null,
    currentTicketResponses: [],
    categories: [],
    isLoading: false,
    isCreating: false,
    creationStatus: '',

    fetchTickets: async (filters = {}) => {
        set({ isLoading: true });
        try {
            const response = await client.get('/api/tickets', {
                params: { ...filters, include: 'company,category' }
            });
            let tickets = response.data.data.map(mapTicket);

            // Patch: Fetch missing company info if needed
            const missingCompanyIds = [...new Set(tickets.filter((t: Ticket) => t.company.id && !t.company.name).map((t: Ticket) => t.company.id as string))] as string[];

            if (missingCompanyIds.length > 0) {
                try {
                    const companyPromises = missingCompanyIds.map((id: string) => client.get(`/api/companies/${id}`).catch(() => null));
                    const companiesResponses = await Promise.all(companyPromises);
                    const companiesMap = new Map();

                    companiesResponses.forEach((res: any) => {
                        if (res && res.data && res.data.data) {
                            companiesMap.set(res.data.data.id, res.data.data);
                        }
                    });

                    tickets = tickets.map((t: Ticket) => {
                        if (t.company.id && !t.company.name && companiesMap.has(t.company.id)) {
                            const comp = companiesMap.get(t.company.id);
                            return {
                                ...t,
                                company: {
                                    id: comp.id,
                                    name: comp.name,
                                    logoUrl: comp.logo_url || comp.logoUrl || null,
                                }
                            };
                        }
                        return t;
                    });
                } catch (err) {
                    console.error('Error patching companies:', err);
                }
            }

            set({ tickets, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    fetchTicket: async (ticketCode) => {
        set({ isLoading: true });
        try {
            const response = await client.get(`/api/tickets/${ticketCode}`, {
                params: { include: 'company,category,owner,creator,attachments' }
            });
            let ticket = mapTicket(response.data.data);

            // Patch for single ticket if needed
            if (ticket.company.id && !ticket.company.name) {
                try {
                    const compRes = await client.get(`/api/companies/${ticket.company.id}`);
                    if (compRes.data.data) {
                        const comp = compRes.data.data;
                        ticket = {
                            ...ticket,
                            company: {
                                id: comp.id,
                                name: comp.name,
                                logoUrl: comp.logo_url || comp.logoUrl || null,
                            }
                        };
                    }
                } catch (e) {
                    console.error('Error patching company for ticket:', e);
                }
            }

            set({ currentTicket: ticket, isLoading: false });
            return ticket;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    createTicket: async (data, attachments = []) => {
        set({ isCreating: true, creationStatus: 'Creando ticket...' });
        try {
            // 1. Create ticket
            const response = await client.post('/api/tickets', data);
            const newTicket = mapTicket(response.data.data);

            // 2. Upload attachments if any
            if (attachments.length > 0) {
                set({ creationStatus: `Subiendo ${attachments.length} archivos...` });
                for (let i = 0; i < attachments.length; i++) {
                    const file = attachments[i];
                    set({ creationStatus: `Subiendo archivo ${i + 1} de ${attachments.length}...` });
                    const formData = new FormData();
                    // @ts-ignore
                    formData.append('file', {
                        uri: file.uri,
                        name: file.fileName || file.uri.split('/').pop() || 'file',
                        type: file.mimeType || 'image/jpeg',
                    });

                    await client.post(`/api/tickets/${newTicket.ticketCode}/attachments`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                }
            }

            set({ isCreating: false, creationStatus: '' });
            return newTicket;
        } catch (error) {
            set({ isCreating: false, creationStatus: '' });
            throw error;
        }
    },

    fetchTicketResponses: async (ticketCode) => {
        const response = await client.get(`/api/tickets/${ticketCode}/responses`);
        const responses = response.data.data.map(mapTicketResponse);
        set({ currentTicketResponses: responses });
    },

    createResponse: async (ticketCode, content, attachments = []) => {
        // 1. Create response
        const response = await client.post(`/api/tickets/${ticketCode}/responses`, { content });
        const newResponse = mapTicketResponse(response.data.data); // Map the new response

        // 2. Upload attachments if any
        if (attachments.length > 0) {
            for (const file of attachments) {
                const formData = new FormData();
                // @ts-ignore
                formData.append('file', {
                    uri: file.uri,
                    name: file.fileName || file.uri.split('/').pop() || 'file',
                    type: file.mimeType || 'image/jpeg',
                });

                await client.post(`/api/tickets/${ticketCode}/responses/${newResponse.id}/attachments`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }
        }

        // Refresh responses
        await get().fetchTicketResponses(ticketCode);
    },

    fetchCategories: async (companyId) => {
        const response = await client.get('/api/tickets/categories', { params: { company_id: companyId } });
        set({ categories: response.data.data });
    },

    rateTicket: async (ticketCode, rating, comment) => {
        await client.post(`/api/tickets/${ticketCode}/rate`, { rating, comment });
        // Refresh ticket
        await get().fetchTicket(ticketCode);
    },

    reopenTicket: async (ticketCode) => {
        await client.post(`/api/tickets/${ticketCode}/reopen`);
        // Refresh ticket
        await get().fetchTicket(ticketCode);
    },
}));

// Helper to map API response (snake_case) to Ticket interface (camelCase)
const mapAttachment = (data: any): any => ({
    id: data.id,
    ticketId: data.ticket_id,
    responseId: data.response_id,
    fileName: data.file_name || data.name,
    fileUrl: data.file_url || data.url,
    fileType: data.file_type || data.mime_type,
    fileSizeBytes: data.file_size_bytes || data.size,
    uploadedBy: {
        id: data.uploaded_by?.id,
        displayName: data.uploaded_by?.name,
    },
    createdAt: data.created_at,
});

const mapTicket = (data: any): Ticket => ({
    id: data.id,
    ticketCode: data.ticket_code,
    title: data.title,
    description: data.description,
    status: data.status,
    lastResponseAuthorType: data.last_response_author_type,
    company: {
        id: data.company?.id || data.company_id,
        name: data.company?.name,
        logoUrl: data.company?.logo_url || data.company?.logoUrl || null, // Handle both cases just in case
    },
    category: data.category ? {
        id: data.category.id,
        name: data.category.name,
    } : null,
    createdBy: {
        id: data.created_by_user?.id,
        displayName: data.created_by_user?.name,
    },
    ownerAgent: data.owner_agent ? {
        id: data.owner_agent.id,
        displayName: data.owner_agent.name,
        avatarUrl: data.owner_agent.avatar_url || null,
    } : null,
    rating: data.rating ? {
        rating: data.rating.rating,
        comment: data.rating.comment,
        createdAt: data.rating.created_at,
    } : null,
    attachmentsCount: data.attachments_count || 0,
    attachments: (data.attachments || []).map(mapAttachment),
    responsesCount: data.responses_count || 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    firstResponseAt: data.timeline?.first_response_at || null,
    resolvedAt: data.resolved_at,
    closedAt: data.closed_at,
});

const mapTicketResponse = (data: any): TicketResponse => ({
    id: data.id,
    ticketId: data.ticket_id,
    authorId: data.author_id,
    content: data.content,
    authorType: data.author_type,
    createdAt: data.created_at,
    author: {
        id: data.author?.id,
        displayName: data.author?.name,
        avatarUrl: data.author?.avatar_url || null,
    },
    attachments: (data.attachments || []).map(mapAttachment),
});
