import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ScrollView } from 'react-native';
import { useTheme, Chip, Searchbar, ActivityIndicator, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAnnouncementStore } from '../../stores/announcementStore';
import { AnnouncementCard } from '../../components/announcements/AnnouncementCard';
import { AnnouncementType } from '../../types/announcement';

const FILTERS: { label: string; value: AnnouncementType | 'ALL' }[] = [
    { label: 'Todos', value: 'ALL' },
    { label: 'Mantenimiento', value: 'MAINTENANCE' },
    { label: 'Incidentes', value: 'INCIDENT' },
    { label: 'Novedades', value: 'NEWS' },
    { label: 'Alertas', value: 'ALERT' },
];

export default function AnnouncementsScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { announcements, fetchAnnouncements, isLoading } = useAnnouncementStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<AnnouncementType | 'ALL'>('ALL');

    useEffect(() => {
        loadAnnouncements();
    }, [selectedType, searchQuery]); // Debounce search in real app

    const loadAnnouncements = () => {
        fetchAnnouncements({
            type: selectedType === 'ALL' ? undefined : selectedType,
            search: searchQuery,
        });
    };

    const handlePress = (id: string) => {
        router.push(`/announcements/${id}`);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Searchbar
                    placeholder="Buscar anuncios..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    elevation={0}
                />

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContainer}
                >
                    {FILTERS.map((filter) => (
                        <Chip
                            key={filter.value}
                            selected={selectedType === filter.value}
                            onPress={() => setSelectedType(filter.value)}
                            style={styles.chip}
                            showSelectedOverlay
                        >
                            {filter.label}
                        </Chip>
                    ))}
                </ScrollView>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary[600]} />
                </View>
            ) : (
                <FlatList
                    data={announcements}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <AnnouncementCard
                            announcement={item}
                            onPress={() => handlePress(item.id)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={{ color: theme.colors.onSurfaceVariant }}>
                                No se encontraron anuncios
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
        gap: 12,
    },
    searchBar: {
        backgroundColor: '#fff', // Or theme.colors.surface
    },
    filtersContainer: {
        gap: 8,
        paddingRight: 16,
    },
    chip: {
        marginRight: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 16,
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
});
