package com.chinmaykoshe.streakly.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class StreakWidgetProvider extends AppWidgetProvider {

    private static final String ACTION_MARK_DONE = "com.chinmaykoshe.streakly.widget.ACTION_MARK_DONE";
    private static final String PREF_NAME = "react-native-default-preference"; // Default name used by react-native-default-preference
    private static final String REMINDERS_KEY = "@sr_reminders_v4";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            String remindersJson = prefs.getString(REMINDERS_KEY, "[]");
            JSONArray reminders = new JSONArray(remindersJson);

            // Find the most urgent reminder, or just use the first one
            JSONObject topReminder = null;
            if (reminders.length() > 0) {
                topReminder = reminders.getJSONObject(0);
            }

            int layoutId = context.getResources().getIdentifier("widget_layout", "layout", context.getPackageName());
            if (layoutId == 0) return; // Layout missing

            RemoteViews views = new RemoteViews(context.getPackageName(), layoutId);

            if (topReminder != null) {
                String title = topReminder.optString("title", "Streak Reminder");
                String emoji = topReminder.optString("emoji", "🔥");
                String status = topReminder.optString("status", "NOT_SENT");
                String type = topReminder.optString("reminderType", "activity");

                // Title
                int titleId = context.getResources().getIdentifier("widget_title", "id", context.getPackageName());
                views.setTextViewText(titleId, emoji + " " + title);

                // Status logic
                int statusId = context.getResources().getIdentifier("widget_status", "id", context.getPackageName());
                int btnId = context.getResources().getIdentifier("widget_btn_done", "id", context.getPackageName());

                if ("DONE".equals(status) || "COMPLETED".equals(status)) {
                    views.setTextViewText(statusId, "Status: Done ✅");
                    views.setTextViewText(btnId, "Done");
                    // Disable button by pointing intent to null, or keep it but change visual
                    Intent intent = new Intent(context, StreakWidgetProvider.class);
                    intent.setAction(ACTION_MARK_DONE);
                    intent.putExtra("reminderId", topReminder.optString("id"));
                    PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                    views.setOnClickPendingIntent(btnId, pendingIntent);
                } else {
                    views.setTextViewText(statusId, "Status: Pending ⏳");
                    views.setTextViewText(btnId, "Mark Done");
                    
                    Intent intent = new Intent(context, StreakWidgetProvider.class);
                    intent.setAction(ACTION_MARK_DONE);
                    intent.putExtra("reminderId", topReminder.optString("id"));
                    PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                    views.setOnClickPendingIntent(btnId, pendingIntent);
                }

                // Last Completed
                String lastCompleted = topReminder.optString("lastCompleted", null);
                int timeId = context.getResources().getIdentifier("widget_time", "id", context.getPackageName());
                if (lastCompleted != null && !lastCompleted.equals("null") && !lastCompleted.isEmpty()) {
                    try {
                        // Attempt to parse ISO string roughly or just display it
                        views.setTextViewText(timeId, "Last: " + lastCompleted.substring(11, 16));
                    } catch (Exception e) {
                        views.setTextViewText(timeId, "Last: " + lastCompleted);
                    }
                } else {
                    views.setTextViewText(timeId, "Not completed yet");
                }
            } else {
                int titleId = context.getResources().getIdentifier("widget_title", "id", context.getPackageName());
                views.setTextViewText(titleId, "No reminders set");
            }

            // Instruct the widget manager to update the widget
            appWidgetManager.updateAppWidget(appWidgetId, views);

        } catch (Exception e) {
            Log.e("StreakWidgetProvider", "Error updating widget", e);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        if (ACTION_MARK_DONE.equals(intent.getAction())) {
            String reminderId = intent.getStringExtra("reminderId");
            if (reminderId != null) {
                // Update SharedPreferences immediately for snappy UI
                try {
                    SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
                    String remindersJson = prefs.getString(REMINDERS_KEY, "[]");
                    JSONArray reminders = new JSONArray(remindersJson);
                    
                    for (int i = 0; i < reminders.length(); i++) {
                        JSONObject r = reminders.getJSONObject(i);
                        if (reminderId.equals(r.optString("id"))) {
                            r.put("status", "DONE");
                            
                            // Set current time ISO format
                            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
                            r.put("lastCompleted", sdf.format(new Date()));
                            
                            reminders.put(i, r);
                            break;
                        }
                    }
                    
                    prefs.edit().putString(REMINDERS_KEY, reminders.toString()).apply();
                    
                    // Force refresh all widgets
                    AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
                    ComponentName thisWidget = new ComponentName(context, StreakWidgetProvider.class);
                    int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
                    onUpdate(context, appWidgetManager, appWidgetIds);

                } catch (Exception e) {
                    Log.e("StreakWidgetProvider", "Error marking done", e);
                }
            }
        }
    }
}
