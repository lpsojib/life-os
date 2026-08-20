// "use client";

// import {
//   CheckSquare,
//   Flame,
//   Target,
//   TrendingUp,
// } from "lucide-react";
// import {
//   useCallback,
//   useEffect,
//   useState,
// } from "react";

// import DashboardCard from "./DashboardCard";
// import DashboardSectionTitle from "./DashboardSectionTitle";

// import { getTasks } from "@/features/tasks/services/task.service";

// import {
//   getHabits,
//   getHabitCompletions,
// } from "@/features/habits/services/habit.service";

// import {
//   getGoals,
//   getGoalTasks,
// } from "@/features/goals/services/goal.service";

// /* =========================================================
//    TYPES
// ========================================================= */

// interface Summary {
//   tasks: {
//     total: number;
//     completed: number;
//     pending: number;
//   };

//   habits: {
//     total: number;
//     completed: number;
//     pending: number;
//   };

//   goals: {
//     total: number;
//     completed: number;
//     pending: number;
//     progress: number;
//   };
// }

// /* =========================================================
//    COLORS
// ========================================================= */

// const COLORS = {
//   ink: "#2A2318",
//   muted: "#8C8374",

//   task: {
//     foreground: "#2A6459",
//     background: "#E3EFEA",
//   },

//   habit: {
//     foreground: "#B4842A",
//     background: "#F5EACB",
//   },

//   goal: {
//     foreground: "#7C4F6E",
//     background: "#F0E3EC",
//   },

//   progress: {
//     foreground: "#B15A38",
//     background: "#F6E4D8",
//   },
// };

// /* =========================================================
//    HELPERS
// ========================================================= */

// const getTodayString = (): string => {
//   const today = new Date();

//   return `${today.getFullYear()}-${String(
//     today.getMonth() + 1
//   ).padStart(2, "0")}-${String(
//     today.getDate()
//   ).padStart(2, "0")}`;
// };

// const clampPercentage = (
//   value: number
// ): number => {
//   if (!Number.isFinite(value)) {
//     return 0;
//   }

//   return Math.min(
//     100,
//     Math.max(0, Math.round(value))
//   );
// };

// /* =========================================================
//    OVERVIEW CARD
// ========================================================= */

// interface OverviewCardProps {
//   icon: typeof CheckSquare;
//   title: string;
//   value: string;
//   subtitle: string;
//   foreground: string;
//   background: string;
// }

// function OverviewCard({
//   icon: Icon,
//   title,
//   value,
//   subtitle,
//   foreground,
//   background,
// }: OverviewCardProps) {
//   return (
//     <div
//       className="rounded-2xl p-3.5 flex flex-col gap-2.5"
//       style={{
//         background,
//       }}
//     >
//       <div
//         className="w-8 h-8 rounded-lg flex items-center justify-center"
//         style={{
//           background: "#FFFFFF",
//         }}
//       >
//         <Icon
//           size={15}
//           color={foreground}
//           strokeWidth={2.2}
//         />
//       </div>

//       <div>
//         <div
//           style={{
//             fontFamily:
//               "'IBM Plex Mono', monospace",
//             fontSize: "18px",
//             fontWeight: 600,
//             color: foreground,
//           }}
//         >
//           {value}
//         </div>

//         <div
//           className="text-xs mt-0.5"
//           style={{
//             color: COLORS.ink,
//             fontWeight: 600,
//             opacity: 0.8,
//           }}
//         >
//           {title}
//         </div>

//         <div
//           className="text-[10px] mt-1"
//           style={{
//             color: COLORS.muted,
//           }}
//         >
//           {subtitle}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    COMPONENT
// ========================================================= */

// export default function OverviewSection() {
//   const [summary, setSummary] =
//     useState<Summary>({
//       tasks: {
//         total: 0,
//         completed: 0,
//         pending: 0,
//       },

//       habits: {
//         total: 0,
//         completed: 0,
//         pending: 0,
//       },

//       goals: {
//         total: 0,
//         completed: 0,
//         pending: 0,
//         progress: 0,
//       },
//     });

//   const [loading, setLoading] =
//     useState(true);

//   /* =======================================================
//      LOAD SUMMARY
//   ======================================================= */

//   const loadSummary =
//     useCallback(async () => {
//       try {
//         setLoading(true);

//         const today =
//           getTodayString();

//         /* =================================================
//            TASKS
//         ================================================= */

//         const allTasks =
//           await getTasks();

//         /*
//          * আজকের Task:
//          *
//          * 1. dueDate আজকের হলে
//          * 2. status daily হলে
//          * 3. আজ complete করা হলে
//          *
//          * Future/pending Task এখানে আসবে না।
//          */

//         const todayTasks =
//           allTasks.filter(
//             (task) => {
//               if (
//                 task.dueDate ===
//                 today
//               ) {
//                 return true;
//               }

//               if (
//                 task.status ===
//                 "daily"
//               ) {
//                 return true;
//               }

//               if (
//                 task.status ===
//                   "completed" &&
//                 task.completedAt
//               ) {
//                 const completedDate =
//                   task.completedAt.slice(
//                     0,
//                     10
//                   );

//                 return (
//                   completedDate ===
//                   today
//                 );
//               }

//               return false;
//             }
//           );

//         const totalTasks =
//           todayTasks.length;

//         const completedTasks =
//           todayTasks.filter(
//             (task) =>
//               task.status ===
//               "completed"
//           ).length;

//         const pendingTasks =
//           Math.max(
//             0,
//             totalTasks -
//               completedTasks
//           );

//         /* =================================================
//            HABITS
//         ================================================= */

//         const allHabits =
//           await getHabits();

//         const activeHabits =
//           allHabits.filter(
//             (habit) =>
//               habit.status ===
//               "active"
//           );

//         const totalHabits =
//           activeHabits.length;

//         let completedHabits = 0;

//         await Promise.all(
//           activeHabits.map(
//             async (habit) => {
//               try {
//                 const completions =
//                   await getHabitCompletions(
//                     habit.id
//                   );

//                 const completedToday =
//                   completions.some(
//                     (completion) =>
//                       completion.date ===
//                         today &&
//                       completion.completed ===
//                         true
//                   );

//                 if (
//                   completedToday
//                 ) {
//                   completedHabits +=
//                     1;
//                 }
//               } catch (error) {
//                 console.error(
//                   "Habit completion load failed:",
//                   error
//                 );
//               }
//             }
//           )
//         );

//         const pendingHabits =
//           Math.max(
//             0,
//             totalHabits -
//               completedHabits
//           );

//         /* =================================================
//            GOALS
//         ================================================= */

//         const allGoals =
//           await getGoals();

//         /*
//          * শুধু আজকের date range-এর
//          * ভিতরে থাকা Goal।
//          */

//         const todayGoals =
//           allGoals.filter(
//             (goal) =>
//               goal.startDate <=
//                 today &&
//               goal.endDate >=
//                 today
//           );

//         const totalGoals =
//           todayGoals.length;

//         let completedGoals = 0;
//         let totalGoalProgress = 0;

//         for (const goal of todayGoals) {
//           let progress =
//             typeof goal.progress ===
//             "number"
//               ? goal.progress
//               : 0;

//           const goalTasks =
//             await getGoalTasks(
//               goal.id
//             );

//           if (
//             goalTasks.length > 0
//           ) {
//             const completed =
//               goalTasks.filter(
//                 (task) =>
//                   task.completed
//               ).length;

//             progress =
//               (completed /
//                 goalTasks.length) *
//               100;
//           }

//           progress =
//             clampPercentage(
//               progress
//             );

//           totalGoalProgress +=
//             progress;

//           if (
//             goal.status ===
//               "completed" ||
//             progress === 100
//           ) {
//             completedGoals += 1;
//           }
//         }

//         const pendingGoals =
//           Math.max(
//             0,
//             totalGoals -
//               completedGoals
//           );

//         const goalProgress =
//           totalGoals > 0
//             ? clampPercentage(
//                 totalGoalProgress /
//                   totalGoals
//               )
//             : 0;

//         /* =================================================
//            UPDATE SUMMARY
//         ================================================= */

//         setSummary({
//           tasks: {
//             total:
//               totalTasks,
//             completed:
//               completedTasks,
//             pending:
//               pendingTasks,
//           },

//           habits: {
//             total:
//               totalHabits,
//             completed:
//               completedHabits,
//             pending:
//               pendingHabits,
//           },

//           goals: {
//             total:
//               totalGoals,
//             completed:
//               completedGoals,
//             pending:
//               pendingGoals,
//             progress:
//               goalProgress,
//           },
//         });
//       } catch (error) {
//         console.error(
//           "Overview summary load failed:",
//           error
//         );
//       } finally {
//         setLoading(false);
//       }
//     }, []);

//   /* =======================================================
//      INITIAL LOAD + UPDATE EVENTS
//   ======================================================= */

//   useEffect(() => {
//     queueMicrotask(() => {
//       void loadSummary();
//     });

//     const handleUpdate = () => {
//       void loadSummary();
//     };

//     window.addEventListener(
//       "life-os-task-changed",
//       handleUpdate
//     );

//     window.addEventListener(
//       "life-os-habit-changed",
//       handleUpdate
//     );

//     window.addEventListener(
//       "life-os-goal-changed",
//       handleUpdate
//     );

//     window.addEventListener(
//       "life-os-task-synced",
//       handleUpdate
//     );

//     window.addEventListener(
//       "life-os-goal-synced",
//       handleUpdate
//     );

//     window.addEventListener(
//       "online",
//       handleUpdate
//     );

//     return () => {
//       window.removeEventListener(
//         "life-os-task-changed",
//         handleUpdate
//       );

//       window.removeEventListener(
//         "life-os-habit-changed",
//         handleUpdate
//       );

//       window.removeEventListener(
//         "life-os-goal-changed",
//         handleUpdate
//       );

//       window.removeEventListener(
//         "life-os-task-synced",
//         handleUpdate
//       );

//       window.removeEventListener(
//         "life-os-goal-synced",
//         handleUpdate
//       );

//       window.removeEventListener(
//         "online",
//         handleUpdate
//       );
//     };
//   }, [loadSummary]);

//   /* =======================================================
//      DISPLAY VALUES
//   ======================================================= */

//   const taskValue = loading
//     ? "—"
//     : `${summary.tasks.completed}/${summary.tasks.total}`;

//   const habitValue = loading
//     ? "—"
//     : `${summary.habits.completed}/${summary.habits.total}`;

//   const goalValue = loading
//     ? "—"
//     : `${summary.goals.completed}/${summary.goals.total}`;

//   const progressValue = loading
//     ? "—"
//     : `${summary.goals.progress}%`;

//   /* =======================================================
//      UI
//   ======================================================= */

//   return (
//     <DashboardCard>
//       <DashboardSectionTitle
//         title="ওভারভিউ"
//       />

//       <div className="grid grid-cols-2 gap-3">
//         <OverviewCard
//           icon={CheckSquare}
//           title="আজকের টাস্ক"
//           value={taskValue}
//           subtitle={
//             loading
//               ? "লোড হচ্ছে..."
//               : `${summary.tasks.pending}টি বাকি`
//           }
//           foreground={
//             COLORS.task.foreground
//           }
//           background={
//             COLORS.task.background
//           }
//         />

//         <OverviewCard
//           icon={Flame}
//           title="আজকের অভ্যাস"
//           value={habitValue}
//           subtitle={
//             loading
//               ? "লোড হচ্ছে..."
//               : `${summary.habits.pending}টি বাকি`
//           }
//           foreground={
//             COLORS.habit.foreground
//           }
//           background={
//             COLORS.habit.background
//           }
//         />

//         <OverviewCard
//           icon={Target}
//           title="সক্রিয় লক্ষ্য"
//           value={goalValue}
//           subtitle={
//             loading
//               ? "লোড হচ্ছে..."
//               : `${summary.goals.pending}টি বাকি`
//           }
//           foreground={
//             COLORS.goal.foreground
//           }
//           background={
//             COLORS.goal.background
//           }
//         />

//         <OverviewCard
//           icon={TrendingUp}
//           title="লক্ষ্য অগ্রগতি"
//           value={progressValue}
//           subtitle={
//             loading
//               ? "লোড হচ্ছে..."
//               : "আজকের লক্ষ্য"
//           }
//           foreground={
//             COLORS.progress.foreground
//           }
//           background={
//             COLORS.progress.background
//           }
//         />
//       </div>
//     </DashboardCard>
//   );
// }