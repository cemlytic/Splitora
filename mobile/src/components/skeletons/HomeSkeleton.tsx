import { View } from "react-native";
import Skeleton from "./Skeleton";

export default function HomeSkeleton() {
  return (
    <View className="mt-4">
      <View className="rounded-3xl border border-ink/6 bg-cream p-6">
        <View className="flex-row items-center justify-between">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </View>

        <View className="mt-4 flex-row items-baseline gap-3">
          <Skeleton className="h-12 w-16 rounded-xl" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </View>

        <View className="mt-6 flex-row gap-3">
          <Skeleton className="h-12 flex-1 rounded-2xl" />
          <Skeleton className="h-12 flex-1 rounded-2xl" />
        </View>
      </View>

      <View className="mt-9 flex-row items-center justify-between">
        <Skeleton className="h-5 w-28 rounded-md" />
        <Skeleton className="h-4 w-12 rounded-md" />
      </View>

      <View className="mt-4 gap-3">
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            className="flex-row items-center justify-between rounded-2xl border border-ink/6 bg-cream p-4"
          >
            <View className="flex-row items-center gap-3.5">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <View className="gap-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </View>
            </View>

            <Skeleton className="h-6 w-16 rounded-md" />
          </View>
        ))}
      </View>
    </View>
  );
}
