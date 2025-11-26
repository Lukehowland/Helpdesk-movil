export interface Ticket {
    id: string;
    ticketCode: string; // TKT-2025-00001
    title: string;
    description: string; // initial_description
    status: 'open' | 'pending' | 'resolved' | 'closed';
    lastResponseAuthorType: 'none' | 'user' | 'agent';

    company: {
        id: string;
        name: string;
        logoUrl: string | null;
    };

    category: {
        id: string;
        name: string;
    } | null;

    createdBy: {
        id: string;
        displayName: string;
    };

    ownerAgent: {
        id: string;
        displayName: string;
        avatarUrl: string | null;
    } | null;

    rating: {
        rating: number; // 1-5
        comment: string | null;
        createdAt: string;
    } | null;

    attachmentsCount: number;
    attachments: Attachment[];
    responsesCount: number;

    createdAt: string;
    updatedAt: string;
    firstResponseAt: string | null;
    resolvedAt: string | null;
    closedAt: string | null;
}

export interface TicketFilters {
    status?: 'open' | 'pending' | 'resolved' | 'closed';
    company_id?: string;
    search?: string;
    sort_by?: 'created_at' | 'updated_at' | 'status';
    sort_direction?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
}

export interface CreateTicketData {
    company_id: string;
    category_id?: string;
    title: string; // min 5, max 255 chars
    description: string; // required
    priority: 'low' | 'medium' | 'high';
}

export interface TicketCategory {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    ticketsCount: number; // tickets activos en esta categoría
}

export interface TicketResponse {
    id: string;
    ticketId: string;
    authorId: string;
    content: string;
    authorType: 'user' | 'agent';
    createdAt: string;

    author: {
        id: string;
        displayName: string;
        avatarUrl: string | null;
    };

    attachments: Attachment[];
}

export interface Attachment {
    id: string;
    ticketId: string;
    responseId: string | null;
    fileName: string;
    fileUrl: string;
    fileType: string; // MIME type
    fileSizeBytes: number;
    uploadedBy: {
        id: string;
        displayName: string;
    };
    createdAt: string;
}
