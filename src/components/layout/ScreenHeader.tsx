import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebounceNavigation } from '@/hooks/useDebounceNavigation';

interface ScreenHeaderProps {
    title: string;
    showBack?: boolean;
    onBack?: () => void;
    rightAction?: {
        icon: string; // MaterialCommunityIcons name
        onPress: () => void;
    };
    transparent?: boolean;
}

export const ScreenHeader = ({
    title,
    showBack = true,
    onBack,
    rightAction,
    transparent = false
}: ScreenHeaderProps) => {
    const router = useRouter();
    const { back, replace } = useDebounceNavigation();
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else if (router.canGoBack()) {
            back();
        } else {
            // Fallback if no history, e.g. from deep link
            replace('/(tabs)/home');
        }
    };

    return (
        <View style={[
            styles.container,
            {
                paddingTop: insets.top + 10,
                backgroundColor: transparent ? 'transparent' : theme.colors.surface,
                borderBottomColor: transparent ? 'transparent' : theme.colors.outlineVariant,
                borderBottomWidth: transparent ? 0 : 1,
            }
        ]}>
            <View style={styles.content}>
                <View style={styles.leftContainer}>
                    {showBack && (
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
                        </TouchableOpacity>
                    )}
                    <Text
                        style={[styles.title, { color: theme.colors.onSurface }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {title}
                    </Text>
                </View>

                {rightAction && (
                    <TouchableOpacity onPress={rightAction.onPress} style={styles.rightButton}>
                        <MaterialCommunityIcons
                            name={rightAction.icon as any}
                            size={24}
                            color={theme.colors.primary[600]}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: 12,
        paddingHorizontal: 16,
        zIndex: 10,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 44,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    backButton: {
        padding: 4,
        marginLeft: -4,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    rightButton: {
        padding: 4,
    },
});
