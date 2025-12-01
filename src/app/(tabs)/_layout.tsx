import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { GlobalHeader } from '../../components/layout/GlobalHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                header: () => <GlobalHeader />,
                tabBarActiveTintColor: theme.colors.primary[600],
                tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.outlineVariant,
                    height: 60 + insets.bottom,
                    paddingBottom: 8 + insets.bottom,
                    paddingTop: 8,
                    backgroundColor: theme.colors.surface,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="tickets"
                options={{
                    title: 'Tickets',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="ticket-confirmation" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="companies"
                options={{
                    title: 'Empresas',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="domain" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="announcements"
                options={{
                    title: 'Anuncios',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="bullhorn" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="help"
                options={{
                    title: 'Ayuda',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="help-circle" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
