import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import {
    SkeletonBox,
    SkeletonCircle,
    SkeletonText,
    ListItemSkeleton,
    CardSkeleton,
    FormSkeleton,
    TicketCardSkeleton,
    AnnouncementCardSkeleton
} from './index';

export default function SkeletonExamples() {
    return (
        <ScrollView className="flex-1 bg-white p-4">
            <Text className="text-xl font-bold mb-4">Skeleton System Examples</Text>

            <Section title="Atoms">
                <View className="flex-row items-center gap-4 mb-2">
                    <SkeletonCircle size={50} />
                    <View>
                        <SkeletonBox width={120} height={20} className="mb-2" />
                        <SkeletonBox width={80} height={16} />
                    </View>
                </View>
                <SkeletonText lines={3} />
            </Section>

            <Section title="Molecules: List Item">
                <ListItemSkeleton withAvatar={true} />
                <ListItemSkeleton withAvatar={false} lines={1} />
            </Section>

            <Section title="Molecules: Card">
                <CardSkeleton />
            </Section>

            <Section title="Molecules: Form">
                <FormSkeleton fields={3} />
            </Section>

            <Section title="Organisms: Ticket Card">
                <TicketCardSkeleton />
            </Section>

            <Section title="Organisms: Announcement Card">
                <AnnouncementCardSkeleton />
            </Section>
        </ScrollView>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-700 mb-3">{title}</Text>
            <View className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                {children}
            </View>
        </View>
    );
}
