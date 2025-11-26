import { View, Text, TouchableOpacity } from 'react-native';
import { Avatar } from 'react-native-paper';
import { Ticket } from '@/types/ticket';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TicketCardProps {
    ticket: Ticket;
}

export function TicketCard({ ticket }: TicketCardProps) {
    const router = useRouter();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'resolved': return 'bg-blue-100 text-blue-800';
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
        <TouchableOpacity
            className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100"
            onPress={() => router.push(`/(tabs)/tickets/${ticket.ticketCode}`)}
        >
            <View className="flex-row justify-between items-start mb-2">
                <Text className="text-gray-500 font-mono text-xs">{ticket.ticketCode}</Text>
                <View className={`px-2 py-0.5 rounded-full ${getStatusColor(ticket.status).split(' ')[0]}`}>
                    <Text className={`text-xs font-bold ${getStatusColor(ticket.status).split(' ')[1]}`}>
                        {getStatusLabel(ticket.status)}
                    </Text>
                </View>
            </View>

            <Text className="font-bold text-lg text-gray-900 mb-1" numberOfLines={2}>
                {ticket.title}
            </Text>

            <View className="flex-row items-center mb-3">
                {ticket.company ? (
                    <>
                        {ticket.company.logoUrl ? (
                            <Avatar.Image size={20} source={{ uri: ticket.company.logoUrl }} />
                        ) : (
                            <Avatar.Text size={20} label={ticket.company.name.substring(0, 2)} />
                        )}
                        <Text className="text-gray-600 text-xs ml-2">{ticket.company.name}</Text>
                    </>
                ) : null}
            </View>

            <View className="flex-row justify-between items-center border-t border-gray-100 pt-3">
                <Text className="text-gray-400 text-xs">
                    {ticket.createdAt ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: es }) : '-'}
                </Text>

                <View className="flex-row items-center">
                    {ticket.lastResponseAuthorType === 'agent' && (
                        <View className="bg-red-100 rounded-full w-2 h-2 mr-2" />
                    )}
                    <MaterialCommunityIcons
                        name={ticket.lastResponseAuthorType === 'agent' ? 'account-tie' : 'account'}
                        size={16}
                        color="#6b7280"
                    />
                </View>
            </View>
        </TouchableOpacity>
    );
}
