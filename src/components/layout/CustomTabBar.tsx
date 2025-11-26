import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

interface Tab {
    name: string;
    icon: string;
    label: string;
}

const TABS: Tab[] = [
    { name: 'home', icon: 'home', label: 'Inicio' },
    { name: 'tickets', icon: 'ticket-confirmation', label: 'Tickets' },
    { name: 'companies', icon: 'domain', label: 'Empresas' },
    { name: 'announcements', icon: 'bullhorn', label: 'Anuncios' },
    { name: 'help', icon: 'help-circle', label: 'Ayuda' },
];

export function CustomTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
    const theme = useTheme();

    const handleTabPress = (index: number, isFocused: boolean) => {
        const route = state.routes[index];
        if (!isFocused) {
            navigation.navigate(route.name);
        }
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.surfaceVariant,
                },
            ]}
        >
            <View style={styles.tabsWrapper}>
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;
                    const tab = TABS[index];

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={() => handleTabPress(index, isFocused)}
                            activeOpacity={0.7}
                            style={styles.tabButton}
                        >
                            {/* Active background circle */}
                            {isFocused && (
                                <View
                                    style={[
                                        styles.activeBackground,
                                        {
                                            backgroundColor: `${theme.colors.primary}15`,
                                        },
                                    ]}
                                />
                            )}

                            {/* Icon container */}
                            <View
                                style={[
                                    styles.iconContainer,
                                    isFocused && {
                                        transform: [{ scale: 1.2 }],
                                    },
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name={tab.icon as any}
                                    size={isFocused ? 28 : 24}
                                    color={
                                        isFocused
                                            ? theme.colors.primary
                                            : theme.colors.onSurfaceVariant
                                    }
                                />
                            </View>

                            {/* Label */}
                            {isFocused && (
                                <View style={styles.labelContainer}>
                                    <Text
                                        style={[
                                            styles.label,
                                            {
                                                color: theme.colors.primary,
                                            },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {tab.label}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 8,
        paddingTop: 8,
        paddingHorizontal: 8,
        borderTopWidth: 1,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tabsWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        position: 'relative',
    },
    activeBackground: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        top: '50%',
        left: '50%',
        marginLeft: -25,
        marginTop: -25,
    },
    iconContainer: {
        zIndex: 1,
        paddingVertical: 8,
    },
    labelContainer: {
        marginTop: 4,
        zIndex: 2,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        maxWidth: 60,
    },
});
