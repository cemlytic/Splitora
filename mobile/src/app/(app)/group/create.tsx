import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useCurrentUser } from "@/context/UserContext";
import { Sparkles, FolderPlus } from "lucide-react-native";
import SafeScreen from "@/components/SafeScreen";
import { useCreateGroup } from "@/hooks/useGroupQueries";
import TopNavigation from "@/components/common/TopNavigation";
import { useAppAlert } from "@/context/AlertContext";
import { hapticFeedback } from "@/utils/haptics";

const QUICK_SUGGESTIONS = [
  "Apartment 4B",
  "Summer Trip",
  "Roadtrip 2026",
  "Groceries",
];

export default function CreateGroupScreen() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { showAlert } = useAppAlert();

  const [name, setName] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const createGroupMutation = useCreateGroup();
  const loading = createGroupMutation.isPending;

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      hapticFeedback.warning();
      showAlert({
        title: "Required Field",
        message: "Please enter a name for this space.",
        type: "warning",
      });
      return;
    }

    if (!currentUser) {
      showAlert({
        title: "Session Error",
        message: "User profile not found. Please log in again.",
        type: "warning",
      });
      return;
    }

    try {
      const newGRoup = await createGroupMutation.mutateAsync(trimmedName);
      hapticFeedback.success();
      router.replace(`/group/${newGRoup._id}`);
    } catch (error: any) {
      console.error("Group creation error: ", error?.response?.data || error);
      showAlert({
        title: "Creation Failed",
        message:
          error?.response?.data?.message ||
          "Something went wrong while creating the space.",
        type: "warning",
      });
    }
  };

  const isFormValid = name.trim().length > 0;

  return (
    <SafeScreen includeBottom className="flex-1 bg-canvas px-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-between py-3"
      >
        <View>
          <TopNavigation />

          <View className="mt-7">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-coral/15">
              <FolderPlus size={22} color="#FF6B4A" strokeWidth={2.2} />
            </View>
            <Text
              style={{ fontFamily: "SpaceGrotesk_700Bold" }}
              className="mt-4 text-3xl tracking-tight text-ink"
            >
              Create a space
            </Text>
            <Text
              style={{ fontFamily: "SpaceGrotesk_400Regular" }}
              className="mt-2 text-sm leading-6 text-muted"
            >
              Set up a shared pool for trips, flatmates, or events to track
              expenses effortlessly.
            </Text>
          </View>

          <View className="mt-8">
            <Text
              style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
              className="mb-2 text-xs uppercase tracking-wider text-muted"
            >
              Space Name
            </Text>

            <View
              className={`flex-row items-center rounded-2xl border bg-cream px-4 transition-all ${
                isFocused ? "border-coral shadow-sm" : "border-ink/10"
              }`}
            >
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Kyoto Getaway, Flat 12"
                placeholderTextColor="#8A8680"
                selectionColor="#FF6B4A"
                autoFocus
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{ fontFamily: "SpaceGrotesk_500Medium" }}
                className="h-14 flex-1 text-base text-ink"
              />
            </View>

            <View className="mt-3.5 flex-row flex-wrap items-center gap-2">
              <Sparkles size={13} color="#8A8680" />
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  onPress={() => setName(suggestion)}
                  activeOpacity={0.7}
                  className="rounded-lg border border-ink/8 bg-ink/3 px-2.5 py-1"
                >
                  <Text
                    style={{ fontFamily: "SpaceGrotesk_500Medium" }}
                    className="text-xs text-muted"
                  >
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View className="mb-2">
          <TouchableOpacity
            onPress={handleCreate}
            disabled={loading || !isFormValid}
            activeOpacity={0.85}
            style={
              isFormValid
                ? {
                    shadowColor: "#FF6B4A",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.25,
                    shadowRadius: 14,
                    elevation: 4,
                  }
                : undefined
            }
            className={`h-14 w-full flex-row items-center justify-center rounded-2xl ${
              isFormValid ? "bg-coral active:scale-[0.99]" : "bg-ink/10"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#1B1B1F" />
            ) : (
              <Text
                style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                className={`text-[15px] ${isFormValid ? "text-ink" : "text-muted"}`}
              >
                Create Space
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}
