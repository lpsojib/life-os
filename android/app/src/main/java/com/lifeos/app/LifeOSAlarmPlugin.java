package com.lifeos.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LifeOSAlarm")
public class LifeOSAlarmPlugin extends Plugin {

    private static final String ACTION_SCHEDULE =
            "com.lifeos.app.ACTION_SCHEDULE_ALARM";

    private static final String ACTION_CANCEL =
            "com.lifeos.app.ACTION_CANCEL_ALARM";

    /* =====================================================
       SCHEDULE ALARM
    ===================================================== */

    @PluginMethod
    public void scheduleAlarm(
            PluginCall call
    ) {

        String alarmId =
                call.getString("alarmId");

        String title =
                call.getString(
                        "title",
                        "Life OS Reminder"
                );

        String description =
                call.getString(
                        "description",
                        ""
                );

        Boolean vibration =
                call.getBoolean(
                        "vibration",
                        true
                );

        long triggerAt =
                call.getLong(
                        "triggerAt",
                        0L
                );

        if (
                alarmId == null ||
                alarmId.trim().isEmpty()
        ) {
            call.reject(
                    "alarmId is required"
            );
            return;
        }

        if (triggerAt <= 0) {
            call.reject(
                    "triggerAt is required"
            );
            return;
        }

        Context context =
                getContext();

        AlarmManager alarmManager =
                (AlarmManager)
                        context.getSystemService(
                                Context.ALARM_SERVICE
                        );

        if (alarmManager == null) {
            call.reject(
                    "AlarmManager is unavailable"
            );
            return;
        }

        /*
         * Android 12+
         * Exact alarm permission.
         */

        if (
                Build.VERSION.SDK_INT
                        >= Build.VERSION_CODES.S
        ) {

            if (
                    !alarmManager
                            .canScheduleExactAlarms()
            ) {

                call.reject(
                        "Exact alarm permission is not granted"
                );

                return;
            }
        }

        Intent intent =
                new Intent(
                        context,
                        LifeOSAlarmReceiver.class
                );

        intent.setAction(
                ACTION_SCHEDULE
        );

        intent.putExtra(
                "alarmId",
                alarmId
        );

        intent.putExtra(
                "title",
                title
        );

        intent.putExtra(
                "description",
                description
        );

        intent.putExtra(
                "vibration",
                vibration != null
                        ? vibration
                        : true
        );

        PendingIntent pendingIntent =
                PendingIntent.getBroadcast(
                        context,
                        alarmRequestCode(
                                alarmId
                        ),
                        intent,
                        PendingIntent.FLAG_UPDATE_CURRENT
                                | PendingIntent.FLAG_IMMUTABLE
                );

        try {

            /*
             * Android 6+
             * Exact alarm that can wake
             * the device from idle mode.
             */

            if (
                    Build.VERSION.SDK_INT
                            >= Build.VERSION_CODES.M
            ) {

                alarmManager
                        .setExactAndAllowWhileIdle(
                                AlarmManager.RTC_WAKEUP,
                                triggerAt,
                                pendingIntent
                        );

            } else {

                alarmManager.setExact(
                        AlarmManager.RTC_WAKEUP,
                        triggerAt,
                        pendingIntent
                );
            }

            JSObject result =
                    new JSObject();

            result.put(
                    "alarmId",
                    alarmId
            );

            result.put(
                    "triggerAt",
                    triggerAt
            );

            result.put(
                    "title",
                    title
            );

            result.put(
                    "description",
                    description
            );

            result.put(
                    "scheduled",
                    true
            );

            call.resolve(
                    result
            );

        } catch (Exception error) {

            call.reject(
                    "Failed to schedule alarm",
                    error
            );
        }
    }

    /* =====================================================
       CANCEL ALARM
    ===================================================== */

    @PluginMethod
    public void cancelAlarm(
            PluginCall call
    ) {

        String alarmId =
                call.getString("alarmId");

        if (
                alarmId == null ||
                alarmId.trim().isEmpty()
        ) {
            call.reject(
                    "alarmId is required"
            );
            return;
        }

        Context context =
                getContext();

        AlarmManager alarmManager =
                (AlarmManager)
                        context.getSystemService(
                                Context.ALARM_SERVICE
                        );

        Intent intent =
                new Intent(
                        context,
                        LifeOSAlarmReceiver.class
                );

        intent.setAction(
                ACTION_CANCEL
        );

        intent.putExtra(
                "alarmId",
                alarmId
        );

        PendingIntent pendingIntent =
                PendingIntent.getBroadcast(
                        context,
                        alarmRequestCode(
                                alarmId
                        ),
                        intent,
                        PendingIntent.FLAG_UPDATE_CURRENT
                                | PendingIntent.FLAG_IMMUTABLE
                );

        if (alarmManager != null) {

            alarmManager.cancel(
                    pendingIntent
            );
        }

        pendingIntent.cancel();

        call.resolve();
    }

    /* =====================================================
       CHECK EXACT ALARM PERMISSION
    ===================================================== */

    @PluginMethod
    public void checkExactAlarmPermission(
            PluginCall call
    ) {

        Context context =
                getContext();

        AlarmManager alarmManager =
                (AlarmManager)
                        context.getSystemService(
                                Context.ALARM_SERVICE
                        );

        boolean allowed = true;

        /*
         * Exact alarm permission exists from
         * Android 12 (API 31).
         */

        if (
                Build.VERSION.SDK_INT
                        >= Build.VERSION_CODES.S
        ) {

            allowed =
                    alarmManager != null &&
                    alarmManager
                            .canScheduleExactAlarms();
        }

        JSObject result =
                new JSObject();

        result.put(
                "granted",
                allowed
        );

        call.resolve(
                result
        );
    }

    /* =====================================================
       REQUEST EXACT ALARM PERMISSION
    ===================================================== */

    @PluginMethod
    public void requestExactAlarmPermission(
            PluginCall call
    ) {

        /*
         * Android versions below 12 do not
         * require this permission.
         */

        if (
                Build.VERSION.SDK_INT
                        < Build.VERSION_CODES.S
        ) {

            JSObject result =
                    new JSObject();

            result.put(
                    "granted",
                    true
            );

            call.resolve(
                    result
            );

            return;
        }

        Context context =
                getContext();

        AlarmManager alarmManager =
                (AlarmManager)
                        context.getSystemService(
                                Context.ALARM_SERVICE
                        );

        if (alarmManager == null) {

            call.reject(
                    "AlarmManager is unavailable"
            );

            return;
        }

        /*
         * Permission already granted.
         */

        if (
                alarmManager
                        .canScheduleExactAlarms()
        ) {

            JSObject result =
                    new JSObject();

            result.put(
                    "granted",
                    true
            );

            call.resolve(
                    result
            );

            return;
        }

        /*
         * Open Android's exact alarm settings.
         */

        try {

            Intent intent =
                    new Intent(
                            Settings
                                    .ACTION_REQUEST_SCHEDULE_EXACT_ALARM
                    );

            intent.setData(
                    Uri.parse(
                            "package:"
                                    + context
                                            .getPackageName()
                    )
            );

            intent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
            );

            context.startActivity(
                    intent
            );

            JSObject result =
                    new JSObject();

            result.put(
                    "granted",
                    false
            );

            result.put(
                    "settingsOpened",
                    true
            );

            call.resolve(
                    result
            );

        } catch (Exception error) {

            call.reject(
                    "Unable to open exact alarm settings",
                    error
            );
        }
    }

    /* =====================================================
       REQUEST CODE
    ===================================================== */

    private int alarmRequestCode(
            String alarmId
    ) {

        return alarmId.hashCode()
                & 0x7fffffff;
    }
}