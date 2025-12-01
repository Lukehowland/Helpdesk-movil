export type ArticleCategoryCode =
    | 'ACCOUNT_PROFILE'
    | 'SECURITY_PRIVACY'
    | 'BILLING_PAYMENTS'
    | 'TECHNICAL_SUPPORT';

export interface ArticleCategory {
    code: ArticleCategoryCode;
    name: string;
    icon: string; // MaterialCommunityIcons name
    articleCount: number;
}

export interface Article {
    id: string;
    title: string;
    excerpt: string;
    content: string; // Markdown
    category: {
        code: ArticleCategoryCode;
        name: string;
    };
    company: {
        id: string;
        name: string;
        logoUrl?: string | null;
    };
    viewsCount: number;
    publishedAt: string;
    updatedAt: string;
    status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
}

export interface ArticleFilters {
    search?: string;
    category?: ArticleCategoryCode;
    companyId?: string;
    sort?: 'views' | 'date' | 'helpful';
}
