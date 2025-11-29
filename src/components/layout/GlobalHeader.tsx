import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebounceNavigation } from '@/hooks/useDebounceNavigation';

export const GlobalHeader = () => {
    const { user } = useAuthStore();
    const { push } = useDebounceNavigation();
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const getInitials = () => {
        if (!user) return 'U';
        if (user.firstName && user.lastName) {
            return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        }
        return (user.displayName || 'U').substring(0, 2).toUpperCase();
    };

    const handleProfilePress = () => {
        push('/profile');
    };

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: theme.colors.surface,
                paddingTop: insets.top + 10,
                borderBottomColor: theme.colors.outlineVariant,
            }
        ]}>
            <View style={styles.content}>
                {/* Logo / Title */}
                <View style={styles.leftContainer}>
                    <MaterialCommunityIcons name="lifebuoy" size={24} color={theme.colors.primary[600]} />
                    <Text style={[styles.title, { color: theme.colors.onSurface }]}>Helpdesk</Text>
                </View>

                {/* Right Actions */}
                <View style={styles.rightContainer}>
                    <TouchableOpacity style={styles.iconButton}>
                        <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.onSurfaceVariant} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleProfilePress} style={styles.avatarContainer}>
                        {user?.avatarUrl ? (
                            <Image
                                source={{ uri: user.avatarUrl }}
                                style={styles.avatarImage}
                            />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary[600] }]}>
                                <Text style={styles.avatarText}>{getInitials()}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconButton: {
        padding: 4,
    },
    avatarContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
