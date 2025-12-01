import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme, Searchbar, ActivityIndicator, Text } from 'react-native-paper';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { useArticleStore } from '../../../stores/articleStore';
import { ArticleCard } from '../../../components/help/ArticleCard';
import { ArticleCategoryCode } from '../../../types/article';
import { useDebounceNavigation } from '@/hooks/useDebounceNavigation';

export default function ArticlesByCategoryScreen() {
    const { code } = useLocalSearchParams();
    const router = useRouter();
    const theme = useTheme();
    const { push } = useDebounceNavigation();
    const { articles, fetchArticles, isLoading, categories } = useArticleStore();
    const [searchQuery, setSearchQuery] = useState('');

    const categoryName = categories.find(c => c.code === code)?.name || 'Artículos';

    useEffect(() => {
        if (code) {
            loadArticles();
        }
    }, [code, searchQuery]);

    const loadArticles = () => {
        fetchArticles({
            category: code as ArticleCategoryCode,
            search: searchQuery,
        });
    };

    const handlePress = (id: string) => {
        push(`/help/article/${id}`);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScreenHeader
                title={categoryName}
                showBack={true}
                onBack={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/(tabs)/help');
                    }
                }}
            />

            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Buscar en esta categoría..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    elevation={0}
                />
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary[600]} />
                </View>
            ) : (
                <FlatList
                    data={articles}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ArticleCard
                            article={item}
                            onPress={() => handlePress(item.id)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={{ color: theme.colors.onSurfaceVariant }}>
                                No se encontraron artículos
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchBar: {
        backgroundColor: '#f3f4f6',
        height: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 16,
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
});
