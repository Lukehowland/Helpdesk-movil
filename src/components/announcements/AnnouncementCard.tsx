import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { Announcement, AnnouncementType, AnnouncementUrgency } from '../../types/announcement';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AnnouncementCardProps {
    announcement: Announcement;
    onPress: () => void;
}

const getTypeConfig = (type: AnnouncementType, colors: any) => {
    switch (type) {
        case 'MAINTENANCE':
            return {
                icon: 'wrench',
                bg: colors.brandPrimary[50], // Using primary light for now, or custom amber
                border: colors.announcement.maintenance,
                color: colors.announcement.maintenance,
                label: 'Mantenimiento'
            };
        case 'INCIDENT':
            return {
                icon: 'alert',
                bg: '#FEE2E2',
                border: colors.announcement.incident,
                color: colors.announcement.incident,
                label: 'Incidente'
            };
        case 'NEWS':
            return {
                icon: 'newspaper',
                bg: '#DBEAFE',
                border: colors.announcement.news,
                color: colors.announcement.news,
                label: 'Novedad'
            };
        case 'ALERT':
            return {
                icon: 'bell-ring',
                bg: '#F3E8FF',
                border: colors.announcement.alert,
                color: colors.announcement.alert,
                label: 'Alerta'
            };
        default:
            return {
                icon: 'information',
                bg: '#F3F4F6',
                border: '#9CA3AF',
                color: '#4B5563',
                label: 'Información'
            };
    }
};

const getUrgencyColor = (urgency: AnnouncementUrgency | undefined, colors: any) => {
    if (!urgency) return null;
    switch (urgency) {
        case 'CRITICAL': return colors.urgency.critical;
        case 'HIGH': return colors.urgency.high;
        case 'MEDIUM': return colors.urgency.medium;
        case 'LOW': return colors.urgency.low;
        default: return colors.textSecondary;
    }
};

export const AnnouncementCard = ({ announcement, onPress }: AnnouncementCardProps) => {
    const theme = useTheme();
    const config = getTypeConfig(announcement.type, theme.colors);

    // Extract urgency if available
    const urgency = 'urgency' in announcement ? announcement.urgency : undefined;
    const urgencyColor = getUrgencyColor(urgency, theme.colors);

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: theme.colors.surface }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Header Strip */}
            <View style={[styles.headerStrip, { backgroundColor: config.bg, borderLeftColor: config.border }]}>
                <View style={styles.headerContent}>
                    <MaterialCommunityIcons name={config.icon as any} size={20} color={config.color} />
                    <Text style={[styles.typeLabel, { color: config.color }]}>{config.label}</Text>

                    {urgency && (
                        <View style={[styles.badge, { backgroundColor: urgencyColor }]}>
                            <Text style={styles.badgeText}>{urgency}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={2}>
                    {announcement.title}
                </Text>

                <Text style={[styles.excerpt, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
                    {announcement.excerpt}
                </Text>

                <View style={styles.footer}>
                    <View style={styles.companyInfo}>
                        <MaterialCommunityIcons name="domain" size={14} color={theme.colors.onSurfaceVariant} />
                        <Text style={[styles.companyName, { color: theme.colors.onSurfaceVariant }]}>
                            {announcement.company?.name || 'Sistema'}
                        </Text>
                    </View>
                    <Text style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
                        {announcement.publishedAt
                            ? formatDistanceToNow(new Date(announcement.publishedAt), { addSuffix: true, locale: es })
                            : ''}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        overflow: 'hidden',
    },
    headerStrip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderLeftWidth: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    typeLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 'auto',
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    content: {
        padding: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    excerpt: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 8,
    },
    companyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    companyName: {
        fontSize: 12,
        fontWeight: '500',
    },
    date: {
        fontSize: 12,
    },
});
