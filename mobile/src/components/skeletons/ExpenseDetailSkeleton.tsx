import { View } from "react-native";
import Skeleton from "./Skeleton";


export default function ExpenseDetailSkeleton() {
  return (
    <View className="mt-2">
      <View className="items-center rounded-3xl border border-ink/6 bg-cream p-6 shadow-sm">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <Skeleton className="mt-3.5 h-6 w-36 rounded-md" />
        <Skeleton className="mt-2 h-10 w-28 rounded-xl" />
        <Skeleton className="mt-4 h-7 w-28 rounded-full" />
      </View>

      <View className="mt-8 mb-3 flex-row items-center justify-between">
        <Skeleton className="h-3.5 w-32 rounded-md" />
        <Skeleton className="h-3.5 w-16 rounded-md" />
      </View>

      <View className="gap-2.5">
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            className="flex-row items-center justify-between rounded-2xl border border-ink/6 bg-cream p-3.5"
          >
            <View className="flex-row items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <View className="gap-1.5">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </View>
            </View>

            <View className="items-end gap-1.5">
              <Skeleton className="h-4 w-14 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
