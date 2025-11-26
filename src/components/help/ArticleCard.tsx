import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { Article } from '../../types/article';

interface ArticleCardProps {
    article: Article;
    onPress: () => void;
}

export const ArticleCard = ({ article, onPress }: ArticleCardProps) => {
    const theme = useTheme();

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: theme.colors.surface }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={2}>
                    {article.title}
                </Text>
                <Text style={[styles.excerpt, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
                    {article.excerpt}
                </Text>

                <View style={styles.footer}>
                    <View style={styles.companyInfo}>
                        <MaterialCommunityIcons name="domain" size={14} color={theme.colors.onSurfaceVariant} />
                        <Text style={[styles.companyName, { color: theme.colors.onSurfaceVariant }]}>
                            {article.company.name}
                        </Text>
                    </View>
                    <View style={styles.stats}>
                        <MaterialCommunityIcons name="eye-outline" size={14} color={theme.colors.onSurfaceVariant} />
                        <Text style={[styles.statsText, { color: theme.colors.onSurfaceVariant }]}>
                            {article.viewsCount}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    content: {
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 22,
    },
    excerpt: {
        fontSize: 14,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    companyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    companyName: {
        fontSize: 12,
        fontWeight: '500',
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statsText: {
        fontSize: 12,
    },
});
