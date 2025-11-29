import { View, Text, TouchableOpacity } from 'react-native';
import { Avatar, Chip } from 'react-native-paper';
import { CompanyExploreItem } from '@/types/company';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDebounceNavigation } from '@/hooks/useDebounceNavigation';

interface CompanyCardProps {
    company: CompanyExploreItem;
}

export function CompanyCard({ company }: CompanyCardProps) {
    const { push } = useDebounceNavigation();

    return (
        <TouchableOpacity
            className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100"
            onPress={() => push(`/(tabs)/companies/${company.id}`)}
            activeOpacity={0.7}
        >
            <View className="flex-row">
                {/* Avatar */}
                <View className="mr-4">
                    {company.logoUrl ? (
                        <Avatar.Image
                            size={56}
                            source={{ uri: company.logoUrl }}
                            style={{ borderRadius: 12, backgroundColor: 'transparent' }}
                        />
                    ) : (
                        <View
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 12,
                                backgroundColor: company.primaryColor || '#007bff',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <Text className="text-white font-bold text-xl">
                                {company.name.substring(0, 2).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Content */}
                <View className="flex-1 justify-center">
                    <View className="flex-row justify-between items-start">
                        <Text className="font-bold text-lg text-gray-900 flex-1 mr-2" numberOfLines={2}>
                            {company.name}
                        </Text>

                        {company.isFollowedByMe && (
                            <View className="bg-green-100 px-2 py-1 rounded-full flex-row items-center">
                                <MaterialCommunityIcons name="check" size={12} color="#16A34A" />
                                <Text className="text-green-600 text-[10px] font-bold ml-1">
                                    Siguiendo
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text className="text-gray-500 text-sm font-medium mt-1">
                        {company.industry.name}
                    </Text>

                    <View className="flex-row items-center mt-2">
                        <MaterialCommunityIcons name="map-marker-outline" size={14} color="#6B7280" />
                        <Text className="text-gray-500 text-xs ml-1 mr-3">
                            {company.city}, {company.country}
                        </Text>

                        <MaterialCommunityIcons name="account-group-outline" size={14} color="#6B7280" />
                        <Text className="text-gray-500 text-xs ml-1">
                            {company.followersCount} seguidores
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}
