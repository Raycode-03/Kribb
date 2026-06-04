import "../global.css";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Slot } from "expo-router";
import { Toaster } from 'sonner-native';
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { StatusBar } from 'expo-status-bar';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{flex:1}}>
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Slot />
        <Toaster />
      </SafeAreaView>
    </ClerkProvider>
    </GestureHandlerRootView>
  );
}
