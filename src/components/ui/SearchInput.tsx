import { View, TextInput, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SearchInputProps extends TextInputProps {
    containerStyle?: StyleProp<ViewStyle>;
}

export function SearchInput({ containerStyle, style, ...props }: SearchInputProps) {
    return (
        <View
            className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 h-12 shadow-sm"
            style={containerStyle}
        >
            <MaterialCommunityIcons name="magnify" size={24} color="#9CA3AF" />
            <TextInput
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-2 text-base text-gray-900 h-full"
                style={[{ fontFamily: 'System' }, style]}
                {...props}
            />
        </View>
    );
}
