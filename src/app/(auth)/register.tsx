import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Dimensions, TextInput } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Checkbox } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { SlideInDown, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '../../stores/authStore';
import { ControlledInput } from '../../components/ui/ControlledInput';
import { GoogleButton } from '../../components/ui/GoogleButton';
import { registerSchema, RegisterFormData } from '../../schemas/auth';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

// Password Strength Component
const PasswordStrength = ({ password }: { password?: string }) => {
    if (!password) return null;

    const hasLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUpper = /[A-Z]/.test(password);

    const strength = [hasLength, hasNumber, hasSpecial, hasUpper].filter(Boolean).length;

    const getColor = () => {
        if (strength <= 1) return 'bg-red-500';
        if (strength === 2) return 'bg-orange-500';
        if (strength === 3) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getText = () => {
        if (strength <= 1) return 'Débil';
        if (strength === 2) return 'Regular';
        if (strength === 3) return 'Buena';
        return 'Fuerte';
    };

    return (
        <View className="mt-1 mb-4">
            <View className="flex-row h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mb-1">
                <View className={`h-full ${getColor()}`} style={{ width: `${(strength / 4) * 100}%` }} />
            </View>
            <Text className="text-xs text-gray-500 text-right">{getText()}</Text>
        </View>
    );
};

export default function RegisterScreen() {
    const router = useRouter();
    const register = useAuthStore((state) => state.register);
    const isLoading = useAuthStore((state) => state.isLoading);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { control, handleSubmit, watch } = useForm<RegisterFormData>({
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

    const password = watch('password');

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await register(data);
            Alert.alert(
                'Registro Exitoso',
                'Por favor verifica tu correo electrónico para activar tu cuenta.',
                [{ text: 'Ir al Login', onPress: () => router.replace('/(auth)/login') }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo crear la cuenta');
        }
    };

    const handleGoogleLogin = () => {
        Alert.alert('Próximamente', 'Funcionalidad en desarrollo');
    };

    return (
        <View className="flex-1 bg-blue-600">
            <StatusBar style="light" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    className="flex-1"
                >
                    {/* Header Section */}
                    <View className="h-[20%] justify-center px-8">
                        <TouchableOpacity onPress={() => router.back()} className="mb-4 w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white text-4xl font-bold mb-2">Crear Cuenta</Text>
                        <Text className="text-blue-100 text-lg">Únete a Helpdesk hoy</Text>
                    </View>

                    {/* Form Section */}
                    <Animated.View
                        entering={SlideInDown.duration(500).springify()}
                        className="flex-1 bg-white rounded-t-[32px] px-8 pt-10 shadow-2xl"
                        style={{ minHeight: height * 0.75 }}
                    >
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            <View className="space-y-2">
                                <View className="flex-row space-x-4">
                                    <View className="flex-1">
                                        <ControlledInput
                                            control={control}
                                            name="firstName"
                                            label="Nombre"
                                            placeholder="Juan"
                                            leftIcon="account-outline"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <ControlledInput
                                            control={control}
                                            name="lastName"
                                            label="Apellido"
                                            placeholder="Pérez"
                                            leftIcon="account-outline"
                                        />
                                    </View>
                                </View>

                                <ControlledInput
                                    control={control}
                                    name="email"
                                    label="Correo Electrónico"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    leftIcon="email-outline"
                                    placeholder="ejemplo@correo.com"
                                />

                                <ControlledInput
                                    control={control}
                                    name="password"
                                    label="Contraseña"
                                    secureTextEntry={!showPassword}
                                    leftIcon="lock-outline"
                                    rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                                    onRightIconPress={() => setShowPassword(!showPassword)}
                                    placeholder="••••••••"
                                />
                                <PasswordStrength password={password} />

                                <ControlledInput
                                    control={control}
                                    name="confirmPassword"
                                    label="Confirmar Contraseña"
                                    secureTextEntry={!showConfirmPassword}
                                    leftIcon="lock-check-outline"
                                    rightIcon={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                    onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    placeholder="••••••••"
                                />
                            </View>

                            <View className="mt-2 mb-6 space-y-2">
                                <View className="flex-row items-center">
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
                                    <Text className="text-gray-600 ml-1 text-xs flex-1">
                                        Acepto los Términos y Condiciones
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
                                    <Text className="text-gray-600 ml-1 text-xs flex-1">
                                        Acepto la Política de Privacidad
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleSubmit(onSubmit)}
                                disabled={isLoading}
                                className="flex-row items-center justify-center bg-blue-600 rounded-xl h-14 shadow-lg shadow-blue-600/30 mb-6 active:bg-blue-700"
                            >
                                <Text className="text-white font-bold text-base">
                                    {isLoading ? 'Cargando...' : 'Registrarse'}
                                </Text>
                            </TouchableOpacity>

                            <GoogleButton onPress={handleGoogleLogin} />

                            <View className="flex-row justify-center mt-6">
                                <Text className="text-gray-500 font-medium">¿Ya tienes cuenta? </Text>
                                <Link href="/(auth)/login" asChild>
                                    <TouchableOpacity>
                                        <Text className="text-blue-600 font-bold">Inicia Sesión</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        </ScrollView>
                    </Animated.View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
