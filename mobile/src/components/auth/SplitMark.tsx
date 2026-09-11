import { View } from "react-native";

export default function SplitMark() {
  return (
    <View className="relative h-36 w-36 items-center justify-center">
      <View className="absolute top-0 left-0 h-28 w-28 rounded-full bg-teal opacity-95" />

      <View className="absolute bottom-0 right-0 h-24 w-24 rounded-full bg-coral opacity-90" />

      <View className="absolute top-6 left-10 h-16 w-16 rounded-full border border-canvas/20 bg-cream/10" />
    </View>
  );
}
