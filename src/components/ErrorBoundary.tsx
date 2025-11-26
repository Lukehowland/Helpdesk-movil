import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { logger } from '../utils/logger';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        logger.error('UI Render Error Caught by Boundary', error, 'ErrorBoundary');
        logger.error('Component Stack', errorInfo.componentStack, 'ErrorBoundary');
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#EF4444" />
                    <Text style={styles.title}>¡Ups! Algo salió mal</Text>
                    <Text style={styles.subtitle}>
                        Hemos detectado un error inesperado. Nuestro equipo ha sido notificado.
                    </Text>

                    <ScrollView style={styles.errorContainer}>
                        <Text style={styles.errorText}>
                            {this.state.error?.toString()}
                        </Text>
                    </ScrollView>

                    <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                        <Text style={styles.buttonText}>Intentar de nuevo</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    errorContainer: {
        maxHeight: 200,
        width: '100%',
        backgroundColor: '#F3F4F6',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
    },
    errorText: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#EF4444',
    },
    button: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
