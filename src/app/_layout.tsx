import "../global.css";
import { Slot } from "expo-router";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { PaperProvider } from 'react-native-paper';
import { theme } from '../constants/theme';

import { initGlobalErrorHandler } from '../utils/errorHandler';

import { ErrorBoundary } from '../components/ErrorBoundary';

// Initialize global error handler
initGlobalErrorHandler();

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <PaperProvider theme={theme}>
                <StatusBar style="auto" />
                <ErrorBoundary>
                    <Slot />
                </ErrorBoundary>
            </PaperProvider>
        </SafeAreaProvider>
    );
}


