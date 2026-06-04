import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useAuth, useSignUp } from "@clerk/expo";
import { Link, useRouter, type Href } from "expo-router";
import { toast } from "sonner-native";

const CODE_LENGTH = 6;

export default function SignUp() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const router = useRouter();
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const isLoading = fetchStatus === "fetching";

  useEffect(() => {
    if (signUp.status === "complete" || isSignedIn) {
      router.replace("/");
    }
  }, [signUp.status, isSignedIn]);

  const onSignUpPress = async () => {
    try {
      const { error } = await signUp.password({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Account Created!\nCheck your email for a verification code!");
      await signUp.verifications.sendEmailCode();
    } catch (err) {
      toast.error("Something went wrong. Please check your connection.");
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
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onVerifyPress = async () => {
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code });
      if (error) {
        toast.error("Invalid verification code. Please try again.");
        return;
      }
      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: ({ decorateUrl }) => {
            toast.success("Account verified successfully!");
            const url = decorateUrl("/");
            router.replace(url as Href);
          },
        });
      }
    } catch (err) {
      toast.error("Something went wrong. Please check your connection.");
    }
  };

  // ── Verification screen ──────────────────────────────────────────────────
  if (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0
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
          onPress={() => signUp.verifications.sendEmailCode()}
          disabled={isLoading}
          className="w-full mt-3 px-6 py-4 rounded-xl items-center justify-center border border-blue-600"
        >
          <Text className="text-blue-600 font-bold text-base">Resend Code</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Sign up screen ───────────────────────────────────────────────────────
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
          Create Account
        </Text>
        <Text className="text-gray-600 mb-8">Find your dream home today.</Text>

        <View className="flex-row gap-3 mb-4">
          <TextInput
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
            placeholder="First name"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => lastNameRef.current?.focus()}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            ref={lastNameRef}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
            placeholder="Last name"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        <TextInput
          ref={emailRef}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4"
          placeholder="Email Address"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          value={email}
          onChangeText={setEmail}
        />
        {errors?.fields.emailAddress && (
          <Text className="text-red-500 mb-4">
            {errors.fields.emailAddress.message}
          </Text>
        )}

        <TextInput
          ref={passwordRef}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4"
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={onSignUpPress}
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
          onPress={onSignUpPress}
          disabled={isLoading}
          className="w-full bg-blue-600 px-6 py-4 mb-4 rounded-xl items-center justify-center"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Sign Up</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-gray-500">Already have an account? </Text>
          <Text className="text-blue-600 font-semibold">
            <Link href="/sign-in">Sign In</Link>
          </Text>
        </View>

        <View nativeID="clerk-captcha" />
      </View>
    </ScrollView>
  );
}