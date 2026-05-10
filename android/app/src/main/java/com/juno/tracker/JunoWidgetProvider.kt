package com.juno.tracker

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class JunoWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (widgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId)
        }
    }

    companion object {
        const val PREFS_NAME = "JunoCycleWidgetPrefs"

        fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            widgetId: Int
        ) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

            val cycleDay      = prefs.getInt("cycleDay", 0)
            val cycleLength   = prefs.getInt("cycleLength", 28)
            val phase         = prefs.getString("phase", "") ?: ""
            val daysUntil     = prefs.getInt("daysUntilPeriod", -1)
            val updatedAt     = prefs.getLong("updatedAt", 0L)

            val views = RemoteViews(context.packageName, R.layout.juno_widget)

            // Day number
            views.setTextViewText(
                R.id.widget_day_number,
                if (cycleDay > 0) cycleDay.toString() else "—"
            )

            // Phase label
            val phaseLabel = when (phase) {
                "menstrual"  -> "🩸 Menstrual"
                "follicular" -> "🌿 Follicular"
                "ovulation"  -> "✨ Ovulation"
                "luteal"     -> "🌙 Luteal"
                else         -> "—"
            }
            views.setTextViewText(R.id.widget_phase, phaseLabel)

            // Period countdown
            val periodText = when {
                daysUntil > 1  -> "Period in $daysUntil days"
                daysUntil == 1 -> "Period tomorrow"
                daysUntil == 0 -> "Period today"
                else           -> "Period —"
            }
            views.setTextViewText(R.id.widget_period_label, periodText)

            // Cycle length
            val cycleLengthText = if (cycleLength > 0) "$cycleLength day cycle" else "— day cycle"
            views.setTextViewText(R.id.widget_cycle_length, cycleLengthText)

            // Last updated
            val timeStr = if (updatedAt > 0) {
                SimpleDateFormat("h:mm a", Locale.getDefault()).format(Date(updatedAt))
            } else {
                "—"
            }
            views.setTextViewText(R.id.widget_last_updated, timeStr)

            // Tap opens the app
            val launchIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context, 0, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_day_number, pendingIntent)
            views.setOnClickPendingIntent(R.id.widget_phase, pendingIntent)
            views.setOnClickPendingIntent(R.id.widget_period_label, pendingIntent)

            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }
}
