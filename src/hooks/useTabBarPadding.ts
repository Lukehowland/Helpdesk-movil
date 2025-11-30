import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Tab bar height in pixels (from _layout.tsx)
 */
const TAB_BAR_HEIGHT = 60;

/**
 * Additional padding to ensure content is not hidden behind tab bar
 */
const CONTENT_SPACING = 20;

/**
 * Hook that calculates the correct bottom padding for scrollable content
 * in screens with a bottom tab bar.
 * 
 * This ensures that:
 * 1. Content doesn't get hidden behind the tab bar
 * 2. Proper spacing is maintained on devices with safe area insets
 * 3. Last item in a list is fully visible with comfortable spacing
 * 
 * @returns Object with paddingBottom property ready to use in contentContainerStyle
 * 
 * @example
 * function MyScreen() {
 *   const contentPadding = useTabBarPadding();
 *   
 *   return (
 *     <FlatList
 *       data={items}
 *       renderItem={...}
 *       contentContainerStyle={contentPadding}
 *     />
 *   );
 * }
 */
export function useTabBarPadding() {
    const insets = useSafeAreaInsets();

    return useMemo(
        () => ({
            paddingBottom: TAB_BAR_HEIGHT + insets.bottom + CONTENT_SPACING,
        }),
        [insets.bottom]
    );
}
