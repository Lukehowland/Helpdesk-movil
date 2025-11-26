import { View, ScrollView, Text, Alert, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, Button, Chip, Divider, FAB } from 'react-native-paper';
import { useTicketStore } from '@/stores/ticketStore';
import { useEffect, useState } from 'react';
import { Ticket } from '@/types/ticket';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TicketConversation } from '@/components/tickets/TicketConversation';
import { TicketAttachments } from '@/components/tickets/TicketAttachments';
import { TicketDetailSkeleton } from '@/components/Skeleton';

export default function TicketDetailScreen() {
    const { ticketCode } = useLocalSearchParams();
    const router = useRouter();
    const { fetchTicket, currentTicket, isLoading, reopenTicket } = useTicketStore();
    const [tab, setTab] = useState<'conversation' | 'info' | 'attachments'>('conversation');

    useEffect(() => {
        if (typeof ticketCode === 'string') {
            fetchTicket(ticketCode).catch(() => {
                Alert.alert('Error', 'No se pudo cargar el ticket');
                router.back();
            });
        }
    }, [ticketCode]);

    const handleShare = async () => {
        if (!currentTicket) return;
        try {
            await Share.share({
                message: `Ticket ${currentTicket.ticketCode}: ${currentTicket.title}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleReopen = async () => {
        if (!currentTicket) return;
        try {
            await reopenTicket(currentTicket.ticketCode);
            Alert.alert('Ticket Reabierto', 'El ticket ha sido reabierto exitosamente.');
        } catch (error) {
            Alert.alert('Error', 'No se pudo reabrir el ticket');
        }
    };

    if (isLoading || !currentTicket) {
        return <TicketDetailSkeleton />;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'open': return 'ABIERTO';
            case 'pending': return 'PENDIENTE';
            case 'resolved': return 'RESUELTO';
            case 'closed': return 'CERRADO';
            default: return status.toUpperCase();
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            {/* Header */}
            <View className="bg-white p-4 border-b border-gray-200 shadow-sm z-10">
                <View className="flex-row justify-between items-center mb-2">
                    <TouchableOpacity onPress={() => router.back()}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-gray-900">{currentTicket.ticketCode}</Text>
                    <TouchableOpacity onPress={handleShare}>
                        <MaterialCommunityIcons name="share-variant" size={24} color="#374151" />
                    </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between mt-2">
                    <View className={`px-3 py-1 rounded-full ${getStatusColor(currentTicket.status).split(' ')[0]}`}>
                        <Text className={`font-bold ${getStatusColor(currentTicket.status).split(' ')[1]}`}>
                            {getStatusLabel(currentTicket.status)}
                        </Text>
                    </View>
                    <Text className="text-gray-500 text-xs">
                        {format(new Date(currentTicket.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                    </Text>
                </View>

                <Text className="text-xl font-bold text-gray-900 mt-3 leading-tight">
                    {currentTicket.title}
                </Text>

                <View className="flex-row items-center mt-3">
                    {currentTicket.company?.logoUrl ? (
                        <Avatar.Image size={24} source={{ uri: currentTicket.company.logoUrl }} />
                    ) : (
                        <Avatar.Text size={24} label={currentTicket.company?.name?.substring(0, 2) || 'NA'} />
                    )}
                    <Text className="text-gray-600 ml-2 font-medium">{currentTicket.company?.name || 'Sin Empresa'}</Text>
                </View>
            </View>

            {/* Tabs */}
            <View className="flex-row bg-white border-b border-gray-200">
                <TouchableOpacity
                    className={`flex-1 p-3 items-center border-b-2 ${tab === 'conversation' ? 'border-blue-600' : 'border-transparent'}`}
                    onPress={() => setTab('conversation')}
                >
                    <Text className={`${tab === 'conversation' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>Conversación</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 p-3 items-center border-b-2 ${tab === 'info' ? 'border-blue-600' : 'border-transparent'}`}
                    onPress={() => setTab('info')}
                >
                    <Text className={`${tab === 'info' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>Info</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 p-3 items-center border-b-2 ${tab === 'attachments' ? 'border-blue-600' : 'border-transparent'}`}
                    onPress={() => setTab('attachments')}
                >
                    <Text className={`${tab === 'attachments' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>Adjuntos</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="flex-1">
                {tab === 'conversation' && (
                    <TicketConversation ticket={currentTicket} />
                )}

                {tab === 'info' && (
                    <ScrollView className="p-4">
                        <View className="bg-white p-4 rounded-xl border border-gray-100 mb-4">
                            <Text className="text-gray-500 text-xs uppercase font-bold mb-2">Descripción Inicial</Text>
                            <Text className="text-gray-800 leading-relaxed">{currentTicket.description}</Text>
                        </View>

                        <View className="bg-white p-4 rounded-xl border border-gray-100 mb-4">
                            <Text className="text-gray-500 text-xs uppercase font-bold mb-3">Detalles</Text>
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-600">Categoría</Text>
                                <Text className="font-medium text-gray-900">{currentTicket.category?.name || 'Sin Categoría'}</Text>
                            </View>
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-600">Creado</Text>
                                <Text className="font-medium text-gray-900">{format(new Date(currentTicket.createdAt), "d MMM yyyy, HH:mm", { locale: es })}</Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-gray-600">Actualizado</Text>
                                <Text className="font-medium text-gray-900">{format(new Date(currentTicket.updatedAt), "d MMM yyyy, HH:mm", { locale: es })}</Text>
                            </View>
                        </View>

                        {currentTicket.ownerAgent && (
                            <View className="bg-white p-4 rounded-xl border border-gray-100 mb-4 flex-row items-center">
                                {currentTicket.ownerAgent.avatarUrl ? (
                                    <Avatar.Image size={40} source={{ uri: currentTicket.ownerAgent.avatarUrl }} />
                                ) : (
                                    <Avatar.Icon size={40} icon="account" />
                                )}
                                <View className="ml-3">
                                    <Text className="font-bold text-gray-900">{currentTicket.ownerAgent.displayName}</Text>
                                    <Text className="text-gray-500 text-xs">Agente Asignado</Text>
                                </View>
                            </View>
                        )}

                        {currentTicket.status === 'closed' && (
                            <Button
                                mode="contained"
                                onPress={handleReopen}
                                className="bg-gray-800"
                            >
                                Reabrir Ticket
                            </Button>
                        )}
                    </ScrollView>
                )}

                {tab === 'attachments' && (
                    <TicketAttachments ticket={currentTicket} />
                )}
            </View>
        </SafeAreaView>
    );
}
