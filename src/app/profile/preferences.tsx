import { View, ScrollView, Text } from 'react-native';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { List, Switch, Divider, RadioButton } from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';
import { useUserStore } from '../../stores/userStore';
import { useState, useCallback } from 'react';
import { debounce } from 'lodash';

export default function PreferencesScreen() {
    const user = useAuthStore((state) => state.user);
    const updatePreferences = useUserStore((state) => state.updatePreferences);

    const [theme, setTheme] = useState(user?.theme || 'light');
    const [language, setLanguage] = useState(user?.language || 'es');
    const [pushEnabled, setPushEnabled] = useState(user?.pushWebNotifications || false);
    const [ticketsEnabled, setTicketsEnabled] = useState(user?.notificationsTickets || false);

    // Debounced save
    const debouncedSave = useCallback(
        debounce(async (data) => {
            try {
                await updatePreferences(data);
            } catch (error) {
                console.error('Failed to save preferences', error);
            }
        }, 500),
        []
    );

    const handleThemeChange = (value: string) => {
        setTheme(value as 'light' | 'dark');
        debouncedSave({ theme: value });
    };

    const handleLanguageChange = (value: string) => {
        setLanguage(value as 'es' | 'en');
        debouncedSave({ language: value });
    };

    const handlePushChange = (value: boolean) => {
        setPushEnabled(value);
        debouncedSave({ pushWebNotifications: value });
    };

    const handleTicketsChange = (value: boolean) => {
        setTicketsEnabled(value);
        debouncedSave({ notificationsTickets: value });
    };

    if (!user) return null;

    return (
        <View className="flex-1 bg-gray-50">
            <ScreenHeader title="Preferencias" showBack={true} />
            <ScrollView className="flex-1">
                <List.Section title="Apariencia">
                    <List.Accordion
                        title="Tema"
                        description={theme === 'light' ? 'Claro' : 'Oscuro'}
                        left={(props) => <List.Icon {...props} icon="brightness-6" />}
                    >
                        <RadioButton.Group onValueChange={handleThemeChange} value={theme}>
                            <RadioButton.Item label="Claro" value="light" />
                            <RadioButton.Item label="Oscuro" value="dark" />
                        </RadioButton.Group>
                    </List.Accordion>

                    <List.Accordion
                        title="Idioma"
                        description={language === 'es' ? 'Español' : 'English'}
                        left={(props) => <List.Icon {...props} icon="translate" />}
                    >
                        <RadioButton.Group onValueChange={handleLanguageChange} value={language}>
                            <RadioButton.Item label="Español" value="es" />
                            <RadioButton.Item label="English" value="en" />
                        </RadioButton.Group>
                    </List.Accordion>
                </List.Section>

                <Divider />

                <List.Section title="Notificaciones">
                    <List.Item
                        title="Notificaciones Push"
                        description="Recibir alertas en el dispositivo"
                        left={(props) => <List.Icon {...props} icon="bell-outline" />}
                        right={() => (
                            <Switch value={pushEnabled} onValueChange={handlePushChange} color="#2563eb" />
                        )}
                    />
                    <List.Item
                        title="Actualizaciones de Tickets"
                        description="Cuando hay respuestas o cambios"
                        left={(props) => <List.Icon {...props} icon="ticket-outline" />}
                        right={() => (
                            <Switch value={ticketsEnabled} onValueChange={handleTicketsChange} color="#2563eb" />
                        )}
                    />
                </List.Section>
            </ScrollView>
        </View>
    );
}
