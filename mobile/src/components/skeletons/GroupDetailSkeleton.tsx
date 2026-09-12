import { View } from "react-native";
import Skeleton from "./Skeleton";

export default function GroupDetailSkeleton() {
  return (
    <View className="mt-2">
      <View className="rounded-3xl border border-ink/6 bg-ink/90 p-6">
        <View className="flex-row items-center justify-between">
          <Skeleton className="h-3 w-28 rounded-md bg-cream/20!" />
          <Skeleton className="h-5 w-24 rounded-full bg-cream/20!" />
        </View>

        <Skeleton className="mt-4 h-10 w-44 rounded-xl bg-cream/20!" />

        <View className="mt-6 flex-row items-center justify-between border-t border-cream/10 pt-3.5">
          <Skeleton className="h-3 w-28 rounded-md bg-cream/20!" />
          <Skeleton className="h-4 w-16 rounded-md bg-cream/20!" />
        </View>
      </View>

      <View className="mt-7 flex-row rounded-2xl border border-ink/8 bg-cream/70 p-1.5">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 flex-1 rounded-xl bg-transparent" />
      </View>

      <View className="mt-5 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            className="flex-row items-center justify-between rounded-2xl border border-ink/6 bg-cream p-4"
          >
            <View className="flex-row items-center gap-3.5">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <View className="gap-2">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </View>
            </View>

            <Skeleton className="h-5 w-16 rounded-md" />
          </View>
        ))}
      </View>
    </View>
  );
}
