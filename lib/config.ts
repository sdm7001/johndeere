export const clerkIsConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export const appConfig = {
  appName: "John Deere Warranty CDR",
  productionUrl: "https://jd.texmg.com",
  clerkIsConfigured,
};
