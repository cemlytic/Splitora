import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  MONGODB_URI: process.env.MONGODB_URI,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

if (!env.MONGODB_URI) throw new Error("MONGODB_URI missing");
if (!env.CLERK_SECRET_KEY) throw new Error("CLERK_SECRET_KEY missing");
if (!env.CLERK_PUBLISHABLE_KEY)
  throw new Error("CLERK_PUBLISHABLE_KEY missing");
if (!env.CLOUDINARY_CLOUD_NAME)
  throw new Error("CLOUDINARY_CLOUD_NAME missing");
if (!env.CLOUDINARY_API_KEY) throw new Error("CLOUDINARY_API_KEY missing");
if (!env.CLOUDINARY_API_SECRET)
  throw new Error("CLOUDINARY_API_SECRET missing");
