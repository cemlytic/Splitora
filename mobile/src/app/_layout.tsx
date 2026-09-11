import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/expo";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { tokenCache } from "@/utils/tokenCache";
import "../global.css";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env");
}

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isSignedIn && inAuthGroup) {
      router.replace("/(app)");
    }
  }, [isLoaded, isSignedIn, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <InitialLayout />
      </ClerkLoaded>
    </ClerkProvider>
  );
}
