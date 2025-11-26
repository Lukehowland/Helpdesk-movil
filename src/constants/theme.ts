import { MD3LightTheme } from "react-native-paper";

const basicColors = {
    primary: '#007bff',    // Acciones principales
    secondary: '#6c757d',  // Acciones secundarias
    success: '#28a745',    // Estados exitosos, ticket resuelto
    warning: '#ffc107',    // Atención, ticket pendiente
    danger: '#dc3545',     // Errores, alertas críticas
    info: '#17a2b8',       // Información

    // Estados de tickets
    ticketOpen: '#28a745',
    ticketPending: '#ffc107',
    ticketResolved: '#17a2b8',
    ticketClosed: '#6c757d',
};

const customColors = {
    // Primario (azul)
    brandPrimary: {
        50: '#EFF6FF',
        100: '#DBEAFE',
        500: '#3B82F6',
        600: '#2563EB',
        700: '#1D4ED8',
    },
};

// Tipos de anuncios
const announcement = {
    maintenance: '#F59E0B',  // Amber
    incident: '#EF4444',     // Red
    news: '#3B82F6',         // Blue
    alert: '#8B5CF6',        // Purple
};

// Urgencia
const urgency = {
    low: '#22C55E',
    medium: '#EAB308',
    high: '#F97316',
    critical: '#EF4444',
};

export const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: customColors.brandPrimary[600], // Use 600 as the main primary color
        secondary: '#6c757d',
        background: '#f8f9fa',
        surface: '#ffffff',
        error: '#EF4444',

        // Custom color extensions
        ...customColors,
        announcement,
        urgency,
    },

    // Ensure elevation is present (MD3)
    elevation: MD3LightTheme.colors.elevation,

    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },
    borderRadius: {
        sm: 4,
        md: 8,
        lg: 16,
        xl: 24,
        round: 9999,
    },
};

// Export individual palettes for direct usage if needed
export const colors = theme.colors;
