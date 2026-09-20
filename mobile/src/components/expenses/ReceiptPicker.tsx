import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Camera, X } from "lucide-react-native";
import { hapticFeedback } from "@/utils/haptics";
import { useAppAlert } from "@/context/AlertContext";

interface ReceiptPickerProps {
  imageUri: string | null;
  onImageChange: (uri: string | null) => void;
}

export default function ReceiptPicker({
  imageUri,
  onImageChange,
}: ReceiptPickerProps) {
  const { showAlert } = useAppAlert();

  const handlePickImage = async () => {
    hapticFeedback.light();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.4,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        onImageChange(`data:image/jpeg;base64,${result.assets[0].base64}`);
        hapticFeedback.success();
      }
    } catch (error) {
      console.error("Image pick error:", error);
      showAlert({
        title: "Image Error",
        message: "Could not attach receipt image. Please try again.",
        type: "warning",
      });
    }
  };

  const handleRemove = () => {
    hapticFeedback.light();
    onImageChange(null);
  };

  return (
    <View className="mt-7">
      <View className="mb-3 flex-row items-center justify-between px-0.5">
        <Text
          style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
          className="text-xs uppercase tracking-wider text-muted"
        >
          Receipt Attachment (Optional)
        </Text>
        {imageUri && (
          <Text
            style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
            className="text-[11px] text-teal"
          >
            Image Ready
          </Text>
        )}
      </View>

      {imageUri ? (
        <View className="overflow-hidden rounded-3xl border border-ink/8 bg-cream p-2.5 shadow-sm">
          <View className="relative">
            <Image
              source={{ uri: imageUri }}
              style={{ width: "100%", height: 160, borderRadius: 18 }}
              contentFit="cover"
              transition={200}
            />

            <View className="absolute bottom-2.5 left-2.5 right-2.5 flex-row items-center justify-between">
              <TouchableOpacity
                onPress={handlePickImage}
                activeOpacity={0.8}
                className="flex-row items-center gap-1.5 rounded-xl border border-white/20 bg-ink/75 px-3 py-1.5 backdrop-blur-md"
              >
                <Camera size={12} color="#FFF8F0" />
                <Text
                  style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                  className="text-[11px] text-cream"
                >
                  Change
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRemove}
                activeOpacity={0.8}
                className="flex-row items-center gap-1 rounded-xl border border-coral/30 bg-coral px-3 py-1.5 shadow-sm active:scale-[0.98]"
              >
                <X size={12} color="#1B1B1F" strokeWidth={2.5} />
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className="text-[11px] text-ink"
                >
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={handlePickImage}
          activeOpacity={0.8}
          className="flex-row items-center justify-between rounded-3xl border border-dashed border-ink/20 bg-cream/70 p-4 active:border-teal/50"
        >
          <View className="flex-row items-center gap-3.5">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-teal/10">
              <Camera size={19} color="#0E7C66" strokeWidth={2.2} />
            </View>
            <View>
              <Text
                style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                className="text-[14px] text-ink"
              >
                Attach Proof of Payment
              </Text>
              <Text
                style={{ fontFamily: "SpaceGrotesk_400Regular" }}
                className="mt-0.5 text-[11px] text-muted"
              >
                Photo of invoice, bill, or receipt
              </Text>
            </View>
          </View>

          <View className="rounded-xl border border-ink/8 bg-canvas px-3 py-1.5">
            <Text
              style={{ fontFamily: "SpaceGrotesk_700Bold" }}
              className="text-xs text-ink"
            >
              Upload
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
