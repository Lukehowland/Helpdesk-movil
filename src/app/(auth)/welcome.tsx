import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-blue-600">
            <StatusBar style="light" />
            <SafeAreaView className="flex-1">
                <View className="flex-1 items-center justify-center px-6">
                    {/* Logo y Título - Centrados */}
                    <Animated.View 
                        entering={FadeIn.duration(600)}
                        className="items-center"
                    >
                        <View className="bg-white/20 p-6 rounded-3xl mb-6 backdrop-blur-md">
                            <Text className="text-white text-6xl font-bold tracking-tighter">HD</Text>
                        </View>
                        <Text className="text-3xl font-bold text-center text-white mb-2">
                            Helpdesk Móvil
                        </Text>
                        <Text className="text-blue-100 text-lg text-center font-medium">
                            Tu soporte, en todas partes
                        </Text>
                    </Animated.View>

                    {/* Botones - Parte inferior con separación */}
                    <Animated.View 
                        entering={FadeInUp.delay(300).duration(800).springify()}
                        className="w-full absolute bottom-12 px-6"
                    >
                        <View className="gap-4">
                            {/* Botón Iniciar Sesión */}
                            <TouchableOpacity
                                onPress={() => router.push('/(auth)/login')}
                                className="flex-row items-center justify-center bg-white rounded-xl h-14 shadow-lg active:bg-gray-50"
                            >
                                <Text className="text-blue-600 font-bold text-base">
                                    Iniciar Sesión
                                </Text>
                            </TouchableOpacity>

                            {/* Botón Crear Cuenta */}
                            <TouchableOpacity
                                onPress={() => router.push('/(auth)/register')}
                                className="flex-row items-center justify-center bg-white/10 border-2 border-white/50 rounded-xl h-14 active:bg-white/20"
                            >
                                <Text className="text-white font-bold text-base">
                                    Crear Cuenta
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </SafeAreaView>
        </View>
    );
}
