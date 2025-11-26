import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme, Button, ActivityIndicator } from 'react-native-paper';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { useAnnouncementStore } from '../../stores/announcementStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Markdown from 'react-native-markdown-display';

export default function AnnouncementDetailScreen() {
    const { id } = useLocalSearchParams();
    const theme = useTheme();
    const router = useRouter();
    const { getAnnouncementById, currentAnnouncement, isLoading } = useAnnouncementStore();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id && typeof id === 'string') {
            loadAnnouncement(id);
        }
    }, [id]);

    const loadAnnouncement = async (announcementId: string) => {
        try {
            await getAnnouncementById(announcementId);
        } catch (err) {
            setError('No se pudo cargar el anuncio');
        }
    };

    if (isLoading || !currentAnnouncement) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary[600]} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text>{error}</Text>
                <Button onPress={() => router.back()}>Volver</Button>
            </View>
        );
    }

    const { type, title, content, company, publishedAt } = currentAnnouncement;

    // Render metadata based on type
    const renderMetadata = () => {
        if (type === 'MAINTENANCE' && 'metadata' in currentAnnouncement) {
            const meta = currentAnnouncement.metadata;
            return (
                <View style={[styles.metaContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Text style={styles.metaTitle}>Detalles del Mantenimiento</Text>
                    <View style={styles.metaRow}>
                        <MaterialCommunityIcons name="clock-start" size={16} color={theme.colors.onSurfaceVariant} />
                        <Text style={styles.metaText}>
                            Inicio: {meta.scheduledStart ? format(new Date(meta.scheduledStart), 'Pp', { locale: es }) : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.metaRow}>
                        <MaterialCommunityIcons name="clock-end" size={16} color={theme.colors.onSurfaceVariant} />
                        <Text style={styles.metaText}>
                            Fin: {meta.scheduledEnd ? format(new Date(meta.scheduledEnd), 'Pp', { locale: es }) : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.metaRow}>
                        <MaterialCommunityIcons name="server-network" size={16} color={theme.colors.onSurfaceVariant} />
                        <Text style={styles.metaText}>
                            Servicios: {meta.affectedServices.join(', ')}
                        </Text>
                    </View>
                </View>
            );
        }
        return null;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScreenHeader title="Detalle del Anuncio" showBack={true} />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.typeBadge}>
                        <MaterialCommunityIcons name="bullhorn" size={16} color={theme.colors.primary[600]} />
                        <Text style={[styles.typeText, { color: theme.colors.primary[600] }]}>{type}</Text>
                    </View>
                    <Text style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
                        {publishedAt ? format(new Date(publishedAt), 'PPP', { locale: es }) : ''}
                    </Text>
                </View>

                <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>

                <View style={styles.companyRow}>
                    <MaterialCommunityIcons name="domain" size={16} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.companyName, { color: theme.colors.onSurfaceVariant }]}>
                        {company.name}
                    </Text>
                </View>

                {renderMetadata()}

                <View style={styles.body}>
                    <Markdown style={markdownStyles}>
                        {content}
                    </Markdown>
                </View>

                <Button
                    mode="contained"
                    onPress={() => router.push('/(tabs)/tickets')} // Or create ticket flow
                    style={styles.actionButton}
                    buttonColor={theme.colors.primary[600]}
                >
                    Crear Ticket Relacionado
                </Button>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    typeText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    date: {
        fontSize: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    companyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 20,
    },
    companyName: {
        fontSize: 14,
        fontWeight: '500',
    },
    metaContainer: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        gap: 8,
    },
    metaTitle: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaText: {
        fontSize: 13,
    },
    body: {
        marginBottom: 30,
    },
    actionButton: {
        marginTop: 10,
    },
});

const markdownStyles = {
    body: {
        fontSize: 16,
        lineHeight: 24,
    },
};
