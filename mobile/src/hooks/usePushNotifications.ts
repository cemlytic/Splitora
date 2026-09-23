import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useUser } from "@clerk/expo";
import { userService } from "@/services/userService";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function usePushNotifications() {
  const { user } = useUser();
  const notificationListener = useRef<{ remove: () => void } | null>(null);
  const responseListener = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    const currentUserId = user?.id;
    if (!currentUserId) return;

    if (isExpoGo && Platform.OS === "android") {
      console.warn(
        "[NotificationService] Android Expo Go does not support remote push notifications. Development build or iOS is required.",
      );
      return;
    }

    let isMounted = true;

    async function initNotifications() {
      try {
        const Notifications = await import("expo-notifications");

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        const token = await registerForPushNotificationsAsync(Notifications);

        if (token && currentUserId && isMounted) {
          try {
            await userService.updatePushToken(currentUserId);
            console.log(
              "[NotificationService] Push token registered for user:",
              currentUserId,
            );
          } catch (error) {
            console.error(
              "[NotificationService] Failed to persist push token:",
              error,
            );
          }
        }

        notificationListener.current =
          Notifications.addNotificationReceivedListener((notification) => {
            console.log(
              "[NotificationService] Notification received:",
              notification,
            );
          });

        responseListener.current =
          Notifications.addNotificationResponseReceivedListener((response) => {
            console.log(
              "[NotificationService] Notification response received:",
              response,
            );
          });
      } catch (err) {
        console.error("[NotificationService] Initialization error:", err);
      }
    }

    initNotifications();

    return () => {
      isMounted = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?.id]);
}

async function registerForPushNotificationsAsync(
  Notifications: typeof import("expo-notifications"),
): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0E7C66",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn(
        "[NotificationService] Permission not granted for push notifications.",
      );
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      "91a87b9e-5d11-499d-9d80-977e9898f312";

    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = pushTokenData.data;
    } catch (error) {
      console.error(
        "[NotificationService] Failed to retrieve Expo push token:",
        error,
      );
    }
  } else {
    console.info(
      "[NotificationService] Physical device required for push notifications.",
    );
  }

  return token;
}
