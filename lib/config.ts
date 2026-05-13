export const clerkIsConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

// Dealer-approved warranty labor rate in USD per hour.
// Set WARRANTY_LABOR_RATE in env (e.g. 125). Defaults to 0 (disabled).
export const warrantyLaborRate = Number(process.env.WARRANTY_LABOR_RATE ?? 0);

export const appConfig = {
  appName: "John Deere Warranty CDR",
  productionUrl: "https://jd.texmg.com",
  clerkIsConfigured,
  warrantyLaborRate,
};
