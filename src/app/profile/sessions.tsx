import { View, FlatList, Text, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { CardSkeleton } from '../../components/Skeleton';
import { useUserStore, Session } from '../../stores/userStore';
import { useEffect, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { parseUserAgent, formatLocation, getCountryFlag } from '../../utils/deviceParser';
import { useDebounceCallback } from '../../hooks/useDebounceCallback';
import Animated, {
    SlideOutRight,
    SlideOutLeft,
    Layout,
} from 'react-native-reanimated';

export default function SessionsScreen() {
    const fetchSessions = useUserStore((state) => state.fetchSessions);
    const revokeSession = useUserStore((state) => state.revokeSession);

    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedSession, setExpandedSession] = useState<string | null>(null);
    const [deletingSessionIds, setDeletingSessionIds] = useState<Map<string, number>>(new Map());
    const [isDeletingAllMode, setIsDeletingAllMode] = useState(false);

    const loadSessions = async () => {
        try {
            const data = await fetchSessions();
            setSessions(data);
        } catch (error) {
            console.error('Failed to load sessions', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadSessions();
    };

    // Sort sessions: current session first, then others
    const sortedSessions = [...sessions].sort((a, b) => {
        if (a.isCurrent) return -1;
        if (b.isCurrent) return 1;
        return 0;
    });

    const toggleExpand = useDebounceCallback((sessionId: string) => {
        if (expandedSession === sessionId) {
            setExpandedSession(null);
        } else {
            setExpandedSession(sessionId);
        }
    }, 300); // 300ms delay for expand/collapse

    const handleRevoke = useDebounceCallback((id: string) => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas cerrar esta sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // First, collapse the expanded card if it's the one being deleted
                            if (expandedSession === id) {
                                setExpandedSession(null);
                                await new Promise((resolve) => setTimeout(resolve, 300));
                            }

                            // Call API FIRST - only animate if it succeeds
                            await revokeSession(id);

                            // Calculate position from bottom (for animation direction)
                            const nonCurrentSessions = sessions.filter((s) => !s.isCurrent);
                            const reversedNonCurrent = [...nonCurrentSessions].reverse();
                            const deletionOrder = reversedNonCurrent.findIndex((s) => s.id === id);

                            // Mark as deleting (triggers slide out animation)
                            setDeletingSessionIds((prev) => new Map(prev).set(id, deletionOrder));

                            // Wait for slide out animation (100ms)
                            await new Promise((resolve) => setTimeout(resolve, 100));

                            // Remove from state - other cards will animate up with Layout.springify()
                            setSessions((prev) => prev.filter((s) => s.id !== id));
                            setDeletingSessionIds((prev) => {
                                const newMap = new Map(prev);
                                newMap.delete(id);
                                return newMap;
                            });

                            // Wait for layout spring animation to complete
                            await new Promise((resolve) => setTimeout(resolve, 150));
                        } catch (error) {
                            setDeletingSessionIds((prev) => {
                                const newMap = new Map(prev);
                                newMap.delete(id);
                                return newMap;
                            });
                            Alert.alert('Error', 'No se pudo cerrar la sesión');
                        }
                    },
                },
            ]
        );
    }, 500); // 500ms delay to prevent double-click on revoke button

    const handleRevokeAllOthers = useDebounceCallback(() => {
        Alert.alert(
            'Cerrar todas las demás sesiones',
            'Se cerrarán todas las sesiones excepto la actual. ¿Continuar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar Todas',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Hide button FIRST before anything else
                            setIsDeletingAllMode(true);

                            // Collapse expanded card if needed
                            if (expandedSession) {
                                setExpandedSession(null);
                                await new Promise((resolve) => setTimeout(resolve, 300));
                            } else {
                                // Small delay to ensure UI updates
                                await new Promise((resolve) => setTimeout(resolve, 50));
                            }

                            const nonCurrentSessions = sessions.filter((s) => !s.isCurrent);
                            if (nonCurrentSessions.length === 0) return;

                            const reversedSessions = [...nonCurrentSessions].reverse();

                            for (let i = 0; i < reversedSessions.length; i++) {
                                const session = reversedSessions[i];
                                try {
                                    // Call API FIRST - only animate if it succeeds
                                    await revokeSession(session.id);

                                    // Mark as deleting
                                    setDeletingSessionIds((prev) => new Map(prev).set(session.id, i));

                                    // Wait for slide out animation
                                    await new Promise((resolve) => setTimeout(resolve, 100));

                                    // Remove from state - triggers layout spring
                                    setSessions((prev) => prev.filter((s) => s.id !== session.id));
                                    setDeletingSessionIds((prev) => {
                                        const newMap = new Map(prev);
                                        newMap.delete(session.id);
                                        return newMap;
                                    });

                                    // Wait for layout animation to complete before next deletion
                                    await new Promise((resolve) => setTimeout(resolve, 150));
                                } catch (error) {
                                    // If one session fails, continue with the rest
                                    console.error(`Failed to revoke session ${session.id}:`, error);
                                    continue;
                                }
                            }

                            // All sessions deleted successfully - button won't show anyway
                            setIsDeletingAllMode(false);
                        } catch (error) {
                            // Show button again if there's an error
                            setIsDeletingAllMode(false);
                            Alert.alert('Error', 'No se pudieron cerrar las sesiones');
                        }
                    },
                },
            ]
        );
    }, 500); // 500ms delay to prevent double-click on revoke all button

    const renderItem = ({ item }: { item: Session }) => {
        const isExpanded = expandedSession === item.id;
        const deletionOrder = deletingSessionIds.get(item.id);
        const deviceInfo = parseUserAgent(item.userAgent, item.deviceName);
        const locationStr = formatLocation(item.location);
        const countryFlag = getCountryFlag(item.location?.country_code || null);
        const timeAgo = formatDistanceToNow(new Date(item.lastUsedAt), { addSuffix: true, locale: es });
        const lastUsedDate = format(new Date(item.lastUsedAt), "d 'de' MMMM 'a las' HH:mm", { locale: es });

        const getExitingAnimation = () => {
            if (deletionOrder === undefined) return undefined;
            if (deletionOrder % 2 === 0) {
                return (new SlideOutRight() as any).duration(150);
            } else {
                return (new SlideOutLeft() as any).duration(150);
            }
        };

        return (
            <Animated.View
                exiting={getExitingAnimation()}
                layout={Layout.springify()}
                className="px-4 py-2"
            >
                <View className={`rounded-xl overflow-hidden border ${item.isCurrent ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 bg-white'}`}>
                    <TouchableOpacity
                        onPress={() => toggleExpand(item.id)}
                        activeOpacity={0.7}
                        className="p-4"
                    >
                        <View className="flex-row items-center gap-4">
                            {/* Icon Column */}
                            <View className="items-center">
                                <View className={`w-12 h-12 rounded-full items-center justify-center ${item.isCurrent ? 'bg-blue-100' : 'bg-gray-100'
                                    }`}>
                                    <MaterialCommunityIcons
                                        name={deviceInfo.icon as any}
                                        size={26}
                                        color={item.isCurrent ? '#1e40af' : '#4B5563'}
                                    />
                                </View>
                            </View>

                            {/* Main Content */}
                            <View className="flex-1 gap-1">
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-base font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
                                        {deviceInfo.displayName}
                                    </Text>
                                    {item.isCurrent && (
                                        <View className="bg-blue-100 px-2 py-0.5 rounded text-xs">
                                            <Text className="text-blue-700 text-[10px] font-bold uppercase tracking-wider">Actual</Text>
                                        </View>
                                    )}
                                </View>

                                <Text className="text-sm text-gray-600" numberOfLines={1}>
                                    {deviceInfo.os} • {deviceInfo.browser}
                                </Text>

                                <View className="flex-row items-center gap-1 mt-0.5">
                                    {countryFlag ? <Text className="text-xs">{countryFlag}</Text> : null}
                                    <Text className="text-xs text-gray-500 flex-1" numberOfLines={1}>
                                        {locationStr} • {timeAgo}
                                    </Text>
                                </View>
                            </View>

                            {/* Chevron */}
                            <View className="justify-center pl-2">
                                <MaterialCommunityIcons
                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color="#9CA3AF"
                                />
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Expanded Details */}
                    {isExpanded && (
                        <View className="px-4 pb-4 pt-0">
                            <View className="h-px bg-gray-100 my-3" />

                            <View className="gap-3">
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-xs text-gray-500">Dirección IP</Text>
                                    <Text className="text-xs font-mono text-gray-700">{item.ipAddress || 'N/A'}</Text>
                                </View>

                                <View className="flex-row justify-between items-center">
                                    <Text className="text-xs text-gray-500">Última actividad</Text>
                                    <Text className="text-xs text-gray-700">{lastUsedDate}</Text>
                                </View>

                                {!item.isCurrent && (
                                    <TouchableOpacity
                                        onPress={() => handleRevoke(item.id)}
                                        className="mt-2 py-2 bg-red-50 rounded-lg border border-red-100 items-center justify-center"
                                    >
                                        <Text className="text-red-600 text-sm font-medium">Cerrar sesión</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            </Animated.View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 bg-gray-50 p-4">
                <ScreenHeader title="Sesiones Activas" showBack={true} />
                <View className="mt-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <CardSkeleton key={i} />
                    ))}
                </View>
            </View>
        );
    }

    return (
        <GestureHandlerRootView className="flex-1">
            <View className="flex-1 bg-gray-50">
                <ScreenHeader title="Sesiones Activas" showBack={true} />
                <FlatList
                    data={sortedSessions}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    contentContainerStyle={{ paddingVertical: 8 }}
                    ListEmptyComponent={() => (
                        <View className="flex-1 items-center justify-center py-12">
                            <MaterialCommunityIcons name="devices" size={48} color="#D1D5DB" />
                            <Text className="text-gray-500 mt-4 font-medium">No hay sesiones activas</Text>
                        </View>
                    )}
                    ListFooterComponent={() => (
                        sessions.length > 1 && !isDeletingAllMode && (
                            <View className="px-4 pb-6 pt-2">
                                <TouchableOpacity
                                    onPress={handleRevokeAllOthers}
                                    className="py-3 px-4 bg-red-50 border border-red-200 rounded-xl flex-row items-center justify-center gap-2"
                                >
                                    <MaterialCommunityIcons name="delete-sweep-outline" size={20} color="#DC2626" />
                                    <Text className="text-red-600 font-semibold">Cerrar todas las demás sesiones</Text>
                                </TouchableOpacity>
                            </View>
                        )
                    )}
                />
            </View>
        </GestureHandlerRootView>
    );
}
