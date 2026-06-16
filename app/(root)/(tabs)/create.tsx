import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
const TYPES = ["apartment", "house", "villa", "studio"] as const;
import { FormState } from "../../../types";
import { useRouter } from "expo-router";
import { useSupabase } from "../../../store/useSupabase";
import { ScrollView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { toast } from "sonner-native";
import { TextInput } from "react-native";
type FormValues = Omit<
  FormState,
  "id" | "created_at" | "price" | "area_sqft" | "latitude" | "longtitude"
> & {
  price: string;
  area_sqft: string;
  latitude: string;
  longtitude: string;
};

const INITIAL_FORM: FormValues = {
  title: "",
  description: "",
  price: "",
  type: "apartment",
  bedrooms: 1,
  bathrooms: 1,
  area_sqft: "",
  address: "",
  city: "",
  latitude: "",
  longtitude: "",
  is_featured: false,
  images: [],
  localImages: [],
};
type PropertyType = (typeof TYPES)[number];
const MIN_PRICE = 1;
const MAX_PRICE = 999_999_999;
const inputClass =
  "bg-white border border-gray-200 rounded-2xl px-4 py-3 text-gray-800";
const labelClass = "text-sm font-semibold text-gray-700 mb-1.5";
const sectionClass = "mb-5";

export default function create() {
  const router = useRouter();
  const authSupabase = useSupabase();
  const [form, setForm] = useState<FormValues>(INITIAL_FORM);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const updateForm = (fields: Partial<FormValues>) =>
    setForm((prev) => ({ ...prev, ...fields }));
  const handlePickImages = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
      selectionLimit: 6,
    });
    if(result.canceled) return
    setUploadingImages(true);

    const uploadedUrls: string[]=[];
    const previewUris: string[]=[];
    for(const asset of result.assets){
      try{
        const filename= `property_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
        const base64 = asset.base64!;
        const buffer = Uint8Array.from(atob(base64),(c)=>c.charCodeAt(0));
        const {error} = await authSupabase.storage.from("property-images").upload(filename, buffer,{
          contentType:"image/jpeg",
          upsert:false,
        })
        if(error) throw error
        const {data: urlData} = authSupabase.storage.from("property-images").getPublicUrl(filename);
        uploadedUrls.push(urlData.publicUrl);
        previewUris.push(asset.uri);
      }catch(err){
        toast.error("Upload Failed ,One or more images failed to upload.")
      }
    }

    updateForm({
      images:[...form.images, ...uploadedUrls],
      localImages:[...form.localImages, ...previewUris],
    })
    setUploadingImages(false);
  };
  const handleRemoveImage = (index: number) => {
    updateForm({
      images:form.images.filter((_,i)=>i !==index),
      localImages:form.localImages.filter((_,i)=>i !==index),
    })
  };
  const handleDetectLocation = async () => {
    setDetectingLocation(true)
    try {
      const {status}  = await Location.requestForegroundPermissionsAsync();
      if(status!== "granted"){
        Alert.alert(
          "Permission Denied",
          "Location permission is required to detect coordinates."
        )
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      updateForm({
        latitude: String(location.coords.latitude),
        longtitude:  String(location.coords.longitude),
      })
    } catch (error) {
      toast.error("Error, Couldl not detect location.")
      
    }finally{
      setDetectingLocation(false);
    }
  
  };
  const handleSubmit = async () => {
    if(!form.title.trim())return toast.error("Validation, Title is required.")

    if(!form.price.trim()) return toast.error("Validation, Price is required.")

    const priceNum = Number(form.price)
    if(isNaN(priceNum)|| priceNum<MIN_PRICE) 
      return toast.error("Validation,  Price must be greater than 0")
    if(priceNum> MAX_PRICE) 
      return toast.error(`Price cannot exceed #${MAX_PRICE.toLocaleString("en-IN")}`)

    if(!form.address.trim()) 
      return toast.error("Addresss is required.")
    if(!form.city.trim())
      return toast.error("City is required")
    if(form.images.length===0)
      return toast.error("Please upload at least one image.")

    setSubmitting(true);
    const {error}  = await authSupabase.from("properties").insert({
      title: form.title.trim(),
      description: form.description.trim(),
      price: priceNum,
      type: form.type,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      area_sqft: form.area_sqft? Number(form.area_sqft): null,
      address: form.address.trim(),
      city: form.city.trim(),
      latitude: form.latitude? Number(form.latitude): null,
      longitude: form.longtitude ? Number(form.longtitude): null,
      images: form.images,
      is_featured: form.is_featured,
      is_sold: false,
    })
    setSubmitting(false);
    if(error){
      toast.error("Failed to create PropertyCard. Try again");
      console.error(error)
      return
    }
    setForm(INITIAL_FORM);

    toast.success("Property listed successfully.")
    router.push("/");
  };
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "android" ? "height" : "padding"}
        className="flex-1"
      >
        <View className="flex-row items-center px-5 pt-4 pb-3">
          <Text className="text-2xl font-bold text-gray-900 flex-1">
            Add Property
          </Text>
        </View>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className={sectionClass}>
            <Text className={labelClass}>
              Photos{" "}
              <Text className="text-gray-400 font-normal">(up to 6)</Text>
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {form.localImages.map((uri, index) => (
                <View key={index} className="relative">
                  <Image
                    source={{ uri }}
                    className="w-24 h-24 rounded-2xl"
                    resizeMode="cover"
                  />
                  {index === 0 && (
                    <View className="absolute top-1 bg-blue-600 px-1.5 py-0.5 rounded-full">
                      <Text className="text-white text-[9px] font-bold">
                        COVER
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full items-center justify-center"
                  >
                    <Ionicons name="close" size={11} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
              {form.localImages.length < 6 && (
                <TouchableOpacity
                  onPress={handlePickImages}
                  disabled={uploadingImages}
                  className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-gray-300 items-center justify-center"
                >
                  {uploadingImages ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                  ) : (
                    <>
                      <Ionicons
                        name="camera-outline"
                        size={22}
                        color="#9CA3AF"
                      />
                      <Text className="text-gray-400 text-xs mt-1">Add</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
          {/* Basic info */}
          <View className={sectionClass}>
            <Text className={labelClass}>Title</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. Modern 38HK in Bandra"
              placeholderTextColor="#9CA3AF"
              value={form.title}
              onChangeText={(v)=>updateForm({title:v})}
            />
          </View>
          {/* description */}
          <View className={sectionClass}>
            <Text className={labelClass}>Description</Text>
            <TextInput
              className={`inputClass h-24`}
              placeholder="Describe the property..."
              placeholderTextColor="#9CA3AF"
              value={form.description}
              onChangeText={(v)=>updateForm({description:v})}
              multiline
              textAlignVertical="top"
            />
          </View>
          {/* price */}
          <View className={sectionClass}>
            <Text className={labelClass}>Price (#)</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. 5000000"
              placeholderTextColor="#9CA3AF"
              value={form.price}
              onChangeText={(v)=>updateForm({price:v})}
              keyboardType="numeric"
            />
            <Text className="text-xs text-gray-400 mt-1.5 ml-1">
              Valid range: #1 - #{MAX_PRICE.toLocaleString("en-US")}
            </Text>
          </View>
          <View className={sectionClass}>
              <Text className={labelClass}>Property Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {TYPES.map((t)=>(
                  <TouchableOpacity 
                  key={t}
                  onPress={()=>updateForm({type:t})}
                  className={`px-4 py-2 rounded-full border %{form.type===t?"bg-blue-600 border-blue-600": "bg-white border-gray-200"}`}
                  >
                    <Text className={`text-sm font-semibold capitalize ${form.type===t ? "text-white" : "text-gray-600"}`}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
          </View>
          {/* bedroom  and bathrooms*/}
          <View className="flex-row gap-4 mb-5">
                <Counter
                  label="Bedrooms"
                  value={form.bedrooms}
                  onChange={(v)=>updateForm({bedrooms: v})} />
                  
                <Counter
                  label="Bathrooms"
                  value={form.bathrooms}
                  onChange={(v)=>updateForm({bathrooms: v})} />
                  
          </View>
          <View className={sectionClass}>
                <Text className={labelClass}>City</Text>
                <TextInput 
                  className={inputClass}
                  placeholder="E.g . Lagos"
                  placeholderTextColor="#9CA3AF"
                  value={form.city}
                  onChangeText={(v)=>updateForm({city: v})} 
                   
                  />
          </View>
          {/* coordinates */}
          <View className={sectionClass}>
            <View className="flex-row items-center justify-between mb-1.5">
                <Text className={labelClass}>Coordinates</Text>
                <TouchableOpacity onPress={handleDetectLocation} disabled={detectingLocation} 
                  className="flex-row items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full"
                >
                  {detectingLocation? (
                    <ActivityIndicator size="small" color="#2563EB"/>
                  ):(
                    <Ionicons name="locate-outline" size={13} color="#2563EB" />
                  )}
                  <Text className="text-blue-600 text-xs font-semibold" >
                  {detectingLocation? "Detecting...": "Detect Location"}
                </Text>
                </TouchableOpacity>
                
            </View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <TextInput 
                      className={inputClass}
                      placeholder="Latitude"
                      placeholderTextColor="#9CA3AF"                   
                      value={form.latitude} 
                      onChangeText={(v)=> updateForm({latitude:v})}
                      keyboardType="numeric"
                      />
                  </View>
                  <View className="flex-1">
                    <TextInput 
                      className={inputClass}
                      placeholder="Longitude"
                      placeholderTextColor="#9CA3AF"                   
                      value={form.longtitude} 
                      onChangeText={(v)=> updateForm({longtitude:v})}
                      keyboardType="numeric"
                      />
                  </View>
                </View>
          </View>
          <View className="gap-3 mb-5">
              <Toggle 
                label="Featured Property"
                description="Show this in the Featured section on home"
                value={form.is_featured}
                onChange={(v)=>updateForm({is_featured: v})}
              />
          </View>

          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={submitting || uploadingImages}
            className={`bg-blue-600 rounded-2xl py-4 items-center`}
            style={{
              shadowColor: "#2563EB",
              shadowOffset:{width: 0, height:4},
              shadowOpacity: 0.3,shadowRadius:8,
              elevation:4,
              opacity: submitting || uploadingImages ? 0.7 : 1,
            }}
          >
            {submitting?( <ActivityIndicator size={"large"} color="white" /> ):(
              <Text className="text-white font-bold text-base">
                List Property
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const Toggle = ({label, description, value, onChange}: {label:string; description:string; value:boolean; onChange:(v:boolean)=>void;})=>(
  <TouchableOpacity 
    onPress={()=>onChange(!value)}
    className={`flex-row items-center justify-between p-4 rounded-2xl border ${value? "bg-blue-50 border-blue-200": "bg-white border-gray-300"}`}
  >
    <View className="flex-1 mr-3">
      <Text className={`font-semibold ${value? "text-blue-700": "text-gray-700"}`}>
        {label}
      </Text>
      {description &&(
        <Text className="text-xs text-gray-400 mt-0.5">
          {description}
        </Text>
      )}
    </View>
    <View className={`w-6 h-6 rounded-full boder-2 items-center justify-center ${value? "bg-blue-600 border-blue-600": "border-gray-300"}`}>
      {value && <Ionicons name="checkmark" size={14} color="white" />}
    </View>
  </TouchableOpacity>
)

const Counter = ({label,value, onChange}:{label:string; value:number; onChange:(v:number)=>void})=>{
  return(
    <>
      <View className="flex-1">
        <Text className={labelClass}>{label}</Text>
        <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <TouchableOpacity 
            onPress={()=>onChange(Math.max(1,value-1))}
            className="w-11 h-11 items-center justify-center"
          >
            <Ionicons name="remove" size={18} color="#374151" />
          </TouchableOpacity>
          <Text  className="flex-1 text-center text-gray-800 font-bold text-base" >
            {value}
          </Text>
          <TouchableOpacity onPress={()=>onChange(value+1)} className="w-11 h-11 items-center justify-center">
            <Ionicons name="add" size={18} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>
    </>
  )
}