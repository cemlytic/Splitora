import { Expo } from "expo-server-sdk";

const expo = new Expo();

export const sendPushNotifications = async (messages) => {
  const validMessages = messages.filter(
    (msg) => msg.to && Expo.isExpoPushToken(msg.to),
  );

  if (validMessages.length === 0) return;

  const chunks = expo.chunkPushNotifications(validMessages);

  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error("Error sending push notification batch:", error);
    }
  }
};
