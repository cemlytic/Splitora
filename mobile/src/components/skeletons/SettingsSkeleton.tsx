import { View } from "react-native";
import Skeleton from "./Skeleton";


export default function SettingsSkeleton() {
  return (
    <View className="mt-4">
      <View className="items-center rounded-3xl border border-ink/6 bg-cream p-6 shadow-sm">
        <Skeleton className="h-18 w-18 rounded-full" />
        <Skeleton className="mt-4 h-6 w-40 rounded-md" />
        <Skeleton className="mt-2 h-3.5 w-32 rounded-md" />
      </View>

      <Skeleton className="mt-8 mb-3 h-3.5 w-36 rounded-md" />

      <View className="rounded-2xl border border-ink/6 bg-cream overflow-hidden">
        <View className="flex-row items-center justify-between p-4 border-b border-ink/5">
          <View className="flex-row items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </View>
          <Skeleton className="h-4 w-28 rounded-md" />
        </View>

        <View className="flex-row items-center justify-between p-4">
          <View className="flex-row items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </View>
          <Skeleton className="h-4 w-40 rounded-md" />
        </View>
      </View>
      <View className="mt-8 gap-3">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </View>
    </View>
  );
}
