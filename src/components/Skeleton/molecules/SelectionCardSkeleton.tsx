import React from 'react';
import { View } from 'react-native';
import { SkeletonBox } from '../atoms/SkeletonBox';
import { SkeletonText } from '../atoms/SkeletonText';

export function SelectionCardSkeleton() {
    return (
        <View className="p-4 mb-3 rounded-xl border border-gray-200 bg-white">
            <View className="flex-row justify-between items-center mb-2">
                <SkeletonBox width="60%" height={20} />
                <SkeletonBox width={20} height={20} borderRadius={10} />
            </View>
            <SkeletonText lines={2} lineHeight={14} />
        </View>
    );
}
