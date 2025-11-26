import { View, ScrollView, Text, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Divider } from 'react-native-paper';
import { useCompanyStore } from '@/stores/companyStore';
import { useEffect, useLayoutEffect } from 'react';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { CompanyHeader } from '@/components/companies/CompanyHeader';
import { FollowButton } from '@/components/companies/FollowButton';
import { ContactSection } from '@/components/companies/ContactSection';
import { BusinessHours } from '@/components/companies/BusinessHours';
import { CompanyTickets } from '@/components/companies/CompanyTickets';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CompanyDetailSkeleton } from '@/components/Skeleton';

export default function CompanyDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const navigation = useNavigation();
    const { fetchCompanyDetail, selectedCompany, selectedCompanyLoading, selectedCompanyError } = useCompanyStore();

    useLayoutEffect(() => {
        // Hide the tab bar and header when on detail screen
        navigation.getParent()?.setOptions({
            headerShown: false,
            tabBarStyle: { display: 'none' }
        });
        return () => {
            navigation.getParent()?.setOptions({
                headerShown: true,
                tabBarStyle: undefined
            });
        };
    }, [navigation]);

    useEffect(() => {
        if (typeof id === 'string') {
            fetchCompanyDetail(id);
        }
    }, [id]);

    if (selectedCompanyLoading || !selectedCompany) {
        return <CompanyDetailSkeleton />;
    }

    if (selectedCompanyError) {
        return (
            <View className="flex-1 bg-white">
                <ScreenHeader title="Empresa" showBack={true} />
                <View className="flex-1 justify-center items-center p-6">
                    <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
                    <Text className="text-gray-900 text-lg font-bold mt-4 text-center">Error</Text>
                    <Text className="text-gray-500 text-center mt-2">{selectedCompanyError}</Text>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <ScreenHeader title="Empresa" showBack={true} />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Header & Quick Info */}
                <CompanyHeader company={selectedCompany} />

                <Divider className="my-4 h-[1px] bg-gray-100" />

                {/* Follow Action */}
                <View className="px-6 mb-6">
                    <FollowButton
                        companyId={selectedCompany.id}
                        isFollowing={selectedCompany.isFollowedByMe}
                        companyName={selectedCompany.name}
                    />
                </View>

                {/* Description */}
                <View className="px-6 mb-6">
                    <Text className="text-lg font-bold text-gray-900 mb-2">Acerca de</Text>
                    {selectedCompany.description ? (
                        <Text className="text-gray-600 leading-relaxed text-base">
                            {selectedCompany.description}
                        </Text>
                    ) : (
                        <Text className="text-gray-400 italic">
                            Esta empresa no ha agregado una descripción.
                        </Text>
                    )}
                </View>

                <Divider className="h-2 bg-gray-50" />

                {/* Contact */}
                <ContactSection company={selectedCompany} />

                <Divider className="h-2 bg-gray-50" />

                {/* Business Hours */}
                <BusinessHours
                    hours={selectedCompany.businessHours}
                    timezone={selectedCompany.timezone}
                />

                <Divider className="h-2 bg-gray-50" />

                {/* My Tickets (Only if following) */}
                <CompanyTickets company={selectedCompany} />

                {/* Announcements Preview (Placeholder as per prompt "Anuncios recientes") */}
                {selectedCompany.isFollowedByMe && (
                    <View className="p-6 bg-white">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-gray-900">Anuncios recientes</Text>
                            <Text className="text-blue-600 font-medium">Ver todos</Text>
                        </View>
                        {selectedCompany.hasUnreadAnnouncements ? (
                            <View className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                <View className="flex-row items-center mb-2">
                                    <MaterialCommunityIcons name="bullhorn" size={16} color="#F97316" />
                                    <Text className="text-orange-700 font-bold ml-2 text-xs uppercase">Nuevo</Text>
                                </View>
                                <Text className="font-bold text-gray-900 mb-1">Tienes anuncios sin leer</Text>
                                <Text className="text-gray-600 text-sm">Revisa las últimas novedades de {selectedCompany.name}</Text>
                            </View>
                        ) : (
                            <Text className="text-gray-500 italic">No hay anuncios recientes</Text>
                        )}
                    </View>
                )}

                {/* Bottom CTA */}
                <View className="p-6 pb-10 bg-gray-50">
                    {selectedCompany.isFollowedByMe ? (
                        <View className="bg-white p-6 rounded-2xl shadow-sm items-center">
                            <MaterialCommunityIcons name="lifebuoy" size={48} color="#7C3AED" />
                            <Text className="text-xl font-bold text-gray-900 mt-4 text-center">¿Necesitas ayuda?</Text>
                            <Text className="text-gray-500 text-center mt-2 mb-6">
                                Crea un ticket de soporte para recibir asistencia personalizada.
                            </Text>
                            <TouchableOpacity
                                className="bg-[#7C3AED] w-full py-3 rounded-lg flex-row justify-center items-center"
                                onPress={() => router.push({ pathname: '/(tabs)/tickets/create', params: { companyId: selectedCompany.id } })}
                            >
                                <MaterialCommunityIcons name="ticket-account" size={20} color="white" />
                                <Text className="text-white font-bold ml-2">Crear ticket de soporte</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="bg-white p-6 rounded-2xl shadow-sm items-center">
                            <MaterialCommunityIcons name="domain" size={48} color="#9CA3AF" />
                            <Text className="text-gray-500 text-center mt-4">
                                Sigue esta empresa para crear tickets y ver sus anuncios y artículos de ayuda.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
