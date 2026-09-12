import { View } from "react-native";
import Skeleton from "./Skeleton";

export default function MembersSkeleton() {
  return (
    <View className="mt-2">
      <View className="mb-4 flex-row items-center justify-between">
        <Skeleton className="h-3.5 w-28 rounded-md" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </View>

      <View className="gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            className="flex-row items-center justify-between rounded-2xl border border-ink/6 bg-cream p-4"
          >
            <View className="flex-row items-center gap-3.5 flex-1 pr-2">
              <Skeleton className="h-11 w-11 rounded-full" />
              <View className="gap-2 flex-1">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-40 rounded-md" />
              </View>
            </View>

            <View className="items-end gap-1.5">
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-3 w-12 rounded-md" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
