import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import clsx from 'clsx';

interface ControlledInputProps<T extends FieldValues> extends TextInputProps {
    control: Control<T>;
    name: Path<T>;
    label?: string;
    leftIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
    rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
    onRightIconPress?: () => void;
    error?: string;
}

export function ControlledInput<T extends FieldValues>({
    control,
    name,
    label,
    leftIcon,
    rightIcon,
    onRightIconPress,
    className,
    ...props
}: ControlledInputProps<T>) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <Controller
            control={control}
            name={name}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <View className="mb-4">
                    {label && (
                        <Text className="text-gray-700 font-medium mb-1.5 ml-1">
                            {label}
                        </Text>
                    )}
                    <View
                        className={clsx(
                            "flex-row items-center bg-white border rounded-xl px-4 h-14 shadow-sm transition-all",
                            error ? "border-red-500 bg-red-50" : isFocused ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200",
                            className
                        )}
                    >
                        {leftIcon && (
                            <MaterialCommunityIcons
                                name={leftIcon}
                                size={22}
                                color={error ? "#ef4444" : isFocused ? "#3b82f6" : "#9ca3af"}
                                style={{ marginRight: 10 }}
                            />
                        )}
                        <TextInput
                            value={value}
                            onBlur={() => {
                                onBlur();
                                setIsFocused(false);
                            }}
                            onFocus={() => setIsFocused(true)}
                            onChangeText={onChange}
                            placeholderTextColor="#9ca3af"
                            className="flex-1 text-base text-gray-900 h-full"
                            style={{ fontFamily: 'System' }}
                            {...props}
                        />
                        {rightIcon && (
                            <TouchableOpacity onPress={onRightIconPress} disabled={!onRightIconPress}>
                                <MaterialCommunityIcons
                                    name={rightIcon}
                                    size={22}
                                    color={error ? "#ef4444" : isFocused ? "#3b82f6" : "#9ca3af"}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                    {error && (
                        <Text className="text-red-500 text-xs mt-1.5 ml-1 font-medium flex-row items-center">
                            <MaterialCommunityIcons name="alert-circle-outline" size={12} /> {error.message}
                        </Text>
                    )}
                </View>
            )}
        />
    );
}
