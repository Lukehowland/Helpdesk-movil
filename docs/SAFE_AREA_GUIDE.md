# Safe Area Handling Guide

## Overview

This guide explains how to properly handle safe areas in the Helpdesk mobile app, specifically for screens with bottom navigation (tab bar).

## The Problem

On modern devices (especially iPhones with notches/Dynamic Island), the operating system reserves certain screen areas as "safe areas" to avoid overlapping with:
- Status bar (top)
- Home indicator (bottom)
- Notches and camera cutouts
- Rounded corners

When not handled correctly, this can cause:
- Content hidden behind system UI
- Tab bar pushed down or displaced
- Inconsistent spacing between screens
- Double padding (when both the tab bar AND screen apply bottom safe area)

## Our Solution

We've created two reusable components that follow React Navigation best practices:

### 1. `ScreenContainer` Component

**Location**: `src/components/layout/ScreenContainer.tsx`

A wrapper component that handles safe area padding for full screens.

**Usage**:
```tsx
import { ScreenContainer } from '@/components/layout/ScreenContainer';

export default function MyScreen() {
    return (
        <ScreenContainer>
            {/* Your screen content */}
        </ScreenContainer>
    );
}
```

**Props**:
- `withTabBar?: boolean` - Whether screen has bottom tab bar (default: `true`)
- `backgroundColor?: string` - Background color (default: `'#f9fafb'`)
- All standard `ViewProps`

**When to use**:
- ✅ For ALL tab screens (Home, Tickets, Companies, Announcements, Help)
- ✅ For screens that need consistent safe area handling
- ❌ For modals that need custom safe area handling

---

### 2. `useTabBarPadding` Hook

**Location**: `src/hooks/useTabBarPadding.ts`

A hook that calculates correct padding for scrollable content with tab bar.

**Usage**:
```tsx
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

export default function MyScreen() {
    const tabBarPadding = useTabBarPadding();

    return (
        <ScreenContainer>
            <FlatList
                data={items}
                renderItem={...}
                contentContainerStyle={{ paddingHorizontal: 16, ...tabBarPadding }}
            />
        </ScreenContainer>
    );
}
```

**Returns**: 
```ts
{ paddingBottom: number } // Tab bar height + safe area + spacing
```

**When to use**:
- ✅ With `FlatList` or `ScrollView` `contentContainerStyle`
- ✅ When you need bottom padding that accounts for tab bar
- ❌ Don't use with `style` prop (use `contentContainerStyle` instead)

## Examples

### FlatList Screen
```tsx
import { FlatList } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

export default function MyListScreen() {
    const tabBarPadding = useTabBarPadding();

    return (
        <ScreenContainer>
            <FlatList
                data={items}
                renderItem={({ item }) => <ItemCard item={item} />}
                contentContainerStyle={{ padding: 16, ...tabBarPadding }}
            />
        </ScreenContainer>
    );
}
```

### ScrollView Screen
```tsx
import { ScrollView } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

export default function MyScrollScreen() {
    const tabBarPadding = useTabBarPadding();

    return (
        <ScreenContainer>
            <ScrollView contentContainerStyle={[{ padding: 24 }, tabBarPadding]}>
                {/* Content */}
            </ScrollView>
        </ScreenContainer>
    );
}
```

### Screen with Header + FlatList
```tsx
export default function MyScreen() {
    const tabBarPadding = useTabBarPadding();

    return (
        <ScreenContainer>
            {/* Static header */}
            <View className="px-4 pt-4">
                <Text className="text-2xl font-bold">Title</Text>
            </View>

            {/* Scrollable list */}
            <FlatList
                data={items}
                renderItem={...}
                contentContainerStyle={{ paddingHorizontal: 16, ...tabBarPadding }}
            />
        </ScreenContainer>
    );
}
```

## Anti-Patterns (Don't Do This!)

### ❌ Using SafeAreaView with `edges={['bottom']}` on tab screens
```tsx
// BAD - causes double padding with tab bar
<SafeAreaView edges={['left', 'right', 'bottom']}>
    <FlatList ... />
</SafeAreaView>
```

**Why it's bad**: The tab bar already handles bottom safe area. Adding it again creates double padding.

---

### ❌ Hardcoding bottom padding
```tsx
// BAD - doesn't account for safe areas or different devices
<FlatList
    contentContainerStyle={{ paddingBottom: 80 }}
/>
```

**Why it's bad**: Different devices have different safe area sizes. iPad, notched iPhones, and Android devices all need different padding.

---

### ❌ No safe area handling at all
```tsx
// BAD - content may be hidden behind tab bar
<View className="flex-1">
    <FlatList ... />
</View>
```

**Why it's bad**: Last items in the list will be hidden behind the tab bar.

---

### ❌ Using `style` instead of `contentContainerStyle`
```tsx
// BAD - doesn't affect scrollable area
<FlatList
    style={tabBarPadding} // Wrong!
/>
```

**Why it's bad**: `style` affects the FlatList container, not the scrollable content inside. Last items will still be hidden.

## Migration Checklist

When creating a new tab screen or migrating an existing one:

- [ ] Import `ScreenContainer` and wrap entire screen
- [ ] Import `useTabBarPadding` hook
- [ ] Call hook: `const tabBarPadding = useTabBarPadding();`
- [ ] Apply to `contentContainerStyle`: `contentContainerStyle={{ ...tabBarPadding }}`
- [ ] Remove any `SafeAreaView` with `edges={['bottom']}`
- [ ] Remove hardcoded `paddingBottom` values
- [ ] Test on device/simulator with notch (iPhone 14+)
- [ ] Verify last item is fully visible with comfortable spacing

## Architecture Benefits

This solution follows SOLID principles:

1. **Single Responsibility**: Each component has one job
   - `ScreenContainer`: Manages screen-level safe areas
   - `useTabBarPadding`: Calculates content padding

2. **Open/Closed**: Easy to extend without modifying
   - New props can be added to `ScreenContainer`
   - Hook calculation logic centralized

3. **DRY (Don't Repeat Yourself)**: 
   - No duplicate safe area logic across 5+ screens
   - Single source of truth for tab bar height

4. **Maintainability**:
   - One place to update if tab bar height changes
   - Consistent behavior across all screens

5. **Testability**:
   - Components can be tested in isolation
   - Hook logic is pure and predictable

## Questions?

If you encounter issues or have questions about safe area handling, please:
1. Check this guide first
2. Review existing tab screens (Companies, Tickets, etc.) as reference
3. Consult with the team

---

**Last Updated**: November 2025  
**Maintainer**: Development Team
