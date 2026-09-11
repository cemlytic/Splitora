import { PropsWithChildren } from "react";
import { View, ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SafeScreenProps extends PropsWithChildren, ViewProps {
  includeBottom?: boolean;
}

export default function SafeScreen({
  children,
  includeBottom = false,
  className = "",
  style,
  ...props
}: SafeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: includeBottom ? insets.bottom : 0,
        },
        style,
      ]}
      className={className || "bg-white"}
      {...props}
    >
      {children}
    </View>
  );
}
