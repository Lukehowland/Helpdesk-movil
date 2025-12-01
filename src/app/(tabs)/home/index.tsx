import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../../stores/authStore';
import { useTicketStore } from '../../../stores/ticketStore';
import { useEffect, useRef, useState } from 'react';
import { HomeSkeleton } from '../../../components/Skeleton';
import { TicketCard } from '../../../components/tickets/TicketCard';
import { useDebounceNavigation } from '@/hooks/useDebounceNavigation';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

export default function HomeScreen() {
    const { push } = useDebounceNavigation();
    const { user, isLoading: authLoading } = useAuthStore();
    const { tickets, fetchTickets, isLoading: ticketsLoading } = useTicketStore();
    const tabBarPadding = useTabBarPadding();

    const rotateAnim = useRef(new Animated.Value(0)).current;

    const waveAnimationSequence = () => {
        return Animated.sequence([
            Animated.timing(rotateAnim, {
                toValue: 20,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
                toValue: -20,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
                toValue: 20,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
            }),
        ]);
    };

    const playWaveAnimation = () => {
        waveAnimationSequence().start();
    };

    const playDoubleWaveAnimation = () => {
        waveAnimationSequence().start(() => {
            setTimeout(() => {
                waveAnimationSequence().start();
            }, 2000);
        });
    };

    useEffect(() => {
        if (!authLoading) {
            fetchTickets({ page: 1, per_page: 1 }); // Fetch only latest ticket

            // Primera animación después de 1 segundo
            const firstTimeout = setTimeout(() => {
                playWaveAnimation();
            }, 1000);

            // Segunda animación después de 3 segundos totales (2 segundos más)
            const secondTimeout = setTimeout(() => {
                playWaveAnimation();
            }, 3000);



            return () => {
                clearTimeout(firstTimeout);
                clearTimeout(secondTimeout);
            };
        }
    }, [authLoading]);

    if (authLoading) {
        return <HomeSkeleton />;
    }

    const quickActions = [
        {
            title: 'Crear Ticket',
            icon: 'plus-circle' as const,
            color: 'bg-blue-100',
            iconColor: '#2563eb',
            route: '/(tabs)/tickets/create',
        },
        {
            title: 'Mis Tickets',
            icon: 'ticket-confirmation' as const,
            color: 'bg-purple-100',
            iconColor: '#9333ea',
            route: '/(tabs)/tickets',
        },
        {
            title: 'Anuncios Recientes',
            icon: 'bullhorn' as const,
            color: 'bg-orange-100',
            iconColor: '#f97316',
            route: '/(tabs)/announcements',
        },
        {
            title: 'Centro de Ayuda',
            icon: 'help-circle' as const,
            color: 'bg-teal-100',
            iconColor: '#14b8a6',
            route: '/(tabs)/help',
        },
    ];

    return (
        <ScreenContainer backgroundColor="#f9fafb">
            <ScrollView contentContainerStyle={[{ padding: 24 }, tabBarPadding]}>
                {/* Header */}
                <View className="mb-8 flex-row items-end gap-3">
                    <View>
                        <Text className="text-blue-600 text-lg font-semibold">Bienvenido,</Text>
                        <Text className="text-4xl font-bold text-gray-900">
                            {user?.firstName || user?.displayName?.split(' ')[0] || 'Usuario'}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={playDoubleWaveAnimation}>
                        <Animated.View
                            style={{
                                transform: [
                                    {
                                        rotate: rotateAnim.interpolate({
                                            inputRange: [-20, 20],
                                            outputRange: ['-20deg', '20deg'],
                                        }),
                                    },
                                ],
                            }}
                        >
                            <MaterialCommunityIcons name="hand-wave" size={48} color="#2563eb" />
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                {/* Quick Actions */}
                <Text className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</Text>
                <View className="flex-row flex-wrap justify-between">
                    {quickActions.map((action, index) => (
                        <View key={index} className="w-[48%] mb-4 relative">
                            <TouchableOpacity
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 items-center w-full"
                                onPress={() => push(action.route as any)}
                            >
                                <View className={`p-3 rounded-full mb-3 ${action.color}`}>
                                    <MaterialCommunityIcons
                                        name={action.icon}
                                        size={24}
                                        color={action.iconColor}
                                    />
                                </View>
                                <Text className="font-medium text-gray-900">{action.title}</Text>
                            </TouchableOpacity>


                        </View>
                    ))}
                </View>

                {/* Recent Activity Section */}
                <View className="mt-4">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-gray-900">Actividad Reciente</Text>
                        <TouchableOpacity onPress={() => push('/(tabs)/tickets')}>
                            <Text className="text-blue-600 font-medium">Ver todo</Text>
                        </TouchableOpacity>
                    </View>

                    {ticketsLoading ? (
                        <View className="bg-white p-6 rounded-xl border border-gray-100 items-center justify-center h-32">
                            <MaterialCommunityIcons name="loading" size={32} color="#2563eb" className="animate-spin" />
                        </View>
                    ) : tickets.length > 0 ? (
                        <TicketCard ticket={tickets[0]} />
                    ) : (
                        <View className="bg-white p-6 rounded-xl border border-gray-100 items-center justify-center">
                            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#d1d5db" />
                            <Text className="text-gray-500 mt-2 text-center">
                                Tus tickets recientes aparecerán aquí
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </ScreenContainer>
    );
}
