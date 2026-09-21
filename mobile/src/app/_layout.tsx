import { useEffect } from "react";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/expo";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { tokenCache } from "@/utils/tokenCache";
import "../global.css";
import { AlertProvider } from "@/context/AlertContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNotificationObserver } from "@/hooks/useNotificationObserver";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env");
}

function InitialLayout({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();

  usePushNotifications();

  useNotificationObserver();

  useEffect(() => {
    if (!isLoaded || !fontsLoaded) return;
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === "(auth)";
    if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isSignedIn && inAuthGroup) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, segments, fontsLoaded]);

  if (!isLoaded || !fontsLoaded) {
    return null;
  }

  return (
    <AlertProvider>
      <Slot />
    </AlertProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const isFontReady = fontsLoaded || !!fontError;

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <InitialLayout fontsLoaded={isFontReady} />
      </ClerkLoaded>
    </ClerkProvider>
  );
}
