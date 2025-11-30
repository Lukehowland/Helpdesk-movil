import { View, FlatList, Text, RefreshControl, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useCompanyStore } from '@/stores/companyStore';
import { useEffect, useState, useCallback, useRef } from 'react';
import { CompanyCard } from '@/components/companies/CompanyCard';
import { debounce } from 'lodash';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CompanyCardSkeleton } from '@/components/Skeleton';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterButton } from '@/components/ui/FilterButton';
import { FilterPill } from '@/components/ui/FilterPill';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

export default function ExploreCompaniesScreen() {
    const { companies, industries, fetchCompanies, fetchIndustries, companiesLoading, setFilter, setMultipleFilters, filters, clearFilters } = useCompanyStore();
    const [refreshing, setRefreshing] = useState(false);
    const [showIndustryModal, setShowIndustryModal] = useState(false);
    const [localSearch, setLocalSearch] = useState(filters.search || '');
    const tabBarPadding = useTabBarPadding();

    // Initial load
    useEffect(() => {
        loadData();
    }, []);

    // Sync localSearch with store search (for filter changes from other screens)
    useEffect(() => {
        setLocalSearch(filters.search || '');
    }, [filters.search]);

    // Fetch when filters change
    useEffect(() => {
        fetchCompanies(1);
    }, [filters.industryId, filters.followedByMe, filters.search]);

    const loadData = async () => {
        try {
            await Promise.all([
                fetchCompanies(1),
                fetchIndustries()
            ]);
        } catch (error) {
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    };

    // Stable debounced search using ref
    const debouncedSearchRef = useRef<any>(null);

    if (!debouncedSearchRef.current) {
        debouncedSearchRef.current = debounce((query: string) => {
            setFilter('search', query);
        }, 500);
    }

    const onChangeSearch = useCallback((query: string) => {
        // Update local state immediately for instant feedback
        setLocalSearch(query);
        // Debounce the store update
        debouncedSearchRef.current(query);
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };


    return (
        <ScreenContainer>
            {/* Header - SEPARATED from FlatList to prevent remounting */}
            <View className="px-4 pt-4 pb-2">
                {/* Title & Subtitle */}
                <View className="mb-4">
                    <Text className="text-2xl font-bold text-gray-900 mb-1">Explorar Empresas</Text>
                    <Text className="text-gray-500">Encuentra empresas para obtener soporte</Text>
                </View>

                {/* Search - Shared Component */}
                <SearchInput
                    placeholder="Buscar empresas..."
                    onChangeText={onChangeSearch}
                    value={localSearch}
                    containerStyle={{ marginBottom: 16 }}
                />

                {/* Filters Row */}
                <View className="flex-row items-center mb-2">
                    {/* Filter Button - Shared Component */}
                    <FilterButton
                        onPress={() => setShowIndustryModal(true)}
                        className="mr-3"
                    />

                    {/* Chips List - Shared Component */}
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={[
                            { id: 'all', label: 'Todas' },
                            { id: 'following', label: 'Siguiendo' },
                            ...industries.map(i => ({ id: i.id, label: i.name }))
                        ]}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingRight: 16, alignItems: 'center' }}
                        renderItem={({ item }) => {
                            const isSelected =
                                (item.id === 'all' && !filters.followedByMe && !filters.industryId) ||
                                (item.id === 'following' && filters.followedByMe) ||
                                (item.id === filters.industryId);

                            return (
                                <FilterPill
                                    label={item.label}
                                    isSelected={isSelected}
                                    onPress={() => {
                                        if (item.id === 'all') {
                                            clearFilters();
                                        } else if (item.id === 'following') {
                                            setMultipleFilters({
                                                followedByMe: true,
                                                industryId: null
                                            });
                                        } else {
                                            setMultipleFilters({
                                                followedByMe: false,
                                                industryId: item.id
                                            });
                                        }
                                    }}
                                />
                            );
                        }}
                    />
                </View>
            </View>

            {/* FlatList - WITHOUT ListHeaderComponent */}
            <FlatList
                data={companies}
                renderItem={({ item }) => <CompanyCard company={item} />}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 0, ...tabBarPadding }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                ListEmptyComponent={() => (
                    companiesLoading && !refreshing ? (
                        <View className="px-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <CompanyCardSkeleton key={i} />
                            ))}
                        </View>
                    ) : (
                        <View className="items-center justify-center mt-20">
                            <MaterialCommunityIcons name="domain-off" size={48} color="#9CA3AF" />
                            <Text className="text-gray-500 text-lg mt-4">No se encontraron empresas</Text>
                        </View>
                    )
                )}
            />

            {/* Industry Filter Modal */}
            <Modal
                visible={showIndustryModal}
                animationType="none"
                transparent={true}
                onRequestClose={() => setShowIndustryModal(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl h-[70%]">
                        <View className="p-4 border-b border-gray-100 flex-row justify-between items-center">
                            <Text className="text-xl font-bold text-gray-900">Filtrar por Industria</Text>
                            <IconButton icon="close" onPress={() => setShowIndustryModal(false)} />
                        </View>

                        <ScrollView className="flex-1 p-4">
                            <TouchableOpacity
                                className={`p-4 rounded-xl mb-2 flex-row justify-between items-center ${!filters.industryId ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-100'}`}
                                onPress={() => {
                                    setFilter('industryId', null);
                                    setShowIndustryModal(false);
                                }}
                            >
                                <Text className={`font-medium ${!filters.industryId ? 'text-blue-700' : 'text-gray-700'}`}>Todas las industrias</Text>
                                {!filters.industryId && <MaterialCommunityIcons name="check" size={20} color="#2563eb" />}
                            </TouchableOpacity>

                            {industries.map((industry) => (
                                <TouchableOpacity
                                    key={industry.id}
                                    className={`p-4 rounded-xl mb-2 flex-row justify-between items-center ${filters.industryId === industry.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-100'}`}
                                    onPress={() => {
                                        setMultipleFilters({
                                            industryId: industry.id,
                                            followedByMe: false
                                        });
                                        setShowIndustryModal(false);
                                    }}
                                >
                                    <Text className={`font-medium ${filters.industryId === industry.id ? 'text-blue-700' : 'text-gray-700'}`}>
                                        {industry.name}
                                    </Text>
                                    {filters.industryId === industry.id && <MaterialCommunityIcons name="check" size={20} color="#2563eb" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ScreenContainer>
    );
}
