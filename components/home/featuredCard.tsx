import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { Image, Text, TouchableOpacity, View } from "react-native";
import { formatPrice } from "../../lib/helpers/formatPrice";
import { Property } from "../../types";
export default function featuredCard({ property }: { property: Property }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      className="w-72 mr-2 rounded-3xl overflow-hidden bg-white mb-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        opacity: property.is_sold ? 0.5 : 1,
      }}
      onPress={() => router.push(`/(root)/property/${property.id}`)}
    >
      <Image
        source={{
          uri:
            property.images.length > 0
              ? property.images[0]
              : require("@/assets/images/kribb.png"),
        }}
        className="w-full h-44"
        resizeMode="cover"
      />
      <View
        className="absolute top-3 left-3 bg-white/90 px-3 py-1
            rounded-full"
      >
        <Text className="text-xs font-semibold text-blue-600 capitalize">
          {property.type}
        </Text>
      </View>
      {property.is_sold && (
        <View
          className="absolute top-3 right-3 bg-red-500 px-3 py-1
            rounded-full"
        >
          <Text className="text-xs font-semibold text-white">Sold</Text>
        </View>
      )}

      <View className="p-4">
        <Text className="text-base mb-1 text-gray-800 " numberOfLines={1}>
          {property.title}
        </Text>
        <View className="flex-row items-center gap-1 mb-3">
          <Ionicons name="location-outline" size={13} color={"#6B7280"} />
          <Text className="text-base mb-1 text-gray-800 " numberOfLines={1}>
            {property.address}, {property.title}
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-blue-600 font-bold text-base">
            {formatPrice(property.price)}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="bed-outline" size={13} color="#6B7280" />
            <Text className="text-xs text-gray-500">{property.bedrooms}</Text>
          </View>

          <View className="flex-row items-center gap-1">
            <Ionicons name="water-outline" size={13} color="#6B7280" />
            <Text className="text-xs text-gray-500">{property.bathrooms}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
