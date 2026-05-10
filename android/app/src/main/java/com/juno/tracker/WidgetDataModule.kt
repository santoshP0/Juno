package com.juno.tracker

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class WidgetDataModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WidgetDataModule"

    @ReactMethod
    fun updateCycleData(data: ReadableMap) {
        val prefs = reactContext.getSharedPreferences(
            JunoWidgetProvider.PREFS_NAME,
            Context.MODE_PRIVATE
        )

        prefs.edit().apply {
            if (data.hasKey("cycleDay"))        putInt("cycleDay",         data.getInt("cycleDay"))
            if (data.hasKey("cycleLength"))     putInt("cycleLength",      data.getInt("cycleLength"))
            if (data.hasKey("phase"))           putString("phase",         data.getString("phase"))
            if (data.hasKey("daysUntilPeriod")) putInt("daysUntilPeriod",  data.getInt("daysUntilPeriod"))
            putLong("updatedAt", System.currentTimeMillis())
            apply()
        }

        // Trigger widget refresh
        val appWidgetManager = AppWidgetManager.getInstance(reactContext)
        val widgetIds = appWidgetManager.getAppWidgetIds(
            ComponentName(reactContext, JunoWidgetProvider::class.java)
        )
        widgetIds.forEach { id ->
            JunoWidgetProvider.updateWidget(reactContext, appWidgetManager, id)
        }
    }
}
