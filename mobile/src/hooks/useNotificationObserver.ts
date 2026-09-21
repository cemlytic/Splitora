import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";

export const useNotificationObserver = () => {
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null,
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log(
          "[PushNotification] Foreground notification received:",
          notification.request.content,
        );
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log("[PushNotification] Interaction payload:", data);

        if (!data) return;

        if (
          (data.type === "EXPENSE_CREATED" ||
            data.type === "SETTLEMENT_CONFIRMED") &&
          data.groupId
        ) {
          router.push(`/group/${data.groupId}`);
        }
      });

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse?.notification?.request?.content?.data) {
      const data = lastResponse.notification.request.content.data;
      if (
        (data.type === "EXPENSE_CREATED" ||
          data.type === "SETTLEMENT_CONFIRMED") &&
        data.groupId
      ) {
        router.push(`/group/${data.groupId}`);
      }
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);
};
