export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">
        Welcome to Life OS 🚀
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">Today&apos;s Tasks</h2>
          <p className="mt-2 text-gray-500">
            No tasks yet.
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">Habits</h2>
          <p className="mt-2 text-gray-500">
            No habits yet.
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">Goals</h2>
          <p className="mt-2 text-gray-500">
            No goals yet.
          </p>
        </div>
      </div>
    </div>
  );
}