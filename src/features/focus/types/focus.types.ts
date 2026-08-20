export interface FocusItem {
  id: string;
  title: string;

  // Timer কখন শুরু হয়েছে
  startedAt: number | null;

  // Pause করার সময় পর্যন্ত মোট elapsed time
  elapsed: number;

  // বর্তমানে চলছে কি না
  running: boolean;

  createdAt: number;
}