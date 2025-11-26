import { Stack } from 'expo-router';

export default function ProfileLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="edit" />
            <Stack.Screen name="preferences" />
            <Stack.Screen name="sessions" />
            <Stack.Screen name="change-password" />
        </Stack>
    );
}
