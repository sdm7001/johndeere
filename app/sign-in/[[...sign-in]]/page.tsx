import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="main">
      <div className="card">
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
      </div>
    </main>
  );
}
