import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useTheme, Searchbar, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useArticleStore } from '../../stores/articleStore';
import { CategoryGrid } from '../../components/help/CategoryGrid';
import { ArticleCard } from '../../components/help/ArticleCard';
import { ArticleCategory } from '../../types/article';

export default function HelpScreen() {
    const theme = useTheme();
    const router = useRouter();
    const {
        categories,
        popularArticles,
        fetchCategories,
        fetchArticles,
        fetchPopularArticles,
        isLoading
    } = useArticleStore();

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCategories();
        fetchPopularArticles();
    }, []);

    const handleCategoryPress = (category: ArticleCategory) => {
        router.push(`/help/category/${category.code}`);
    };

    const handleArticlePress = (id: string) => {
        router.push(`/help/article/${id}`);
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.content}
        >
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                    Centro de Ayuda
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Encuentra soluciones rápidas
                </Text>

                <Searchbar
                    placeholder="Buscar en artículos de ayuda..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    elevation={0}
                    onSubmitEditing={() => fetchArticles({ search: searchQuery })}
                    onIconPress={() => fetchArticles({ search: searchQuery })}
                />
            </View>

            {isLoading ? (
                <ActivityIndicator style={{ marginTop: 32 }} color={theme.colors.primary[600]} />
            ) : (
                <>
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
                            CATEGORÍAS
                        </Text>
                        <CategoryGrid
                            categories={categories}
                            onPressCategory={handleCategoryPress}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
                            ARTÍCULOS POPULARES
                        </Text>
                        <View style={[styles.popularList, { backgroundColor: theme.colors.surface }]}>
                            {popularArticles.map((article) => (
                                <ArticleCard
                                    key={article.id}
                                    article={article}
                                    onPress={() => handleArticlePress(article.id)}
                                />
                            ))}
                        </View>
                    </View>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: 32,
    },
    header: {
        padding: 16,
        gap: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 16,
    },
    searchBar: {
        backgroundColor: '#fff',
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    popularList: {
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
});
