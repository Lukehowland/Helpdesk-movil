import { View, FlatList, Text, Alert, RefreshControl, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Button, Chip, Divider } from 'react-native-paper';
import { CardSkeleton } from '../../components/Skeleton';
import { useUserStore, Session } from '../../stores/userStore';
import { useEffect, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { parseUserAgent, formatLocation, getCountryFlag } from '../../utils/deviceParser';

export default function SessionsScreen() {
    const fetchSessions = useUserStore((state) => state.fetchSessions);
    const revokeSession = useUserStore((state) => state.revokeSession);
    const revokeAllOtherSessions = useUserStore((state) => state.revokeAllOtherSessions);

    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedSession, setExpandedSession] = useState<string | null>(null);

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
                            await revokeSession(id);
                            setSessions((prev) => prev.filter((s) => s.id !== id));
                        } catch (error) {
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
                            await revokeAllOtherSessions();
                            loadSessions();
                        } catch (error) {
                            Alert.alert('Error', 'No se pudieron cerrar las sesiones');
                        }
                    },
                },
            ]
        );
    };

    const toggleExpand = (sessionId: string) => {
        setExpandedSession(expandedSession === sessionId ? null : sessionId);
    };

    const renderItem = ({ item }: { item: Session }) => {
        const isExpanded = expandedSession === item.id;
        const deviceInfo = parseUserAgent(item.userAgent, item.deviceName);
        const locationStr = formatLocation(item.location);
        const countryFlag = getCountryFlag(item.location?.country_code || null);
        const timeAgo = formatDistanceToNow(new Date(item.lastUsedAt), { addSuffix: true, locale: es });
        const lastUsedDate = format(new Date(item.lastUsedAt), "d 'de' MMMM 'a las' HH:mm", { locale: es });

        return (
            <View className="px-4 py-3">
                <View className={`rounded-2xl border ${item.isCurrent ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                    {/* Header Card */}
                    <TouchableOpacity
                        onPress={() => toggleExpand(item.id)}
                        activeOpacity={0.7}
                        className="px-4 py-4"
                    >
                        <View className="flex-row items-center gap-3">
                            {/* Device Icon */}
                            <View className={`w-12 h-12 rounded-full items-center justify-center ${
                                item.isCurrent ? 'bg-blue-200' : 'bg-gray-100'
                            }`}>
                                <MaterialCommunityIcons
                                    name={deviceInfo.icon as any}
                                    size={28}
                                    color={item.isCurrent ? '#1e40af' : '#6B7280'}
                                />
                            </View>

                            {/* Device Info */}
                            <View className="flex-1">
                                <View className="flex-row items-center gap-2">
                                    <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                                        {deviceInfo.displayName}
                                    </Text>
                                    {item.isCurrent && (
                                        <View className="bg-green-500 px-2 py-1 rounded-full">
                                            <Text className="text-xs font-semibold text-white">Actual</Text>
                                        </View>
                                    )}
                                </View>
                                <Text className="text-xs text-gray-500 mt-1">
                                    {deviceInfo.os} • {deviceInfo.browser}
                                </Text>
                                <Text className="text-xs text-gray-400 mt-0.5">{timeAgo}</Text>
                            </View>

                            {/* Chevron */}
                            <MaterialCommunityIcons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={24}
                                color="#9CA3AF"
                            />
                        </View>
                    </TouchableOpacity>

                    {/* Expanded Details */}
                    {isExpanded && (
                        <>
                            <View className="border-t border-gray-100" />
                            <View className="px-4 py-4 gap-3">
                                {/* Location */}
                                {item.location && (
                                    <View>
                                        <Text className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">
                                            📍 Ubicación
                                        </Text>
                                        <View className="flex-row items-center gap-2">
                                            <Text className="text-sm text-2xl">{countryFlag}</Text>
                                            <View className="flex-1">
                                                <Text className="text-sm font-medium text-gray-900">{locationStr}</Text>
                                                {item.location.timezone && (
                                                    <Text className="text-xs text-gray-500">{item.location.timezone}</Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {/* IP Address */}
                                <View>
                                    <Text className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">
                                        🌐 Dirección IP
                                    </Text>
                                    <Text className="text-sm font-mono text-gray-700 bg-gray-50 p-2 rounded-lg">
                                        {item.ipAddress || 'No disponible'}
                                    </Text>
                                </View>

                                {/* Last Used */}
                                <View>
                                    <Text className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">
                                        ⏰ Última actividad
                                    </Text>
                                    <Text className="text-sm text-gray-700">{lastUsedDate}</Text>
                                </View>

                                {/* Expiration */}
                                <View>
                                    <Text className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">
                                        🔐 Expira
                                    </Text>
                                    <Text className="text-sm text-gray-700">
                                        {format(new Date(item.expiresAt), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                                    </Text>
                                </View>

                                {/* Action Button */}
                                {!item.isCurrent && (
                                    <TouchableOpacity
                                        onPress={() => handleRevoke(item.id)}
                                        className="mt-2 py-2.5 px-3 bg-red-50 rounded-lg flex-row items-center justify-center gap-2 border border-red-200"
                                    >
                                        <MaterialCommunityIcons name="logout" size={16} color="#DC2626" />
                                        <Text className="text-sm font-semibold text-red-600">Cerrar esta sesión</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </View>
            </View>
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
                    ListFooterComponent={() => (
                        sessions.length > 1 && (
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
