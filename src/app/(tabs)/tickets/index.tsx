import { View, FlatList, Text, RefreshControl, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { FAB } from 'react-native-paper';
import { useTicketStore } from '@/stores/ticketStore';
import { useEffect, useState, useCallback, useRef } from 'react';
import { TicketCard } from '@/components/tickets/TicketCard';
import { debounce } from 'lodash';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { TicketCardSkeleton } from '@/components/Skeleton';
import { SearchInput } from '@/components/ui/SearchInput';
import { useDebounceNavigation } from '@/hooks/useDebounceNavigation';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATUS_FILTERS = [
    { id: 'all', label: 'Todos' },
    { id: 'open', label: 'Abiertos' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'resolved', label: 'Resueltos' },
    { id: 'closed', label: 'Cerrados' },
];

export default function MyTicketsScreen() {
    const { push } = useDebounceNavigation();
    const { tickets, fetchTickets, isLoading } = useTicketStore();
    const user = useAuthStore((state) => state.user);
    const tabBarPadding = useTabBarPadding();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [refreshing, setRefreshing] = useState(false);

    // Hint State
    const [showHint, setShowHint] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const loadData = async () => {
        try {
            await fetchTickets({
                search: searchQuery,
                status: statusFilter === 'all' ? undefined : statusFilter as any
            });
        } catch (error) {
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    };

    // Check for hint
    useEffect(() => {
        const checkHint = async () => {
            try {
                const hasSeen = await AsyncStorage.getItem('hasSeenCreateTicketHint');
                if (!hasSeen) {
                    setShowHint(true);
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }).start();

                    // Mark as seen immediately so it doesn't show again next time
                    await AsyncStorage.setItem('hasSeenCreateTicketHint', 'true');

                    // Auto hide after 8 seconds
                    setTimeout(() => {
                        Animated.timing(fadeAnim, {
                            toValue: 0,
                            duration: 500,
                            useNativeDriver: true,
                        }).start(() => setShowHint(false));
                    }, 8000);
                }
            } catch (error) {
                console.error('Error checking hint status:', error);
            }
        };

        checkHint();
    }, []);

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((query) => {
            fetchTickets({
                search: query,
                status: statusFilter === 'all' ? undefined : statusFilter as any
            });
        }, 500),
        [statusFilter]
    );

    useEffect(() => {
        loadData();
    }, [statusFilter]);

    const onChangeSearch = (query: string) => {
        setSearchQuery(query);
        debouncedSearch(query);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // Stats calculation
    const stats = {
        total: tickets.length,
        open: tickets.filter(t => ['open', 'pending'].includes(t.status)).length,
        resolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
    };

    return (
        <ScreenContainer>
            <View className="bg-white pb-4">
                {/* Header Title */}
                <View className="px-6 pt-6 pb-4">
                    <Text className="text-2xl font-bold text-gray-900">Mis Tickets</Text>
                    <Text className="text-gray-500 text-sm">Gestiona tus solicitudes de soporte</Text>
                </View>

                {/* Compact Stats Widgets */}
                <View className="flex-row px-4 gap-2 mb-6">
                    <View className="flex-1 bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm flex-row items-center">
                        <View className="bg-blue-50 p-2 rounded-full mr-3">
                            <MaterialCommunityIcons name="ticket-outline" size={18} color="#2563eb" />
                        </View>
                        <View>
                            <Text className="text-lg font-bold text-gray-900 leading-5">{stats.total}</Text>
                            <Text className="text-[10px] text-gray-500 font-bold uppercase">Total</Text>
                        </View>
                    </View>
                    <View className="flex-1 bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm flex-row items-center">
                        <View className="bg-emerald-50 p-2 rounded-full mr-3">
                            <MaterialCommunityIcons name="progress-clock" size={18} color="#059669" />
                        </View>
                        <View>
                            <Text className="text-lg font-bold text-gray-900 leading-5">{stats.open}</Text>
                            <Text className="text-[10px] text-gray-500 font-bold uppercase">Activos</Text>
                        </View>
                    </View>
                    <View className="flex-1 bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm flex-row items-center">
                        <View className="bg-purple-50 p-2 rounded-full mr-3">
                            <MaterialCommunityIcons name="check-circle-outline" size={18} color="#7c3aed" />
                        </View>
                        <View>
                            <Text className="text-lg font-bold text-gray-900 leading-5">{stats.resolved}</Text>
                            <Text className="text-[10px] text-gray-500 font-bold uppercase">Listos</Text>
                        </View>
                    </View>
                </View>

                {/* Search Input */}
                <View className="px-4 mb-6">
                    <SearchInput
                        placeholder="Buscar tickets..."
                        onChangeText={onChangeSearch}
                        value={searchQuery}
                    />
                </View>

                {/* Dynamic Colored Filters - Carousel Style */}
                <View className="mb-2">
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={STATUS_FILTERS}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                        renderItem={({ item }) => {
                            const isActive = statusFilter === item.id;

                            // Define active colors based on filter id
                            let activeBorder = 'border-gray-900';
                            let activeText = 'text-gray-900';
                            let activeIcon = '#111827'; // gray-900

                            if (item.id === 'open') {
                                activeBorder = 'border-emerald-600';
                                activeText = 'text-emerald-700';
                                activeIcon = '#059669'; // emerald-600
                            }
                            else if (item.id === 'pending') {
                                activeBorder = 'border-amber-500';
                                activeText = 'text-amber-700';
                                activeIcon = '#f59e0b'; // amber-500
                            }
                            else if (item.id === 'resolved') {
                                activeBorder = 'border-blue-600';
                                activeText = 'text-blue-700';
                                activeIcon = '#2563eb'; // blue-600
                            }
                            else if (item.id === 'closed') {
                                activeBorder = 'border-gray-500';
                                activeText = 'text-gray-700';
                                activeIcon = '#6b7280'; // gray-500
                            }

                            return (
                                <TouchableOpacity
                                    onPress={() => setStatusFilter(item.id)}
                                    className={`mr-2 px-4 h-10 rounded-lg justify-center items-center border shadow-sm ${isActive
                                            ? `${activeBorder} bg-white`
                                            : 'border-gray-300 bg-white'
                                        }`}
                                >
                                    <View className="flex-row items-center gap-1">
                                        <Text className={`font-medium ${isActive ? activeText : 'text-gray-600'
                                            }`}>
                                            {item.label}
                                        </Text>
                                        {isActive && (
                                            <MaterialCommunityIcons name="check" size={16} color={activeIcon} />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </View>

            {isLoading && !refreshing ? (
                <View style={{ padding: 16 }}>
                    {Array.from({ length: 5 }).map((_, index) => (
                        <TicketCardSkeleton key={index} />
                    ))}
                </View>
            ) : (
                <FlatList
                    data={tickets}
                    renderItem={({ item }) => <TicketCard ticket={item} />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, ...tabBarPadding }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={() => (
                        <View className="items-center justify-center mt-20 px-6">
                            <MaterialCommunityIcons name="ticket-outline" size={64} color="#d1d5db" />
                            <Text className="text-gray-500 text-lg mt-4 font-bold">No tienes tickets</Text>
                            <Text className="text-gray-400 text-center mt-2">
                                Crea un nuevo ticket para solicitar ayuda a las empresas que sigues.
                            </Text>
                            <TouchableOpacity
                                onPress={() => push('/(tabs)/tickets/create')}
                                className="mt-6 bg-blue-50 px-6 py-3 rounded-full"
                            >
                                <Text className="text-blue-600 font-bold">Crear mi primer ticket</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}

            {/* Hint Balloon */}
            {showHint && (
                <Animated.View
                    style={{ opacity: fadeAnim }}
                    className="absolute bottom-24 right-4 bg-blue-600 px-4 py-2 rounded-xl shadow-lg z-50"
                >
                    <Text className="text-white font-bold">¡Crea tu ticket aquí!</Text>
                    <View className="absolute -bottom-1 right-6 w-3 h-3 bg-blue-600 rotate-45" />
                </Animated.View>
            )}

            <FAB
                icon="plus"
                style={{
                    position: 'absolute',
                    margin: 16,
                    right: 0,
                    bottom: 0,
                    backgroundColor: '#2563eb',
                }}
                color="white"
                onPress={() => push('/(tabs)/tickets/create')}
            />
        </ScreenContainer>
    );
}
