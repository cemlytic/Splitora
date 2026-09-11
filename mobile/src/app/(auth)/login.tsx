import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useSSO } from "@clerk/expo";
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import SafeScreen from "../../components/SafeScreen";
import SplitMark from "@/components/auth/SplitMark";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error("SSO Error:", err);
    } finally {
      setLoading(false);
    }
  }, [startSSOFlow]);

  if (!fontsLoaded) {
    return (
      <SafeScreen className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color="#0E7C66" />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen
      includeBottom
      className="flex-1 justify-between bg-canvas px-7 py-6"
    >
      <StatusBar barStyle="dark-content" />

      <View className="pt-8">
        <SplitMark />
      </View>

      <View className="my-auto">
        <Text
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          className="text-[40px] tracking-tight leading-11.5 text-ink"
        >
          Fair shares,{"\n"}zero friction.
        </Text>

        <Text
          style={{ fontFamily: "SpaceGrotesk_400Regular" }}
          className="mt-4 text-[16px] leading-6 text-muted"
        >
          From weekend trips to shared flats — track expenses and settle up in
          seconds.
        </Text>

        <View className="mt-8 self-start flex-row items-center rounded-full border border-ink/5 bg-cream/70 px-4 py-2.5 shadow-sm">
          <View className="h-2 w-2 rounded-full bg-teal mr-2.5" />
          <Text
            style={{ fontFamily: "SpaceGrotesk_500Medium" }}
            className="text-[13px] text-ink"
          >
            Roommates
          </Text>
          <Text className="mx-2 text-muted/40">•</Text>
          <Text
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            className="text-[13px] text-coral"
          >
            +$42.50 settled
          </Text>
        </View>
      </View>

      <View className="pb-4">
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.85}
          style={{
            shadowColor: "#1B1B1F",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 5,
          }}
          className="h-14 w-full flex-row items-center justify-center rounded-2xl bg-ink px-6 active:scale-[0.99]"
        >
          {loading ? (
            <ActivityIndicator color="#FFF8F0" />
          ) : (
            <View className="flex-row items-center justify-center gap-4">
              <Image
                source={require("@/assets/images/google.png")}
                className="w-6 h-6"
              />
              <Text
                style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                className="text-[15px] tracking-wide text-cream"
              >
                Continue with Google
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Text
          style={{ fontFamily: "SpaceGrotesk_400Regular" }}
          className="mt-4 text-center text-xs leading-5 text-muted"
        >
          By continuing, you agree to our{" "}
          <Text className="underline text-ink/80">Terms</Text> and{" "}
          <Text className="underline text-ink/80">Privacy Policy</Text>.
        </Text>
      </View>
    </SafeScreen>
  );
}
