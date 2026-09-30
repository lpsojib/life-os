"use client";

import { registerPlugin } from "@capacitor/core";

export interface LifeOSAlarmOptions {
  alarmId: string;
  triggerAt: number;
  title?: string;
  description?: string;
  sound?: string;
  vibration?: boolean;
}

export interface LifeOSAlarmPlugin {
  scheduleAlarm(
    options: LifeOSAlarmOptions
  ): Promise<{
    alarmId: string;
    triggerAt: number;
    title?: string;
    description?: string;
    scheduled?: boolean;
  }>;

  cancelAlarm(
    options: {
      alarmId: string;
    }
  ): Promise<void>;

  checkExactAlarmPermission(): Promise<{
    granted: boolean;
  }>;

  requestExactAlarmPermission(): Promise<{
    granted: boolean;
    settingsOpened?: boolean;
  }>;
}

const LifeOSAlarm =
  registerPlugin<LifeOSAlarmPlugin>(
    "LifeOSAlarm"
  );

export default LifeOSAlarm;