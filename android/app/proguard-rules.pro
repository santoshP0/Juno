# ─── React Native core ────────────────────────────────────────────────────────
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**

# ─── Reanimated ───────────────────────────────────────────────────────────────
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# ─── Expo modules ─────────────────────────────────────────────────────────────
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# ─── SQLite ───────────────────────────────────────────────────────────────────
-keep class org.sqlite.** { *; }
-keep class org.sqlite.database.** { *; }

# ─── Notifications ────────────────────────────────────────────────────────────
-keep class com.dieam.reactnativepushnotification.** { *; }
-keep class me.leolin.shortcutbadger.** { *; }

# ─── Gesture Handler ──────────────────────────────────────────────────────────
-keep class com.swmansion.gesturehandler.** { *; }

# ─── AsyncStorage ─────────────────────────────────────────────────────────────
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# ─── Keep JS interface methods called via reflection ──────────────────────────
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
}
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}

# ─── Suppress common warnings ─────────────────────────────────────────────────
-dontwarn javax.annotation.**
-dontwarn okhttp3.**
-dontwarn okio.**
