export type Language = "en" | "bn";

export const translations = {
  en: {
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      close: "Close",
      reset: "Reset",
      confirm: "Confirm",
      back: "Back",
      done: "Done",
      yes: "Yes",
      no: "No",
      loading: "Loading...",
      search: "Search",
      today: "Today",
      yesterday: "Yesterday",
      tomorrow: "Tomorrow",
    },

    nav: {
      dashboard: "Dashboard",
      tasks: "Tasks",
      planner: "Planner",
      goals: "Goals",
      habits: "Habits",
      focus: "Focus",
      journal: "Journal",
      calendar: "Calendar",
      finance: "Finance",
      about: "About",
      settings: "Settings",
    },

    dashboard: {
      title: "Dashboard",
      subtitle: "Here's your day at a glance",
      today: "Today",
      tasks: "Tasks",
      habits: "Habits",
      goals: "Goals",
      focus: "Focus",
      completed: "Completed",
      pending: "Pending",
      progress: "Progress",
    },

    tasks: {
      title: "Tasks",
      subtitle: "Manage everything on your plate",
      addTask: "Add Task",
      taskName: "Task name",
      description: "Description",
      priority: "Priority",
      low: "Low",
      medium: "Medium",
      high: "High",
      pending: "Pending",
      completed: "Completed",
      all: "All Tasks",
      noTasks: "No tasks yet",
      taskAdded: "Task added",
      taskDeleted: "Task deleted",
    },

    habits: {
      title: "Habits",
      subtitle: "Build consistency, one day at a time",
      addHabit: "Add Habit",
      today: "Today",
      streak: "Streak",
      completed: "Completed",
      noHabits: "No habits yet",
      reminder: "Reminder",
      alarm: "Alarm",
    },

    goals: {
      title: "Goals",
      subtitle: "Track your long-term progress",
      addGoal: "Add Goal",
      active: "Active",
      completed: "Completed",
      expired: "Expired",
      progress: "Progress",
      tasks: "Tasks",
      startDate: "Start date",
      endDate: "End date",
      noGoals: "No goals yet",
    },

    focus: {
      title: "Focus Mode",
      subtitle: "Deep work, distraction-free",
      start: "Start",
      pause: "Pause",
      reset: "Reset",
      focusSession: "Focus Session",
      paused: "Paused",
      inProgress: "In progress",
      sessionComplete: "Session complete",
      sessions: "Sessions",
      totalFocus: "Total focus",
      distractions: "Distractions",
    },

    planner: {
      title: "Planner",
      subtitle: "Plan your days and weeks",
      week: "Week",
      month: "Month",
      today: "Today",
    },

    journal: {
      title: "Journal",
      subtitle: "Reflect on your day",
      newEntry: "New Entry",
      writeSomething: "Write something...",
      saveNote: "Save Note",
      gratitude: "Gratitude",
    },

    settings: {
      title: "Settings",
      subtitle: "Personalize your Life OS",

      appearance: "Appearance",
      language: "Language",
      languageDescription:
        "Choose the language for your Life OS",

      english: "English",
      bangla: "বাংলা",

      theme: "Theme",
      light: "Light",
      dark: "Dark",

      notifications: "Notifications",
      taskReminders: "Task reminders",
      habitNudges: "Habit nudges",
      weeklyReport: "Weekly report",

      security: "Security",
      pinLock: "PIN lock",
      fingerprint: "Face ID / Fingerprint",
      cloudBackup: "Encrypted cloud backup",

      exportData: "Export data",

      reset: "Reset Life OS",
      resetDescription:
        "Reset selected Life OS data",
      resetWarning:
        "This action cannot be undone.",
      resetEverything:
        "Reset everything",

      languageChanged:
        "Language changed successfully",
    },

    about: {
      title: "About",
      subtitle: "About your Life OS",
    },
  },

  bn: {
    common: {
      save: "সংরক্ষণ",
      cancel: "বাতিল",
      delete: "মুছে ফেলুন",
      edit: "এডিট",
      add: "যোগ করুন",
      close: "বন্ধ করুন",
      reset: "রিসেট",
      confirm: "নিশ্চিত করুন",
      back: "ফিরে যান",
      done: "সম্পন্ন",
      yes: "হ্যাঁ",
      no: "না",
      loading: "লোড হচ্ছে...",
      search: "সার্চ",
      today: "আজ",
      yesterday: "গতকাল",
      tomorrow: "আগামীকাল",
    },

    nav: {
      dashboard: "ড্যাশবোর্ড",
      tasks: "টাস্ক",
      planner: "প্ল্যানার",
      goals: "লক্ষ্য",
      habits: "অভ্যাস",
      focus: "ফোকাস",
      journal: "জার্নাল",
      calendar: "ক্যালেন্ডার",
      finance: "ফাইন্যান্স",
      about: "সম্পর্কে",
      settings: "সেটিংস",
    },

    dashboard: {
      title: "ড্যাশবোর্ড",
      subtitle: "আপনার দিনের সবকিছু এক নজরে",
      today: "আজ",
      tasks: "টাস্ক",
      habits: "অভ্যাস",
      goals: "লক্ষ্য",
      focus: "ফোকাস",
      completed: "সম্পন্ন",
      pending: "বাকি",
      progress: "অগ্রগতি",
    },

    tasks: {
      title: "টাস্ক",
      subtitle: "আপনার সব কাজ পরিচালনা করুন",
      addTask: "টাস্ক যোগ করুন",
      taskName: "টাস্কের নাম",
      description: "বিবরণ",
      priority: "অগ্রাধিকার",
      low: "কম",
      medium: "মাঝারি",
      high: "জরুরি",
      pending: "বাকি",
      completed: "সম্পন্ন",
      all: "সব টাস্ক",
      noTasks: "এখনও কোনো টাস্ক নেই",
      taskAdded: "টাস্ক যোগ হয়েছে",
      taskDeleted: "টাস্ক মুছে ফেলা হয়েছে",
    },

    habits: {
      title: "অভ্যাস",
      subtitle: "প্রতিদিন ধারাবাহিকতা তৈরি করুন",
      addHabit: "অভ্যাস যোগ করুন",
      today: "আজ",
      streak: "স্ট্রিক",
      completed: "সম্পন্ন",
      noHabits: "এখনও কোনো অভ্যাস নেই",
      reminder: "রিমাইন্ডার",
      alarm: "অ্যালার্ম",
    },

    goals: {
      title: "লক্ষ্য",
      subtitle: "আপনার দীর্ঘমেয়াদি অগ্রগতি দেখুন",
      addGoal: "লক্ষ্য যোগ করুন",
      active: "চলমান",
      completed: "সম্পন্ন",
      expired: "মেয়াদ শেষ",
      progress: "অগ্রগতি",
      tasks: "টাস্ক",
      startDate: "শুরুর তারিখ",
      endDate: "শেষের তারিখ",
      noGoals: "এখনও কোনো লক্ষ্য নেই",
    },

    focus: {
      title: "ফোকাস মোড",
      subtitle: "বিভ্রান্তি ছাড়া গভীর মনোযোগ",
      start: "শুরু",
      pause: "পজ",
      reset: "রিসেট",
      focusSession: "ফোকাস সেশন",
      paused: "পজ করা হয়েছে",
      inProgress: "চলছে",
      sessionComplete: "সেশন সম্পন্ন",
      sessions: "সেশন",
      totalFocus: "মোট ফোকাস",
      distractions: "বিভ্রান্তি",
    },

    planner: {
      title: "প্ল্যানার",
      subtitle: "আপনার দিন ও সপ্তাহ পরিকল্পনা করুন",
      week: "সপ্তাহ",
      month: "মাস",
      today: "আজ",
    },

    journal: {
      title: "জার্নাল",
      subtitle: "আপনার দিন নিয়ে ভাবুন",
      newEntry: "নতুন লেখা",
      writeSomething: "কিছু লিখুন...",
      saveNote: "নোট সংরক্ষণ",
      gratitude: "কৃতজ্ঞতা",
    },

    settings: {
      title: "সেটিংস",
      subtitle: "আপনার Life OS নিজের মতো সাজান",

      appearance: "অ্যাপিয়ারেন্স",
      language: "ভাষা",
      languageDescription:
        "আপনার Life OS-এর ভাষা নির্বাচন করুন",

      english: "English",
      bangla: "বাংলা",

      theme: "থিম",
      light: "লাইট",
      dark: "ডার্ক",

      notifications: "নোটিফিকেশন",
      taskReminders: "টাস্ক রিমাইন্ডার",
      habitNudges: "অভ্যাস রিমাইন্ডার",
      weeklyReport: "সাপ্তাহিক রিপোর্ট",

      security: "নিরাপত্তা",
      pinLock: "PIN লক",
      fingerprint: "Face ID / Fingerprint",
      cloudBackup: "এনক্রিপ্টেড ক্লাউড ব্যাকআপ",

      exportData: "ডেটা এক্সপোর্ট",

      reset: "Life OS রিসেট",
      resetDescription:
        "নির্বাচিত Life OS ডেটা রিসেট করুন",
      resetWarning:
        "এই কাজটি আর ফিরিয়ে নেওয়া যাবে না।",
      resetEverything:
        "সবকিছু রিসেট করুন",

      languageChanged:
        "ভাষা সফলভাবে পরিবর্তন হয়েছে",
    },

    about: {
      title: "সম্পর্কে",
      subtitle: "আপনার Life OS সম্পর্কে",
    },
  },
} as const;