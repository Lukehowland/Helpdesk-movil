import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useArticleStore } from '../../stores/articleStore';
import { CategoryGrid } from '../../components/help/CategoryGrid';
import { ArticleCard } from '../../components/help/ArticleCard';
import { ArticleCategory } from '../../types/article';
import { CategoryGridSkeleton, ListItemSkeleton } from '../../components/Skeleton';
import { SearchInput } from '@/components/ui/SearchInput';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useDebounceNavigation } from '@/hooks/useDebounceNavigation';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

export default function HelpScreen() {
    const theme = useTheme();
    const { push } = useDebounceNavigation();
    const tabBarPadding = useTabBarPadding();
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
        push(`/help/category/${category.code}`);
    };

    const handleArticlePress = (id: string) => {
        push(`/help/article/${id}`);
    };

    return (
        <ScreenContainer backgroundColor={theme.colors.background}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={[styles.content, tabBarPadding]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                        Centro de Ayuda
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                        Encuentra soluciones rápidas
                    </Text>

                    <SearchInput
                        placeholder="Buscar en artículos de ayuda..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        onSubmitEditing={() => fetchArticles({ search: searchQuery })}
                    />
                </View>

                {isLoading ? (
                    <>
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
                                CATEGORÍAS
                            </Text>
                            <View style={{ paddingHorizontal: 16 }}>
                                <CategoryGridSkeleton />
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
                                ARTÍCULOS POPULARES
                            </Text>
                            <View style={styles.popularList}>
                                <ListItemSkeleton lines={2} withAvatar={false} />
                                <ListItemSkeleton lines={2} withAvatar={false} />
                                <ListItemSkeleton lines={2} withAvatar={false} />
                            </View>
                        </View>
                    </>
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
                            <View style={styles.popularList}>
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
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: 0, // Will be handled by tabBarPadding in ScrollView
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
        paddingHorizontal: 16,
    },
});
