import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
} from "react-native";
import {
  AlertTriangle,
  Trash2,
  HelpCircle,
  CheckCircle2,
} from "lucide-react-native";
import { hapticFeedback } from "@/utils/haptics";

interface AlertAction {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

interface AlertOptions {
  title: string;
  message: string;
  type?: "destructive" | "info" | "warning" | "success";
  buttons?: AlertAction[];
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertOptions | null>(null);

  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const showAlert = useCallback(
    (options: AlertOptions) => {
      setConfig(options);

      if (options.type === "destructive" || options.type === "warning") {
        hapticFeedback.warning();
      } else if (options.type === "success") {
        hapticFeedback.success();
      } else {
        hapticFeedback.light();
      }

      setVisible(true);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [scaleAnim, opacityAnim],
  );

  const handleDismiss = useCallback(
    (callback?: () => void) => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.94,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisible(false);
        callback?.();
      });
    },
    [scaleAnim, opacityAnim],
  );

  const buttons = config?.buttons || [{ text: "Got it", style: "default" }];
  const type = config?.type || "info";

  const getTheme = () => {
    switch (type) {
      case "destructive":
        return {
          icon: <Trash2 size={24} color="#FF6B4A" strokeWidth={2} />,
          badgeOuter: "bg-coral/10 border-coral/20",
          badgeInner: "bg-coral/15",
          btnColor: "bg-coral border-coral",
          btnText: "text-cream",
          shadowColor: "#FF6B4A",
        };
      case "warning":
        return {
          icon: <AlertTriangle size={24} color="#E07A5F" strokeWidth={2} />,
          badgeOuter: "bg-coral/8 border-coral/15",
          badgeInner: "bg-coral/12",
          btnColor: "bg-ink border-ink",
          btnText: "text-cream",
          shadowColor: "#1B1B1F",
        };
      case "success":
        return {
          icon: <CheckCircle2 size={24} color="#0E7C66" strokeWidth={2} />,
          badgeOuter: "bg-teal/10 border-teal/20",
          badgeInner: "bg-teal/15",
          btnColor: "bg-teal border-teal",
          btnText: "text-cream",
          shadowColor: "#0E7C66",
        };
      default:
        return {
          icon: <HelpCircle size={24} color="#0E7C66" strokeWidth={2} />,
          badgeOuter: "bg-teal/10 border-teal/20",
          badgeInner: "bg-teal/15",
          btnColor: "bg-teal border-teal",
          btnText: "text-cream",
          shadowColor: "#0E7C66",
        };
    }
  };

  const theme = getTheme();

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      <Modal
        visible={visible}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={() => handleDismiss()}
      >
        <Animated.View
          style={{
            opacity: opacityAnim,
            backgroundColor: "rgba(27, 27, 31, 0.65)",
          }}
          className="flex-1 items-center justify-center px-7"
        >
          <Pressable
            onPress={() => handleDismiss()}
            className="absolute inset-0"
          />

          <Animated.View
            style={{
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
              shadowColor: "#1B1B1F",
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.16,
              shadowRadius: 28,
              elevation: 12,
            }}
            className="w-full max-w-82.5 items-center rounded-4xl border border-ink/8 bg-cream p-6 pb-5"
          >
            <View
              className={`h-16 w-16 items-center justify-center rounded-3xl border ${theme.badgeOuter} p-1`}
            >
              <View
                className={`h-full w-full items-center justify-center rounded-[20px] ${theme.badgeInner}`}
              >
                {theme.icon}
              </View>
            </View>

            <View className="mt-4 w-full items-center">
              <Text
                style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                className="text-center text-[19px] tracking-tight text-ink"
              >
                {config?.title}
              </Text>

              <Text
                style={{ fontFamily: "SpaceGrotesk_400Regular" }}
                className="mt-1.5 px-2 text-center text-[13.5px] leading-[20px] text-ink/65"
              >
                {config?.message}
              </Text>
            </View>

            <View className="mt-6 w-full flex-row items-center gap-2.5">
              {buttons.map((btn, index) => {
                const isCancel = btn.style === "cancel";
                const isBtnDestructive = btn.style === "destructive";

                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.82}
                    onPress={() => {
                      handleDismiss(btn.onPress);
                    }}
                    style={
                      !isCancel
                        ? {
                            shadowColor: isBtnDestructive
                              ? "#FF6B4A"
                              : theme.shadowColor,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.16,
                            shadowRadius: 10,
                            elevation: 3,
                          }
                        : undefined
                    }
                    className={`h-12 flex-1 items-center justify-center rounded-2xl border active:scale-[0.98] ${
                      isCancel
                        ? "border-ink/8 bg-canvas"
                        : isBtnDestructive
                          ? "border-coral bg-coral"
                          : theme.btnColor
                    }`}
                  >
                    <Text
                      style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                      className={`text-[14px] ${
                        isCancel ? "text-ink/80" : theme.btnText
                      }`}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useAppAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAppAlert must be used within an AlertProvider");
  }
  return context;
};
