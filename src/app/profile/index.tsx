import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, List, Divider, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScreenHeader } from '../../components/layout/ScreenHeader';

export default function ProfileScreen() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar Sesión',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    }
                },
            ]
        );
    };

    if (!user) return null;

    const initials = (user.displayName || 'Usuario')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    return (
        <View className="flex-1 bg-gray-50">
            <ScreenHeader title="Perfil" showBack={true} />
            <ScrollView>
                {/* Header */}
                <View className="bg-white p-6 items-center border-b border-gray-200">
                    <View className="relative">
                        {user.avatarUrl ? (
                            <Avatar.Image size={80} source={{ uri: user.avatarUrl }} />
                        ) : (
                            <Avatar.Text size={80} label={initials} className="bg-blue-600" />
                        )}
                        <TouchableOpacity
                            className="absolute bottom-0 right-0 bg-white rounded-full p-1 border border-gray-200 shadow-sm"
                            onPress={() => router.push('/profile/edit')}
                        >
                            <MaterialCommunityIcons name="camera" size={20} color="#4b5563" />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-xl font-bold mt-4 text-gray-900">
                        {user.displayName}
                    </Text>
                    <Text className="text-gray-500">{user.email}</Text>

                    {user.emailVerified && (
                        <View className="flex-row items-center mt-1 bg-green-100 px-2 py-0.5 rounded-full">
                            <MaterialCommunityIcons name="check-circle" size={14} color="#166534" />
                            <Text className="text-green-800 text-xs ml-1 font-medium">Verificado</Text>
                        </View>
                    )}

                    <Text className="text-gray-400 text-xs mt-2">
                        Miembro desde {format(new Date(user.createdAt), 'MMMM yyyy', { locale: es })}
                    </Text>
                </View>

                {/* Stats */}
                <View className="flex-row p-4 bg-white mt-4 justify-around border-y border-gray-100">
                    <View className="items-center">
                        <Text className="text-xl font-bold text-blue-600">
                            {user.ticketsCount}
                        </Text>
                        <Text className="text-xs text-gray-500 uppercase">Tickets</Text>
                    </View>
                    <View className="w-[1px] bg-gray-200" />
                    <View className="items-center">
                        <Text className="text-xl font-bold text-yellow-600">
                            {user.ticketsCount - user.resolvedTicketsCount}
                        </Text>
                        <Text className="text-xs text-gray-500 uppercase">Abiertos</Text>
                    </View>
                    <View className="w-[1px] bg-gray-200" />
                    <View className="items-center">
                        <Text className="text-xl font-bold text-gray-700">
                            0
                        </Text>
                        <Text className="text-xs text-gray-500 uppercase">Empresas</Text>
                    </View>
                </View>

                {/* Menu */}
                <View className="mt-6 bg-white border-y border-gray-200">
                    <List.Item
                        title="Editar Perfil"
                        left={(props) => <List.Icon {...props} icon="account-edit" color="#4b5563" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => router.push('/profile/edit')}
                    />
                    <Divider />
                    <List.Item
                        title="Preferencias"
                        left={(props) => <List.Icon {...props} icon="cog" color="#4b5563" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => router.push('/profile/preferences')}
                    />
                    <Divider />
                    <List.Item
                        title="Sesiones Activas"
                        left={(props) => <List.Icon {...props} icon="devices" color="#4b5563" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => router.push('/profile/sessions')}
                    />
                    <Divider />
                    <List.Item
                        title="Cambiar Contraseña"
                        left={(props) => <List.Icon {...props} icon="lock-reset" color="#4b5563" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => router.push('/profile/change-password')}
                    />
                </View>

                <View className="mt-6 px-4 mb-8">
                    <Button
                        mode="outlined"
                        onPress={handleLogout}
                        textColor="#dc2626"
                        className="border-red-200 bg-white"
                    >
                        Cerrar Sesión
                    </Button>
                    <Text className="text-center text-gray-400 text-xs mt-4">
                        Versión 1.0.0
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
