import { View, ScrollView, Alert } from 'react-native';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Avatar } from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';
import { useUserStore } from '../../stores/userStore';
import { ControlledInput } from '../../components/ui/ControlledInput';
import { profileSchema, ProfileFormData } from '../../schemas/profile';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useDebounceCallback } from '../../hooks/useDebounceCallback';

export default function EditProfileScreen() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const updateProfile = useUserStore((state) => state.updateProfile);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [avatar, setAvatar] = useState(user?.avatarUrl);

    const { control, handleSubmit } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            phoneNumber: user?.phoneNumber || '',
        },
    });

    const pickImage = useDebounceCallback(async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true, // In real app, upload to server and get URL
        });

        if (!result.canceled) {
            setAvatar(result.assets[0].uri);
            // Here you would typically upload the image
        }
    }, 500); // 500ms delay to prevent multiple image pickers

    const onSubmit = useDebounceCallback(async (data: ProfileFormData) => {
        setIsSubmitting(true);
        try {
            await updateProfile({
                ...data,
                avatarUrl: avatar, // Assuming API handles this or we uploaded it separately
            });
            Alert.alert('Éxito', 'Perfil actualizado correctamente');
            router.back();
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el perfil');
        } finally {
            setIsSubmitting(false);
        }
    }, 1000); // 1000ms delay to prevent multiple profile updates

    if (!user) return null;

    return (
        <View className="flex-1 bg-white">
            <ScreenHeader title="Editar Perfil" showBack={true} />
            <ScrollView className="flex-1 px-6 py-4">
                <View className="items-center mb-8">
                    <View className="relative">
                        {avatar ? (
                            <Avatar.Image size={100} source={{ uri: avatar }} />
                        ) : (
                            <Avatar.Text size={100} label={(user.displayName || 'U').substring(0, 2)} />
                        )}
                        <Button
                            mode="text"
                            onPress={pickImage}
                            className="mt-2"
                        >
                            Cambiar Foto
                        </Button>
                    </View>
                </View>

                <ControlledInput
                    control={control}
                    name="firstName"
                    label="Nombre"
                />

                <ControlledInput
                    control={control}
                    name="lastName"
                    label="Apellido"
                />

                <ControlledInput
                    control={control}
                    name="phoneNumber"
                    label="Teléfono (Opcional)"
                    keyboardType="phone-pad"
                />

                <Button
                    mode="contained"
                    onPress={handleSubmit(onSubmit)}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className="mt-4 rounded-xl bg-blue-600"
                    contentStyle={{ height: 50 }}
                >
                    Guardar Cambios
                </Button>
            </ScrollView>
        </View>
    );
}
