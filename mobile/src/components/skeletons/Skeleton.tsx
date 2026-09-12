import { useEffect, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";

interface SkeletonProps {
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export default function Skeleton({ className = "", style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ opacity }, style]}
      className={`bg-ink/10 rounded-2xl ${className}`}
    />
  );
}
