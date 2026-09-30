package com.lifeos.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;

public class LifeOSAlarmReceiver extends BroadcastReceiver {

    public static final String CHANNEL_ID =
            "life_os_alarm_channel";

    public static final String ACTION_ALARM =
            "com.lifeos.app.ACTION_ALARM";

    @Override
    public void onReceive(
            Context context,
            Intent intent
    ) {

        if (intent == null) {
            return;
        }

        String alarmId =
                intent.getStringExtra("alarmId");

        String title =
                intent.getStringExtra("title");

        String description =
                intent.getStringExtra("description");

        boolean vibration =
                intent.getBooleanExtra(
                        "vibration",
                        true
                );

        if (
                alarmId == null ||
                alarmId.trim().isEmpty()
        ) {
            alarmId = "unknown";
        }

        if (
                title == null ||
                title.trim().isEmpty()
        ) {
            title = "Life OS Reminder";
        }

        if (description == null) {
            description = "";
        }

        /*
         * Create notification channel.
         */

        createNotificationChannel(
                context,
                vibration
        );

        /*
         * Open Life OS when notification
         * is tapped.
         */

        Intent launchIntent =
                context.getPackageManager()
                        .getLaunchIntentForPackage(
                                context.getPackageName()
                        );

        PendingIntent contentIntent = null;

        if (launchIntent != null) {

            launchIntent.setFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
                            | Intent.FLAG_ACTIVITY_CLEAR_TOP
                            | Intent.FLAG_ACTIVITY_SINGLE_TOP
            );

            contentIntent =
                    PendingIntent.getActivity(
                            context,
                            notificationRequestCode(
                                    alarmId
                            ),
                            launchIntent,
                            PendingIntent.FLAG_UPDATE_CURRENT
                                    | PendingIntent.FLAG_IMMUTABLE
                    );
        }

        /*
         * Default Android notification sound.
         */

        Uri soundUri =
                android.provider.Settings.System
                        .DEFAULT_NOTIFICATION_URI;

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(
                        context,
                        CHANNEL_ID
                )
                        .setSmallIcon(
                                android.R.drawable
                                        .ic_lock_idle_alarm
                        )
                        .setContentTitle(
                                title
                        )
                        .setContentText(
                                description.isEmpty()
                                        ? "Your reminder time has arrived."
                                        : description
                        )
                        .setStyle(
                                new NotificationCompat
                                        .BigTextStyle()
                                        .bigText(
                                                description.isEmpty()
                                                        ? "Your reminder time has arrived."
                                                        : description
                                        )
                        )
                        .setPriority(
                                NotificationCompat
                                        .PRIORITY_MAX
                        )
                        .setCategory(
                                NotificationCompat
                                        .CATEGORY_ALARM
                        )
                        .setVisibility(
                                NotificationCompat
                                        .VISIBILITY_PUBLIC
                        )
                        .setAutoCancel(true)
                        .setSound(
                                soundUri
                        );

        /*
         * Enable vibration when requested.
         */

        if (vibration) {

            builder.setVibrate(
                    new long[]{
                            0,
                            700,
                            300,
                            700,
                            300,
                            1000
                    }
            );
        }

        if (contentIntent != null) {

            builder.setContentIntent(
                    contentIntent
            );
        }

        NotificationManager notificationManager =
                (NotificationManager)
                        context.getSystemService(
                                Context.NOTIFICATION_SERVICE
                        );

        if (notificationManager != null) {

            notificationManager.notify(
                    notificationRequestCode(
                            alarmId
                    ),
                    builder.build()
            );
        }
    }

    /* =====================================================
       NOTIFICATION CHANNEL
    ===================================================== */

    private void createNotificationChannel(
            Context context,
            boolean vibration
    ) {

        if (
                Build.VERSION.SDK_INT
                        < Build.VERSION_CODES.O
        ) {
            return;
        }

        NotificationManager notificationManager =
                (NotificationManager)
                        context.getSystemService(
                                Context.NOTIFICATION_SERVICE
                        );

        if (notificationManager == null) {
            return;
        }

        Uri soundUri =
                android.provider.Settings.System
                        .DEFAULT_NOTIFICATION_URI;

        AudioAttributes audioAttributes =
                new AudioAttributes.Builder()
                        .setUsage(
                                AudioAttributes
                                        .USAGE_ALARM
                        )
                        .setContentType(
                                AudioAttributes
                                        .CONTENT_TYPE_SONIFICATION
                        )
                        .build();

        NotificationChannel channel =
                new NotificationChannel(
                        CHANNEL_ID,
                        "Life OS Alarms",
                        NotificationManager
                                .IMPORTANCE_HIGH
                );

        channel.setDescription(
                "Life OS reminder alarms"
        );

        /*
         * Alarm sound.
         */

        channel.setSound(
                soundUri,
                audioAttributes
        );

        /*
         * Vibration.
         */

        channel.enableVibration(
                vibration
        );

        if (vibration) {

            channel.setVibrationPattern(
                    new long[]{
                            0,
                            700,
                            300,
                            700,
                            300,
                            1000
                    }
            );
        }

        notificationManager
                .createNotificationChannel(
                        channel
                );
    }

    /* =====================================================
       NOTIFICATION ID
    ===================================================== */

    private int notificationRequestCode(
            String alarmId
    ) {

        return alarmId.hashCode()
                & 0x7fffffff;
    }
}