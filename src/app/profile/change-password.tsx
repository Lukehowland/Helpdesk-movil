import { View, ScrollView, Alert } from 'react-native';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'react-native-paper';
import { ControlledInput } from '../../components/ui/ControlledInput';
import { passwordChangeSchema, PasswordChangeFormData } from '../../schemas/profile';
import { client } from '../../services/api/client';
import { useState } from 'react';
import { useDebounceCallback } from '../../hooks/useDebounceCallback';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { control, handleSubmit, reset } = useForm<PasswordChangeFormData>({
        resolver: zodResolver(passwordChangeSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
        },
    });

    const onSubmit = useDebounceCallback(async (data: PasswordChangeFormData) => {
        setIsSubmitting(true);
        try {
            await client.post('/api/auth/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });

            Alert.alert('Éxito', 'Contraseña actualizada correctamente');
            reset();
            router.back();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo actualizar la contraseña');
        } finally {
            setIsSubmitting(false);
        }
    }, 1000); // 1000ms delay to prevent multiple password change requests

    return (
        <View className="flex-1 bg-white">
            <ScreenHeader title="Cambiar Contraseña" showBack={true} />
            <ScrollView className="flex-1 px-6 py-4">
                <ControlledInput
                    control={control}
                    name="currentPassword"
                    label="Contraseña Actual"
                    secureTextEntry={!showPassword}
                />

                <ControlledInput
                    control={control}
                    name="newPassword"
                    label="Nueva Contraseña"
                    secureTextEntry={!showPassword}
                    rightIcon={showPassword ? "eye-off" : "eye"}
                    onRightIconPress={() => setShowPassword(!showPassword)}
                />

                <ControlledInput
                    control={control}
                    name="confirmNewPassword"
                    label="Confirmar Nueva Contraseña"
                    secureTextEntry={!showPassword}
                />

                <Button
                    mode="contained"
                    onPress={handleSubmit(onSubmit)}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className="mt-4 rounded-xl bg-blue-600"
                    contentStyle={{ height: 50 }}
                >
                    Actualizar Contraseña
                </Button>
            </ScrollView>
        </View>
    );
}
