import StatsCard from "@/components/cards/StatsCard";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Welcome to Life OS 🚀
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Today's Tasks"
          value={0}
          description="Completed today"
        />

        <StatsCard
          title="Habits"
          value={0}
          description="Completed today"
        />

        <StatsCard
          title="Goals"
          value={0}
          description="Active goals"
        />

        <StatsCard
          title="XP"
          value={0}
          description="Current experience"
        />
      </div>
    </div>
  );
}