import { View, FlatList, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { List, ActivityIndicator } from 'react-native-paper';
import { useTicketStore } from '@/stores/ticketStore';
import { useEffect, useState } from 'react';
import { Ticket, Attachment } from '@/types/ticket';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TicketAttachmentsProps {
    ticket: Ticket;
}

export function TicketAttachments({ ticket }: TicketAttachmentsProps) {
    const { currentTicketResponses, fetchTicketResponses, isLoading } = useTicketStore();
    const [allAttachments, setAllAttachments] = useState<Attachment[]>([]);

    useEffect(() => {
        // Ensure we have responses to extract attachments
        if (currentTicketResponses.length === 0) {
            fetchTicketResponses(ticket.ticketCode);
        }
    }, [ticket.ticketCode]);

    useEffect(() => {
        const responseAttachments = currentTicketResponses.flatMap(r => r.attachments || []);
        const ticketAttachments = ticket.attachments || [];
        setAllAttachments([...ticketAttachments, ...responseAttachments]);
    }, [currentTicketResponses, ticket.attachments]);

    const handleOpenAttachment = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'No se puede abrir este archivo');
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error al intentar abrir el archivo');
        }
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes('image')) return 'file-image';
        if (mimeType.includes('pdf')) return 'file-pdf-box';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'file-word';
        if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'file-excel';
        return 'file';
    };

    if (isLoading && currentTicketResponses.length === 0) {
        return (
            <View className="flex-1 justify-center items-center p-4">
                <ActivityIndicator size="small" color="#2563eb" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <FlatList
                data={allAttachments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={() => (
                    <View className="items-center justify-center mt-10">
                        <MaterialCommunityIcons name="paperclip" size={48} color="#d1d5db" />
                        <Text className="text-gray-500 mt-2">No hay archivos adjuntos</Text>
                    </View>
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleOpenAttachment(item.fileUrl)}>
                        <List.Item
                            title={item.fileName}
                            description={`${format(new Date(item.createdAt), "d MMM yyyy, HH:mm", { locale: es })} • ${(item.fileSizeBytes / 1024).toFixed(1)} KB`}
                            left={(props) => <List.Icon {...props} icon={getFileIcon(item.fileType)} />}
                            right={(props) => <List.Icon {...props} icon="download" />}
                            className="border-b border-gray-100"
                        />
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}
