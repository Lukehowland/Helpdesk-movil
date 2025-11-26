import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ScrollView } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAnnouncementStore } from '../../stores/announcementStore';
import { AnnouncementCard } from '../../components/announcements/AnnouncementCard';
import { AnnouncementType } from '../../types/announcement';
import { AnnouncementCardSkeleton } from '../../components/Skeleton';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterPill } from '@/components/ui/FilterPill';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['left', 'right', 'bottom']}>
            <View style={styles.header}>
                <View className="mb-4">
                    <Text className="text-2xl font-bold text-gray-900 mb-1">Anuncios</Text>
                    <Text className="text-gray-500">Mantente informado de las últimas novedades</Text>
                </View>

                <SearchInput
                    placeholder="Buscar anuncios..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    containerStyle={{ marginBottom: 16 }}
                />

                <View>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={FILTERS}
                        keyExtractor={(item) => item.value}
                        contentContainerStyle={{ alignItems: 'center', paddingRight: 16 }}
                        renderItem={({ item }) => (
                            <FilterPill
                                label={item.label}
                                isSelected={selectedType === item.value}
                                onPress={() => setSelectedType(item.value)}
                            />
                        )}
                    />
                </View>
            </View>

            {isLoading ? (
                <View style={styles.listContent}>
                    {Array.from({ length: 5 }).map((_, index) => (
                        <AnnouncementCardSkeleton key={index} />
                    ))}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 80,
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
});
