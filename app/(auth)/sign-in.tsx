import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useState, useRef } from "react";
import { useSignIn } from "@clerk/expo";
import { Link, useRouter, type Href } from "expo-router";
import { toast } from "sonner-native";
const CODE_LENGTH = 6;

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const router = useRouter();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const passwordRef = useRef<TextInput>(null);
  const isLoading = fetchStatus === "fetching";

  const onSignInPress = async () => {
  try {
    toast.success("Signing in...");
    const { error } = await signIn.password({
      emailAddress: email,
      password,
    });
    if (error) {
      toast.error("Invalid email or password. Please try again!");
      return;
    }
    if (!error && signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }
          toast.success("Signed in successfully!");
          const url = decorateUrl("/");
          router.replace(url as Href);
        },
      });
    } else if (signIn.status === "needs_second_factor") {
      await signIn.mfa.sendPhoneCode();
    } else if (signIn.status === "needs_client_trust") {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === "email_code"
      );
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
      }
    }
  } catch (err) {
    toast.error("Something went wrong. Please check your connection and try again.");
  }
};
  
    const handleChange = (text: string, index: number) => {
      if (text.length > 1) {
        const digits = text.replace(/\D/g, "").slice(0, CODE_LENGTH);
        setCode(digits.padEnd(CODE_LENGTH, ""));
  
        const lastIndex = Math.min(digits.length - 1, CODE_LENGTH - 1);
        inputRefs.current[lastIndex]?.focus();
        return;
      }
      const digit = text.replace(/\D/g, "").slice(-1);
      const newCode = code.split("");
      newCode[index] = digit;
      setCode(newCode.join(""));
  
      if (digit && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };
  
    const handleKeyPress = (
      e: { nativeEvent: { key: string } },
      index: number,
    ) => {
      if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    };
    const onVerifyPress = async () => {
      const { error } = await signIn.mfa.verifyEmailCode({ code });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (signIn.status === "complete") {
        await signIn.finalize({navigate:({session, decorateUrl})=>{
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }
          toast.success("Account verified successfully!");
          const url = decorateUrl("/");
          router.replace(url as Href);
        }})
      }
      
    };
    if (
      signIn.status==='needs_client_trust'
    ) {
      return (
        <View className="flex-1 justify-center px-6 py-12">
          <Image
            source={require("../../assets/images/kribb.png")}
            className="w-32 h-16 mb-8"
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-gray-800 mb-2">
            Verify your account
          </Text>
          <Text className="text-gray-600 mb-8">We sent a code to {email}</Text>
  
          {/* OTP Boxes */}
          <View className="flex-row justify-between mb-8">
            {Array.from({ length: CODE_LENGTH }).map((_, index) => (
              <TextInput
                key={index}
                ref={(ref: TextInput | null) => {
                  inputRefs.current[index] = ref;
                }}
                className="w-12 h-14 border border-gray-300 rounded-xl text-center text-xl font-bold text-gray-800"
                style={{ borderColor: code[index] ? "#2563eb" : "#D1D5DB" }}
                maxLength={1}
                keyboardType="number-pad"
                value={code[index] || ""}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
              />
            ))}
          </View>
          <TouchableOpacity
            onPress={onVerifyPress}
            disabled={isLoading}
            className="w-full bg-blue-600 px-6 py-4 rounded-xl items-center justify-center"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Verify</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => signIn.mfa.sendEmailCode()}
            disabled={isLoading}
            className="w-full mt-3 px-6 py-4 rounded-xl items-center justify-center border border-blue-600"
          >
            <Text className="text-blue-600 font-bold text-base">Resend Code</Text>
          </TouchableOpacity>
        </View>
      );
    }
  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="flex-1 bg-white"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 justify-center px-6 py-12">
        <Image
          source={require("../../assets/images/kribb.png")}
          className="w-32 h-16 mb-8"
          resizeMode="contain"
        />
        <Text className="text-3xl font-bold text-gray-800 mb-2">
          Welcome Back
        </Text>
        <Text className="text-gray-600 mb-8">Find your dream home today.</Text>
        <TextInput
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-6"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder="Email Address"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        {errors?.fields.identifier && (
          <Text className="text-red-500 mb-4">
            {errors.fields.identifier.message}
          </Text>
        )}
        <TextInput
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-6"
           returnKeyType="done"
          onSubmitEditing={onSignInPress}
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {errors?.fields.password && (
          <Text className="text-red-500 mb-4">
            {errors.fields.password.message}
          </Text>
        )}
        <TouchableOpacity
          onPress={onSignInPress}
          disabled={isLoading}
          className="w-full bg-blue-600 px-6 py-4 mb-4 border border-gray-300 rounded-xl items-center justify-center"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Sign In</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-gray-500">Don&apos;t have an account? </Text>
          <Text className="text-blue-600 font-semibold">
            <Link href="/sign-up">Sign Up</Link>
          </Text>
        </View>

        <View nativeID="clerk-captcha" />
      </View>
    </ScrollView>
  );
}
