import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme, Button, ActivityIndicator, Divider } from 'react-native-paper';
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary[600]} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text>{error}</Text>
                <Button onPress={() => router.back()}>Volver</Button>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScreenHeader title="Artículo" showBack={true} />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.categoryBadge}>
                        <Text style={[styles.categoryText, { color: theme.colors.primary[600] }]}>
                            {currentArticle.category.name}
                        </Text>
                    </View>
                    <Text style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
                        Actualizado {format(new Date(currentArticle.updatedAt), 'PPP', { locale: es })}
                    </Text>
                </View>

                <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                    {currentArticle.title}
                </Text>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="domain" size={14} color={theme.colors.onSurfaceVariant} />
                        <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                            {currentArticle.company.name}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="eye-outline" size={14} color={theme.colors.onSurfaceVariant} />
                        <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                            {currentArticle.viewsCount} vistas
                        </Text>
                    </View>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.body}>
                    <Markdown style={markdownStyles}>
                        {currentArticle.content}
                    </Markdown>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackTitle}>¿Fue útil este artículo?</Text>
                    <View style={styles.feedbackButtons}>
                        <Button mode="outlined" icon="thumb-up-outline" onPress={() => { }}>
                            Sí
                        </Button>
                        <Button mode="outlined" icon="thumb-down-outline" onPress={() => { }}>
                            No
                        </Button>
                    </View>
                </View>

                <Button
                    mode="contained"
                    onPress={() => router.push('/(tabs)/tickets')}
                    style={styles.actionButton}
                    buttonColor={theme.colors.primary[600]}
                >
                    ¿Necesitas más ayuda? Crear Ticket
                </Button>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryBadge: {
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    categoryText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    date: {
        fontSize: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        lineHeight: 32,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
    },
    divider: {
        marginVertical: 20,
    },
    body: {
        minHeight: 200,
    },
    feedbackContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    feedbackTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 12,
    },
    feedbackButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        marginTop: 10,
    },
});

const markdownStyles = {
    body: {
        fontSize: 16,
        lineHeight: 24,
    },
};
