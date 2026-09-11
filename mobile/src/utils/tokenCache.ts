import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { TokenCache } from "@clerk/expo";

export const tokenCache: TokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        return typeof localStorage !== "undefined"
          ? localStorage.getItem(key)
          : null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error("SecureStore get item error: ", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error("SecureStore save item error: ", error);
    }
  },
};
