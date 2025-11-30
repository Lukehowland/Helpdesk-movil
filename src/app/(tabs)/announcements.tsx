import React, { useEffect, useState } from 'react';
import { View, FlatList, Text } from 'react-native';
import { useAnnouncementStore } from '../../stores/announcementStore';
import { AnnouncementCard } from '../../components/announcements/AnnouncementCard';
import { AnnouncementType } from '../../types/announcement';
import { AnnouncementCardSkeleton } from '../../components/Skeleton';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterPill } from '@/components/ui/FilterPill';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useDebounceNavigation } from '@/hooks/useDebounceNavigation';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

const FILTERS: { label: string; value: AnnouncementType | 'ALL' }[] = [
    { label: 'Todos', value: 'ALL' },
    { label: 'Mantenimiento', value: 'MAINTENANCE' },
    { label: 'Incidentes', value: 'INCIDENT' },
    { label: 'Novedades', value: 'NEWS' },
    { label: 'Alertas', value: 'ALERT' },
];

export default function AnnouncementsScreen() {
    const { push } = useDebounceNavigation();
    const { announcements, fetchAnnouncements, isLoading } = useAnnouncementStore();
    const tabBarPadding = useTabBarPadding();

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
        push(`/announcements/${id}`);
    };

    return (
        <ScreenContainer>
            <View className="px-4 pt-4 pb-2">
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
                <View className="px-4 pb-20">
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
                    contentContainerStyle={{ paddingHorizontal: 16, ...tabBarPadding }}
                    ListEmptyComponent={
                        <View className="items-center justify-center mt-8">
                            <Text className="text-gray-500">
                                No se encontraron anuncios
                            </Text>
                        </View>
                    }
                />
            )}
        </ScreenContainer>
    );
}
