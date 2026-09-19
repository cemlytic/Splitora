import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Copy, Check, X, Building2, ShieldCheck, ArrowRight } from "lucide-react-native";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatIban } from "@/utils/formatIban";
import { hapticFeedback } from "@/utils/haptics";

interface QuickPayModalProps {
  visible: boolean;
  onClose: () => void;
  receiverName: string;
  receiverIban?: string;
  accountHolder?: string;
  amount: number;
  onConfirmSettlement: () => void;
  loading?: boolean;
}

export default function QuickPayModal({
  visible,
  onClose,
  receiverName,
  receiverIban,
  accountHolder,
  amount,
  onConfirmSettlement,
  loading = false,
}: QuickPayModalProps) {
  const [copied, setCopied] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      hapticFeedback.light();
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 110,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.92);
      opacityAnim.setValue(0);
      setCopied(false);
    }
  }, [visible]);

  const handleDismiss = () => {
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
      onClose();
    });
  };

  const handleCopyIban = async () => {
    if (!receiverIban) return;
    await Clipboard.setStringAsync(receiverIban.replace(/\s+/g, ""));
    hapticFeedback.success();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Animated.View
        style={{
          opacity: opacityAnim,
          backgroundColor: "rgba(27, 27, 31, 0.65)",
        }}
        className="flex-1 items-center justify-center px-6"
      >
        <Pressable onPress={handleDismiss} className="absolute inset-0" />

        <Animated.View
          style={{
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
            shadowColor: "#1B1B1F",
            shadowOffset: { width: 0, height: 18 },
            shadowOpacity: 0.18,
            shadowRadius: 30,
            elevation: 14,
          }}
          className="w-full max-w-86.25 rounded-4xl border border-ink/8 bg-cream p-6"
        >
          <View className="flex-row items-center justify-between pb-4 border-b border-ink/5">
            <View className="flex-row items-center gap-2.5">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-teal/10">
                <Building2 size={17} color="#0E7C66" strokeWidth={2.2} />
              </View>
              <View>
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className="text-base tracking-tight text-ink"
                >
                  Direct Settlement
                </Text>
                <Text
                  style={{ fontFamily: "SpaceGrotesk_400Regular" }}
                  className="text-[11px] text-muted"
                >
                  Bank & Wire Transfer
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleDismiss}
              activeOpacity={0.7}
              className="h-8 w-8 items-center justify-center rounded-full bg-ink/5"
            >
              <X size={15} color="#8A8680" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <View className="mt-4 items-center justify-center rounded-2xl border border-ink/6 bg-canvas py-4 shadow-sm">
            <Text
              style={{ fontFamily: "SpaceGrotesk_500Medium" }}
              className="text-[11px] uppercase tracking-wider text-muted"
            >
              Amount to Transfer
            </Text>
            <Text
              style={{ fontFamily: "SpaceGrotesk_700Bold" }}
              className="mt-0.5 text-3xl tracking-tight text-ink"
            >
              {formatCurrency(amount)}
            </Text>
          </View>

          {receiverIban ? (
            <View className="mt-4 rounded-2xl border border-ink/8 bg-canvas p-4">
              <View className="flex-row items-center justify-between">
                <Text
                  style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                  className="text-[10px] uppercase tracking-wider text-muted"
                >
                  Recipient Legal Name
                </Text>
                <ShieldCheck size={13} color="#0E7C66" />
              </View>
              <Text
                style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                className="mt-1 text-sm text-ink"
                numberOfLines={1}
              >
                {accountHolder || receiverName}
              </Text>

              <Text
                style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                className="mt-3.5 text-[10px] uppercase tracking-wider text-muted"
              >
                IBAN / Account Number
              </Text>
              <Text
                style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                className="mt-1 text-xs tracking-wider text-ink"
                numberOfLines={1}
              >
                {formatIban(receiverIban)}
              </Text>

              <TouchableOpacity
                onPress={handleCopyIban}
                activeOpacity={0.8}
                className={`mt-4 h-11 flex-row items-center justify-center gap-2 rounded-xl border transition-all active:scale-[0.99] ${
                  copied
                    ? "border-teal bg-teal text-cream"
                    : "border-ink/10 bg-cream"
                }`}
              >
                {copied ? (
                  <>
                    <Check size={14} color="#FFF8F0" strokeWidth={2.5} />
                    <Text
                      style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                      className="text-xs text-cream"
                    >
                      Copied to Clipboard
                    </Text>
                  </>
                ) : (
                  <>
                    <Copy size={14} color="#1B1B1F" strokeWidth={2} />
                    <Text
                      style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                      className="text-xs text-ink"
                    >
                      Copy IBAN
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mt-4 items-center rounded-2xl border border-dashed border-ink/15 bg-canvas/70 p-5">
              <Text
                style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                className="text-center text-xs text-ink"
              >
                No IBAN Provided
              </Text>
              <Text
                style={{ fontFamily: "SpaceGrotesk_400Regular" }}
                className="mt-1 text-center text-xs leading-5 text-muted"
              >
                {receiverName} has not added settlement details yet. Settle up in cash or confirm offline.
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => {
              handleDismiss();
              onConfirmSettlement();
            }}
            disabled={loading}
            activeOpacity={0.85}
            style={{
              shadowColor: "#0E7C66",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.22,
              shadowRadius: 12,
              elevation: 4,
            }}
            className="mt-5 h-13 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-teal active:scale-[0.99]"
          >
            {loading ? (
              <ActivityIndicator color="#FFF8F0" size="small" />
            ) : (
              <>
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className="text-sm text-cream"
                >
                  I've Paid, Mark as Settled
                </Text>
                <ArrowRight size={16} color="#FFF8F0" strokeWidth={2.2} />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}