import { SignInButton, SignOutButton, UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

import { ClaimIntake } from "@/components/claim-intake";
import { ManagerDashboard } from "@/components/manager-dashboard";
import { appConfig } from "@/lib/config";
import { getDashboardMetrics } from "@/lib/claim-records";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = appConfig.clerkIsConfigured ? await currentUser() : null;
  const dashboardMetrics = await getDashboardMetrics().catch(() => null);

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <strong>John Deere Warranty CDR</strong>
          <span>{appConfig.productionUrl}</span>
        </div>
        {appConfig.clerkIsConfigured && user ? (
          <div className="topbar-actions">
            <SignOutButton redirectUrl="/sign-in">
              <button className="logout-button" type="button">
                Log out
              </button>
            </SignOutButton>
            <UserButton />
          </div>
        ) : null}
      </header>

      <main className="main">
        {!appConfig.clerkIsConfigured ? (
          <div className="setup">
            Clerk is not configured in this environment. Add Clerk keys before production use. The local MVP
            remains available for build validation.
          </div>
        ) : null}

        {appConfig.clerkIsConfigured && !user ? (
          <div className="card">
            <h1>Sign in required</h1>
            <p>Warranty claim drafting is restricted to approved dealership users.</p>
            <SignInButton mode="modal">
              <button className="button" type="button">
                Sign in with Clerk
              </button>
            </SignInButton>
          </div>
        ) : (
          <>
            <section className="hero">
              <h1>Dealer-grade warranty CDR drafting MVP</h1>
              <p>
                Paste the original customer complaint, the technician&apos;s write-up, and the workorder time
                you are trying to collect. The app produces a copy-ready CDR draft and flags labor-time issues
                before submission.
              </p>
            </section>
            <ManagerDashboard metrics={dashboardMetrics} />
            <ClaimIntake />
          </>
        )}
      </main>
    </div>
  );
}
