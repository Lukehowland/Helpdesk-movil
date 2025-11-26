import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FilterButtonProps extends TouchableOpacityProps {
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    iconSize?: number;
    iconColor?: string;
}

export function FilterButton({
    icon = 'filter-variant',
    iconSize = 20,
    iconColor = '#374151',
    className,
    ...props
}: FilterButtonProps) {
    return (
        <TouchableOpacity
            className={`bg-white items-center justify-center rounded-xl border border-gray-200 h-10 w-10 shadow-sm ${className}`}
            {...props}
        >
            <MaterialCommunityIcons name={icon} size={iconSize} color={iconColor} />
        </TouchableOpacity>
    );
}
