"use client";

import type {
  Habit,
  HabitAlarm,
} from "../types/habit.types";

const ALARM_STORAGE_KEY =
  "life-os-habit-alarm-state";

const CHECK_INTERVAL =
  15 * 1000;

const TRIGGER_GUARD =
  60 * 1000;

const DEFAULT_ALARM: HabitAlarm = {
  enabled: true,
  sound: "default",
  repeat: "daily",
  snoozeMinutes: 5,
  vibration: true,
};

interface AlarmState {
  habitId: string;
  lastTriggeredAt?: string;
  snoozeUntil?: string;
  settings?: HabitAlarm;
}

/* =========================================================
   AUDIO
========================================================= */

let audioContext: AudioContext | null = null;

let alarmTimer:
  ReturnType<typeof setTimeout> | null = null;

let alarmPlaying = false;

const getAudioContext =
  (): AudioContext | null => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      if (audioContext) {
        return audioContext;
      }

      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioContextClass) {
        return null;
      }

      audioContext =
        new AudioContextClass();

      return audioContext;
    } catch (error) {
      console.error(
        "Life OS: AudioContext error",
        error
      );

      return null;
    }
  };

export const unlockAlarmAudio =
  async (): Promise<void> => {
    const context =
      getAudioContext();

    if (!context) {
      return;
    }

    try {
      if (context.state === "suspended") {
        await context.resume();
      }
    } catch (error) {
      console.error(
        "Life OS: Audio unlock error",
        error
      );
    }
  };

const playTone = (
  context: AudioContext,
  frequency: number,
  duration: number,
  volume: number
): void => {
  const oscillator =
    context.createOscillator();

  const gain =
    context.createGain();

  const startTime =
    context.currentTime;

  oscillator.type = "sine";

  oscillator.frequency.setValueAtTime(
    frequency,
    startTime
  );

  gain.gain.setValueAtTime(
    0.001,
    startTime
  );

  gain.gain.exponentialRampToValueAtTime(
    volume,
    startTime + 0.03
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    startTime + duration
  );

  oscillator.connect(gain);
  gain.connect(
    context.destination
  );

  oscillator.start(startTime);

  oscillator.stop(
    startTime + duration
  );
};

const playAlarmPattern = (
  sound: HabitAlarm["sound"]
): void => {
  const context =
    getAudioContext();

  if (!context) {
    return;
  }

  switch (sound) {
    case "alarm":
      playTone(
        context,
        880,
        0.35,
        0.45
      );

      setTimeout(() => {
        playTone(
          context,
          440,
          0.35,
          0.45
        );
      }, 380);

      setTimeout(() => {
        playTone(
          context,
          880,
          0.35,
          0.45
        );
      }, 760);

      setTimeout(() => {
        playTone(
          context,
          440,
          0.35,
          0.45
        );
      }, 1140);

      break;

    case "bell":
      playTone(
        context,
        880,
        0.55,
        0.4
      );

      setTimeout(() => {
        playTone(
          context,
          660,
          0.55,
          0.4
        );
      }, 600);

      break;

    case "chime":
      playTone(
        context,
        523.25,
        0.5,
        0.35
      );

      setTimeout(() => {
        playTone(
          context,
          659.25,
          0.5,
          0.35
        );
      }, 250);

      setTimeout(() => {
        playTone(
          context,
          783.99,
          0.7,
          0.35
        );
      }, 500);

      break;

    case "digital":
      playTone(
        context,
        1000,
        0.18,
        0.4
      );

      setTimeout(() => {
        playTone(
          context,
          800,
          0.18,
          0.4
        );
      }, 220);

      setTimeout(() => {
        playTone(
          context,
          1000,
          0.18,
          0.4
        );
      }, 440);

      break;

    case "default":
    default:
      playTone(
        context,
        660,
        0.5,
        0.4
      );

      setTimeout(() => {
        playTone(
          context,
          880,
          0.5,
          0.4
        );
      }, 550);

      setTimeout(() => {
        playTone(
          context,
          660,
          0.5,
          0.4
        );
      }, 1100);

      break;
  }
};

export const playAlarmSound =
  async (
    sound: HabitAlarm["sound"] = "default"
  ): Promise<void> => {
    await unlockAlarmAudio();

    playAlarmPattern(sound);
  };

export const startContinuousAlarmSound =
  async (
    sound: HabitAlarm["sound"] = "default"
  ): Promise<void> => {
    await unlockAlarmAudio();

    stopAlarmSound();

    alarmPlaying = true;

    const playLoop = () => {
      if (!alarmPlaying) {
        return;
      }

      playAlarmPattern(sound);

      alarmTimer =
        setTimeout(
          playLoop,
          2200
        );
    };

    playLoop();
  };

export const stopAlarmSound =
  (): void => {
    alarmPlaying = false;

    if (alarmTimer) {
      clearTimeout(
        alarmTimer
      );

      alarmTimer = null;
    }
  };

/* =========================================================
   VIBRATION
========================================================= */

export const vibrateAlarm =
  (): void => {
    if (
      typeof navigator === "undefined"
    ) {
      return;
    }

    if (!navigator.vibrate) {
      return;
    }

    try {
      navigator.vibrate([
        700,
        300,
        700,
        300,
        1000,
      ]);
    } catch (error) {
      console.error(
        "Life OS: Vibration error",
        error
      );
    }
  };

export const stopAlarmVibration =
  (): void => {
    if (
      typeof navigator === "undefined"
    ) {
      return;
    }

    if (!navigator.vibrate) {
      return;
    }

    try {
      navigator.vibrate(0);
    } catch {
      // Ignore.
    }
  };

/* =========================================================
   NOTIFICATION
========================================================= */

export const requestAlarmNotificationPermission =
  async (): Promise<
    NotificationPermission | null
  > => {
    if (
      typeof window === "undefined"
    ) {
      return null;
    }

    if (
      !("Notification" in window)
    ) {
      return null;
    }

    try {
      if (
        Notification.permission ===
        "granted"
      ) {
        return "granted";
      }

      if (
        Notification.permission ===
        "denied"
      ) {
        return "denied";
      }

      return await Notification.requestPermission();
    } catch (error) {
      console.error(
        "Life OS: Notification permission error",
        error
      );

      return null;
    }
  };

const showAlarmNotification =
  (
    habit: Habit
  ): void => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    if (
      !("Notification" in window)
    ) {
      return;
    }

    if (
      Notification.permission !==
      "granted"
    ) {
      return;
    }

    try {
      const notification =
        new Notification(
          `⏰ ${habit.name}`,
          {
            body: `Habit alarm - ${habit.time}`,
            icon: "/icons/icon-192.png",
            tag: `habit-alarm-${habit.id}`,
            requireInteraction: true,
          }
        );

      notification.onclick =
        () => {
          window.focus();
          notification.close();
        };
    } catch (error) {
      console.error(
        "Life OS: Notification error",
        error
      );
    }
  };

/* =========================================================
   LOCAL ALARM STATE
========================================================= */

const getAlarmStates =
  (): AlarmState[] => {
    if (
      typeof window === "undefined"
    ) {
      return [];
    }

    try {
      const raw =
        localStorage.getItem(
          ALARM_STORAGE_KEY
        );

      if (!raw) {
        return [];
      }

      const parsed =
        JSON.parse(raw);

      if (
        !Array.isArray(parsed)
      ) {
        return [];
      }

      return parsed as AlarmState[];
    } catch {
      return [];
    }
  };

const saveAlarmStates =
  (
    states: AlarmState[]
  ): void => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    try {
      localStorage.setItem(
        ALARM_STORAGE_KEY,
        JSON.stringify(states)
      );
    } catch (error) {
      console.error(
        "Life OS: Alarm storage error",
        error
      );
    }
  };

const getAlarmState =
  (
    habitId: string
  ): AlarmState => {
    const states =
      getAlarmStates();

    const existing =
      states.find(
        (state) =>
          state.habitId ===
          habitId
      );

    if (existing) {
      return existing;
    }

    return {
      habitId,
    };
  };

const updateAlarmState =
  (
    habitId: string,
    update: Partial<AlarmState>
  ): void => {
    const states =
      getAlarmStates();

    const index =
      states.findIndex(
        (state) =>
          state.habitId ===
          habitId
      );

    const current =
      index >= 0
        ? states[index]
        : {
            habitId,
          };

    const next: AlarmState = {
      ...current,
      ...update,
    };

    if (index >= 0) {
      states[index] = next;
    } else {
      states.push(next);
    }

    saveAlarmStates(
      states
    );
  };

export const clearAlarmState =
  (
    habitId: string
  ): void => {
    const states =
      getAlarmStates().filter(
        (state) =>
          state.habitId !==
          habitId
      );

    saveAlarmStates(
      states
    );
  };

/* =========================================================
   ALARM SETTINGS
========================================================= */

export const getHabitAlarm =
  (
    habit: Habit
  ): HabitAlarm => {
    const state =
      getAlarmState(
        habit.id
      );

    return {
      ...DEFAULT_ALARM,
      ...(habit.alarm ?? {}),
      ...(state.settings ?? {}),
    };
  };

export const saveHabitAlarmSettings =
  (
    habitId: string,
    settings: Partial<HabitAlarm>
  ): HabitAlarm => {
    const currentHabitState =
      getAlarmState(
        habitId
      );

    const currentSettings: HabitAlarm = {
      ...DEFAULT_ALARM,
      ...(currentHabitState.settings ?? {}),
    };

    const nextSettings: HabitAlarm = {
      ...currentSettings,
      ...settings,
    };

    updateAlarmState(
      habitId,
      {
        settings: nextSettings,
      }
    );

    window.dispatchEvent(
      new CustomEvent(
        "life-os-habit-alarm-settings-changed",
        {
          detail: {
            habitId,
            settings: nextSettings,
          },
        }
      )
    );

    return nextSettings;
  };

export const updateHabitAlarm =
  (
    habit: Habit,
    settings: Partial<HabitAlarm>
  ): Habit => {
    const nextAlarm =
      saveHabitAlarmSettings(
        habit.id,
        settings
      );

    return {
      ...habit,
      alarm: nextAlarm,
    };
  };

/* =========================================================
   HELPERS
========================================================= */

const normalizeTime =
  (
    time: string
  ): string | null => {
    if (!time) {
      return null;
    }

    const value =
      time.trim();

    const match =
      value.match(
        /^([01]\d|2[0-3]):([0-5]\d)$/
      );

    if (!match) {
      return null;
    }

    return `${match[1]}:${match[2]}`;
  };

const getCurrentTime =
  (): string => {
    const now =
      new Date();

    const hours =
      String(
        now.getHours()
      ).padStart(
        2,
        "0"
      );

    const minutes =
      String(
        now.getMinutes()
      ).padStart(
        2,
        "0"
      );

    return `${hours}:${minutes}`;
  };

const isHabitDateValid =
  (
    habit: Habit
  ): boolean => {
    const now =
      new Date();

    const today =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

    const start =
      new Date(
        `${habit.startDate}T00:00:00`
      );

    const end =
      new Date(
        `${habit.endDate}T23:59:59`
      );

    if (
      Number.isNaN(
        start.getTime()
      ) ||
      Number.isNaN(
        end.getTime()
      )
    ) {
      return false;
    }

    return (
      today >= start &&
      today <= end
    );
  };

const isRepeatAllowedToday =
  (
    alarm: HabitAlarm
  ): boolean => {
    const day =
      new Date().getDay();

    switch (
      alarm.repeat
    ) {
      case "weekdays":
        return (
          day >= 1 &&
          day <= 5
        );

      case "weekly":
        return true;

      case "none":
      case "daily":
      default:
        return true;
    }
  };

/* =========================================================
   TRIGGER
========================================================= */

export const triggerHabitAlarm =
  async (
    habit: Habit
  ): Promise<void> => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    const alarm =
      getHabitAlarm(
        habit
      );

    if (!alarm.enabled) {
      return;
    }

    const habitTime =
      normalizeTime(
        habit.time
      );

    if (!habitTime) {
      return;
    }

    if (
      !isHabitDateValid(
        habit
      )
    ) {
      return;
    }

    if (
      !isRepeatAllowedToday(
        alarm
      )
    ) {
      return;
    }

    const now =
      new Date();

    const state =
      getAlarmState(
        habit.id
      );

    if (
      state.lastTriggeredAt
    ) {
      const lastTriggered =
        new Date(
          state.lastTriggeredAt
        );

      const difference =
        now.getTime() -
        lastTriggered.getTime();

      if (
        difference >= 0 &&
        difference <
          TRIGGER_GUARD
      ) {
        return;
      }
    }

    if (
      state.snoozeUntil
    ) {
      const snoozeUntil =
        new Date(
          state.snoozeUntil
        );

      if (
        now < snoozeUntil
      ) {
        return;
      }
    }

    updateAlarmState(
      habit.id,
      {
        lastTriggeredAt:
          now.toISOString(),
        snoozeUntil:
          undefined,
      }
    );

    await startContinuousAlarmSound(
      alarm.sound
    );

    if (
      alarm.vibration
    ) {
      vibrateAlarm();
    }

    showAlarmNotification(
      habit
    );

    window.dispatchEvent(
      new CustomEvent(
        "life-os-habit-alarm",
        {
          detail: {
            habit,
            alarm,
            triggeredAt:
              now.toISOString(),
          },
        }
      )
    );
  };

/* =========================================================
   CHECK
========================================================= */

export const checkHabitAlarms =
  async (
    habits: Habit[]
  ): Promise<void> => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    const currentTime =
      getCurrentTime();

    for (
      const habit of habits
    ) {
      if (
        habit.status !==
        "active"
      ) {
        continue;
      }

      const alarm =
        getHabitAlarm(
          habit
        );

      if (!alarm.enabled) {
        continue;
      }

      const habitTime =
        normalizeTime(
          habit.time
        );

      if (!habitTime) {
        continue;
      }

      if (
        habitTime !==
        currentTime
      ) {
        continue;
      }

      await triggerHabitAlarm(
        habit
      );
    }
  };

/* =========================================================
   SNOOZE
========================================================= */

export const snoozeHabitAlarm =
  (
    habit: Habit
  ): void => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    const alarm =
      getHabitAlarm(
        habit
      );

    const minutes =
      alarm.snoozeMinutes;

    if (
      !Number.isFinite(
        minutes
      ) ||
      minutes <= 0
    ) {
      return;
    }

    stopAlarmSound();

    stopAlarmVibration();

    const snoozeUntil =
      new Date(
        Date.now() +
          minutes *
            60 *
            1000
      );

    updateAlarmState(
      habit.id,
      {
        snoozeUntil:
          snoozeUntil.toISOString(),
      }
    );

    window.dispatchEvent(
      new CustomEvent(
        "life-os-habit-alarm-snoozed",
        {
          detail: {
            habitId:
              habit.id,
            snoozeUntil:
              snoozeUntil.toISOString(),
          },
        }
      )
    );
  };

/* =========================================================
   STOP
========================================================= */

export const stopHabitAlarm =
  (
    habitId: string
  ): void => {
    stopAlarmSound();

    stopAlarmVibration();

    updateAlarmState(
      habitId,
      {
        snoozeUntil:
          undefined,
      }
    );

    if (
      typeof window === "undefined"
    ) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(
        "life-os-habit-alarm-stopped",
        {
          detail: {
            habitId,
          },
        }
      )
    );
  };

/* =========================================================
   ENABLE / DISABLE
========================================================= */

export const isHabitAlarmEnabled =
  (
    habit: Habit
  ): boolean => {
    return getHabitAlarm(
      habit
    ).enabled;
  };

export const enableHabitAlarm =
  (
    habit: Habit
  ): Habit => {
    return updateHabitAlarm(
      habit,
      {
        enabled: true,
      }
    );
  };

export const disableHabitAlarm =
  (
    habit: Habit
  ): Habit => {
    stopHabitAlarm(
      habit.id
    );

    return updateHabitAlarm(
      habit,
      {
        enabled: false,
      }
    );
  };

/* =========================================================
   ALARM RUNNER
========================================================= */

let currentHabits:
  Habit[] = [];

let alarmInterval:
  ReturnType<
    typeof setInterval
  > | null = null;

export const setAlarmHabits =
  (
    habits: Habit[]
  ): void => {
    currentHabits = [
      ...habits,
    ];
  };

export const startHabitAlarmRunner =
  (
    habits: Habit[]
  ): void => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    currentHabits = [
      ...habits,
    ];

    if (alarmInterval) {
      return;
    }

    void checkHabitAlarms(
      currentHabits
    );

    alarmInterval =
      setInterval(
        () => {
          void checkHabitAlarms(
            currentHabits
          );
        },
        CHECK_INTERVAL
      );
  };

export const stopHabitAlarmRunner =
  (): void => {
    if (
      alarmInterval
    ) {
      clearInterval(
        alarmInterval
      );

      alarmInterval =
        null;
    }

    currentHabits = [];

    stopAlarmSound();

    stopAlarmVibration();
  };