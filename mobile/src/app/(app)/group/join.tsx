import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/expo";
import * as Clipboard from "expo-clipboard";
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium, 
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { KeyRound, ClipboardPaste, ArrowRight } from "lucide-react-native";
import SafeScreen from "@/components/SafeScreen";
import { groupService } from "@/services/groupService";
import TopNavigation from "@/components/common/TopNavigation";

export default function JoinGroupScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setInviteCode(text.trim().toUpperCase());
      }
    } catch (error) {
      console.warn("Clipboard access failed:", error);
    }
  };

  const handleJoin = async () => {
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      Alert.alert("Missing Code", "Please enter a valid invite code.");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User session not found.");
      return;
    }

    try {
      setLoading(true);
      const joinedGroup = await groupService.joinGroup({
        inviteCode: cleanCode,
        clerkId: user.id,
      });
      router.replace(`/group/${joinedGroup._id}`);
    } catch (error: any) {
      console.error("Failed to join group:", error);
      Alert.alert(
        "Unable to Join",
        error?.response?.data?.message ||
          "This invite code appears to be invalid or expired. Check with your friend and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <SafeScreen className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color="#0E7C66" />
      </SafeScreen>
    );
  }

  const isCodeValid = inviteCode.trim().length >= 4;

  return (
    <SafeScreen includeBottom className="flex-1 bg-canvas px-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-between py-3"
      >
        <View>
          <TopNavigation />

          <View className="mt-7">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-teal/15">
              <KeyRound size={22} color="#0E7C66" strokeWidth={2.2} />
            </View>

            <Text
              style={{ fontFamily: "SpaceGrotesk_700Bold" }}
              className="mt-4 text-3xl tracking-tight text-ink"
            >
              Enter invite code
            </Text>
            <Text
              style={{ fontFamily: "SpaceGrotesk_400Regular" }}
              className="mt-2 text-sm leading-6 text-muted"
            >
              Paste or type the unique alphanumeric key shared by your flatmate
              or trip organizer.
            </Text>
          </View>


          <View className="mt-8">
            <View className="mb-2.5 flex-row items-center justify-between">
              <Text
                style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                className="text-xs uppercase tracking-wider text-muted"
              >
                Access Key
              </Text>
              <TouchableOpacity
                onPress={handlePaste}
                activeOpacity={0.7}
                className="flex-row items-center gap-1.5"
              >
                <ClipboardPaste size={13} color="#0E7C66" />
                <Text
                  style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                  className="text-xs text-teal"
                >
                  Paste from clipboard
                </Text>
              </TouchableOpacity>
            </View>

            <View
              className={`rounded-2xl border bg-cream px-5 py-4 transition-all ${
                isFocused ? "border-teal shadow-sm" : "border-ink/10"
              }`}
            >
              <TextInput
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                placeholder="e.g. 9F2A1C"
                placeholderTextColor="#8A8680"
                selectionColor="#0E7C66"
                autoFocus
                autoCapitalize="characters"
                maxLength={10}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                  fontFamily: "SpaceGrotesk_700Bold",
                  letterSpacing: 4,
                  fontSize: 22,
                  textAlign: "center",
                }}
                className="text-ink"
              />
            </View>

            <Text
              style={{ fontFamily: "SpaceGrotesk_400Regular" }}
              className="mt-3 text-center text-xs text-muted"
            >
              Codes are typically 6-8 characters and case-insensitive.
            </Text>
          </View>
        </View>


        <View className="mb-2">
          <TouchableOpacity
            onPress={handleJoin}
            disabled={loading || !isCodeValid}
            activeOpacity={0.85}
            style={
              isCodeValid
                ? {
                    shadowColor: "#1B1B1F",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.16,
                    shadowRadius: 14,
                    elevation: 4,
                  }
                : undefined
            }
            className={`h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl ${
              isCodeValid ? "bg-ink active:scale-[0.99]" : "bg-ink/10"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#FFF8F0" />
            ) : (
              <>
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className={`text-[15px] ${isCodeValid ? "text-cream" : "text-muted"}`}
                >
                  Join Space
                </Text>
                <ArrowRight
                  size={17}
                  color={isCodeValid ? "#FFF8F0" : "#8A8680"}
                  strokeWidth={2.2}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}
