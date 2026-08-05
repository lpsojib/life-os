import LoginForm from "@/features/auth/components/LoginForm";

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
      </div>
    </main>
  );
}