import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

export default function TopNavigation() {
  const router = useRouter();
  return (
    <>
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.7}
        className="h-10 w-10 items-center justify-center rounded-full border border-ink/8 bg-cream"
      >
        <ArrowLeft size={18} color="#1B1B1F" />
      </TouchableOpacity>
    </>
  );
}
