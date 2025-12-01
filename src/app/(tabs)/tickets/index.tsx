import { View, FlatList, Text, RefreshControl, TouchableOpacity, Animated } from 'react-native';
import { SegmentedButtons, FAB } from 'react-native-paper';
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

    // Stats calculation (Client-side patch)
    const stats = {
        total: tickets.length,
        open: tickets.filter(t => ['open', 'pending'].includes(t.status)).length,
        resolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
    };

    return (
        <ScreenContainer>
            {/* Header Stats */}
            <View className="bg-white px-4 pt-4 pb-2 border-b border-gray-200">
                <View className="flex-row justify-between mb-4">
                    <View className="bg-blue-50 p-3 rounded-xl flex-1 mr-2 items-center">
                        <Text className="text-2xl font-bold text-blue-700">{stats.total}</Text>
                        <Text className="text-xs text-blue-600 uppercase font-bold">Total</Text>
                    </View>
                    <View className="bg-green-50 p-3 rounded-xl flex-1 mr-2 items-center">
                        <Text className="text-2xl font-bold text-green-700">{stats.open}</Text>
                        <Text className="text-xs text-green-600 uppercase font-bold">Activos</Text>
                    </View>
                    <View className="bg-gray-100 p-3 rounded-xl flex-1 items-center">
                        <Text className="text-2xl font-bold text-gray-700">{stats.resolved}</Text>
                        <Text className="text-xs text-gray-600 uppercase font-bold">Resueltos</Text>
                    </View>
                </View>

                <SearchInput
                    placeholder="Buscar tickets..."
                    onChangeText={onChangeSearch}
                    value={searchQuery}
                    containerStyle={{ marginBottom: 16 }}
                />

                <SegmentedButtons
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    buttons={[
                        { value: 'all', label: 'Todos' },
                        { value: 'open', label: 'Abiertos' },
                        { value: 'pending', label: 'Pendientes' },
                        { value: 'resolved', label: 'Resueltos' },
                    ]}
                    style={{ marginBottom: 8 }}
                    density="small"
                />
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
