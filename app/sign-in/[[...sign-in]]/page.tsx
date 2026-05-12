import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="auth-shell">
      <main className="auth-layout">
        <section className="auth-hero-panel">
          <div className="auth-brand-mark">
            <span className="auth-logo-box">JD</span>
            <div>
              <strong>John Deere Warranty CDR</strong>
              <span>Dealer-grade claim drafting</span>
            </div>
          </div>

          <div className="auth-hero-copy">
            <span className="eyebrow">Secure dealership portal</span>
            <h1>Turn warranty notes into audit-ready CDR claims.</h1>
            <p>
              Sign in to convert customer complaints, technician write-ups, and workorder time into
              structured Deere-style warranty drafts with labor warnings and source guardrails.
            </p>
          </div>

          <div className="auth-feature-grid">
            <div>
              <span>01</span>
              <strong>Paste the story</strong>
              <p>Complaint, tech notes, and requested time stay together.</p>
            </div>
            <div>
              <span>02</span>
              <strong>Draft the CDR</strong>
              <p>Cause, Diagnose, Repair, and Clean up are formatted for review.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Catch issues early</strong>
              <p>Time mismatches and non-claimable activity are flagged before submission.</p>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-header">
            <span className="auth-secure-pill">Protected by Clerk</span>
            <h2>Welcome back</h2>
            <p>Use your approved dealership account to access warranty claim drafting.</p>
          </div>

          <div className="auth-clerk-frame">
            <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
          </div>

          <div className="auth-loading-note">
            <strong>Still loading?</strong>
            <span>
              Clerk DNS and certificate activation may take a few minutes after setup. Refresh the page
              if the sign-in form does not appear.
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
