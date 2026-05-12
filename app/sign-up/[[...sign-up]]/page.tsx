import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <strong>John Deere Warranty CDR</strong>
          <span>Secure dealer sign-up</span>
        </div>
      </header>
      <main className="main auth-main">
        <div className="card auth-card">
          <div>
            <h1>Create account</h1>
            <p>Use this only if dealership self-service sign-up is enabled in Clerk.</p>
          </div>
          <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/" />
        </div>
      </main>
    </div>
  );
}
