import { View, FlatList, Text, Alert, RefreshControl, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Button, Chip, Divider } from 'react-native-paper';
import { CardSkeleton } from '../../components/Skeleton';
import { useUserStore, Session } from '../../stores/userStore';
import { useEffect, useState, useRef } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { parseUserAgent, formatLocation, getCountryFlag } from '../../utils/deviceParser';
import Animated, { FadeOut, SlideOutRight, SlideOutLeft, ZoomOut, ZoomIn, runOnJS, Layout } from 'react-native-reanimated';

export default function SessionsScreen() {
    const fetchSessions = useUserStore((state) => state.fetchSessions);
    const revokeSession = useUserStore((state) => state.revokeSession);
    const revokeAllOtherSessions = useUserStore((state) => state.revokeAllOtherSessions);

    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedSession, setExpandedSession] = useState<string | null>(null);
    // Map<sessionId, deletionOrder> - tracks the order of deletion from bottom to top
    const [deletingSessionIds, setDeletingSessionIds] = useState<Map<string, number>>(new Map());
    // Track if we're in "delete all" mode for button animation
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

    const handleRevoke = (id: string) => {
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
                            // Calculate position from bottom (for animation direction)
                            const nonCurrentSessions = sessions.filter((s) => !s.isCurrent);
                            const reversedNonCurrent = [...nonCurrentSessions].reverse();
                            const deletionOrder = reversedNonCurrent.findIndex((s) => s.id === id);

                            // Mark as deleting to start animation with deletion order
                            setDeletingSessionIds((prev) => new Map(prev).set(id, deletionOrder));

                            // Wait for animation to complete (400ms to ensure visibility)
                            await new Promise((resolve) => setTimeout(resolve, 400));

                            // Make API call
                            await revokeSession(id).catch((error) => {
                                console.error('Error revoking session:', error);
                                throw error;
                            });

                            // Remove from state after animation and API complete
                            setSessions((prev) => prev.filter((s) => s.id !== id));
                            setDeletingSessionIds((prev) => {
                                const newMap = new Map(prev);
                                newMap.delete(id);
                                return newMap;
                            });
                        } catch (error) {
                            console.error('Error during session revocation:', error);
                            // Cancel animation if API fails
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
    };

    const handleRevokeAllOthers = () => {
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
                            // Get non-current sessions and reverse to start from bottom
                            const nonCurrentSessions = sessions.filter((s) => !s.isCurrent);

                            if (nonCurrentSessions.length === 0) {
                                return;
                            }

                            // Trigger button animation (zoom in + fade flash)
                            setIsDeletingAllMode(true);

                            // Wait for button animation to complete (150ms)
                            await new Promise((resolve) => setTimeout(resolve, 150));

                            // Reverse to eliminate from bottom to top
                            const reversedSessions = [...nonCurrentSessions].reverse();

                            // Eliminate each session sequentially with animation from bottom to top
                            for (let i = 0; i < reversedSessions.length; i++) {
                                const session = reversedSessions[i];
                                try {
                                    // Mark as deleting with deletion order (for alternating direction)
                                    setDeletingSessionIds((prev) => new Map(prev).set(session.id, i));

                                    // Wait for animation to complete (400ms to ensure visibility)
                                    await new Promise((resolve) => setTimeout(resolve, 400));

                                    // Make API call
                                    await revokeSession(session.id).catch((error) => {
                                        console.error(`Error revoking session ${session.id}:`, error);
                                        throw error;
                                    });

                                    // Remove from state
                                    setSessions((prev) => prev.filter((s) => s.id !== session.id));
                                    setDeletingSessionIds((prev) => {
                                        const newMap = new Map(prev);
                                        newMap.delete(session.id);
                                        return newMap;
                                    });
                                } catch (error) {
                                    console.error(`Failed to revoke session ${session.id}:`, error);
                                    // Cancel animation if API fails
                                    setDeletingSessionIds((prev) => {
                                        const newMap = new Map(prev);
                                        newMap.delete(session.id);
                                        return newMap;
                                    });
                                    Alert.alert('Error', `No se pudo cerrar sesión ${session.id}`);
                                    // Continue with next session instead of stopping
                                    continue;
                                }
                            }
                        } catch (error) {
                            Alert.alert('Error', 'No se pudieron cerrar todas las sesiones');
                        }
                    },
                },
            ]
        );
    };

    const toggleExpand = (sessionId: string) => {
        setExpandedSession(expandedSession === sessionId ? null : sessionId);
    };

    const renderItem = ({ item, index }: { item: Session; index: number }) => {
        const isExpanded = expandedSession === item.id;
        const deletionOrder = deletingSessionIds.get(item.id);
        const isDeleting = deletionOrder !== undefined;
        const deviceInfo = parseUserAgent(item.userAgent, item.deviceName);
        const locationStr = formatLocation(item.location);
        const countryFlag = getCountryFlag(item.location?.country_code || null);
        const timeAgo = formatDistanceToNow(new Date(item.lastUsedAt), { addSuffix: true, locale: es });
        const lastUsedDate = format(new Date(item.lastUsedAt), "d 'de' MMMM 'a las' HH:mm", { locale: es });

        // Alternate animation direction based on deletion order (from bottom to top)
        // even order = right, odd order = left
        const getExitingAnimation = () => {
            if (deletionOrder === undefined) return undefined;
            if (deletionOrder % 2 === 0) {
                return new SlideOutRight();
            } else {
                return new SlideOutLeft();
            }
        };

        return (
            <Animated.View
                layout={Layout.springify()}
                exiting={getExitingAnimation()}
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

    return (
        <GestureHandlerRootView className="flex-1">
            <View className="flex-1 bg-gray-50">
                <ScreenHeader title="Sesiones Activas" showBack={true} />
                <FlatList
                    data={sessions}
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
                    ListFooterComponent={() => {
                        if (sessions.length <= 1 || isDeletingAllMode) {
                            return null;
                        }
                        return (
                            <Animated.View
                                exiting={new ZoomIn()}
                                className="px-4 pb-6 pt-2"
                            >
                                <TouchableOpacity
                                    onPress={handleRevokeAllOthers}
                                    className="py-3 px-4 bg-red-50 border border-red-200 rounded-xl flex-row items-center justify-center gap-2"
                                >
                                    <MaterialCommunityIcons name="delete-sweep-outline" size={20} color="#DC2626" />
                                    <Text className="text-red-600 font-semibold">Cerrar todas las demás sesiones</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    }}
                />
            </View>
        </GestureHandlerRootView>
    );
}
