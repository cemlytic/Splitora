import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  MONGODB_URI: process.env.MONGODB_URI,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
};

if (!env.MONGODB_URI) throw new Error("MONGODB_URI missing");
if (!env.CLERK_SECRET_KEY) throw new Error("CLERK_SECRET_KEY missing");
if (!env.CLERK_PUBLISHABLE_KEY)
  throw new Error("CLERK_PUBLISHABLE_KEY missing");
