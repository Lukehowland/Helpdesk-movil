import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, Platform, Dimensions, TouchableWithoutFeedback } from 'react-native';
import Animated, { FadeIn, ZoomIn, FadeOut, ZoomOut } from 'react-native-reanimated';
import { Avatar, List, Divider, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { useDebounceNavigation } from '@/hooks/useDebounceNavigation';
import { useDebounceCallback } from '@/hooks/useDebounceCallback';

import { ProfileSkeleton } from '../../components/Skeleton';

export default function ProfileScreen() {
    const { push, replace } = useDebounceNavigation();
    const { user, logout, isLoading, refreshToken, invalidateToken, updateAvatar, isUploadingAvatar } = useAuthStore();
    const [showImagePreview, setShowImagePreview] = React.useState(false);
    const insets = useSafeAreaInsets();
    const { height: screenHeight } = Dimensions.get('screen');

    const handleLogout = useDebounceCallback(() => {
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
                        replace('/(auth)/login');
                    }
                },
            ]
        );
    }, 500); // 500ms delay to prevent multiple logout alerts



    const handlePickImage = useDebounceCallback(async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                await updateAvatar(result.assets[0].uri);
                Alert.alert('Éxito', 'Foto de perfil actualizada correctamente');
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar la foto de perfil');
        }
    }, 500); // 500ms delay to prevent multiple image pickers

    if (isLoading) {
        return <ProfileSkeleton />;
    }

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
                        <TouchableOpacity onPress={() => setShowImagePreview(true)}>
                            {user.avatarUrl ? (
                                <Avatar.Image size={80} source={{ uri: user.avatarUrl }} />
                            ) : (
                                <Avatar.Text size={80} label={initials} className="bg-blue-600" />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="absolute bottom-0 right-0 bg-white rounded-full p-1 border border-gray-200 shadow-sm"
                            onPress={handlePickImage}
                            disabled={isUploadingAvatar}
                        >
                            {isUploadingAvatar ? (
                                <ActivityIndicator size="small" color="#4b5563" />
                            ) : (
                                <MaterialCommunityIcons name="camera" size={20} color="#4b5563" />
                            )}
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

                    {user.createdAt && (
                        <Text className="text-gray-400 text-xs mt-2">
                            Miembro desde {format(new Date(user.createdAt), 'MMMM yyyy', { locale: es })}
                        </Text>
                    )}
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
                        onPress={() => push('/profile/edit')}
                    />
                    <Divider />
                    <List.Item
                        title="Preferencias"
                        left={(props) => <List.Icon {...props} icon="cog" color="#4b5563" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => push('/profile/preferences')}
                    />
                    <Divider />
                    <List.Item
                        title="Sesiones Activas"
                        left={(props) => <List.Icon {...props} icon="devices" color="#4b5563" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => push('/profile/sessions')}
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

            <Modal
                visible={showImagePreview}
                transparent={true}
                onRequestClose={() => setShowImagePreview(false)}
                animationType="fade"
                statusBarTranslucent={true}
                navigationBarTranslucent={true}
            >
                <TouchableWithoutFeedback onPress={() => setShowImagePreview(false)}>
                    <BlurView
                        intensity={20}
                        tint="dark"
                        className="flex-1 justify-center items-center relative"
                        style={{ height: screenHeight, width: '100%' }}
                    >
                        <TouchableOpacity
                            className="absolute right-4 z-10 p-2 bg-white/20 rounded-full"
                            style={{ top: insets.top + 16 }}
                            onPress={() => setShowImagePreview(false)}
                        >
                            <MaterialCommunityIcons name="close" size={24} color="white" />
                        </TouchableOpacity>

                        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                            <Animated.View
                                entering={ZoomIn.duration(300)}
                                exiting={ZoomOut.duration(300)}
                                className="items-center p-4"
                                style={{ paddingBottom: insets.bottom }}
                            >
                                {user.avatarUrl ? (
                                    <Animated.Image
                                        source={{ uri: user.avatarUrl }}
                                        className="w-80 h-80 rounded-full shadow-2xl border-2 border-white/50"
                                        style={{ objectFit: 'cover' }}
                                    />
                                ) : (
                                    <View className="w-80 h-80 rounded-full bg-blue-600 items-center justify-center shadow-2xl border-2 border-white/50">
                                        <Text className="text-white text-8xl font-bold">{initials}</Text>
                                    </View>
                                )}
                                <View className="mt-8 items-center">
                                    <Text className="text-white text-2xl font-bold text-center">{user.displayName}</Text>
                                    <Text className="text-gray-400 text-base mt-1 text-center">{user.email}</Text>
                                </View>
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </BlurView>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}
