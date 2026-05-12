import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <strong>John Deere Warranty CDR</strong>
          <span>Secure dealer sign-in</span>
        </div>
      </header>
      <main className="main auth-main">
        <div className="card auth-card">
          <div>
            <h1>Sign in</h1>
            <p>
              Warranty claim drafting is restricted to approved dealership users. If the Clerk form is
              still loading, refresh this page after DNS finishes propagating for the Clerk auth domain.
            </p>
          </div>
          <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
        </div>
      </main>
    </div>
  );
}
