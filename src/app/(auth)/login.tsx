import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Checkbox } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, SlideInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../stores/authStore';
import { ControlledInput } from '../../components/ui/ControlledInput';
import { GoogleButton } from '../../components/ui/GoogleButton';
import { loginSchema, LoginFormData } from '../../schemas/auth';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const isLoading = useAuthStore((state) => state.isLoading);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const { control, handleSubmit } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            await login(data.email, data.password);
            router.replace('/(tabs)/home');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Credenciales inválidas');
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
                    <View className="h-[25%] justify-center px-8">
                        <TouchableOpacity onPress={() => router.back()} className="mb-6 w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white text-4xl font-bold mb-2">Bienvenido</Text>
                        <Text className="text-blue-100 text-lg">Inicia sesión para continuar</Text>
                    </View>

                    {/* Form Section */}
                    <Animated.View
                        entering={SlideInDown.duration(500).springify()}
                        className="flex-1 bg-white rounded-t-[32px] px-8 pt-10 shadow-2xl"
                    >
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            <View className="space-y-2">
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
                            </View>

                            <View className="flex-row justify-between items-center mt-2 mb-8">
                                <View className="flex-row items-center">
                                    <Checkbox.Android
                                        status={rememberMe ? 'checked' : 'unchecked'}
                                        onPress={() => setRememberMe(!rememberMe)}
                                        color="#2563eb"
                                    />
                                    <Text className="text-gray-600 ml-1">Recordarme</Text>
                                </View>
                                <Link href="/(auth)/forgot-password" asChild>
                                    <TouchableOpacity>
                                        <Text className="text-blue-600 font-bold text-sm">¿Olvidaste tu contraseña?</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>

                            <TouchableOpacity
                                onPress={handleSubmit(onSubmit)}
                                disabled={isLoading}
                                className="flex-row items-center justify-center bg-blue-600 rounded-xl h-14 shadow-lg shadow-blue-600/30 mb-6 active:bg-blue-700"
                            >
                                <Text className="text-white font-bold text-base">
                                    {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
                                </Text>
                            </TouchableOpacity>

                            <GoogleButton onPress={handleGoogleLogin} />

                            <View className="flex-row justify-center mt-6">
                                <Text className="text-gray-500 font-medium">¿No tienes cuenta? </Text>
                                <Link href="/(auth)/register" asChild>
                                    <TouchableOpacity>
                                        <Text className="text-blue-600 font-bold">Regístrate</Text>
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
