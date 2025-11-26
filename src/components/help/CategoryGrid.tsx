import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { ArticleCategory } from '../../types/article';

interface CategoryGridProps {
    categories: ArticleCategory[];
    onPressCategory: (category: ArticleCategory) => void;
}

const getCategoryIcon = (code: string, apiIcon?: string): string => {
    if (apiIcon && apiIcon !== 'help-circle') return apiIcon;

    switch (code) {
        case 'ACCOUNT_PROFILE': return 'account-cog';
        case 'SECURITY_PRIVACY': return 'shield-check';
        case 'BILLING_PAYMENTS': return 'credit-card-outline';
        case 'TECHNICAL_SUPPORT': return 'wrench';
        default: return 'help-circle';
    }
};

export const CategoryGrid = ({ categories, onPressCategory }: CategoryGridProps) => {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            {categories.map((category) => (
                <TouchableOpacity
                    key={category.code}
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.outlineVariant,
                        }
                    ]}
                    onPress={() => onPressCategory(category)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary[50] }]}>
                        <MaterialCommunityIcons
                            name={getCategoryIcon(category.code, category.icon) as any}
                            size={32}
                            color={theme.colors.primary}
                        />
                    </View>
                    <Text style={[styles.name, { color: theme.colors.onSurface }]}>
                        {category.name}
                    </Text>
                    <Text style={[styles.count, { color: theme.colors.onSurfaceVariant }]}>
                        {category.articleCount} artículos
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingHorizontal: 16,
    },
    card: {
        width: '48%', // Approx half width minus gap
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 140,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    name: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    count: {
        fontSize: 12,
    },
});
