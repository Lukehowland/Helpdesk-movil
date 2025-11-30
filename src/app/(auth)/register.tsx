import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Checkbox } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { ControlledInput } from '../../components/ui/ControlledInput';
import { registerSchema, RegisterFormData } from '../../schemas/auth';
import { useDebounceCallback } from '../../hooks/useDebounceCallback';

export default function RegisterScreen() {
    const router = useRouter();
    const register = useAuthStore((state) => state.register);
    const isLoading = useAuthStore((state) => state.isLoading);
    const [showPassword, setShowPassword] = useState(false);

    const { control, handleSubmit } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            termsAccepted: false,
            privacyAccepted: false,
        },
    });

    const onSubmit = useDebounceCallback(async (data: RegisterFormData) => {
        try {
            await register(data);
            Alert.alert(
                'Registro Exitoso',
                'Por favor verifica tu correo electrónico para activar tu cuenta.',
                [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
            );
        } catch (error: any) {
            let errorMessage = error.response?.data?.message || 'No se pudo crear la cuenta.';

            if (error.response?.data?.errors) {
                const validationErrors = error.response.data.errors;
                const errorDetails = Object.keys(validationErrors)
                    .map(key => `• ${validationErrors[key].join(' ')}`)
                    .join('\n');
                errorMessage += `\n\n${errorDetails}`;
            }

            Alert.alert('Error de registro', errorMessage);
        }
    }, 1000); // 1000ms delay to prevent duplicate account creation

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
                <View className="mb-8">
                    <Text className="text-3xl font-bold text-gray-900">Crear Cuenta</Text>
                    <Text className="text-gray-500 mt-2">Únete para gestionar tus tickets</Text>
                </View>

                <View className="flex-row space-x-4 mb-2">
                    <View className="flex-1">
                        <ControlledInput
                            control={control}
                            name="firstName"
                            label="Nombre"
                        />
                    </View>
                    <View className="flex-1">
                        <ControlledInput
                            control={control}
                            name="lastName"
                            label="Apellido"
                        />
                    </View>
                </View>

                <ControlledInput
                    control={control}
                    name="email"
                    label="Correo Electrónico"
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <ControlledInput
                    control={control}
                    name="password"
                    label="Contraseña"
                    secureTextEntry={!showPassword}
                    right={
                        <Button
                            onPress={() => setShowPassword(!showPassword)}
                            compact
                            textColor="#6b7280"
                        >
                            {showPassword ? 'Ocultar' : 'Mostrar'}
                        </Button>
                    }
                />

                <ControlledInput
                    control={control}
                    name="confirmPassword"
                    label="Confirmar Contraseña"
                    secureTextEntry={!showPassword}
                />

                <View className="mb-6">
                    <View className="flex-row items-center mb-2">
                        <Controller
                            control={control}
                            name="termsAccepted"
                            render={({ field: { value, onChange } }) => (
                                <Checkbox.Android
                                    status={value ? 'checked' : 'unchecked'}
                                    onPress={() => onChange(!value)}
                                    color="#2563eb"
                                />
                            )}
                        />
                        <Text className="flex-1 text-gray-600 text-sm">
                            Acepto los <Text className="text-blue-600 font-bold">Términos de Servicio</Text>
                        </Text>
                    </View>

                    <View className="flex-row items-center">
                        <Controller
                            control={control}
                            name="privacyAccepted"
                            render={({ field: { value, onChange } }) => (
                                <Checkbox.Android
                                    status={value ? 'checked' : 'unchecked'}
                                    onPress={() => onChange(!value)}
                                    color="#2563eb"
                                />
                            )}
                        />
                        <Text className="flex-1 text-gray-600 text-sm">
                            Acepto la <Text className="text-blue-600 font-bold">Política de Privacidad</Text>
                        </Text>
                    </View>
                </View>

                <Button
                    mode="contained"
                    onPress={handleSubmit(onSubmit)}
                    loading={isLoading}
                    disabled={isLoading}
                    contentStyle={{ height: 50 }}
                    className="rounded-xl bg-blue-600 mb-6"
                >
                    Registrarse
                </Button>

                <View className="flex-row justify-center mb-8">
                    <Text className="text-gray-600">¿Ya tienes cuenta? </Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Text className="text-blue-600 font-bold">Inicia Sesión</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
