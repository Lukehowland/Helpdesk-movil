export type AnnouncementType = 'MAINTENANCE' | 'INCIDENT' | 'NEWS' | 'ALERT';
export type AnnouncementUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CompanyShort {
    id: string;
    name: string;
    logoUrl: string | null;
}

export interface BaseAnnouncement {
    id: string;
    type: AnnouncementType;
    title: string;
    excerpt: string;
    content: string;
    company: CompanyShort;
    publishedAt: string;
    status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
}

export interface MaintenanceAnnouncement extends BaseAnnouncement {
    type: 'MAINTENANCE';
    metadata: {
        scheduledStart: string;
        scheduledEnd: string;
        actualStart?: string;
        actualEnd?: string;
        affectedServices: string[];
        isEmergency: boolean;
    };
}

export interface IncidentAnnouncement extends BaseAnnouncement {
    type: 'INCIDENT';
    urgency: AnnouncementUrgency;
    metadata: {
        affectedServices: string[];
        resolutionContent?: string;
    };
}

export interface NewsAnnouncement extends BaseAnnouncement {
    type: 'NEWS';
    metadata: {
        newsType: 'feature_release' | 'policy_update' | 'general_update';
        targetAudience: string[];
        callToAction?: {
            text: string;
            url: string;
        };
    };
}

export interface AlertAnnouncement extends BaseAnnouncement {
    type: 'ALERT';
    urgency: AnnouncementUrgency;
    metadata: {
        alertType: 'security' | 'system' | 'service' | 'compliance';
        actionRequired: boolean;
        actionDescription?: string;
        startedAt?: string;
        endedAt?: string;
    };
}

export type Announcement =
    | MaintenanceAnnouncement
    | IncidentAnnouncement
    | NewsAnnouncement
    | AlertAnnouncement;
