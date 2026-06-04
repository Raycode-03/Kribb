import { Text, View , FlatList, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {useFocusEffect, useRouter, } from "expo-router"
import {useUser} from "@clerk/expo"
import { useCallback, useState } from "react";
import { Property } from "../../../types";
import { supabase } from "../../../utils/supabase";
export default function HomeScreen() {
  const {user} = useUser();
  const router  = useRouter();

  const [featured , setFeatured] = useState<Property[]>([])
  const [recommended, setRecommended] = useState<Property[]>([])
  const [loading, setLoading ]= useState(true)

  const fetchPropertics = async()=>{
    setLoading(true);
    const {data: featuredData} =await supabase.from('properties')
    .select("*").eq("is_featured", true)
    .order("created_at", {ascending:false});

     const {data: recommendedData} =await supabase.from('properties')
    .select("*").eq("is_featured", false)
    .order("created_at", {ascending:false});
    setFeatured(featuredData?? [])
    setRecommended(recommendedData??[])
    setLoading(false);
  }
  useFocusEffect(
    useCallback(()=>{
      fetchPropertics();
    },[])
  )
  return (
    <View className="flex-1 justify-center items-center">
      <FlatList
        data={recommended}
        keyExtractor={(item)=>item.id}
        contentContainerStyle={{paddingBottom:100}}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View>
              <Image source={require('../../../assets/images/kribb.png')}
               style={{width:90, height:36}} resizeMode="contain"/>
            </View>
            <Text className="text-gray-900 text-lg font-bold px-5 mb-4">
              Recommended 
            </Text>
          </View>
        }

        renderItem={({ item }=> (
          <View className="px-5">
            <Text>{item.title}</Text>

          </View>
        ))}
        ListEmptyComponent={
          !loading?(
            <View className="items-center py-10">
              <Text className="text-gray-400">
                No properties found
              </Text>
            </View>
          ): null}
      />
    </View>
  );
}
