import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar, useTheme } from 'react-native-paper';
import { Article } from '../../types/article';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ArticleCardProps {
    article: Article;
    onPress: () => void;
}

export const ArticleCard = ({ article, onPress }: ArticleCardProps) => {
    const theme = useTheme();

    return (
        <TouchableOpacity
            className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100"
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Header: Category and Date */}
            <View className="flex-row justify-between items-start mb-2">
                <View className="bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">
                    <Text className="text-purple-700 text-xs font-bold">
                        {article.category.name}
                    </Text>
                </View>
                <Text className="text-gray-400 text-xs">
                    {article.publishedAt && !isNaN(new Date(article.publishedAt).getTime())
                        ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: es })
                        : 'Reciente'}
                </Text>
            </View>

            {/* Content: Title and Excerpt */}
            <View className="mb-3">
                <Text className="font-bold text-lg text-gray-900 mb-1" numberOfLines={2}>
                    {article.title}
                </Text>
                <Text className="text-gray-500 text-sm leading-5" numberOfLines={2}>
                    {article.excerpt}
                </Text>
            </View>

            {/* Footer: Company and Stats */}
            <View className="flex-row items-center justify-between pt-2 border-t border-gray-50">
                <View className="flex-row items-center">
                    {article.company.logoUrl ? (
                        <Avatar.Image size={20} source={{ uri: article.company.logoUrl }} />
                    ) : (
                        <Avatar.Text size={20} label={article.company.name.substring(0, 2).toUpperCase()} />
                    )}
                    <Text className="text-gray-600 text-xs ml-2 font-medium">
                        {article.company.name}
                    </Text>
                </View>

                <View className="flex-row items-center gap-3">
                    <View className="flex-row items-center">
                        <MaterialCommunityIcons name="eye-outline" size={14} color="#9CA3AF" />
                        <Text className="text-gray-400 text-xs ml-1">{article.viewsCount || 0}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};
