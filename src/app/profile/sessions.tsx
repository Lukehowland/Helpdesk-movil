import { View, FlatList, Text, Alert, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Card, Button, Chip, Divider } from 'react-native-paper';
import { useUserStore, Session } from '../../stores/userStore';
import { useEffect, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

    const getDeviceIcon = (deviceName: string | null) => {
        if (!deviceName) return 'devices';
        const lower = deviceName.toLowerCase();
        if (lower.includes('mobile') || lower.includes('android') || lower.includes('ios')) {
            return 'cellphone';
        }
        if (lower.includes('chrome') || lower.includes('firefox') || lower.includes('safari') || lower.includes('edge')) {
            return 'web';
        }
        return 'monitor';
    };

    const toggleExpand = (sessionId: string) => {
        setExpandedSession(expandedSession === sessionId ? null : sessionId);
    };

    const renderItem = ({ item }: { item: Session }) => {
        const isExpanded = expandedSession === item.id;

        return (
            <Card className="mx-4 mb-3 bg-white" elevation={1}>
                <TouchableOpacity onPress={() => toggleExpand(item.id)}>
                    <Card.Content>
                        {/* Header */}
                        <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center flex-1">
                                <MaterialCommunityIcons
                                    name={getDeviceIcon(item.deviceName)}
                                    size={32}
                                    color="#4B5563"
                                    style={{ marginRight: 12 }}
                                />
                                <View className="flex-1">
                                    <Text className="text-base font-semibold text-gray-800">
                                        {item.deviceName || 'Dispositivo Desconocido'}
                                    </Text>
                                    <Text className="text-xs text-gray-500">
                                        {item.ipAddress || 'N/A'}
                                    </Text>
                                </View>
                            </View>
                            {item.isCurrent && (
                                <Chip
                                    mode="flat"
                                    style={{ backgroundColor: '#D1FAE5', height: 28 }}
                                    textStyle={{ color: '#065F46', fontSize: 11 }}
                                >
                                    Actual
                                </Chip>
                            )}
                        </View>

                        {/* Quick Info */}
                        <View className="mt-2">
                            <View className="flex-row items-center mb-1">
                                <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
                                <Text className="text-xs text-gray-600 ml-2">
                                    Último uso: {formatDistanceToNow(new Date(item.lastUsedAt), { addSuffix: true, locale: es })}
                                </Text>
                            </View>
                            <View className="flex-row items-center">
                                <MaterialCommunityIcons name="calendar-clock" size={14} color="#6B7280" />
                                <Text className="text-xs text-gray-600 ml-2">
                                    Expira: {formatDistanceToNow(new Date(item.expiresAt), { addSuffix: true, locale: es })}
                                </Text>
                            </View>
                        </View>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <>
                                <Divider className="my-3" />
                                <View>
                                    <Text className="text-xs font-semibold text-gray-700 mb-2">Detalles Completos</Text>

                                    {/* Session ID */}
                                    <View className="mb-2">
                                        <Text className="text-xs text-gray-500">ID de Sesión:</Text>
                                        <Text className="text-xs text-gray-800 font-mono">{item.id}</Text>
                                    </View>

                                    {/* User Agent */}
                                    {item.userAgent && (
                                        <View className="mb-2">
                                            <Text className="text-xs text-gray-500">User Agent:</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                <Text className="text-xs text-gray-800 font-mono">{item.userAgent}</Text>
                                            </ScrollView>
                                        </View>
                                    )}

                                    {/* Last Used Date */}
                                    <View className="mb-2">
                                        <Text className="text-xs text-gray-500">Último uso:</Text>
                                        <Text className="text-xs text-gray-800">{format(new Date(item.lastUsedAt), "PPpp", { locale: es })}</Text>
                                    </View>

                                    {/* Expiration Date */}
                                    <View className="mb-2">
                                        <Text className="text-xs text-gray-500">Fecha de expiración:</Text>
                                        <Text className="text-xs text-gray-800">{format(new Date(item.expiresAt), "PPpp", { locale: es })}</Text>
                                    </View>

                                    {/* Location */}
                                    {item.location && (
                                        <View className="mb-2">
                                            <Text className="text-xs text-gray-500">Ubicación:</Text>
                                            <Text className="text-xs text-gray-800">{item.location}</Text>
                                        </View>
                                    )}
                                </View>
                            </>
                        )}

                        {/* Expand/Collapse Indicator */}
                        <View className="flex-row items-center justify-center mt-3">
                            <MaterialCommunityIcons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color="#9CA3AF"
                            />
                        </View>
                    </Card.Content>
                </TouchableOpacity>

                {/* Revoke Button */}
                {!item.isCurrent && (
                    <Card.Actions>
                        <Button
                            mode="text"
                            textColor="#DC2626"
                            onPress={() => handleRevoke(item.id)}
                            icon="close-circle-outline"
                        >
                            Cerrar Sesión
                        </Button>
                    </Card.Actions>
                )}
            </Card>
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
                    ListHeaderComponent={() => (
                        <View className="px-4 pt-4 pb-4">
                            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-row items-start mb-2">
                                <MaterialCommunityIcons name="information" size={20} color="#2563EB" style={{ marginRight: 8, marginTop: 2 }} />
                                <Text className="text-sm text-blue-800 flex-1">
                                    Toca una sesión para ver más detalles. Las sesiones inactivas pueden ser cerradas.
                                </Text>
                            </View>
                        </View>
                    )}
                    ListFooterComponent={() => (
                        <View className="p-4">
                            <Button
                                mode="outlined"
                                onPress={handleRevokeAllOthers}
                                textColor="#DC2626"
                                style={{ borderColor: '#FEE2E2', backgroundColor: '#FFF' }}
                                icon="delete-sweep"
                            >
                                Cerrar todas las demás sesiones
                            </Button>
                        </View>
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </GestureHandlerRootView>
    );
}
