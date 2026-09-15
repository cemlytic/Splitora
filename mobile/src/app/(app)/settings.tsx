import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/expo";
import {
  ArrowLeft,
  LogOut,
  Mail,
  User as UserIcon,
  Trash2,
  Building2,
  Check,
  ShieldCheck,
  Pencil,
} from "lucide-react-native";
import SafeScreen from "@/components/SafeScreen";
import SettingsSkeleton from "@/components/skeletons/SettingsSkeleton";
import { useAppAlert } from "@/context/AlertContext";
import { hapticFeedback } from "@/utils/haptics";
import { userService } from "@/services/userService";
import { formatIban } from "@/utils/formatIban";

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user, isLoaded } = useUser();
  const { showAlert } = useAppAlert();

  const [deleting, setDeleting] = useState(false);

  const [iban, setIban] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [initialIban, setInitialIban] = useState("");
  const [initialHolder, setInitialHolder] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [isIbanFocused, setIsIbanFocused] = useState(false);
  const [isHolderFocused, setIsHolderFocused] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    userService
      .getUserProfile(user.id)
      .then((data: any) => {
        if (data?.iban) {
          const formatted = formatIban(data.iban);
          setIban(formatted);
          setInitialIban(formatted);
        }
        if (data?.bankAccountHolder) {
          setAccountHolder(data.bankAccountHolder);
          setInitialHolder(data.bankAccountHolder);
        }
        if (data?.iban || data?.bankAccountHolder) {
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      })
      .catch((err) => {
        console.log("Could not fetch payment profile:", err);
      });
  }, [user?.id]);

  const hasChanges =
    iban.trim() !== initialIban.trim() ||
    accountHolder.trim() !== initialHolder.trim();

  const handleSavePaymentInfo = async () => {
    if (!user?.id) return;

    const cleanIban = iban.replace(/\s+/g, "").trim();
    const cleanHolder = accountHolder.trim();

    if (!cleanIban || !cleanHolder) {
      hapticFeedback.warning();
      showAlert({
        title: "Missing Details",
        message: "Please enter both the account holder name and IBAN number.",
        type: "warning",
      });
      return;
    }

    try {
      setSavingPayment(true);
      await userService.updatePaymentDetails(user.id, {
        iban: cleanIban,
        bankAccountHolder: cleanHolder,
      });

      setInitialIban(iban);
      setInitialHolder(accountHolder);
      setIsEditing(false);
      hapticFeedback.success();

      showAlert({
        title: "Details Saved",
        message: "Your settlement details have been updated successfully.",
        type: "success",
      });
    } catch (error: any) {
      hapticFeedback.warning();
      console.error("Save payment details error:", error);
      showAlert({
        title: "Update Failed",
        message:
          error?.response?.data?.message ||
          "Could not update payment details. Please try again.",
        type: "warning",
      });
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSignOut = () => {
    hapticFeedback.light();
    showAlert({
      title: "Sign Out",
      message: "Are you sure you want to sign out of your account?",
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              router.replace("/(auth)/login");
            } catch (error) {
              console.error("Sign out error:", error);
            }
          },
        },
      ],
    });
  };

  const handleDeleteAccount = () => {
    hapticFeedback.warning();
    showAlert({
      title: "Delete Account",
      message:
        "Are you sure you want to permanently delete your account? All access to your spaces and history will be lost.",
      type: "destructive",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await userService.deleteAccount(user!.id);
              await user?.delete();
              await signOut();
              router.replace("/(auth)/login");
            } catch (error: any) {
              console.error("Delete account error:", error);
              showAlert({
                title: "Action Failed",
                message:
                  error?.errors?.[0]?.message ||
                  "Could not delete your account at this moment.",
                type: "warning",
              });
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    });
  };

  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "No email provided";

  const fullName =
    user?.fullName ||
    (user?.firstName
      ? `${user.firstName} ${user?.lastName || ""}`.trim()
      : "Account");

  return (
    <SafeScreen includeBottom className="flex-1 bg-canvas px-6">
      <StatusBar barStyle="dark-content" />

      <View className="flex-row items-center justify-between py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="h-10 w-10 items-center justify-center rounded-full border border-ink/8 bg-cream"
        >
          <ArrowLeft size={18} color="#1B1B1F" />
        </TouchableOpacity>

        <Text
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          className="text-base tracking-tight text-ink"
        >
          Account
        </Text>

        <View className="h-10 w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "space-between",
          paddingBottom: 32,
        }}
        className="flex-1"
      >
        {!isLoaded ? (
          <SettingsSkeleton />
        ) : (
          <View>
            <View className="mt-4 items-center rounded-3xl border border-ink/6 bg-cream p-6 shadow-sm">
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={{ width: 72, height: 72, borderRadius: 36 }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View className="h-18 w-18 items-center justify-center rounded-full bg-teal">
                  <Text
                    style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                    className="text-2xl text-cream"
                  >
                    {user?.firstName?.[0] || "U"}
                  </Text>
                </View>
              )}

              <Text
                style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                className="mt-4 text-xl tracking-tight text-ink text-center"
              >
                {fullName}
              </Text>

              <Text
                style={{ fontFamily: "SpaceGrotesk_400Regular" }}
                className="mt-1 text-xs text-muted text-center"
              >
                Signed in via Google
              </Text>
            </View>

            <View className="mt-6">
              <Text
                style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                className="mb-3 text-xs uppercase tracking-wider text-muted px-0.5"
              >
                Profile Information
              </Text>

              <View className="rounded-2xl border border-ink/6 bg-cream overflow-hidden">
                <View className="flex-row items-center justify-between p-4 border-b border-ink/5">
                  <View className="flex-row items-center gap-3">
                    <View className="h-8 w-8 items-center justify-center rounded-xl bg-ink/5">
                      <UserIcon size={15} color="#1B1B1F" />
                    </View>
                    <Text
                      style={{ fontFamily: "SpaceGrotesk_500Medium" }}
                      className="text-xs text-muted"
                    >
                      Name
                    </Text>
                  </View>

                  <Text
                    style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                    className="text-sm text-ink max-w-45 text-right"
                    numberOfLines={1}
                  >
                    {fullName}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between p-4">
                  <View className="flex-row items-center gap-3">
                    <View className="h-8 w-8 items-center justify-center rounded-xl bg-ink/5">
                      <Mail size={15} color="#1B1B1F" />
                    </View>
                    <Text
                      style={{ fontFamily: "SpaceGrotesk_500Medium" }}
                      className="text-xs text-muted"
                    >
                      Email
                    </Text>
                  </View>

                  <Text
                    style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                    className="text-sm text-ink max-w-50 text-right"
                    numberOfLines={1}
                  >
                    {email}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-7">
              <View className="flex-row items-center justify-between mb-3 px-0.5">
                <Text
                  style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                  className="text-xs uppercase tracking-wider text-muted"
                >
                  Direct Settlement Details
                </Text>
                <View className="flex-row items-center gap-1 rounded-md bg-teal/10 px-2 py-0.5">
                  <Building2 size={11} color="#0E7C66" />
                  <Text
                    style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                    className="text-[10px] text-teal tracking-wide"
                  >
                    IBAN / WIRE
                  </Text>
                </View>
              </View>

              <View className="rounded-3xl border border-ink/6 bg-cream p-5 shadow-sm">
                <View className="flex-row items-start gap-2.5 pb-4 mb-4 border-b border-ink/5">
                  <ShieldCheck size={16} color="#0E7C66" className="mt-0.5" />
                  <Text
                    style={{ fontFamily: "SpaceGrotesk_400Regular" }}
                    className="flex-1 text-xs leading-5 text-muted"
                  >
                    Group members can copy these details to transfer their balance directly to your bank account.
                  </Text>
                </View>

                <View className="gap-4">
                  <View>
                    <Text
                      style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                      className="mb-1.5 text-[11px] uppercase tracking-wider text-muted"
                    >
                      Account Holder
                    </Text>
                    <View
                      className={`rounded-2xl border px-4 py-3 transition-all ${
                        !isEditing
                          ? "border-transparent bg-canvas/60 opacity-80"
                          : isHolderFocused
                            ? "border-teal bg-canvas shadow-sm"
                            : "border-ink/8 bg-canvas"
                      }`}
                    >
                      <TextInput
                        value={accountHolder}
                        onChangeText={setAccountHolder}
                        editable={isEditing}
                        placeholder="Legal Name or Entity"
                        placeholderTextColor="#8A8680"
                        selectionColor="#0E7C66"
                        onFocus={() => setIsHolderFocused(true)}
                        onBlur={() => setIsHolderFocused(false)}
                        style={{
                          fontFamily: "SpaceGrotesk_500Medium",
                          fontSize: 14,
                          color: "#1B1B1F",
                        }}
                      />
                    </View>
                  </View>

                  <View>
                    <Text
                      style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                      className="mb-1.5 text-[11px] uppercase tracking-wider text-muted"
                    >
                      International Bank Account Number (IBAN)
                    </Text>
                    <View
                      className={`rounded-2xl border px-4 py-3 transition-all ${
                        !isEditing
                          ? "border-transparent bg-canvas/60 opacity-80"
                          : isIbanFocused
                            ? "border-teal bg-canvas shadow-sm"
                            : "border-ink/8 bg-canvas"
                      }`}
                    >
                      <TextInput
                        value={iban}
                        onChangeText={(txt) => setIban(formatIban(txt))}
                        editable={isEditing}
                        placeholder="GB29 NWBK 6016 1331 9268 19"
                        placeholderTextColor="#8A8680"
                        autoCapitalize="characters"
                        selectionColor="#0E7C66"
                        maxLength={42}
                        onFocus={() => setIsIbanFocused(true)}
                        onBlur={() => setIsIbanFocused(false)}
                        style={{
                          fontFamily: "SpaceGrotesk_700Bold",
                          fontSize: 13,
                          letterSpacing: 0.8,
                          color: "#1B1B1F",
                        }}
                      />
                    </View>
                  </View>

                  {!isEditing ? (
                    <TouchableOpacity
                      onPress={() => {
                        hapticFeedback.light();
                        setIsEditing(true);
                      }}
                      activeOpacity={0.8}
                      className="mt-1 h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-canvas active:scale-[0.99]"
                    >
                      <Pencil size={14} color="#1B1B1F" strokeWidth={2} />
                      <Text
                        style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                        className="text-xs text-ink"
                      >
                        Edit Details
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="mt-1 flex-row items-center gap-2">
                      {initialIban || initialHolder ? (
                        <TouchableOpacity
                          onPress={() => {
                            hapticFeedback.light();
                            setIban(initialIban);
                            setAccountHolder(initialHolder);
                            setIsEditing(false);
                          }}
                          activeOpacity={0.8}
                          className="h-12 flex-1 items-center justify-center rounded-2xl border border-ink/10 bg-canvas active:scale-[0.99]"
                        >
                          <Text
                            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                            className="text-xs text-ink/70"
                          >
                            Cancel
                          </Text>
                        </TouchableOpacity>
                      ) : null}

                      <TouchableOpacity
                        onPress={handleSavePaymentInfo}
                        disabled={
                          savingPayment ||
                          (!hasChanges && (!!initialIban || !!initialHolder))
                        }
                        activeOpacity={0.8}
                        className={`h-12 flex-row items-center justify-center gap-2 rounded-2xl active:scale-[0.99] ${
                          !hasChanges && (initialIban || initialHolder)
                            ? "bg-ink/20 flex-1"
                            : "bg-ink flex-1"
                        }`}
                      >
                        {savingPayment ? (
                          <ActivityIndicator color="#FFF8F0" size="small" />
                        ) : (
                          <>
                            <Check size={14} color="#FFF8F0" strokeWidth={2.5} />
                            <Text
                              style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                              className="text-xs text-cream"
                            >
                              Save Changes
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View className="mt-8 gap-3">
              <TouchableOpacity
                onPress={handleSignOut}
                disabled={deleting}
                activeOpacity={0.8}
                className="h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-cream active:scale-[0.99]"
              >
                <LogOut size={16} color="#1B1B1F" strokeWidth={2} />
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className="text-[15px] text-ink"
                >
                  Sign Out
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={deleting}
                activeOpacity={0.8}
                className="h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl border border-coral/30 bg-coral/10 active:scale-[0.99]"
              >
                {deleting ? (
                  <ActivityIndicator color="#FF6B4A" />
                ) : (
                  <>
                    <Trash2 size={16} color="#FF6B4A" strokeWidth={2} />
                    <Text
                      style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                      className="text-[15px] text-coral"
                    >
                      Delete Account
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="mt-12 items-center">
          <Text
            style={{ fontFamily: "SpaceGrotesk_400Regular" }}
            className="text-xs text-muted"
          >
            © 2026 AppName. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
