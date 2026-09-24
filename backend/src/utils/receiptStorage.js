import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const uploadReceiptImage = async (base64DataUri) => {
  const result = await cloudinary.uploader.upload(base64DataUri, {
    folder: "splitwise-receipts",
    resource_type: "image",
  });
  return result.secure_url;
};

export const isBase64DataUri = (value) =>
  typeof value === "string" && value.startsWith("data:image");
