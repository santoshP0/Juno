package com.juno.tracker

import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent

/**
 * Restores the Juno home screen widget after device reboot.
 *
 * Android clears AppWidget state on reboot. expo-notifications uses WorkManager
 * internally and handles its own notification rescheduling — this receiver only
 * needs to refresh the widget RemoteViews from SharedPreferences.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED &&
            action != "android.intent.action.QUICKBOOT_POWERON" &&
            action != "com.htc.intent.action.QUICKBOOT_POWERON"
        ) return

        val appWidgetManager = AppWidgetManager.getInstance(context)
        val widgetIds = appWidgetManager.getAppWidgetIds(
            ComponentName(context, JunoWidgetProvider::class.java)
        )
        widgetIds.forEach { id ->
            JunoWidgetProvider.updateWidget(context, appWidgetManager, id)
        }
    }
}
