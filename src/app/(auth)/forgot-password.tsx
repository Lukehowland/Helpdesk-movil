import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// Button removed - using TouchableOpacity
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { client } from '../../services/api/client';
import { ControlledInput } from '../../components/ui/ControlledInput';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Schema for Step 1: Email
const emailSchema = z.object({
    email: z.string().email('Email inválido'),
});

// Schema for Step 2: Code + Password
const resetSchema = z.object({
    code: z.string().min(6, 'El código debe tener 6 caracteres'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type EmailData = z.infer<typeof emailSchema>;
type ResetData = z.infer<typeof resetSchema>;

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form for Step 1
    const { control: emailControl, handleSubmit: handleEmailSubmit } = useForm<EmailData>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: '' },
    });

    // Form for Step 2
    const { control: resetControl, handleSubmit: handleResetSubmit } = useForm<ResetData>({
        resolver: zodResolver(resetSchema),
        defaultValues: { code: '', password: '', confirmPassword: '' },
    });

    const onEmailSubmit = async (data: EmailData) => {
        setIsLoading(true);
        try {
            await client.post('/api/auth/password-reset', data);
            setEmail(data.email);
            setStep(2);
            Alert.alert('Código enviado', 'Revisa tu correo electrónico para ver el código de verificación.');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo enviar el código.');
        } finally {
            setIsLoading(false);
        }
    };

    const onResetSubmit = async (data: ResetData) => {
        setIsLoading(true);
        try {
            await client.post('/api/auth/password-reset/confirm', {
                email,
                code: data.code,
                password: data.password,
                passwordConfirmation: data.confirmPassword
            });
            Alert.alert(
                'Contraseña restablecida',
                'Tu contraseña ha sido actualizada exitosamente.',
                [{ text: 'Iniciar Sesión', onPress: () => router.replace('/(auth)/login') }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo restablecer la contraseña.');
        } finally {
            setIsLoading(false);
        }
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
                        <TouchableOpacity 
                            onPress={() => step === 1 ? router.back() : setStep(1)} 
                            className="mb-6 w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                        >
                            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white text-4xl font-bold mb-2">Recuperar Acceso</Text>
                        <Text className="text-blue-100 text-lg">
                            {step === 1 ? 'Ingresa tu email para recibir un código' : 'Ingresa el código y tu nueva contraseña'}
                        </Text>
                    </View>

                    {/* Form Section */}
                    <Animated.View
                        entering={SlideInDown.duration(500).springify()}
                        className="flex-1 bg-white rounded-t-[32px] px-8 pt-10 shadow-2xl"
                    >
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            {step === 1 ? (
                                <View>
                                    <ControlledInput
                                        control={emailControl}
                                        name="email"
                                        label="Correo Electrónico"
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        leftIcon="email-outline"
                                        placeholder="ejemplo@correo.com"
                                    />
                                    <TouchableOpacity
                                        onPress={handleEmailSubmit(onEmailSubmit)}
                                        disabled={isLoading}
                                        className="flex-row items-center justify-center bg-blue-600 rounded-xl h-14 shadow-lg shadow-blue-600/30 mt-4 active:bg-blue-700"
                                    >
                                        <Text className="text-white font-bold text-base">
                                            {isLoading ? 'Enviando...' : 'Enviar Código'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View className="space-y-2">
                                    <ControlledInput
                                        control={resetControl}
                                        name="code"
                                        label="Código de Verificación (6 dígitos)"
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        leftIcon="shield-check-outline"
                                        placeholder="123456"
                                    />
                                    <ControlledInput
                                        control={resetControl}
                                        name="password"
                                        label="Nueva Contraseña"
                                        secureTextEntry={!showPassword}
                                        leftIcon="lock-outline"
                                        rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                                        onRightIconPress={() => setShowPassword(!showPassword)}
                                        placeholder="••••••••"
                                    />
                                    <ControlledInput
                                        control={resetControl}
                                        name="confirmPassword"
                                        label="Confirmar Nueva Contraseña"
                                        secureTextEntry={!showConfirmPassword}
                                        leftIcon="lock-check-outline"
                                        rightIcon={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                        onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        placeholder="••••••••"
                                    />
                                    <TouchableOpacity
                                        onPress={handleResetSubmit(onResetSubmit)}
                                        disabled={isLoading}
                                        className="flex-row items-center justify-center bg-blue-600 rounded-xl h-14 shadow-lg shadow-blue-600/30 mt-6 active:bg-blue-700"
                                    >
                                        <Text className="text-white font-bold text-base">
                                            {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    </Animated.View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
