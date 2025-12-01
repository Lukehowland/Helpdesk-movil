import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme, Button, ActivityIndicator, Avatar } from 'react-native-paper';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { useArticleStore } from '../../../stores/articleStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Markdown from 'react-native-markdown-display';

export default function ArticleDetailScreen() {
    const { id } = useLocalSearchParams();
    const theme = useTheme();
    const router = useRouter();
    const { getArticleById, currentArticle, isLoading } = useArticleStore();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id && typeof id === 'string') {
            loadArticle(id);
        }
    }, [id]);

    const loadArticle = async (articleId: string) => {
        try {
            await getArticleById(articleId);
        } catch (err) {
            setError('No se pudo cargar el artículo');
        }
    };

    if (isLoading || !currentArticle) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 p-4">
                <Text className="text-gray-600 mb-4">{error}</Text>
                <Button mode="contained" onPress={() => router.back()}>Volver</Button>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <ScreenHeader title="Artículo" showBack={true} />
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                {/* Header Info */}
                <View className="flex-row justify-between items-center mb-4">
                    <View className="bg-purple-100 px-3 py-1 rounded-full">
                        <Text className="text-purple-700 font-bold text-xs">
                            {currentArticle.category.name}
                        </Text>
                    </View>
                    <Text className="text-gray-500 text-xs">
                        Publicado {currentArticle.publishedAt && !isNaN(new Date(currentArticle.publishedAt).getTime())
                            ? format(new Date(currentArticle.publishedAt), 'PPP', { locale: es })
                            : 'Recientemente'}
                    </Text>
                </View>

                {/* Title */}
                <Text className="text-2xl font-bold text-gray-900 mb-4 leading-8">
                    {currentArticle.title}
                </Text>

                {/* Company & Meta */}
                <View className="flex-row items-center justify-between mb-6 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <View className="flex-row items-center">
                        {currentArticle.company.logoUrl ? (
                            <Avatar.Image size={32} source={{ uri: currentArticle.company.logoUrl }} />
                        ) : (
                            <Avatar.Text size={32} label={currentArticle.company.name.substring(0, 2).toUpperCase()} />
                        )}
                        <View className="ml-3">
                            <Text className="text-sm font-semibold text-gray-800">
                                {currentArticle.company.name}
                            </Text>
                            <Text className="text-xs text-gray-500">
                                Autor
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row gap-4">
                        <View className="items-center">
                            <MaterialCommunityIcons name="eye-outline" size={20} color="#6B7280" />
                            <Text className="text-xs text-gray-500 mt-1">{currentArticle.viewsCount || 0}</Text>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm min-h-[200px]">
                    <Markdown style={markdownStyles}>
                        {currentArticle.content}
                    </Markdown>
                </View>

                {/* Updated At */}
                <Text className="text-gray-400 text-xs text-right mt-2 mb-6">
                    Última actualización: {currentArticle.updatedAt && !isNaN(new Date(currentArticle.updatedAt).getTime())
                        ? format(new Date(currentArticle.updatedAt), 'PPP', { locale: es })
                        : 'Recientemente'}
                </Text>

                {/* Feedback */}
                <View className="items-center mb-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <Text className="text-base font-medium text-gray-800 mb-4">¿Fue útil este artículo?</Text>
                    <View className="flex-row gap-4">
                        <Button mode="outlined" icon="thumb-up-outline" onPress={() => { }} className="border-gray-300">
                            Sí
                        </Button>
                        <Button mode="outlined" icon="thumb-down-outline" onPress={() => { }} className="border-gray-300">
                            No
                        </Button>
                    </View>
                </View>

                <Button
                    mode="contained"
                    onPress={() => router.push('/(tabs)/tickets')}
                    className="mt-2"
                    buttonColor={theme.colors.primary}
                    contentStyle={{ height: 48 }}
                >
                    ¿Necesitas más ayuda? Crear Ticket
                </Button>
            </ScrollView >
        </View >
    );
}

const markdownStyles = {
    body: {
        fontSize: 16,
        lineHeight: 24,
        color: '#374151', // gray-700
    },
    heading1: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 20,
        color: '#111827', // gray-900
    },
    heading2: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 16,
        color: '#1F2937', // gray-800
    },
    paragraph: {
        marginBottom: 10,
    },
    list_item: {
        marginBottom: 5,
    },
};
