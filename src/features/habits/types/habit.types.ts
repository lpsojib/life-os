export type HabitStatus = "active" | "completed";

export type HabitAlarmSound =
  | "default"
  | "alarm"
  | "bell"
  | "chime"
  | "digital";

export type HabitAlarmRepeat =
  | "none"
  | "daily"
  | "weekdays"
  | "weekly";

export interface HabitAlarm {
  /**
   * Alarm চালু/বন্ধ
   *
   * Default:
   * true
   */
  enabled: boolean;

  /**
   * Alarm-এর sound
   *
   * IMPORTANT:
   * Alarm-এর time আলাদা নেই।
   * Habit-এর `time`-ই Alarm Time।
   */
  sound: HabitAlarmSound;

  /**
   * Alarm repeat system
   */
  repeat: HabitAlarmRepeat;

  /**
   * Snooze duration in minutes.
   *
   * 0 = Snooze disabled
   */
  snoozeMinutes: number;

  /**
   * Alarm বাজলে vibration হবে কি না
   */
  vibration: boolean;

  /**
   * একই alarm বারবার trigger হওয়া
   * prevent করার জন্য।
   */
  lastTriggeredAt?: string;
}

export interface Habit {
  id: string;

  name: string;

  targetDays: number;

  startDate: string;

  endDate: string;

  /**
   * Habit-এর সময়।
   *
   * এই time-টাই automatically
   * Alarm Time হিসেবে ব্যবহার হবে।
   *
   * Example:
   * "06:30"
   * "08:00"
   * "21:30"
   */
  time: string;

  status: HabitStatus;

  createdAt: string;

  /**
   * Alarm settings।
   *
   * Optional রাখা হয়েছে যাতে
   * পুরোনো Habit data-এর সাথে
   * compatibility থাকে।
   */
  alarm?: HabitAlarm;
}

export interface HabitCompletion {
  id: string;

  habitId: string;

  date: string;

  completed: boolean;

  createdAt: string;
}