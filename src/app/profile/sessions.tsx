import { View, FlatList, Text, Alert, RefreshControl } from 'react-native';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { List, Button, Chip } from 'react-native-paper';
import { useUserStore, Session } from '../../stores/userStore';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';

export default function SessionsScreen() {
    const fetchSessions = useUserStore((state) => state.fetchSessions);
    const revokeSession = useUserStore((state) => state.revokeSession);
    const revokeAllOtherSessions = useUserStore((state) => state.revokeAllOtherSessions);

    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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
                            loadSessions(); // Reload to verify
                        } catch (error) {
                            Alert.alert('Error', 'No se pudieron cerrar las sesiones');
                        }
                    },
                },
            ]
        );
    };

    const renderRightActions = (id: string, isCurrent: boolean) => {
        if (isCurrent) return null;
        return (
            <View className="bg-red-600 justify-center items-center w-20 h-full">
                <MaterialCommunityIcons
                    name="delete"
                    size={24}
                    color="white"
                    onPress={() => handleRevoke(id)}
                />
            </View>
        );
    };

    const renderItem = ({ item }: { item: Session }) => (
        <Swipeable renderRightActions={() => renderRightActions(item.id, item.isCurrent)}>
            <List.Item
                title={item.deviceName}
                description={() => (
                    <View className="mt-1">
                        <Text className="text-gray-500 text-xs">
                            IP: {item.ipAddress}
                        </Text>
                        <Text className="text-gray-400 text-xs">
                            Último uso: {formatDistanceToNow(new Date(item.lastUsedAt), { addSuffix: true, locale: es })}
                        </Text>
                    </View>
                )}
                left={(props) => (
                    <List.Icon {...props} icon={item.deviceName.toLowerCase().includes('mobile') ? 'cellphone' : 'monitor'} />
                )}
                right={() => item.isCurrent ? (
                    <Chip className="bg-green-100" textStyle={{ color: '#166534', fontSize: 10 }}>Actual</Chip>
                ) : null}
                className="bg-white border-b border-gray-100"
            />
        </Swipeable>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <ScreenHeader title="Sesiones Activas" showBack={true} />
            <FlatList
                data={sessions}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListHeaderComponent={() => (
                    <View className="p-4">
                        <Text className="text-gray-500 text-sm mb-2">
                            Desliza a la izquierda para cerrar una sesión específica.
                        </Text>
                    </View>
                )}
                ListFooterComponent={() => (
                    <View className="p-4">
                        <Button
                            mode="outlined"
                            onPress={handleRevokeAllOthers}
                            textColor="#dc2626"
                            className="border-red-200 bg-white"
                        >
                            Cerrar todas las demás sesiones
                        </Button>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}
