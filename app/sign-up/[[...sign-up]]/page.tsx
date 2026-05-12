import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="main">
      <div className="card">
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
      </div>
    </main>
  );
}
