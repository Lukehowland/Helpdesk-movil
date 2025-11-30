import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenContainerProps extends ViewProps {
    /**
     * Whether this screen has a tab bar at the bottom.
     * If true, bottom safe area inset will NOT be applied to avoid double padding.
     * @default true
     */
    withTabBar?: boolean;

    /**
     * Background color for the container
     */
    backgroundColor?: string;

    /**
     * Children components
     */
    children: React.ReactNode;
}

/**
 * ScreenContainer component handles safe area padding for screens.
 * 
 * This component follows React Navigation best practices by:
 * - Using useSafeAreaInsets hook instead of SafeAreaView component
 * - Applying only necessary insets (never bottom when withTabBar is true)
 * - Providing consistent safe area handling across all screens
 * 
 * @example
 * // For a screen with tab bar (default)
 * <ScreenContainer>
 *   <ScrollView>...</ScrollView>
 * </ScreenContainer>
 * 
 * @example
 * // For a screen without tab bar (e.g., modal)
 * <ScreenContainer withTabBar={false}>
 *   <View>...</View>
 * </ScreenContainer>
 */
export function ScreenContainer({
    withTabBar = true,
    backgroundColor = '#f9fafb', // bg-gray-50
    children,
    style,
    ...props
}: ScreenContainerProps) {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.container,
                {
                    paddingLeft: insets.left,
                    paddingRight: insets.right,
                    // Only apply bottom inset if there's no tab bar
                    paddingBottom: withTabBar ? 0 : insets.bottom,
                    backgroundColor,
                },
                style,
            ]}
            {...props}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
