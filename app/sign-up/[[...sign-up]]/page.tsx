import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="auth-shell">
      <main className="auth-layout">
        <section className="auth-hero-panel">
          <div className="auth-brand-mark">
            <span className="auth-logo-box">JD</span>
            <div>
              <strong>John Deere Warranty CDR</strong>
              <span>Dealer warranty workspace</span>
            </div>
          </div>

          <div className="auth-hero-copy">
            <span className="eyebrow">Invitation required</span>
            <h1>Create access for warranty claim drafting.</h1>
            <p>
              New accounts should be limited to approved dealership users who prepare, review, or
              manage Deere warranty claim documentation.
            </p>
          </div>

          <div className="auth-feature-grid">
            <div>
              <span>01</span>
              <strong>Secure access</strong>
              <p>Keep warranty drafts and source documents behind authenticated sessions.</p>
            </div>
            <div>
              <span>02</span>
              <strong>Controlled workflow</strong>
              <p>Use account approvals before allowing claim drafting access.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Audit ready</strong>
              <p>Protect the process that turns workorder notes into CDR drafts.</p>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-header">
            <span className="auth-secure-pill">Protected by Clerk</span>
            <h2>Create account</h2>
            <p>Use this only if dealership self-service sign-up is enabled in Clerk.</p>
          </div>

          <div className="auth-clerk-frame">
            <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/" />
          </div>

          <div className="auth-loading-note">
            <strong>Need access?</strong>
            <span>Ask the dealership administrator to invite or approve your account.</span>
          </div>
        </section>
      </main>
    </div>
  );
}
