import { TouchableOpacity, Text, View, TouchableOpacityProps } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FilterPillProps extends TouchableOpacityProps {
    label: string;
    isSelected?: boolean;
    showCheck?: boolean;
}

export function FilterPill({
    label,
    isSelected = false,
    showCheck = true,
    className,
    ...props
}: FilterPillProps) {
    return (
        <TouchableOpacity
            className={`mr-2 px-4 h-10 rounded-lg justify-center items-center border shadow-sm ${isSelected
                    ? 'border-blue-500 bg-white'
                    : 'border-gray-300 bg-white'
                } ${className}`}
            {...props}
        >
            <View className="flex-row items-center gap-1">
                <Text className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                    {label}
                </Text>
                {isSelected && showCheck && (
                    <MaterialCommunityIcons name="check" size={12} color="#2563EB" />
                )}
            </View>
        </TouchableOpacity>
    );
}
