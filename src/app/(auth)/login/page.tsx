import LoginForm from "@/features/auth/components/LoginForm";
import GoogleLoginButton from "@/features/auth/components/GoogleLoginButton";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-3xl font-bold">
          Welcome Back 👋
        </h1>

        <p className="mb-8 text-center text-gray-500">
          Sign in to your Life OS account
        </p>

        <LoginForm />

        <div className="my-6 flex items-center">
          <div className="h-px flex-1 bg-gray-300" />
          <span className="mx-4 text-sm text-gray-500">OR</span>
          <div className="h-px flex-1 bg-gray-300" />
        </div>

        <GoogleLoginButton />
      </div>
    </main>
  );
}